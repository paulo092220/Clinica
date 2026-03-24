
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Patient, Appointment, FixedExpense, DistributionConfig, User } from "../types";

export const generateMasterReportPDF = (data: {
  patients: Patient[];
  appointments: Appointment[];
  fixedExpenses: FixedExpense[];
  config: DistributionConfig;
  users: User[];
}) => {
  const { patients, appointments, fixedExpenses, config, users } = data;
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString();

  // --- ENCABEZADO ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NOAH'S AGENCY", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Gestión Clínica Estomatológica Integral", 14, 28);
  doc.text(`Fecha de Emisión: ${dateStr}`, pageWidth - 14, 20, { align: "right" });
  doc.text("Reporte Ejecutivo Maestro", pageWidth - 14, 28, { align: "right" });

  let currentY = 50;

  // --- RESUMEN FINANCIERO GLOBAL ---
  const allRecords = patients.flatMap(p => p.history);
  const totalIncomeCUP = allRecords.reduce((sum, r) => sum + r.amountPaidCUP, 0) + 
                         appointments.filter(a => a.status !== 'cancelled').reduce((sum, a) => sum + (a.reservationFeeCUP || 0), 0);
  const totalIncomeUSD = allRecords.reduce((sum, r) => sum + r.amountPaidUSD, 0) +
                         appointments.filter(a => a.status !== 'cancelled').reduce((sum, a) => sum + (a.reservationFeeUSD || 0), 0);
  const totalSpentCUP = fixedExpenses.reduce((sum, e) => sum + e.amountCUP, 0);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text("1. Resumen Financiero Consolidado", 14, currentY);
  currentY += 5;

  doc.autoTable({
    startY: currentY,
    head: [['Concepto', 'Monto CUP', 'Monto USD (Equiv.)']],
    body: [
      ['Ingresos Totales (Tratamientos + Reservas)', `$ ${totalIncomeCUP.toLocaleString()}`, `$ ${totalIncomeUSD.toLocaleString()}`],
      ['Gastos Totales (Operativos)', `$ ${totalSpentCUP.toLocaleString()}`, '-'],
      ['Utilidad Bruta Clínica', `$ ${(totalIncomeCUP - totalSpentCUP).toLocaleString()}`, '-'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- TABLA DE FACTURACIÓN (ÚLTIMOS MOVIMIENTOS) ---
  doc.text("2. Últimos Movimientos de Facturación", 14, currentY);
  currentY += 5;

  const billingRows = allRecords.slice(0, 15).map(r => [
    r.date,
    patients.find(p => p.history.some(h => h.id === r.id))?.name || 'N/A',
    r.doctor,
    r.paymentMethod,
    `$ ${r.amountPaidCUP.toLocaleString()} CUP`
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Fecha', 'Paciente', 'Doctor', 'Método', 'Monto']],
    body: billingRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- DISTRIBUCIÓN DE UTILIDADES ---
  doc.text("3. Distribución de Fondos y Utilidades", 14, currentY);
  currentY += 5;

  const netClinic = totalIncomeCUP - totalSpentCUP;
  const distributionRows = [
    ['Recuperación de Inversión', `${config.investmentRecovery}%`, `$ ${(netClinic * config.investmentRecovery / 100).toLocaleString()} CUP`],
    ['Gastos y Operaciones', `${config.operatingCosts}%`, `$ ${(netClinic * config.operatingCosts / 100).toLocaleString()} CUP`],
    ['Socio Inversor', `${config.investorPartner}%`, `$ ${(netClinic * config.investorPartner / 100).toLocaleString()} CUP`],
  ];

  doc.autoTable({
    startY: currentY,
    head: [['Fondo de Reserva', 'Porcentaje', 'Monto Distribuido']],
    body: distributionRows,
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11] }, // Amber 500
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- RENDIMIENTO MÉDICO ---
  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.text("4. Desempeño y Rentabilidad por Estomatólogo", 14, currentY);
  currentY += 5;

  const doctorRows = users.filter(u => u.roleType === 'DENTIST').map(doc => {
    const docRecs = allRecords.filter(r => r.doctor === doc.name);
    const prodCUP = docRecs.reduce((sum, r) => sum + r.amountPaidCUP, 0);
    return [
      doc.name,
      docRecs.length,
      `$ ${prodCUP.toLocaleString()} CUP`,
      `$ ${(prodCUP * config.doctorCommission / 100).toLocaleString()} CUP`
    ];
  });

  doc.autoTable({
    startY: currentY,
    head: [['Doctor', 'Pacientes', 'Producción Bruta', 'Honorarios (Neto)']],
    body: doctorRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- DEMANDA DE SERVICIOS ---
  doc.text("5. Servicios más Demandados", 14, currentY);
  currentY += 5;

  const serviceCounts: Record<string, number> = {};
  allRecords.forEach(r => r.services?.forEach(s => serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1));
  const serviceRows = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => [name, count, `${((count / allRecords.length) * 100).toFixed(1)}%`]);

  doc.autoTable({
    startY: currentY,
    head: [['Servicio', 'Frecuencia', 'Impacto en Demanda']],
    body: serviceRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
  });

  // --- PIE DE PÁGINA ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - Generado automáticamente por Noah's Agency Dental Suite`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`Reporte_Maestro_${dateStr.replace(/\//g, '-')}.pdf`);
};
