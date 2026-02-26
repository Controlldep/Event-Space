import { Injectable } from '@nestjs/common';
import { CreateEventDto } from '../api/input-dto/create-event.dto';
import { EventsRepository } from '../infrastructure/events.repository';
import type { ActiveUserData } from '../../../core/decorators/extract-user-from-request';
import { UserEntity } from '../../users/domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../core/exceptions/domain.exceptions';
import { UserRole } from '../../users/domain/enum/user-role.type';
import { EventEntity } from '../domain/event.entity';
import { DataSource, LessThan, MoreThan, Not } from 'typeorm';
import { TicketEntity } from '../../tickets/domain/ticket.entity';
import { UpdateEventDto } from '../api/input-dto/update-event.dto';
import { QueryEventDto } from '../api/input-dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getAllEvents(dto: QueryEventDto) {
    const [items, total] = await this.eventsRepository.getAllEvents(dto);

    return {
      items,
      total,
      pageNumber: dto.pageNumber,
      pageSize: dto.pageSize,
      totalPages: Math.ceil(total / dto.pageSize),
    };
  }

  async getEventById(id: string) {
    return await this.eventsRepository.getEventById(id);
  }

  async createEvent(userData: ActiveUserData, dto: CreateEventDto) {
    const newStart = new Date(dto.startTime).getTime();
    const newEnd = new Date(dto.endTime).getTime();
    const HOUR_IN_MS = 60 * 60 * 1000;

    if (newEnd <= newStart) {
      throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Конец события должен быть позже начала');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const findUser = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userData.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!findUser) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND, 'Пользователь не найден');
      if (findUser.role !== UserRole.ORGANIZER) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Вы не являетесь организатором');
      }

      const bufferStart = new Date(newStart - HOUR_IN_MS);
      const bufferEnd = new Date(newEnd + HOUR_IN_MS);

      const otherEvents = await queryRunner.manager.find(EventEntity, {
        where: {
          organizerId: findUser.id,
          endTime: MoreThan(bufferStart),
          startTime: LessThan(bufferEnd),
        },
      });

      for (const event of otherEvents) {
        const oStart = new Date(event.startTime).getTime();
        const oEnd = new Date(event.endTime).getTime();

        const hasOverlap = newStart < oEnd + HOUR_IN_MS && newEnd > oStart - HOUR_IN_MS;

        if (hasOverlap) {
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, `Конфликт расписания: "${event.title}". Нужен перерыв в 1 час.`);
        }
      }

      const eventInstance = EventEntity.createInstance(dto, findUser.id);
      const savedEvent = await queryRunner.manager.save(eventInstance);

      const organizerTicket = TicketEntity.createInstance({
        eventId: savedEvent.id,
        userId: userData.userId,
      });
      await queryRunner.manager.save(organizerTicket);

      await queryRunner.commitTransaction();
      return savedEvent;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateEvent(eventId: string, dto: UpdateEventDto, userData: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const event = await queryRunner.manager.findOne(EventEntity, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!event) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);
      if (event.organizerId !== userData.userId) throw new CustomHttpException(DomainExceptionCode.FORBIDDEN);

      await queryRunner.manager.findOne(UserEntity, {
        where: { id: event.organizerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (dto.maxParticipants !== undefined && dto.maxParticipants < event.maxParticipants) {
        const soldTicketsCount = await queryRunner.manager.count(TicketEntity, {
          where: { eventId: eventId },
        });

        if (dto.maxParticipants < soldTicketsCount) {
          throw new CustomHttpException(
            DomainExceptionCode.BAD_REQUEST,
            `Нельзя установить лимит ${dto.maxParticipants}, так как уже продано ${soldTicketsCount} билетов`,
          );
        }
      }

      if (dto.startTime || dto.endTime) {
        const finalStart = dto.startTime ? new Date(dto.startTime).getTime() : event.startTime.getTime();
        const finalEnd = dto.endTime ? new Date(dto.endTime).getTime() : event.endTime.getTime();
        const HOUR_IN_MS = 60 * 60 * 1000;

        if (finalEnd <= finalStart) {
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Конец события должен быть позже начала');
        }

        const conflict = await queryRunner.manager.findOne(EventEntity, {
          where: {
            organizerId: event.organizerId,
            id: Not(eventId),
            startTime: LessThan(new Date(finalEnd + HOUR_IN_MS)),
            endTime: MoreThan(new Date(finalStart - HOUR_IN_MS)),
          },
        });

        if (conflict) {
          throw new CustomHttpException(
            DomainExceptionCode.BAD_REQUEST,
            `Конфликт! Ивент "${conflict.title}" слишком близко. Нужен перерыв в 1 час.`,
          );
        }
      }

      queryRunner.manager.merge(EventEntity, event, dto);
      const savedEvent = await queryRunner.manager.save(event);

      await queryRunner.commitTransaction();
      return savedEvent;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteEvent(id: string) {
    return await this.eventsRepository.deleteEvent(id);
  }
}
