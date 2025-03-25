import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
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
  @IsOptional()
  pickedUp: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  sold: boolean;
}
