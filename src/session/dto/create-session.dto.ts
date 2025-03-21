import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @IsNumber()
  @IsNotEmpty()
  depositFee: number;

  @IsNumber()
  @IsOptional()
  depositFeeLimitBeforeDiscount?: number = 30;

  @IsNumber()
  @IsNotEmpty()
  depositFeeDiscount: number;

  @IsNumber()
  @IsNotEmpty()
  saleComission: number;

  @IsNotEmpty()
  @IsOptional()
  managerId: Types.ObjectId;
}
