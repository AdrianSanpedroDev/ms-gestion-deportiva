import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ApplicationException } from './application.exception';
import { ErrorCase } from './error-case.enum';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    filter = new HttpExceptionFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('traduce ApplicationException al código HTTP de su ErrorCase', () => {
    filter.catch(
      new ApplicationException(ErrorCase.HAS_ASSOCIATIONS, 'Tiene registros'),
      host,
    );
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.HAS_ASSOCIATIONS,
      message: 'Tiene registros',
    });

    filter.catch(
      new ApplicationException(ErrorCase.INTERNAL_ERROR, 'Fallo'),
      host,
    );
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('devuelve { campo: mensaje } tal cual en 400 de ValidationPipe', () => {
    filter.catch(
      new BadRequestException({ nombre: 'El nombre es obligatorio' }),
      host,
    );
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      nombre: 'El nombre es obligatorio',
    });
  });

  it('traduce 400 de ParseIntPipe a INVALID_OPERATION en español (no INTERNAL_ERROR)', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      }),
      host,
    );
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.INVALID_OPERATION,
      message: 'El identificador numérico en la ruta es inválido',
    });
  });

  it('traduce HttpException de seguridad y 404 de Nest', () => {
    filter.catch(new UnauthorizedException('Sin token'), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.UNAUTHORIZED,
      message: 'Sin token',
    });

    filter.catch(new ForbiddenException('Sin permiso'), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.FORBIDDEN,
      message: 'Sin permiso',
    });

    filter.catch(new ServiceUnavailableException('Caído'), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.SERVICE_UNAVAILABLE,
      message: 'Caído',
    });

    filter.catch(new NotFoundException('Cannot GET /api/nope'), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'Cannot GET /api/nope',
    });
  });

  it('traduce QueryFailedError ER_DUP_ENTRY y ER_ROW_IS_REFERENCED_2 a 409', () => {
    const dup = new QueryFailedError('INSERT', [], {
      code: 'ER_DUP_ENTRY',
    } as unknown as Error);
    filter.catch(dup, host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ errorCase: ErrorCase.ALREADY_EXISTS }),
    );

    const fk = new QueryFailedError('DELETE', [], {
      code: 'ER_ROW_IS_REFERENCED_2',
    } as unknown as Error);
    filter.catch(fk, host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ errorCase: ErrorCase.HAS_ASSOCIATIONS }),
    );
  });

  it('responde 500 INTERNAL_ERROR ante errores no controlados', () => {
    filter.catch(new Error('boom'), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      errorCase: ErrorCase.INTERNAL_ERROR,
      message: 'Ocurrió un error interno en el servidor',
    });
  });
});
