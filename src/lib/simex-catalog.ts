/* ════════════════════════════════════════
   SIMEX / Sigma Flow — Catálogo aplanado para despiece
   Origen: src/data/simex_catalog.json
   Cada item es una pieza seleccionable con su SKU.
   ════════════════════════════════════════ */
/* eslint-disable @typescript-eslint/no-explicit-any */
import catalog from "@/data/simex_catalog.json";

export interface CatalogItem {
  category: string;   // agrupador para el primer selector
  desc: string;       // descripción comercial completa
  medida: string;     // medida principal (para mostrar en la tabla)
  sku: string;        // SKU Sigma Flow
  unidad: string;     // "pza" | "m"
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function build(): CatalogItem[] {
  const items: CatalogItem[] = [];
  const c: any = catalog;

  // Conexiones HD: codos, tees, reducciones
  for (const x of c.conexiones ?? []) {
    if (x.familia === "Codo HD") {
      items.push({ category: "Codo HD", desc: `Codo HD ${x.dn1} ${x.dn2} (${x.bridas} bridas)`, medida: x.dn1, sku: x.sku, unidad: "pza" });
    } else if (x.familia === "Tee HD") {
      items.push({ category: "Tee HD", desc: `Tee HD ${x.dn1} × ${x.dn2} (${x.bridas} bridas)`, medida: `${x.dn1}×${x.dn2}`, sku: x.sku, unidad: "pza" });
    } else if (x.familia === "Reducción HD") {
      items.push({ category: "Reducción HD", desc: `Reducción HD ${x.dn1} × ${x.dn2} (${x.bridas} bridas)`, medida: `${x.dn1}×${x.dn2}`, sku: x.sku, unidad: "pza" });
    }
  }

  // Válvulas de compuerta
  for (const v of c.valv_compuerta ?? [])
    items.push({ category: "Válvula compuerta", desc: `Válvula compuerta ${v.dn}${v.norma ? ` ${v.norma}` : ""} (${v.bridas} bridas)`, medida: v.dn, sku: v.sku, unidad: "pza" });

  // Válvulas check
  for (const v of c.valv_check ?? [])
    items.push({ category: "Válvula check", desc: `Válvula check ${v.dn} (${v.bridas} bridas)`, medida: v.dn, sku: v.sku, unidad: "pza" });

  // Válvulas mariposa
  for (const v of c.valv_mariposa ?? [])
    items.push({ category: "Válvula mariposa", desc: `Válvula mariposa ${v.dn} (${v.bridas} bridas)`, medida: v.dn, sku: v.sku, unidad: "pza" });

  // Válvulas de aire
  for (const v of c.valv_aire ?? [])
    items.push({ category: "Válvula de aire", desc: `Válvula de aire ${cap(v.tipo)} ${v.dn} Sigma Flow`, medida: v.dn, sku: v.sku, unidad: "pza" });

  // Tapas / bridas ciegas
  for (const [size, sku] of Object.entries(c.tapa_ciega ?? {}))
    items.push({ category: "Tapa ciega", desc: `Tapa ciega (brida ciega) ${size}`, medida: size, sku: sku as string, unidad: "pza" });

  // Coples de desmontaje
  for (const [size, sku] of Object.entries(c.cople_desmontaje ?? {}))
    items.push({ category: "Cople de desmontaje", desc: `Cople de desmontaje ${size}`, medida: size, sku: sku as string, unidad: "pza" });

  // Juntas Gibault (kit por medida + material)
  for (const [key, k] of Object.entries(c.kit ?? {})) {
    const [size, mat] = key.split("|");
    const sku = (k as any).gib;
    if (sku) items.push({ category: "Junta Gibault", desc: `Junta Gibault ${size}${mat ? ` (${mat})` : ""}`, medida: size, sku, unidad: "pza" });
  }

  return items;
}

export const CATALOG_ITEMS: CatalogItem[] = build();

export const CATALOG_CATEGORIES: string[] = Array.from(new Set(CATALOG_ITEMS.map((i) => i.category)));
