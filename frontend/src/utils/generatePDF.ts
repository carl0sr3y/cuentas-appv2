import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, { total: number; type: string }>;
}

interface Transaction {
  type: string;
  amount: string;
  description: string;
  date: string;
  category: { name: string };
  user: { name: string };
}

interface ClientTransaction {
  type: string;
  amount: string;
  description: string;
  date: string;
  user: { name: string };
}

interface Client {
  name: string;
  type: string;
  phone?: string;
  email?: string;
  balance: number;
  transactions: ClientTransaction[];
}

export const generatePDF = (summary: Summary, transactions: Transaction[]) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Cuentas App — Reporte Financiero", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Resumen", 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [["Concepto", "Monto"]],
    body: [
      ["Total Ingresos", `Q${summary.totalIncome.toFixed(2)}`],
      ["Total Egresos", `Q${summary.totalExpense.toFixed(2)}`],
      ["Balance", `Q${summary.balance.toFixed(2)}`],
    ],
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.setFontSize(14);
  doc.text("Transacciones", 14, (doc as any).lastAutoTable.finalY + 14);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [["Fecha", "Tipo", "Categoría", "Descripción", "Monto", "Usuario"]],
    body: transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type === "INCOME" ? "Ingreso" : "Egreso",
      t.category.name,
      t.description || "-",
      `Q${parseFloat(t.amount).toFixed(2)}`,
      t.user.name,
    ]),
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save("reporte-cuentas-app.pdf");
};

export const generateClientPDF = (client: Client) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Estado de cuenta — ${client.name}`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Tipo: ${client.type === "PERSON" ? "Persona" : "Empresa"}`, 14, 38);
  if (client.phone) doc.text(`Teléfono: ${client.phone}`, 14, 45);
  if (client.email) doc.text(`Email: ${client.email}`, 14, 52);

  const balanceColor = client.balance >= 0 ? [22, 163, 74] : [220, 38, 38];
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.setFontSize(14);
  doc.text(`Balance: Q${client.balance.toFixed(2)}`, 14, 62);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.text("Historial de movimientos", 14, 74);

  autoTable(doc, {
    startY: 78,
    head: [["Fecha", "Tipo", "Descripción", "Monto", "Usuario"]],
    body: client.transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type === "INCOME" ? "Abono" : "Cargo",
      t.description || "-",
      `Q${parseFloat(t.amount).toFixed(2)}`,
      t.user.name,
    ]),
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`estado-cuenta-${client.name.toLowerCase().replace(/ /g, "-")}.pdf`);
};