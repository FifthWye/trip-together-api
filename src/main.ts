import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const origins = process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
  ];
  app.enableCors({ origin: origins, credentials: true });

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
