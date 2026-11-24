import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/errores/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const campos: Record<string, string> = {};
        for (const error of errors) {
          const mensaje = Object.values(error.constraints ?? {})[0];
          if (mensaje) campos[error.property] = mensaje;
        }
        // El ValidationPipe LANZA lo que devuelva esta función: tiene que ser una excepción HTTP,
        // no un objeto plano (si no, el filtro no la reconoce y responde 500).
        return new BadRequestException(campos);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const corsOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : 'http://localhost:5173',
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 8182);
}
void bootstrap();
