import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class MoMoService {
  private readonly logger = new Logger(MoMoService.name);

  constructor(private readonly configService: ConfigService) {}

  async createPayment(params: {
    orderId: string;
    amount: number;
    orderInfo: string;
    redirectUrl: string;
    ipnUrl: string;
    extraData?: string;
  }) {
    const partnerCode = this.configService.get('MOMO_PARTNER_CODE', 'MOMO');
    const accessKey = this.configService.get('MOMO_ACCESS_KEY', 'F8BBA842ECF85');
    const secretKey = this.configService.get('MOMO_SECRET_KEY', 'K951B6PE1waDMi640xX08PD3vg6EkVlz');
    const apiUrl = this.configService.get('MOMO_API_URL', 'test-payment.momo.vn');
    const requestType = 'payWithMethod';
    const requestId = `${params.orderId}_${Date.now()}`;
    const extraData = params.extraData ?? '';

    // Thứ tự rawSignature: accessKey, amount, extraData, ipnUrl, orderId, orderInfo,
    //                      partnerCode, redirectUrl, requestId, requestType
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${params.amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${params.ipnUrl}`,
      `orderId=${params.orderId}`,
      `orderInfo=${params.orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${params.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount: params.amount,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      redirectUrl: params.redirectUrl,
      ipnUrl: params.ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    const response = await fetch(`https://${apiUrl}/v2/gateway/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await response.json()) as { payUrl?: string; [key: string]: unknown };
    return { paymentUrl: data.payUrl, requestId };
  }

  verifySignature(body: {
    accessKey?: string;
    amount: number;
    extraData: string;
    message: string;
    orderId: string;
    orderInfo: string;
    orderType: string;
    partnerCode: string;
    payType: string;
    requestId: string;
    responseTime: number;
    resultCode: number;
    transId: string;
    signature: string;
  }): boolean {
    const secretKey = this.configService.get(
      'MOMO_SECRET_KEY',
      'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    );
    const accessKey = this.configService.get('MOMO_ACCESS_KEY', 'F8BBA842ECF85');

    // Thứ tự rawSignature cho webhook:
    // accessKey, amount, extraData, message, orderId, orderInfo, orderType,
    // partnerCode, payType, requestId, responseTime, resultCode, transId
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${body.amount}`,
      `extraData=${body.extraData}`,
      `message=${body.message}`,
      `orderId=${body.orderId}`,
      `orderInfo=${body.orderInfo}`,
      `orderType=${body.orderType}`,
      `partnerCode=${body.partnerCode}`,
      `payType=${body.payType}`,
      `requestId=${body.requestId}`,
      `responseTime=${body.responseTime}`,
      `resultCode=${body.resultCode}`,
      `transId=${body.transId}`,
    ].join('&');

    const expectedSignature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    return expectedSignature === body.signature;
  }
}
