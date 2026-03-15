import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

/**
 * HttpExceptionFilter
 *
 * Filter này bắt TẤT CẢ exceptions và format thành response chuẩn:
 * {
 *   success: false,
 *   error: { code, message, details },
 *   meta: { timestamp, path }
 * }
 *
 * @Catch() decorator:
 * - Không có argument → bắt TẤT CẢ exceptions
 * - @Catch(HttpException) → chỉ bắt HttpException
 * - @Catch(NotFoundException, BadRequestException) → bắt nhiều loại
 *
 * Cách hoạt động:
 * 1. Code trong controller/service throw exception
 * 2. Exception đi qua filter pipeline
 * 3. Filter này bắt và transform thành format chuẩn
 * 4. Trả về client với status code phù hợp
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Xác định status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Xác định error message và details
    let message = 'Internal server error';
    let details: unknown = undefined;
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      // NestJS validation errors trả về object với message array
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as Record<string, unknown>;
        message = (errorObj.message as string) || exception.message;

        // Nếu message là array (validation errors), lấy element đầu tiên làm message chính
        if (Array.isArray(errorObj.message)) {
          message = errorObj.message[0];
          details = errorObj.message;
        } else {
          // Extract custom fields (vd: missingPrerequisites) → đưa vào details
          // Loại bỏ NestJS internal keys: message, statusCode, error
          // → Chỉ giữ lại custom data mà service đã throw kèm
          //
          // Ví dụ: ForbiddenException({ message: '...', missingPrerequisites: [...] })
          // → customFields = { missingPrerequisites: [...] }
          // → details = { missingPrerequisites: [...] }
          const {
            message: _msg,
            statusCode: _sc,
            error: _err,
            ...customFields
          } = errorObj;
          if (Object.keys(customFields).length > 0) {
            details = customFields;
          }
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      // Map HTTP status sang error code
      code = this.getErrorCode(status);
    }

    // Build error response
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Map HTTP status code sang readable error code
   */
  private getErrorCode(status: number): string {
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
}
