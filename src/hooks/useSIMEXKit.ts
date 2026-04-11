/* eslint-disable @typescript-eslint/no-explicit-any */
import catalog from "@/data/simex_catalog.json";

// ── Equivalent lengths Le/D for hm calculation (AWWA / Crane TP-410) ──
export const LONGITUD_EQUIV: Record<string, number> = {
  "codo-90": 30,
  "codo-45": 16,
  "codo-22": 8,
  "codo-11": 4,
  "tee-directo": 20,
  "tee-lateral": 60,
  "cruz": 60,
  "reduccion": 10,
  "vcg-r": 13,
  "vcg-b": 13,
  "vmb-c": 45,
  "vmb-dex": 35,
  "vmb-w": 45,
  "valvula-compuerta": 13,
  "valvula-mariposa": 45,
  "check": 150,
  "duo-check": 100,
  "check-resilente": 150,
  "tapa-ciega": 0,
  "fin-linea": 0,
  "medidor-woltmann": 50,
  "vrp": 50,
  "valvula-alivio": 50,
  "cople-desmontaje": 5,
  "abrazadera": 0,
  "marco-tapa": 0,
};

export interface AccesorioCalc {
  id: string;
  tipo: string;        // key in LONGITUD_EQUIV
  label: string;       // display name
  cantidad: number;
  angulo?: string;
  dn2?: string;
}

/** Calculate real hm using equivalent length method */
export function calcHmReal(accesorios: AccesorioCalc[], L: number, D_m: number, hf: number): number {
  if (accesorios.length === 0 || L <= 0 || D_m <= 0) return 0;
  const sumLe = accesorios.reduce((sum, acc) => {
    const factor = LONGITUD_EQUIV[acc.tipo] ?? 0;
    return sum + factor * D_m * acc.cantidad;
  }, 0);
  return hf * (sumLe / L);
}

// ── Material name mapping HidroCalc → SIMEX catalog ──
export const MATERIAL_MAP: Record<string, string> = {
  "PVC — AWWA C900/C905": "PVC AWWA C900",
  "PVC — Métrico ISO 4422": "PVC Métrico",
  "PVC — Ingles ASTM D2241": "PVC Inglés",
  "HDPE — AWWA C906": "PEAD",
  "Hierro dúctil": "HD AWWA",
  "Acero nuevo": "Acero",
  "Acero (10+ años)": "Acero",
  "Asbesto cemento": "Asbesto A7",
};

export const DN_MM_TO_STR: Record<number, string> = {
  50: '2"', 75: '3"', 100: '4"', 150: '6"', 200: '8"',
  250: '10"', 300: '12"', 350: '14"', 400: '16"',
  450: '18"', 500: '20"', 600: '24"', 750: '30"', 900: '36"',
};

// ── Valve catalog by type and DN ──
export const VALV_CATALOG: Record<string, Record<string, { sku: string; bridas: number; norma: string }>> = {
  "vcg-r": {
    '2"': {sku:"VI-VFF-2",bridas:2,norma:"AWWA C515"}, '3"': {sku:"VI-VFF-3",bridas:2,norma:"AWWA C515"},
    '4"': {sku:"VI-VFF-4",bridas:2,norma:"AWWA C515"}, '6"': {sku:"VI-VFF-6",bridas:2,norma:"AWWA C515"},
    '8"': {sku:"VI-VFF-8",bridas:2,norma:"AWWA C515"}, '10"': {sku:"VI-VFF-10",bridas:2,norma:"AWWA C515"},
    '12"': {sku:"VI-VFF-12",bridas:2,norma:"AWWA C515"}, '14"': {sku:"VI-VFF-14",bridas:2,norma:"AWWA C515"},
    '16"': {sku:"VI-VFF-16",bridas:2,norma:"AWWA C515"}, '18"': {sku:"VI-VFF-18",bridas:2,norma:"AWWA C515"},
    '20"': {sku:"VI-VFF-20",bridas:2,norma:"AWWA C515"}, '24"': {sku:"VI-VFF-24",bridas:2,norma:"AWWA C515"},
    '30"': {sku:"VI-VFF-30",bridas:2,norma:"AWWA C515"}, '36"': {sku:"VI-VFF-36",bridas:2,norma:"AWWA C515"},
  },
  "vcg-b": {
    '2"': {sku:"VI-VFB-2",bridas:2,norma:"AWWA C500"}, '3"': {sku:"VI-VFB-3",bridas:2,norma:"AWWA C500"},
    '4"': {sku:"VI-VFB-4",bridas:2,norma:"AWWA C500"}, '6"': {sku:"VI-VFB-6",bridas:2,norma:"AWWA C500"},
    '8"': {sku:"VI-VFB-8",bridas:2,norma:"AWWA C500"}, '10"': {sku:"VI-VFB-10",bridas:2,norma:"AWWA C500"},
    '12"': {sku:"VI-VFB-12",bridas:2,norma:"AWWA C500"}, '14"': {sku:"VI-VFB-14",bridas:2,norma:"AWWA C500"},
    '16"': {sku:"VI-VFB-16",bridas:2,norma:"AWWA C500"}, '18"': {sku:"VI-VFB-18",bridas:2,norma:"AWWA C500"},
    '20"': {sku:"VI-VFB-20",bridas:2,norma:"AWWA C500"}, '24"': {sku:"VI-VFB-24",bridas:2,norma:"AWWA C500"},
  },
  "vmb-c": {
    '3"': {sku:"VI-VMC-3250",bridas:2,norma:"AWWA C504"}, '4"': {sku:"VI-VMC-4250",bridas:2,norma:"AWWA C504"},
    '6"': {sku:"VI-VMC-6250",bridas:2,norma:"AWWA C504"}, '8"': {sku:"VI-VMC-8250",bridas:2,norma:"AWWA C504"},
    '10"': {sku:"VI-VMC-10250",bridas:2,norma:"AWWA C504"}, '12"': {sku:"VI-VMC-12250",bridas:2,norma:"AWWA C504"},
    '14"': {sku:"VI-VMC-14250",bridas:2,norma:"AWWA C504"}, '16"': {sku:"VI-VMC-16250",bridas:2,norma:"AWWA C504"},
    '18"': {sku:"VI-VMC-18250",bridas:2,norma:"AWWA C504"}, '20"': {sku:"VI-VMC-20250",bridas:2,norma:"AWWA C504"},
    '24"': {sku:"VI-VMC-24250",bridas:2,norma:"AWWA C504"},
  },
  "vmb-dex": {
    '30"': {sku:"VI-VMC-30150",bridas:2,norma:"AWWA C504"}, '36"': {sku:"VI-VMC-36150",bridas:2,norma:"AWWA C504"},
  },
  "vmb-w": {
    '2"': {sku:"VI-VMW-2",bridas:0,norma:"ISO 5752"}, '3"': {sku:"VI-VMW-3",bridas:0,norma:"ISO 5752"},
    '4"': {sku:"VI-VMW-4",bridas:0,norma:"ISO 5752"}, '6"': {sku:"VI-VMW-6",bridas:0,norma:"ISO 5752"},
    '8"': {sku:"VI-VMW-8",bridas:0,norma:"ISO 5752"}, '10"': {sku:"VI-VMW-10",bridas:0,norma:"ISO 5752"},
    '12"': {sku:"VI-VMW-12",bridas:0,norma:"ISO 5752"},
  },
};

export const VALV_TIPOS = [
  { key: "vcg-r", titulo: "Compuerta Resilente", sub: "Sello EPDM · AWWA C515", rango: '2"-36" · 250 PSI' },
  { key: "vcg-b", titulo: "Compuerta Bronce", sub: "Asientos Bronce · AWWA C500", rango: '2"-24" · 250 PSI' },
  { key: "vmb-c", titulo: "Mariposa Concéntrica", sub: "EPDM vulcanizado · AWWA C504", rango: '3"-24" · 250 PSI' },
  { key: "vmb-dex", titulo: "Mariposa Doble Exc.", sub: "Para diámetros grandes", rango: '30"-36" · 150 PSI' },
  { key: "vmb-w", titulo: "Mariposa Wafer", sub: "Entre bridas · ISO 5752", rango: '2"-12" · Sin bridas propias' },
];

export const VALV_NOMBRES: Record<string, string> = {
  "vcg-r": "Compuerta Resilente", "vcg-b": "Compuerta Bronce",
  "vmb-c": "Mariposa Concéntrica", "vmb-dex": "Mariposa Doble Exc.", "vmb-w": "Mariposa Wafer",
};

export type ConexionAcero = "bridado" | "roscado" | "soldado";

export interface KitItem {
  sku: string;
  descripcion: string;
  cantidad: number;
  tipo: "pieza" | "kit_brida" | "valvula" | "sugerencia";
}

export function getKit(dn: string, material: string) {
  const key = `${dn}|${material}`;
  const entry = (catalog.kit as any)[key];
  if (!entry) return null;
  return { od: entry.od, abu: entry.abu, ext: entry.ext, gib: entry.gib, emp: entry.emp, tor: entry.tor, bolts: entry.bolts || 8 };
}

export function getTapaCiegaSKU(dn: string): string {
  return (catalog as any).tapa_ciega?.[dn] || `CI-BCF-${dn.replace(/"/g, "")}`;
}

export function getCopleSKU(dn: string): string {
  return (catalog as any).cople_desmontaje?.[dn] || `CI-CDM-${dn.replace(/"/g, "")}`;
}

export function getConexionSKU(tipo: string, dn1: string, dn2?: string): { sku: string; bridas: number; desc: string } | null {
  const conex = catalog.conexiones as any[];
  const match = conex.find((c: any) => {
    if (tipo === "codo") return c.familia.includes("Codo") && c.dn1 === dn1 && c.dn2.includes(dn2 || "90");
    if (tipo === "cruz") return c.familia.includes("Cruz") && c.dn1 === dn1 && c.dn2 === (dn2 || dn1);
    if (tipo === "tee") return c.familia.includes("Tee") && c.dn1 === dn1 && c.dn2 === (dn2 || dn1);
    if (tipo === "reduccion") return c.familia.includes("Reducc") && c.dn1 === dn1 && c.dn2 === dn2;
    return false;
  });
  return match ? { sku: match.sku, bridas: match.bridas, desc: `${match.familia} ${dn1}${dn2 ? " x " + dn2 : ""}` } : null;
}

export function getValvulaSKU(tipo: "compuerta" | "check" | "mariposa", dn: string) {
  const map: Record<string, any[]> = {
    compuerta: catalog.valv_compuerta as any[],
    check: catalog.valv_check as any[],
    mariposa: catalog.valv_mariposa as any[],
  };
  const match = (map[tipo] || []).find((v: any) => v.dn === dn);
  return match ? { sku: match.sku, bridas: match.bridas ?? 2, norma: match.norma ?? "" } : null;
}

export function getValvulaAireSKU(dn: string, tipo?: string) {
  const match = (catalog.valv_aire as any[]).find((v: any) => v.dn === dn && (!tipo || v.tipo === tipo));
  return match?.sku || null;
}

export type KitOpcion = "A" | "B";

/** Check if ABU exists for this DN/material combination */
export function hasABU(dn: string, material: string): boolean {
  const kit = getKit(dn, material);
  return kit?.abu != null;
}

export function buildKitBrida(dn: string, material: string, nBridas: number, opcion: KitOpcion = "A"): KitItem[] {
  const kit = getKit(dn, material);
  if (!kit || nBridas === 0) return [];
  const items: KitItem[] = [];

  if (opcion === "A" && kit.abu) {
    // Opción A: ABU
    items.push({ sku: kit.abu, descripcion: `Adapt. Bridado Universal ${dn}`, cantidad: nBridas, tipo: "kit_brida" });
  } else {
    // Opción B: Extremidad + Gibault (or fallback when no ABU)
    if (kit.ext) {
      items.push({ sku: kit.ext, descripcion: `Extremidad Bridada ${dn} OD ${kit.od}mm`, cantidad: nBridas, tipo: "kit_brida" });
    }
    const gibSKU = kit.gib;
    if (gibSKU) {
      items.push({ sku: gibSKU, descripcion: `Junta Gibault ${kit.od}mm`, cantidad: nBridas, tipo: "kit_brida" });
    }
  }

  if (kit.emp) {
    items.push({ sku: kit.emp, descripcion: `Empaque Neopreno DN ${dn}`, cantidad: nBridas, tipo: "kit_brida" });
  }
  if (kit.tor) {
    items.push({ sku: kit.tor, descripcion: `Tornillo bridado DN ${dn}`, cantidad: nBridas * kit.bolts, tipo: "kit_brida" });
  }
  return items;
}
