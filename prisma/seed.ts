import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Limpieza ordenada (hijo -> padre)
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.user.deleteMany();

  // Usuarios base
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: await argon2.hash('admin123'),
      role: Role.ADMIN,
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: 'dr@test.com',
      passwordHash: await argon2.hash('dr123'),
      role: Role.DOCTOR,
    },
  });

  const patient = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      passwordHash: await argon2.hash('patient123'),
      role: Role.PATIENT,
    },
  });

  // Prescripción de ejemplo (para probar luego el módulo)
  const rx = await prisma.prescription.create({
    data: {
      code: 'RX-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      doctorId: doctor.id,
      patientId: patient.id,
      items: {
        create: [
          { name: 'Ibuprofeno', dose: '400 mg', quantity: 10, notes: 'Cada 8 horas con comida' },
          { name: 'Omeprazol', dose: '20 mg', quantity: 7 },
        ],
      },
    },
    include: { items: true },
  });

  console.log('Seed listo:', {
    admin: { email: admin.email },
    doctor: { email: doctor.email },
    patient: { email: patient.email },
    rx: { id: rx.id, code: rx.code, items: rx.items.length },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
