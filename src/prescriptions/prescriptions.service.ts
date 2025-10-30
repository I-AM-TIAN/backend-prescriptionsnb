import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListQueryDto } from './dto/list-query.dto';

type Requester = { id: string; role: string };

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: string, dto: CreatePrescriptionDto) {
    const patient = await this.prisma.user.findFirst({
      where: { id: dto.patientId, deletedAt: null },
    });
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

  private buildWhere(base: any, q?: ListQueryDto) {
    const where: any = { ...base, deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.from || q?.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }
    return where;
  }

  private buildOrder(q?: ListQueryDto) {
    const sortBy = q?.sortBy ?? 'createdAt';
    const order = q?.order ?? 'desc';
    return { [sortBy]: order };
  }

  private buildPagination(q?: ListQueryDto) {
    const page = q?.page ?? 1;
    const limit = q?.limit ?? 10;
    const skip = (page - 1) * limit;
    return { skip, take: limit, page, limit };
  }

  async listForDoctor(doctorId: string, q?: ListQueryDto) {
    const where = this.buildWhere({ doctorId }, q);
    const orderBy = this.buildOrder(q);
    const { skip, take, page, limit } = this.buildPagination(q);

    const [total, rows] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { items: true, patient: true },
      }),
    ]);

    return { data: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async listAll(q?: ListQueryDto) {
    const where = this.buildWhere({}, q);
    const orderBy = this.buildOrder(q);
    const { skip, take, page, limit } = this.buildPagination(q);

    const [total, rows] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { items: true, patient: true, doctor: true },
      }),
    ]);

    return { data: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async listForPatient(patientId: string, q?: ListQueryDto) {
    const where = this.buildWhere({ patientId }, q);
    const orderBy = this.buildOrder(q);
    const { skip, take, page, limit } = this.buildPagination(q);

    const [total, rows] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { items: true, doctor: true },
      }),
    ]);

    return { data: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findAccessible(id: string, requester: Requester) {
    const rx = await this.prisma.prescription.findFirst({
      where: { id, deletedAt: null },
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
    const rx = await this.prisma.prescription.findFirst({
      where: { id, deletedAt: null },
    });
    if (!rx) throw new NotFoundException('No existe');
    if (rx.patientId !== patientId) throw new ForbiddenException();
    if (rx.status === 'CONSUMED') return rx;

    return this.prisma.prescription.update({
      where: { id },
      data: { status: 'CONSUMED', consumedAt: new Date() },
    });
  }

  // Soft delete (doctor dueño o admin)
  async softDelete(id: string, requester: Requester) {
    const rx = await this.prisma.prescription.findUnique({ where: { id } });
    if (!rx || rx.deletedAt) throw new NotFoundException('No existe');
    const isOwnerDoctor = rx.doctorId === requester.id;
    const isAdmin = requester.role === 'ADMIN';
    if (!isOwnerDoctor && !isAdmin) throw new ForbiddenException();

    return this.prisma.prescription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, requester: Requester) {
    const rx = await this.prisma.prescription.findUnique({ where: { id } });
    if (!rx || !rx.deletedAt) throw new NotFoundException('No existe o no está borrada');
    const isOwnerDoctor = rx.doctorId === requester.id;
    const isAdmin = requester.role === 'ADMIN';
    if (!isOwnerDoctor && !isAdmin) throw new ForbiddenException();

    return this.prisma.prescription.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
