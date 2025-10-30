import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: string, dto: CreatePrescriptionDto) {
    const patient = await this.prisma.user.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    const code = 'RX-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    return this.prisma.prescription.create({
      data: {
        code,
        doctorId,
        patientId: dto.patientId,
        items: { create: dto.items },
      },
      include: { items: true, doctor: true, patient: true },
    });
  }

  async listForDoctor(doctorId: string, status?: 'PENDING'|'CONSUMED') {
    return this.prisma.prescription.findMany({
      where: { doctorId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { items: true, patient: true },
    });
  }

  async listAll(status?: 'PENDING'|'CONSUMED') {
    return this.prisma.prescription.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { items: true, patient: true, doctor: true },
    });
  }

  async listForPatient(patientId: string, status?: 'PENDING'|'CONSUMED') {
    return this.prisma.prescription.findMany({
      where: { patientId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { items: true, doctor: true },
    });
  }

  async findAccessible(id: string, requester: { id: string; role: string }) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: { items: true, doctor: true, patient: true },
    });
    if (!rx) throw new NotFoundException('No existe');

    const isOwnerDoctor = rx.doctorId === requester.id;
    const isOwnerPatient = rx.patientId === requester.id;
    const isAdmin = requester.role === 'ADMIN';
    if (!isOwnerDoctor && !isOwnerPatient && !isAdmin) throw new ForbiddenException();

    return rx;
  }

  async consume(id: string, patientId: string) {
    const rx = await this.prisma.prescription.findUnique({ where: { id } });
    if (!rx) throw new NotFoundException('No existe');
    if (rx.patientId !== patientId) throw new ForbiddenException();
    if (rx.status === 'CONSUMED') return rx;

    return this.prisma.prescription.update({
      where: { id },
      data: { status: 'CONSUMED', consumedAt: new Date() },
    });
  }
}
