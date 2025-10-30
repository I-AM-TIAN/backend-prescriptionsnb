import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async buildPrescriptionPdf(rx: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    doc.fontSize(18).text('Prescripción', { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).text(`Código: ${rx.code}`);
    doc.text(`Estado: ${rx.status}`);
    doc.text(`Fecha: ${new Date(rx.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.text(`Médico: ${rx.doctor?.email ?? rx.doctorId}`);
    doc.text(`Paciente: ${rx.patient?.email ?? rx.patientId}`);
    doc.moveDown();

    doc.fontSize(14).text('Ítems', { underline: true }).moveDown(0.25);
    rx.items.forEach((it: any, i: number) => {
      doc.fontSize(12).text(`${i + 1}. ${it.name}`);
      if (it.dose) doc.text(`   Dosis: ${it.dose}`);
      if (it.quantity) doc.text(`   Cantidad: ${it.quantity}`);
      if (it.notes) doc.text(`   Notas: ${it.notes}`);
      doc.moveDown(0.25);
    });

    if (rx.status === 'CONSUMED' && rx.consumedAt) {
      doc.moveDown().fontSize(11).text(`Consumo registrado: ${new Date(rx.consumedAt).toLocaleString()}`);
    }

    doc.end();
    return done;
  }
}
