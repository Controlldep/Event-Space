import { IsEmail, IsEnum, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../domain/type/user-role.type';

export class UserInputDto {
  @MinLength(8, { message: 'fullName must be at least 8 characters long' })
  @MaxLength(30, { message: 'fullName cannot be longer than 30 characters' })
  fullName: string;

  @IsEmail()
  email: string;

  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(20, { message: 'password cannot be longer than 20 characters' })
  password: string;

  @IsEnum(UserRole, { message: 'Role must be either user, admin or organizer' })
  role: UserRole;
}
