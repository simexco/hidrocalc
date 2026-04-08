/* ════════════════════════════════════════
   Unit Conversions
   ════════════════════════════════════════ */

import type { FlowUnit } from "@/types/hydraulic";

export function flowToM3s(value: number, unit: FlowUnit): number {
  switch (unit) {
    case "L/s": return value / 1000;
    case "m³/h": return value / 3600;
    case "m³/s": return value;
  }
}

export function m3sToFlow(value: number, unit: FlowUnit): number {
  switch (unit) {
    case "L/s": return value * 1000;
    case "m³/h": return value * 3600;
    case "m³/s": return value;
  }
}

export function mcaToKPa(mca: number): number {
  return mca * 9.81;
}

export function mcaToBar(mca: number): number {
  return mca * 9.81 / 100;
}

export function kPaToMca(kPa: number): number {
  return kPa / 9.81;
}

/** Convert m.c.a. to kg/cm² (1 kg/cm² = 10 m.c.a.) */
export function mcaToKgcm2(mca: number): number {
  return mca / 10.0;
}

/** Convert kg/cm² to m.c.a. */
export function kgcm2ToMca(kgcm2: number): number {
  return kgcm2 * 10.0;
}

export function formatNumber(val: number | null | undefined, decimals = 2): string {
  if (val == null || !isFinite(val)) return "—";
  return val.toFixed(decimals);
}
