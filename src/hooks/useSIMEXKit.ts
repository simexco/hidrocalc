/* eslint-disable @typescript-eslint/no-explicit-any */
import catalog from "@/data/simex_catalog.json";

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
