import { Controller, Get, Post, Param, Body, Query, UseGuards, Put } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class PrescriptionsController {
  constructor(private service: PrescriptionsService) {}

  // DOCTOR crea
  @Roles('DOCTOR')
  @Post('prescriptions')
  create(@GetUser() user: any, @Body() dto: CreatePrescriptionDto) {
    return this.service.create(user.id, dto);
  }

  // DOCTOR lista propias | ADMIN lista todas
  @Roles('DOCTOR', 'ADMIN')
  @Get('prescriptions')
  list(@GetUser() user: any, @Query('status') status?: 'PENDING'|'CONSUMED') {
    if (user.role === 'ADMIN') return this.service.listAll(status);
    return this.service.listForDoctor(user.id, status);
  }

  // PATIENT lista las suyas
  @Roles('PATIENT')
  @Get('me/prescriptions')
  myList(@GetUser() user: any, @Query('status') status?: 'PENDING'|'CONSUMED') {
    return this.service.listForPatient(user.id, status);
  }

  // Detalle (accesible por dueño doctor/paciente o admin)
  @Roles('DOCTOR', 'PATIENT', 'ADMIN')
  @Get('prescriptions/:id')
  detail(@GetUser() user: any, @Param('id') id: string) {
    return this.service.findAccessible(id, user);
  }

  // Consumir (paciente)
  @Roles('PATIENT')
  @Put('prescriptions/:id/consume')
  consume(@GetUser() user: any, @Param('id') id: string) {
    return this.service.consume(id, user.id);
  }

  // PDF (stub por ahora)
  @Roles('DOCTOR', 'PATIENT', 'ADMIN')
  @Get('prescriptions/:id/pdf')
  pdf() {
    return { ok: false, message: 'PDF no implementado aún' };
  }
}