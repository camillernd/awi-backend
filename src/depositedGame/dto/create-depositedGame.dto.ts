import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { Types } from 'mongoose';

export class CreateDepositedGameDto {
  @IsNotEmpty()
  sellerId: Types.ObjectId;

  @IsNotEmpty()
  sessionId: Types.ObjectId;

  @IsNotEmpty()
  gameDescriptionId: Types.ObjectId;

  @IsNumber()
  @IsNotEmpty()
  salePrice: number;

  @IsBoolean()
  @IsNotEmpty()
  forSale: boolean;

  @IsBoolean()
  @IsNotEmpty()
  pickedUp: boolean;

  @IsBoolean()
  @IsNotEmpty()
  sold: boolean;
}
