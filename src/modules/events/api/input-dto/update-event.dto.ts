import { IsDate, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @IsOptional()
  @MinLength(1, { message: 'Заголовок слишком короткий' })
  @MaxLength(20, { message: 'Заголовок слишком длинный' })
  title?: string;

  @IsOptional()
  @MinLength(10, { message: 'Описание должно быть подробнее' })
  @MaxLength(50, { message: 'Описание слишком длинное' })
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxParticipants?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}
