import { IsDate, IsEnum, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory } from '../../domain/enum/event-category';

export class CreateEventDto {
  @MinLength(1, { message: 'Заголовок слишком короткий' })
  @MaxLength(20, { message: 'Заголовок слишком длинный' })
  title: string;

  @MinLength(10, { message: 'Описание должно быть подробнее' })
  @MaxLength(50, { message: 'Описание слишком длинное' })
  description: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  maxParticipants: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;

  @IsEnum(EventCategory)
  category: EventCategory;
}
