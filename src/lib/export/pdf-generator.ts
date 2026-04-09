/* ════════════════════════════════════════
   HidroCalc PDF Generator — Sigma Flow / SIMEX
   ════════════════════════════════════════ */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND: [number, number, number] = [28, 61, 90]; // #1C3D5A Pantone 7463 C

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFinalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable?.finalY ?? 200;
}

/**
 * Load logo from /public as base64 at runtime.
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/sigmaflow-full.jpg");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Sanitize text: replace Unicode chars that jsPDF can't render
 * with ASCII equivalents to prevent the "spaced out" text bug.
 */
function safe(text: string): string {
  return text
    // Subscripts
    .replace(/₁/g, "1")
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/₀/g, "0")
    // Superscripts
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    // Symbols
    .replace(/✓/g, "[OK]")
    .replace(/✗/g, "[X]")
    .replace(/⚠/g, "[!]")
    .replace(/★/g, "*")
    .replace(/·/g, "-")
    .replace(/—/g, " - ")
    .replace(/–/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/×/g, "x")
    .replace(/°/g, " deg")
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ñ/g, "n")
    .replace(/Á/g, "A")
    .replace(/É/g, "E")
    .replace(/Í/g, "I")
    .replace(/Ó/g, "O")
    .replace(/Ú/g, "U")
    .replace(/Ñ/g, "N");
}

function safeRows(rows: string[][]): string[][] {
  return rows.map((row) => row.map(safe));
}

function safeInputs(inputs: { label: string; value: string }[]): [string, string][] {
  return inputs.map((i) => [safe(i.label), safe(i.value)]);
}

function safeResults(results: { label: string; value: string; unit?: string }[]): [string, string, string][] {
  return results.map((r) => [safe(r.label), safe(r.value), safe(r.unit || "")]);
}

function addHeader(doc: jsPDF, pageWidth: number, logoB64: string | null) {
  // Brand bar top
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Left: Logo image or text fallback
  if (logoB64) {
    try {
      doc.addImage(logoB64, "JPEG", 14, 7, 50, 16);
    } catch {
      // Fallback to text if image fails
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND);
      doc.text("SIGMA FLOW", 14, 18);
    }
  } else {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND);
    doc.text("SIGMA FLOW", 14, 18);
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text("Soluciones en Infraestructura Hidráulica", 14, 26);

  // Right: HidroCalc
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND);
  doc.text("HidroCalc v1.2", pageWidth - 14, 16, { align: "right" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);

  const now = new Date();
  doc.text(
    `${now.toLocaleDateString("es-MX")} - ${now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - 14, 21, { align: "right" }
  );

  // Separator
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.8);
  doc.line(14, 26, pageWidth - 14, 26);
}

function addFooter(doc: jsPDF, pageWidth: number, pageNum: number, totalPages: number) {
  const y = 286;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, y - 4, pageWidth - 14, y - 4);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("HidroCalc by Sigma Flow - Solo para uso tecnico profesional", 14, y);
  doc.text("Pagina " + pageNum + " de " + totalPages, pageWidth - 14, y, { align: "right" });
}

function addWatermark(doc: jsPDF) {
  doc.setFontSize(50);
  doc.setTextColor(...BRAND);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GState = (doc as any).GState;
  if (GState) {
    doc.setGState(new GState({ opacity: 0.03 }));
    doc.text("SIGMA FLOW", 105, 160, { align: "center", angle: 40 });
    doc.setGState(new GState({ opacity: 1 }));
  }
}

function sectionHeader(doc: jsPDF, text: string, y: number, pageWidth: number): number {
  doc.setFillColor(...BRAND);
  doc.rect(14, y, pageWidth - 28, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(safe(text), 17, y + 5);
  return y + 10;
}

export interface PDFExportData {
  title: string;
  module: string;
  projectName: string;
  hasAssumedValues: boolean;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; unit?: string }[];
  alerts: { level: string; message: string }[];
  tableData?: { head: string[]; body: string[][] };
}

export async function generateHidroCalcPDF(data: PDFExportData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Load logo
  const logoB64 = await loadLogoBase64();
  addHeader(doc, pw, logoB64);

  let y = 32;

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(safe(data.title), 14, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(safe("Modulo: " + data.module + "  |  Proyecto: " + data.projectName), 14, y);
  y += 8;

  // Warning
  if (data.hasAssumedValues) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.rect(14, y - 2, pw - 28, 10, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 64, 14);
    doc.text("ATENCION: Algunos resultados usan valores asumidos. Verificar con datos reales.", 17, y + 3.5);
    y += 14;
  }

  // ── INPUTS TABLE ──
  y = sectionHeader(doc, "DATOS DE ENTRADA", y, pw);

  autoTable(doc, {
    startY: y,
    head: [["Parametro", "Valor"]],
    body: safeInputs(data.inputs),
    theme: "striped",
    headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [50, 50, 50], font: "helvetica" },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
  });

  y = getFinalY(doc) + 8;

  // ── RESULTS TABLE ──
  if (y > 230) { doc.addPage(); addWatermark(doc); y = 20; }
  y = sectionHeader(doc, "RESULTADOS", y, pw);

  autoTable(doc, {
    startY: y,
    head: [["Resultado", "Valor", "Unidad"]],
    body: safeResults(data.results),
    theme: "striped",
    headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [50, 50, 50], font: "helvetica" },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 }, 1: { halign: "right", cellWidth: 40 } },
  });

  y = getFinalY(doc) + 8;

  // ── EXTRA TABLE ──
  if (data.tableData) {
    if (y > 210) { doc.addPage(); addWatermark(doc); y = 20; }
    y = sectionHeader(doc, "TABLA COMPARATIVA", y, pw);

    autoTable(doc, {
      startY: y,
      head: [data.tableData.head.map(safe)],
      body: safeRows(data.tableData.body),
      theme: "striped",
      headStyles: { fillColor: BRAND, textColor: 255, fontSize: 7, fontStyle: "bold" },
      styles: { fontSize: 7, cellPadding: 1.8, textColor: [50, 50, 50], font: "helvetica" },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      margin: { left: 14, right: 14 },
    });

    y = getFinalY(doc) + 8;
  }

  // ── ALERTS ──
  if (data.alerts.length > 0) {
    if (y > 245) { doc.addPage(); addWatermark(doc); y = 20; }
    y = sectionHeader(doc, "ALERTAS Y OBSERVACIONES", y, pw);

    const colors: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
      OK: { bg: [220, 252, 231], text: [6, 95, 70] },
      WARN: { bg: [255, 251, 235], text: [146, 64, 14] },
      ERROR: { bg: [254, 226, 226], text: [153, 27, 27] },
      CRITICAL: { bg: [254, 226, 226], text: [127, 29, 29] },
    };

    for (const alert of data.alerts) {
      if (y > 275) { doc.addPage(); addWatermark(doc); y = 20; }
      const c = colors[alert.level] || colors.WARN;
      doc.setFillColor(...c.bg);
      doc.rect(14, y - 3, pw - 28, 7, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(...c.text);
      const icon = alert.level === "OK" ? "[OK]" : alert.level === "WARN" ? "[!]" : "[X]";
      doc.text(icon + "  " + safe(alert.message), 17, y + 1.5);
      y += 9;
    }
  }

  // ── TECHNICAL DISCLAIMERS ──
  if (y > 240) { doc.addPage(); addWatermark(doc); y = 20; }
  y += 4;
  y = sectionHeader(doc, "NOTAS TECNICAS Y LIMITACIONES", y, pw);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const disclaimers = [
    "1. Cálculos basados en formula de Hazen-Williams. Valida para agua limpia a 20 C y flujo turbulento (V > 0.3 m/s).",
    "2. Pérdidas menores estimadas. Verificar con accesorios reales del proyecto.",
    "3. Analisis de golpe de ariete basado en Joukowsky/Michaud. No sustituye analisis de transitorio completo.",
    "4. Validar resultados con normativa local aplicable (NOM-001-CONAGUA, MAPAS, etc.).",
    "5. Este cálculo es de referencia tecnica. No sustituye proyecto ejecutivo firmado por ingeniero responsable.",
  ];
  for (const d of disclaimers) {
    doc.text(d, 16, y);
    y += 3.5;
  }

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, pw, p, totalPages);
    if (p > 1) addWatermark(doc);
  }

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}
