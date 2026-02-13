import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @MinLength(1, { message: 'title must be at least 1 characters long' })
  @MaxLength(20, { message: 'title cannot be longer than 20 characters' })
  title: string;

  @MinLength(10, { message: 'description must be at least 10 characters long' })
  @MaxLength(50, { message: 'description cannot be longer than 50 characters' })
  description: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  maxParticipants: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;
}
