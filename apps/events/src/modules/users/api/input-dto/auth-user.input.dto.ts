import { IsEmail, MaxLength, MinLength } from 'class-validator';

export class AuthUserInputDto {
  @IsEmail()
  email: string;
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(20, { message: 'password cannot be longer than 20 characters' })
  password: string;
}
