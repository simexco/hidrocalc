/* ════════════════════════════════════════
   Reporte de Predimensionamiento Hidráulico — Sigma Flow
   Entregable consolidado (Demanda · Conducción · Bombeo · Guía)
   Documento sin carácter oficial: no sustituye al proyecto ejecutivo.
   ════════════════════════════════════════ */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND: [number, number, number] = [28, 61, 90]; // #1C3D5A

// ── Tipos ──────────────────────────────────────────────
export interface ReportVertex { cad: number; cota: number; desc: string }
export interface ReportValve { cad: string; tipo: string }

export interface ReportData {
  // Portada
  proyecto: string;
  localidad: string;
  fecha: string;
  folio: string;
  elaboro: string;
  // Módulo 1 — Demanda
  poblacion: number | null;
  periodoDiseno: number | null;
  dotacion: number | null;
  cmd: number | null;
  cmh: number | null;
  horasTanque: number | null;
  // Módulo 2 — Conducción
  q_ls: number | null;
  longitud: number | null;
  desnivel: number | null;
  presionRequerida: number | null;
  material: string;
  dn: string;
  clase: string;
  diametroInterior: number | null; // mm
  c: number | null;
  vertices: ReportVertex[];
  valvulas: ReportValve[];
  // Módulo 3 — Bombeo
  incluyeBombeo: boolean;
  he: number | null;
  eficiencia: number | null;
}

export interface ReportResults {
  qm: number | null;
  qmd: number | null;
  qmh: number | null;
  vtanque: number | null;
  velocidad: number | null;
  hf: number | null;
  hac: number | null;
  perdidaTotal: number | null;
  presionFinal: number | null;
  hv: number | null;
  cdt: number | null;
  phKW: number | null;
  peKW: number | null;
  hp: number | null;
  qm3h: number | null;
}

// ── Cálculos del reporte ───────────────────────────────
export function computeReport(d: ReportData): ReportResults {
  const r: ReportResults = {
    qm: null, qmd: null, qmh: null, vtanque: null,
    velocidad: null, hf: null, hac: null, perdidaTotal: null, presionFinal: null,
    hv: null, cdt: null, phKW: null, peKW: null, hp: null, qm3h: null,
  };

  // Módulo 1
  if (d.poblacion != null && d.dotacion != null && d.poblacion > 0 && d.dotacion > 0) {
    r.qm = (d.dotacion * d.poblacion) / 86400;
    if (d.cmd != null) r.qmd = r.qm * d.cmd;
    if (d.cmh != null) r.qmh = r.qm * d.cmh;
    if (r.qmd != null && d.horasTanque != null) r.vtanque = r.qmd * d.horasTanque * 3.6; // L/s × h × 3.6 = m³
  }

  // Módulo 2 — gasto de conducción (usa Q capturado, suele ser Qmd)
  const Q = d.q_ls;
  if (Q != null && Q > 0 && d.diametroInterior != null && d.diametroInterior > 0) {
    const Q_m3s = Q / 1000;
    const D_m = d.diametroInterior / 1000;
    const A = Math.PI * Math.pow(D_m / 2, 2);
    r.velocidad = Q_m3s / A;
    r.hv = (r.velocidad * r.velocidad) / (2 * 9.81);
    if (d.longitud != null && d.longitud > 0 && d.c != null && d.c > 0) {
      r.hf = (10.67 * d.longitud * Math.pow(Q_m3s, 1.852)) / (Math.pow(d.c, 1.852) * Math.pow(D_m, 4.87));
      r.hac = 0.1 * r.hf;
      r.perdidaTotal = r.hf + r.hac;
      // Presión final (línea por gravedad): carga disponible = desnivel; menos pérdidas
      if (d.desnivel != null) r.presionFinal = d.desnivel - r.perdidaTotal;
    }
  }

  // Módulo 3 — Bombeo
  if (d.incluyeBombeo && Q != null && Q > 0 && d.he != null) {
    const hf = r.hf ?? 0;
    const hac = r.hac ?? 0;
    const hv = r.hv ?? 0;
    r.cdt = d.he + hf + hac + hv;
    const Q_m3s = Q / 1000;
    r.phKW = (9.81 * Q_m3s * r.cdt); // kW (rho·g·Q·H, con 9.81 kN/m³ → kW)
    const ef = d.eficiencia != null && d.eficiencia > 0 ? d.eficiencia / 100 : 0.7;
    r.peKW = r.phKW / ef;
    r.hp = r.peKW * 1.341;
    r.qm3h = Q_m3s * 3600;
  } else if (Q != null) {
    r.qm3h = (Q / 1000) * 3600;
  }

  return r;
}

// ── Helpers de texto ───────────────────────────────────
function safe(text: string): string {
  return text
    .replace(/₁/g, "1").replace(/₂/g, "2").replace(/₃/g, "3").replace(/₀/g, "0")
    .replace(/²/g, "2").replace(/³/g, "3")
    .replace(/✓/g, "[OK]").replace(/✗/g, "[X]").replace(/⚠/g, "[!]")
    .replace(/·/g, "-").replace(/—/g, " - ").replace(/–/g, "-")
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/×/g, "x").replace(/°/g, " deg")
    .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n")
    .replace(/Á/g, "A").replace(/É/g, "E").replace(/Í/g, "I").replace(/Ó/g, "O").replace(/Ú/g, "U").replace(/Ñ/g, "N");
}
const n = (v: number | null | undefined, dec = 2) => (v == null || !isFinite(v) ? "—" : v.toFixed(dec));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number { return (doc as any).lastAutoTable?.finalY ?? 40; }

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/sigmaflow-full.jpg");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ── Encabezado y pie por hoja ──────────────────────────
function header(doc: jsPDF, d: ReportData, hoja: number, total: number) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pw, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(safe(d.proyecto || "Proyecto"), 14, 9);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(safe(`${d.localidad || ""}  ${d.fecha ? "- " + d.fecha : ""}  ${d.folio ? "- Folio " + d.folio : ""}`), 14, 15);
  doc.text(safe(`Elaboro: ${d.elaboro || "-"}`), 14, 19.5);
  doc.setTextColor(0, 0, 0);

  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BRAND); doc.setLineWidth(0.3); doc.line(14, ph - 16, pw - 14, ph - 16);
  doc.setFontSize(7); doc.setTextColor(120, 120, 120);
  doc.text("Elaborado con criterios de los MAPAS (CONAGUA). Documento sin caracter oficial: no sustituye al proyecto ejecutivo.", 14, ph - 11);
  doc.text("cotizaciones@sigmaflow.mx - www.sigmaflow.mx", 14, ph - 7);
  doc.text(safe(`${d.folio || ""} - Hoja ${hoja} de ${total}`), pw - 14, ph - 7, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

function sectionTitle(doc: jsPDF, num: string, title: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND);
  doc.rect(14, y, pw - 28, 8, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(safe(`${num}  ${title}`), 17, y + 5.5);
  doc.setTextColor(0, 0, 0);
  return y + 12;
}

function subhead(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...BRAND);
  doc.text(safe(text), 14, y);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
  return y + 5;
}

// ── Gráfica del perfil (vector) ────────────────────────
function drawProfile(doc: jsPDF, verts: ReportVertex[], y: number): number {
  const pts = [...verts].filter((v) => v.cad != null && v.cota != null).sort((a, b) => a.cad - b.cad);
  if (pts.length < 2) return y;
  const pw = doc.internal.pageSize.getWidth();
  const x0 = 20, x1 = pw - 20, h = 42, yTop = y;
  const cads = pts.map((p) => p.cad), cotas = pts.map((p) => p.cota);
  const cMin = Math.min(...cads), cMax = Math.max(...cads);
  const zMin = Math.min(...cotas), zMax = Math.max(...cotas);
  const zPad = Math.max((zMax - zMin) * 0.15, 1);
  const zLo = zMin - zPad, zHi = zMax + zPad;
  const sx = (c: number) => x0 + ((c - cMin) / (cMax - cMin || 1)) * (x1 - x0);
  const sy = (z: number) => yTop + h - ((z - zLo) / (zHi - zLo || 1)) * h;

  // ejes
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
  doc.line(x0, yTop, x0, yTop + h); doc.line(x0, yTop + h, x1, yTop + h);
  // terreno
  doc.setDrawColor(...BRAND); doc.setLineWidth(0.6);
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(sx(pts[i].cad), sy(pts[i].cota), sx(pts[i + 1].cad), sy(pts[i + 1].cota));
  }
  // puntos + etiquetas
  doc.setFontSize(6); doc.setTextColor(80, 80, 80);
  for (const p of pts) {
    doc.setFillColor(...BRAND); doc.circle(sx(p.cad), sy(p.cota), 0.8, "F");
    doc.text(`${p.cota.toFixed(1)}`, sx(p.cad), sy(p.cota) - 2, { align: "center" });
    if (p.desc) doc.text(safe(p.desc), sx(p.cad), yTop + h + 4, { align: "center" });
    doc.text(`0+${String(Math.round(p.cad)).padStart(3, "0")}`, sx(p.cad), yTop + h + 8, { align: "center" });
  }
  doc.setTextColor(120, 120, 120); doc.setFontSize(7);
  doc.text("Cadenamiento (m) - cotas en m.s.n.m.", (x0 + x1) / 2, yTop + h + 13, { align: "center" });
  doc.setTextColor(0, 0, 0);
  return yTop + h + 18;
}

// ════════════════════════════════════════════════════════
//  GENERADOR PRINCIPAL
// ════════════════════════════════════════════════════════
export async function generateReportPDF(d: ReportData): Promise<jsPDF> {
  const r = computeReport(d);
  const doc = new jsPDF();
  const total = d.incluyeBombeo ? 4 : 3;
  const logo = await loadLogo();

  const tableBlue = { fillColor: BRAND as [number, number, number], textColor: 255 as number, fontStyle: "bold" as const };

  // ─────────── HOJA 1 — DEMANDA ───────────
  header(doc, d, 1, total);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("REPORTE DE PREDIMENSIONAMIENTO HIDRAULICO", 14, 32);
  let y = sectionTitle(doc, "MODULO 1", "ANALISIS DE DEMANDA DE AGUA", 38);
  doc.setFontSize(8); doc.setTextColor(90, 90, 90);
  doc.text(safe("Que responde: cuanta agua requiere la poblacion, cuanto debe entregar la fuente y de que tamano el tanque."), 14, y);
  doc.setTextColor(0, 0, 0); y += 6;

  y = subhead(doc, "1  Entradas capturadas", y);
  autoTable(doc, {
    startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
    head: [["Parametro", "Valor", "Referencia"]],
    body: [
      ["Poblacion de diseno", `${n(d.poblacion, 0)} hab`, "Dato base"],
      ["Periodo de diseno", `${n(d.periodoDiseno, 0)} anos`, "Normativa"],
      ["Dotacion por habitante", `${n(d.dotacion, 0)} L/hab/dia`, "MAPAS CONAGUA"],
      ["Coef. maximo diario (CMD)", n(d.cmd, 2), "MAPAS CONAGUA"],
      ["Coef. maximo horario (CMH)", n(d.cmh, 2), "MAPAS CONAGUA"],
    ],
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 6;

  y = subhead(doc, "2  Resultados para obra", y);
  autoTable(doc, {
    startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
    head: [["Resultado", "Valor", "Para que sirve"]],
    body: [
      ["Gasto medio (Qm)", `${n(r.qm)} L/s`, "Consumo promedio diario"],
      ["Gasto maximo diario (Qmd)", `${n(r.qmd)} L/s`, "Disena FUENTE y CONDUCCION"],
      ["Gasto maximo horario (Qmh)", `${n(r.qmh)} L/s`, "Disena RED DE DISTRIBUCION"],
      ["Tanque de regulacion (V)", `${n(r.vtanque, 1)} m3`, "Qmd x horas equiv. x 3.6"],
    ],
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 6;
  doc.setFillColor(233, 239, 245); doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 16, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...BRAND);
  doc.text("LA FUENTE DEBE ENTREGAR CUANDO MENOS:", 17, y + 6);
  doc.setFontSize(13); doc.text(`${n(r.qmd)} L/s`, 17, y + 13);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(60, 60, 60);
  doc.text(safe("El aforo de la fuente (pozo, manantial, toma) debe ser >= Qmd. Si no se conoce, solicitar prueba de aforo antes de construir."), 70, y + 8, { maxWidth: doc.internal.pageSize.getWidth() - 90 });
  doc.setTextColor(0, 0, 0);

  // ─────────── HOJA 2 — CONDUCCION ───────────
  doc.addPage();
  header(doc, d, 2, total);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("REPORTE DE PREDIMENSIONAMIENTO HIDRAULICO", 14, 32);
  y = sectionTitle(doc, "MODULO 2", "DIMENSIONAMIENTO DE TUBERIA", 38);
  doc.setFontSize(8); doc.setTextColor(90, 90, 90);
  doc.text(safe("Que responde: que tubo se requiere (material, diametro y clase), longitud y ubicacion de valvulas."), 14, y);
  doc.setTextColor(0, 0, 0); y += 6;

  y = subhead(doc, "1  Entradas capturadas", y);
  autoTable(doc, {
    startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
    head: [["Parametro", "Valor"]],
    body: [
      ["Gasto de diseno (Q)", `${n(d.q_ls)} L/s`],
      ["Longitud total de la linea", `${n(d.longitud, 0)} m`],
      ["Desnivel (cota inicio-fin)", `${n(d.desnivel, 1)} m`],
      ["Presion requerida al final", `${n(d.presionRequerida, 1)} m.c.a.`],
      ["Material elegido", `${d.material || "-"}`],
      ["Coef. Hazen-Williams (C)", n(d.c, 0)],
    ],
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 6;

  y = subhead(doc, "2  Resultados para obra", y);
  autoTable(doc, {
    startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
    head: [["Resultado", "Valor"]],
    body: [
      ["Tuberia sugerida", `${d.material || "-"} ${d.clase || ""} ${d.dn || ""}`.trim()],
      ["Velocidad en la linea", `${n(r.velocidad)} m/s ${r.velocidad != null && r.velocidad >= 0.3 && r.velocidad <= 2.5 ? "(0.3-2.5 OK)" : "(revisar)"}`],
      ["Perdida por friccion (Hf)", `${n(r.hf, 2)} m`],
      ["Perdida por accesorios (10%)", `${n(r.hac, 2)} m`],
      ["Perdida total", `${n(r.perdidaTotal, 2)} m`],
      ["Presion estimada al final", `${n(r.presionFinal, 1)} m.c.a. ${r.presionFinal != null && d.presionRequerida != null && r.presionFinal >= d.presionRequerida ? "CUMPLE" : "REVISAR"}`],
    ],
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 6;

  if (d.vertices.filter((v) => v.cad != null && v.cota != null).length >= 2) {
    y = subhead(doc, "Perfil de la linea", y);
    y = drawProfile(doc, d.vertices, y);
  }
  if (d.valvulas.filter((v) => v.cad || v.tipo).length > 0) {
    autoTable(doc, {
      startY: y, theme: "plain", styles: { fontSize: 8 },
      head: [["Cadenamiento", "Valvula / accesorio sugerido"]],
      headStyles: { fontStyle: "bold", textColor: BRAND as [number, number, number] },
      body: d.valvulas.filter((v) => v.cad || v.tipo).map((v) => [v.cad || "-", safe(v.tipo || "-")]),
      margin: { left: 14, right: 14 },
    });
  }

  // ─────────── HOJA 3 — BOMBEO ───────────
  if (d.incluyeBombeo) {
    doc.addPage();
    header(doc, d, 3, total);
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE PREDIMENSIONAMIENTO HIDRAULICO", 14, 32);
    y = sectionTitle(doc, "MODULO 3", "EQUIPO DE BOMBEO", 38);
    doc.setFontSize(8); doc.setTextColor(90, 90, 90);
    doc.text(safe("Que responde: datos para solicitar la bomba (Q y CDT); el proveedor define modelo y HP."), 14, y);
    doc.setTextColor(0, 0, 0); y += 6;

    y = subhead(doc, "1  Entradas y proceso", y);
    autoTable(doc, {
      startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
      head: [["Parametro", "Valor"]],
      body: [
        ["Gasto por conducir (Q)", `${n(d.q_ls)} L/s (${n(r.qm3h, 1)} m3/h)`],
        ["Carga estatica (He)", `${n(d.he, 1)} m`],
        ["Perdidas (Hf + Hac)", `${n(r.perdidaTotal, 1)} m`],
        ["Carga de velocidad (Hv)", `${n(r.hv, 2)} m`],
        ["Eficiencia del equipo", `${n(d.eficiencia, 0)} %`],
        ["CDT = He + Hf + Hac + Hv", `${n(r.cdt, 1)} m`],
      ],
      margin: { left: 14, right: 14 },
    });
    y = finalY(doc) + 6;

    doc.setFillColor(233, 239, 245); doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 16, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...BRAND);
    doc.text("SOLICITAR LA BOMBA CON ESTOS 2 DATOS:", 17, y + 6);
    doc.setFontSize(12);
    doc.text(`Q = ${n(d.q_ls)} L/s    +    CDT = ${n(r.cdt, 1)} m`, 17, y + 13);
    doc.setTextColor(0, 0, 0); y += 22;

    y = subhead(doc, "Datos para cotizar", y);
    autoTable(doc, {
      startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
      head: [["Concepto", "Valor"]],
      body: [
        ["Caudal nominal (Q)", `${n(d.q_ls)} L/s (${n(r.qm3h, 1)} m3/h)`],
        ["Carga de diseno (CDT)", `${n(r.cdt, 1)} m.c.a.`],
        ["Potencia hidraulica / al freno", `${n(r.phKW, 2)} / ${n(r.peKW, 2)} kW`],
        ["Potencia estimada (referencia)", `~${n(r.hp, 1)} HP`],
        ["Tipo de bomba", "Centrifuga horizontal o sumergible"],
      ],
      margin: { left: 14, right: 14 },
    });
    y = finalY(doc) + 4;
    doc.setFontSize(7.5); doc.setTextColor(90, 90, 90);
    doc.text(safe("NOTA: el modelo y la potencia definitivos los determina el proveedor con la curva del equipo. La potencia estimada es solo para comparar propuestas y presupuestar."), 14, y, { maxWidth: doc.internal.pageSize.getWidth() - 28 });
    doc.setTextColor(0, 0, 0);
  }

  // ─────────── HOJA FINAL — GUIA DE INSTALACION ───────────
  doc.addPage();
  header(doc, d, total, total);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("GUIA DE INSTALACION SUGERIDA", 14, 32);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 90);
  doc.text(safe("Asi se construiria la linea. Esquemas ilustrativos: el proyecto ejecutivo define los valores finales."), 14, 38);
  doc.setTextColor(0, 0, 0);

  y = subhead(doc, "Secuencia de instalacion", 46);
  const pasos = [
    "1. Excavar la zanja al ancho y profundidad indicados; fondo parejo, sin piedras.",
    "2. Colocar plantilla (cama) de arena de 10 cm y nivelarla.",
    "3. Tender el tubo y ensamblar uniones espiga-campana con lubricante.",
    "4. Acostillar con material fino compactado a mano hasta el lomo del tubo.",
    "5. Relleno inicial: 30 cm sobre el lomo, compactado a mano (sin piedras).",
    "6. Relleno final con material de excavacion, compactado por capas.",
    "7. Antes de tapar uniones: prueba hidrostatica a 1.5 x la presion de trabajo.",
    "8. Colar atraques contra terreno firme antes de la prueba.",
  ];
  doc.setFontSize(8);
  for (const p of pasos) { doc.text(safe(p), 16, y); y += 5; }
  y += 3;

  y = subhead(doc, "Dimensiones para atraques de concreto (f'c = 150 kg/cm2)", y);
  autoTable(doc, {
    startY: y, theme: "grid", styles: { fontSize: 8 }, headStyles: tableBlue,
    head: [["Diam. nominal", "Altura cm", "Lado A cm", "Lado B cm", "Vol. m3"]],
    body: [
      ['51 mm (2")', "25", "25", "25", "0.016"],
      ['63 mm (2 1/2")', "30", "30", "30", "0.027"],
      ['76 mm (3")', "35", "30", "30", "0.032"],
      ['102 mm (4")', "40", "35", "35", "0.049"],
      ['152 mm (6")', "50", "45", "45", "0.101"],
    ],
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 6;

  y = subhead(doc, "Glosario rapido", y);
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  const glos = [
    "Qm / Qmd / Qmh: gasto medio / maximo diario / maximo horario.",
    "Aforo: cuantos L/s entrega la fuente de forma sostenida.",
    "m.c.a.: metros de columna de agua (1 kg/cm2 = 10 m.c.a.).",
    "RD: relacion diametro/espesor; define la presion que resiste el tubo.",
    "CDT: carga dinamica total que debe vencer la bomba.",
    "VAEA: valvula de admision y expulsion de aire (puntos altos).",
    "VRP: valvula reductora de presion (cuando la presion excede la clase).",
    "Atraque: bloque de concreto que transmite el empuje del agua al terreno.",
  ];
  for (const g of glos) { doc.text(safe(g), 16, y); y += 4.5; }
  y += 4;

  doc.setFillColor(...BRAND); doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("COTIZA CON SIGMA FLOW LAS VALVULAS Y PIEZAS ESPECIALES DE ESTE PROYECTO", 17, y + 7, { maxWidth: doc.internal.pageSize.getWidth() - 34 });
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(safe(`Envia este reporte (folio ${d.folio || "-"}) a cotizaciones@sigmaflow.mx o por WhatsApp.`), 17, y + 14);
  doc.text("Recibe propuesta tecnico-economica de valvulas, juntas y accesorios en 48 h. www.sigmaflow.mx", 17, y + 18.5);
  doc.setTextColor(0, 0, 0);

  // Logo en portada (esquina sup. derecha hoja 1)
  if (logo) {
    try { doc.setPage(1); doc.addImage(logo, "JPEG", doc.internal.pageSize.getWidth() - 52, 26, 38, 0); } catch { /* ignore */ }
  }

  return doc;
}

export function downloadReport(doc: jsPDF, filename: string) {
  doc.save(filename);
}
