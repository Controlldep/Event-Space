import { IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateUserInputDto {
  @IsOptional()
  @MinLength(8, { message: 'fullName must be at least 8 characters long' })
  @MaxLength(30, { message: 'fullName cannot be longer than 30 characters' })
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(20, { message: 'password cannot be longer than 20 characters' })
  oldPassword?: string;

  @IsOptional()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(20, { message: 'password cannot be longer than 20 characters' })
  password?: string;
}
