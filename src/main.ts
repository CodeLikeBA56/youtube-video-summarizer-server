import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'fatal', 'debug', 'verbose'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
