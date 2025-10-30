import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  const config = new DocumentBuilder()
    .setTitle('Prescriptions API')
    .setDescription('API de autenticación y prescripciones')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
