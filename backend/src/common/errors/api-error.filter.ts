import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorBody, ApiErrorCode } from './api-error';

type ErrorResponse = {
  code?: ApiErrorCode;
  message?: string;
  fields?: Record<string, string>;
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body = this.formatHttpException(status, raw);
      response.status(status).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务暂时不可用',
      },
    } satisfies ApiErrorBody);
  }

  private formatHttpException(status: number, raw: string | object): ApiErrorBody {
    if (typeof raw === 'object' && raw !== null && 'code' in raw) {
      const error = raw as ErrorResponse;
      return {
        error: {
          code: error.code || this.defaultCode(status),
          message: error.message || this.defaultMessage(status),
          ...(error.fields ? { fields: error.fields } : {}),
        },
      };
    }

    return {
      error: {
        code: this.defaultCode(status),
        message: this.defaultMessage(status),
      },
    };
  }

  private defaultCode(status: number): ApiErrorCode {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHENTICATED';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return 'DATABASE_UNAVAILABLE';
    return 'INTERNAL_ERROR';
  }

  private defaultMessage(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return '请求参数不合法';
    if (status === HttpStatus.UNAUTHORIZED) return '请先登录';
    if (status === HttpStatus.NOT_FOUND) return '资源不存在';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return '数据库暂时不可用';
    return '服务暂时不可用';
  }
}
