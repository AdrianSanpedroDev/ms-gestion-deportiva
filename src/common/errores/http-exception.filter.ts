import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApplicationException } from './application.exception';
import { ErrorCase } from './error-case.enum';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApplicationException) {
      response
        .status(this.statusFor(exception.errorCase))
        .json({ errorCase: exception.errorCase, message: exception.message });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      // 400 de validación de DTOs (ValidationPipe): objeto plano { campo: mensaje } sin statusCode (ACUERDOS 5.2).
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof payload === 'object' &&
        payload !== null &&
        !Array.isArray(payload) &&
        !('statusCode' in payload)
      ) {
        response.status(status).json(payload);
        return;
      }

      const errorCase = this.errorCaseForStatus(status);
      const rawMessage =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : exception.message;

      const message =
        status === HttpStatus.BAD_REQUEST &&
        rawMessage.includes('numeric string is expected')
          ? 'El identificador numérico en la ruta es inválido'
          : rawMessage;

      response.status(status).json({ errorCase, message });
      return;
    }

    if (exception instanceof QueryFailedError) {
      const driverError = (
        exception as QueryFailedError & {
          driverError?: { code?: string };
          code?: string;
        }
      ).driverError;
      const code =
        driverError?.code ?? (exception as unknown as { code?: string }).code;

      if (code === 'ER_DUP_ENTRY') {
        response.status(HttpStatus.CONFLICT).json({
          errorCase: ErrorCase.ALREADY_EXISTS,
          message: 'Ya existe un registro con esos datos',
        });
        return;
      }
      if (code === 'ER_ROW_IS_REFERENCED_2') {
        response.status(HttpStatus.CONFLICT).json({
          errorCase: ErrorCase.HAS_ASSOCIATIONS,
          message: 'No se puede eliminar porque tiene datos asociados',
        });
        return;
      }
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorCase: ErrorCase.INTERNAL_ERROR,
      message: 'Ocurrió un error interno en el servidor',
    });
  }

  private errorCaseForStatus(status: number): ErrorCase {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCase.INVALID_OPERATION;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCase.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCase.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCase.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCase.ALREADY_EXISTS;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCase.SERVICE_UNAVAILABLE;
      default:
        return ErrorCase.INTERNAL_ERROR;
    }
  }

  private statusFor(errorCase: ErrorCase): number {
    switch (errorCase) {
      case ErrorCase.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ErrorCase.ALREADY_EXISTS:
      case ErrorCase.HAS_ASSOCIATIONS:
        return HttpStatus.CONFLICT;
      case ErrorCase.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case ErrorCase.FORBIDDEN:
        return HttpStatus.FORBIDDEN;
      case ErrorCase.SERVICE_UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case ErrorCase.INTERNAL_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
