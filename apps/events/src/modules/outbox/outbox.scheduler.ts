import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEntity, OutboxStatus } from 'src/modules/outbox/outbox.entity';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
  ) {}

  @Cron(process.env.OUTBOX_CRON_EXPRESSION!)
  async handleOutbox() {
    try {
      const tasks: OutboxEntity[] = await this.outboxRepository.query(
        `
      UPDATE outbox
      SET status = $1, updated_at = NOW()
      WHERE id IN (
        SELECT id FROM outbox
        WHERE status = $2
        ORDER BY created_at ASC
        LIMIT 20
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
      `,
        [OutboxStatus.PROCESSING, OutboxStatus.PENDING],
      );

      if (tasks.length === 0) return;

      const successfulIds: string[] = [];

      this.logger.log(`Захвачено задач для отправки: ${tasks.length}`);
      for (const task of tasks) {
        try {
          this.logger.log(`Обработка задачи ID: ${task.id}, тип: ${task.type}`);

          successfulIds.push(task.id);
        } catch (err) {
          this.logger.error(`Ошибка при отправке задачи ${task.id}:`, err);

          await this.outboxRepository.update(task.id, {
            status: OutboxStatus.PENDING,
            updatedAt: new Date(),
          });
        }
      }
      if (successfulIds.length > 0) {
        await this.outboxRepository.update(successfulIds, {
          status: OutboxStatus.SENT,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Ошибка при работе крона:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldRecords() {
    try {
      const retentionDays = 7;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - retentionDays);

      const result = await this.outboxRepository
        .createQueryBuilder()
        .delete()
        .from(OutboxEntity)
        .where('status = :status', { status: OutboxStatus.SENT })
        .andWhere('createdAt < :dateLimit', { dateLimit })
        .execute();

      this.logger.log(`Удалено ${result.affected} записей`);
    } catch (error) {
      this.logger.error('Ошибка при очистке Outbox:', error);
    }
  }
}
