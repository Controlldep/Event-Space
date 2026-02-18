import { v4 as uuidv4 } from 'uuid';

export function createDeviceId(): string {
  return uuidv4();
}
