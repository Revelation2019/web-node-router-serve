import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './middleware/logger.middleware';

const PORT = parseInt(process.env.PORT, 10) || 3335; // 端口

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule);
  app.use(new LoggerMiddleware().use);
  await app.listen(PORT);
}
bootstrap();
