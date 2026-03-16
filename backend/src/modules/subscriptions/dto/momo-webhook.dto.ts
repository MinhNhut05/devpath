import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MoMoWebhookDto {
  @IsString()
  partnerCode!: string;

  @IsString()
  orderId!: string;

  @IsString()
  requestId!: string;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsString()
  orderInfo!: string;

  @IsString()
  orderType!: string;

  @IsString()
  transId!: string;

  @IsNumber()
  @Type(() => Number)
  resultCode!: number; // 0 = success

  @IsString()
  message!: string;

  @IsString()
  payType!: string;

  @IsNumber()
  @Type(() => Number)
  responseTime!: number;

  @IsString()
  extraData!: string;

  @IsString()
  signature!: string;
}
