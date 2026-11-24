import {
  ExecutionContext,
  ForbiddenException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import axios from 'axios';
import { SecurityGuard } from './security.guard';

describe('SecurityGuard', () => {
  let guard: SecurityGuard;
  let configValues: Record<string, string | undefined>;
  let reflector: { getAllAndOverride: jest.Mock };
  let postSpy: jest.SpyInstance;

  const makeContext = (
    authorization?: string,
    path = '/api/torneos/1',
    method = 'GET',
  ): ExecutionContext =>
    ({
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          method,
          headers: authorization ? { authorization } : {},
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    postSpy = jest.spyOn(axios, 'post');

    configValues = {
      SEGURIDAD_HABILITADA: 'true',
      MS_SECURITY: 'http://localhost:8181/',
    };
    const configService = {
      get: jest.fn(
        (key: string, defaultVal?: string) => configValues[key] ?? defaultVal,
      ),
    } as unknown as ConfigService;

    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new SecurityGuard(configService, reflector as unknown as Reflector);
  });

  it('permite pasar si SEGURIDAD_HABILITADA=false', async () => {
    configValues.SEGURIDAD_HABILITADA = 'false';
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('permite pasar si la ruta está marcada con @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('lanza 401 si falta token o formato inválido', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      guard.canActivate(makeContext('Basic abc')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('permite pasar cuando ms_security responde allowed: true', async () => {
    postSpy.mockResolvedValue({ data: { allowed: true } });

    await expect(
      guard.canActivate(makeContext('Bearer jwt-valido', '/api/equipos/4', 'GET')),
    ).resolves.toBe(true);

    expect(postSpy).toHaveBeenCalledWith(
      'http://localhost:8181/api/internal/security/permissions-validation',
      { url: '/api/equipos/4', method: 'GET' },
      expect.objectContaining({
        headers: { Authorization: 'Bearer jwt-valido' },
      }),
    );
  });

  it('lanza 403 cuando ms_security responde allowed: false', async () => {
    postSpy.mockResolvedValue({ data: { allowed: false } });

    await expect(
      guard.canActivate(makeContext('Bearer jwt-valido')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lanza 503 cuando ms_security no responde', async () => {
    postSpy.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      guard.canActivate(makeContext('Bearer jwt-valido')),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
