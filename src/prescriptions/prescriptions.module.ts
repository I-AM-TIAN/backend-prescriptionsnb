import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PdfService } from 'src/shared/pdf.service';

@Module({
  providers: [PrescriptionsService, PdfService],
  controllers: [PrescriptionsController],
})
export class PrescriptionsModule {}
