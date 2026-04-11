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
  "reduccion": 10,
  "valvula-compuerta": 13,
  "valvula-mariposa": 45,
  "check-resilente": 150,
  "fin-linea": 0,
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
  return { od: entry.od, abu: entry.abu, ext: entry.ext, emp: entry.emp, tor: entry.tor, bolts: entry.bolts || 8 };
}

export function getConexionSKU(tipo: string, dn1: string, dn2?: string): { sku: string; bridas: number; desc: string } | null {
  const conex = catalog.conexiones as any[];
  const match = conex.find((c: any) => {
    if (tipo === "codo") return c.familia.includes("Codo") && c.dn1 === dn1 && c.dn2.includes(dn2 || "90");
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

export function buildKitBrida(dn: string, material: string, nBridas: number): KitItem[] {
  const kit = getKit(dn, material);
  if (!kit || nBridas === 0) return [];
  const items: KitItem[] = [];
  const mainSKU = kit.abu || kit.ext;
  if (mainSKU) {
    items.push({
      sku: mainSKU,
      descripcion: kit.abu ? `Adaptador Bridado Universal ${dn}` : `Extremidad Bridada ${dn} OD ${kit.od}mm`,
      cantidad: nBridas,
      tipo: "kit_brida",
    });
  }
  if (kit.emp) {
    items.push({ sku: kit.emp, descripcion: `Empaque Neopreno DN ${dn}`, cantidad: nBridas, tipo: "kit_brida" });
  }
  if (kit.tor) {
    items.push({ sku: kit.tor, descripcion: `Tornillo bridado DN ${dn}`, cantidad: nBridas * kit.bolts, tipo: "kit_brida" });
  }
  return items;
}
