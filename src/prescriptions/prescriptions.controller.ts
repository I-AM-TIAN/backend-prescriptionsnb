import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Put,
  Delete,
  Patch,
  Res,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ListQueryDto } from './dto/list-query.dto';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from '../shared/pdf.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@ApiTags('prescriptions')
@Controller()
export class PrescriptionsController {
  constructor(
    private service: PrescriptionsService,
    private pdfService: PdfService,
  ) {}

  @Roles('DOCTOR')
  @Post('prescriptions')
  create(@GetUser() user: any, @Body() dto: CreatePrescriptionDto) {
    return this.service.create(user.id, dto);
  }

  @Roles('DOCTOR', 'ADMIN')
  @Get('prescriptions')
  list(@GetUser() user: any, @Query() q: ListQueryDto) {
    if (user.role === 'ADMIN') return this.service.listAll(q);
    return this.service.listForDoctor(user.id, q);
  }

  @Roles('PATIENT')
  @Get('me/prescriptions')
  myList(@GetUser() user: any, @Query() q: ListQueryDto) {
    return this.service.listForPatient(user.id, q);
  }

  @Roles('DOCTOR', 'PATIENT', 'ADMIN')
  @ApiParam({ name: 'id' })
  @Get('prescriptions/:id')
  detail(@GetUser() user: any, @Param('id') id: string) {
    return this.service.findAccessible(id, user);
  }

  @Roles('PATIENT')
  @ApiParam({ name: 'id' })
  @Put('prescriptions/:id/consume')
  consume(@GetUser() user: any, @Param('id') id: string) {
    return this.service.consume(id, user.id);
  }

  // Soft delete (doctor dueño o admin)
  @Roles('DOCTOR', 'ADMIN')
  @ApiParam({ name: 'id' })
  @Delete('prescriptions/:id')
  softDelete(@GetUser() user: any, @Param('id') id: string) {
    return this.service.softDelete(id, user);
  }

  @Roles('DOCTOR', 'ADMIN')
  @ApiParam({ name: 'id' })
  @Patch('prescriptions/:id/restore')
  restore(@GetUser() user: any, @Param('id') id: string) {
    return this.service.restore(id, user);
  }

  // PDF
  @Roles('DOCTOR', 'PATIENT', 'ADMIN')
  @ApiParam({ name: 'id' })
  @Get('prescriptions/:id/pdf')
  async pdf(
    @GetUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const rx = await this.service.findAccessible(id, user);
    const buffer = await this.pdfService.buildPrescriptionPdf(rx);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="prescription-${rx.code}.pdf"`,
    );
    return res.send(buffer);
  }
}
