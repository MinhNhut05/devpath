// vnpay-webhook.dto.ts - DTO cho VNPay webhook/callback payload
//
// Tại sao cần DTO riêng cho webhook?
// -> Type-safe: TypeScript biết đúng shape của data từ VNPay
// -> Validation: class-validator tự động validate trước khi vào controller
// -> Documentation: rõ ràng fields nào VNPay gửi về
//
// VNPay gửi callback qua GET query params (return URL)
// hoặc POST body (IPN - Instant Payment Notification)
// DTO này dùng cho cả 2 trường hợp

import { IsString } from 'class-validator';

export class VnpayWebhookDto {
  /**
   * orderId ta đã tạo và gửi cho VNPay khi tạo payment.
   * Dùng để tìm đơn hàng trong DB và cập nhật trạng thái.
   * Ví dụ: "ORDER_1705312200000"
   */
  @IsString()
  vnp_TxnRef!: string;

  /**
   * Transaction ID nội bộ của VNPay.
   * Dùng để reconcile (đối soát) với VNPay nếu có dispute.
   * Ví dụ: "14095637"
   */
  @IsString()
  vnp_TransactionNo!: string;

  /**
   * Mã kết quả giao dịch từ VNPay.
   * '00' = thành công
   * Các code khác = thất bại (xem VNPay docs cho full list)
   * Ví dụ: "00" (success), "24" (user cancelled)
   */
  @IsString()
  vnp_ResponseCode!: string;

  /**
   * Số tiền giao dịch — đã được VNPay *100 (theo spec của họ).
   * Để lấy số tiền thực: parseInt(vnp_Amount) / 100
   * Ví dụ: "10000000" = 100,000 VND
   */
  @IsString()
  vnp_Amount!: string;

  /**
   * Thông tin đơn hàng ta đã gửi khi tạo payment.
   * Ví dụ: "Thanh toan goi Pro 1 thang"
   */
  @IsString()
  vnp_OrderInfo!: string;

  /**
   * HMAC-SHA512 signature từ VNPay để verify tính toàn vẹn.
   * Phải verify signature này trước khi xử lý bất kỳ logic nào.
   * Nếu không verify -> attacker có thể fake callback.
   */
  @IsString()
  vnp_SecureHash!: string;

  /**
   * Ngày giờ thanh toán theo format YYYYMMDDHHmmss.
   * Ví dụ: "20240115103000" = 2024-01-15 10:30:00
   */
  @IsString()
  vnp_PayDate!: string;
}
