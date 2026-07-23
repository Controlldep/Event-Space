import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateStripeCheckoutInputDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  eventTitle: string;
}
