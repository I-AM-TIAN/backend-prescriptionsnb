import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.APP_ORIGIN ?? true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Verificación de DB al arrancar
  const prisma = app.get(PrismaService);
  await prisma.$queryRaw`SELECT 1`;
  console.log('DB connection: OK');

  // Shutdown hooks para Prisma
  app.enableShutdownHooks();

  const port = process.env.PORT || 4001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();