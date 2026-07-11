export interface UserRegisteredPayload {
  fullName: string;
  email: string;
}

export interface TicketPurchasedPayload {
  eventName: string;
  startTime: Date;
  endTime: Date;
}

export interface NewDeviceLoginPayload {
  ip: string;
  userAgent: string;
}

export type OutboxPayload = UserRegisteredPayload | TicketPurchasedPayload | NewDeviceLoginPayload;

//TODO: Refactor to a dynamic registry
