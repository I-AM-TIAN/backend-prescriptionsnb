import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // En Prisma 5+ / 6+ usa onModuleDestroy para cerrar
  async onModuleDestroy() {
    await this.$disconnect();
  }
}