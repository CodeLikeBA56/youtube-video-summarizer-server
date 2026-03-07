import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'fatal', 'debug', 'verbose'],
  });
  app.setGlobalPrefix('api');

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',') : [];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
