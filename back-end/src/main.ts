import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger.service';
import { CorrelationInterceptor } from './common/correlation.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(new CorrelationInterceptor());
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 4000);
  const workerOnly = config.get<boolean>('workerOnly', false);

  await app.listen(port);
  logger.event(
    `Notification system up on :${port}` +
      (workerOnly ? ' (worker instance)' : ''),
    { workerOnly },
  );
}

bootstrap();
