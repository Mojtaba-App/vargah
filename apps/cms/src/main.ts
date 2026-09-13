import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.enableCors({
    origin: [
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 CMS API running on http://localhost:${port}/api/v1`);
}

bootstrap();
