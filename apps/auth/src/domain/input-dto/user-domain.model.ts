import { UserRole } from '../enum/user-role.type';

export class CreateUserDomainModel {
  readonly email: string;
  readonly passwordHash: string;
  readonly fullName: string;
  readonly role: UserRole;
}
