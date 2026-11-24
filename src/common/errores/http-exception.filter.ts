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
      // 400 de validación de DTOs: el cuerpo ya es { campo: mensaje } (ACUERDOS 5.2) y se responde tal cual.
      if (status === HttpStatus.BAD_REQUEST && typeof payload === 'object' && !('message' in payload)) {
        response.status(status).json(payload);
        return;
      }
      const errorCase =
        status === HttpStatus.UNAUTHORIZED
          ? ErrorCase.UNAUTHORIZED
          : status === HttpStatus.FORBIDDEN
            ? ErrorCase.FORBIDDEN
            : status === HttpStatus.SERVICE_UNAVAILABLE
              ? ErrorCase.SERVICE_UNAVAILABLE
              : ErrorCase.INTERNAL_ERROR;
      if (typeof payload === 'object' && 'message' in payload) {
        response.status(status).json({ errorCase, message: String(payload.message) });
      } else {
        response.status(status).json({ errorCase, message: exception.message });
      }
      return;
    }

    if (exception instanceof QueryFailedError) {
      const code = (exception as unknown as { code?: string }).code;
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
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
