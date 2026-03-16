// vnpay.service.ts - Service xử lý VNPay payment integration
//
// Tại sao dùng sync thay vì async?
// -> createPayment và verifySignature chỉ làm string/crypto operations
// -> Không có I/O (network, DB) nên không cần async/await
// -> Sync đơn giản hơn, không cần try/catch cho Promise
//
// Tại sao HMAC-SHA512?
// -> VNPay yêu cầu SHA512 cho version 2.1.0
// -> SHA512 an toàn hơn SHA256 (longer hash, more collision-resistant)
//
// createHmac từ Node.js built-in 'crypto' — KHÔNG cần cài package

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

// ── Interfaces ────────────────────────────────────────────────────────────────

/**
 * Params cho createPayment method.
 * orderId: unique ID ta tạo để track đơn hàng
 * amount: số tiền VND (service sẽ *100 theo yêu cầu VNPay)
 * orderInfo: mô tả đơn hàng hiển thị trên trang thanh toán
 * ipAddr: IP của user (bắt buộc theo VNPay spec)
 */
interface CreatePaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
}

/**
 * Return type của createPayment.
 * paymentUrl: URL redirect user đến trang thanh toán VNPay
 */
interface CreatePaymentResult {
  paymentUrl: string;
}

// ── VNPayService class ────────────────────────────────────────────────────────

@Injectable()
export class VNPayService {
  private readonly logger = new Logger(VNPayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly apiUrl: string;
  private readonly returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Dùng sandbox defaults để dev/test không cần set env vars
    this.tmnCode = configService.get('VNPAY_TMN_CODE', 'CGPNBGDF');
    this.hashSecret = configService.get(
      'VNPAY_HASH_SECRET',
      'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ',
    );
    this.apiUrl = configService.get(
      'VNPAY_API_URL',
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
    this.returnUrl = configService.get(
      'VNPAY_RETURN_URL',
      'http://localhost:5174/payment/callback',
    );
  }

  /**
   * Tạo VNPay payment URL để redirect user đến trang thanh toán.
   *
   * Flow:
   * 1. Build vnpParams object với tất cả required fields
   * 2. Sort keys alphabetically (VNPay yêu cầu)
   * 3. Build URL-encoded query string
   * 4. Tính HMAC-SHA512 signature
   * 5. Append signature vào query string
   * 6. Return full payment URL
   *
   * @param params - orderId, amount (VND), orderInfo, ipAddr
   * @returns { paymentUrl } - URL để redirect user
   */
  createPayment(params: CreatePaymentParams): CreatePaymentResult {
    const { orderId, amount, orderInfo, ipAddr } = params;

    // vnp_CreateDate: format YYYYMMDDHHmmss (VNPay spec)
    // ISO string: "2024-01-15T10:30:00.000Z"
    // Sau replace: "20240115103000000" -> slice(0,14) = "20240115103000"
    const createDate = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);

    // vnp_Amount: VNPay yêu cầu số tiền *100
    // Ví dụ: 100000 VND -> 10000000
    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort alphabetically — VNPay yêu cầu keys phải được sort trước khi sign
    // Nếu không sort đúng thứ tự -> signature sai -> VNPay từ chối request
    const sortedKeys = Object.keys(vnpParams).sort();
    const sortedParams: Record<string, string> = {};
    for (const key of sortedKeys) {
      sortedParams[key] = vnpParams[key];
    }

    // Build query string và tính signature
    const queryString = new URLSearchParams(sortedParams).toString();
    const secureHash = this.buildSignature(queryString);

    // Append signature vào cuối URL (KHÔNG encode signature)
    const paymentUrl = `${this.apiUrl}?${queryString}&vnp_SecureHash=${secureHash}`;

    this.logger.log(`Created VNPay payment URL for order: ${orderId}`);

    return { paymentUrl };
  }

  /**
   * Verify HMAC signature từ VNPay callback/webhook.
   *
   * VNPay gửi callback với tất cả params + vnp_SecureHash.
   * Ta cần:
   * 1. Lấy vnp_SecureHash ra khỏi params
   * 2. Sort và build query string từ các params còn lại
   * 3. Tính lại signature
   * 4. So sánh với vnp_SecureHash nhận được
   *
   * @param params - Toàn bộ query params từ VNPay callback
   * @returns true nếu signature hợp lệ, false nếu bị giả mạo
   */
  verifySignature(params: Record<string, string>): boolean {
    // Clone để không mutate object gốc
    const clonedParams = { ...params };

    // Lấy secure hash từ params trước khi xóa
    const receivedHash = clonedParams['vnp_SecureHash'];

    // Xóa signature fields — không được include vào khi tính lại signature
    delete clonedParams['vnp_SecureHash'];
    delete clonedParams['vnp_SecureHashType'];

    // Sort alphabetically (giống createPayment)
    const sortedKeys = Object.keys(clonedParams).sort();
    const sortedParams: Record<string, string> = {};
    for (const key of sortedKeys) {
      sortedParams[key] = clonedParams[key];
    }

    // Tính lại signature và so sánh
    const queryString = new URLSearchParams(sortedParams).toString();
    const computedHash = this.buildSignature(queryString);

    const isValid = computedHash === receivedHash;

    if (!isValid) {
      this.logger.warn('VNPay signature verification failed');
    }

    return isValid;
  }

  /**
   * Helper: Tính HMAC-SHA512 signature từ query string đã được sort.
   *
   * Tại sao private?
   * -> Chỉ dùng nội bộ bởi createPayment và verifySignature
   * -> Không expose logic crypto ra ngoài
   *
   * @param queryString - URL-encoded string đã sort keys
   * @returns hex string của HMAC-SHA512
   */
  private buildSignature(queryString: string): string {
    return createHmac('sha512', this.hashSecret)
      .update(queryString)
      .digest('hex');
  }
}
