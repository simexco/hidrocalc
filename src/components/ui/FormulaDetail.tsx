"use client";

import { useState } from "react";

interface FormulaStep {
  label?: string;      // "V = Q / A"
  substitution?: string; // "V = 0.040 / 0.01767"
  result?: string;     // "V = 2.264 m/s"
}

interface FormulaDetailProps {
  title: string;        // "Velocidad V"
  value: string;        // "2.264"
  unit: string;         // "m/s"
  formula: string;      // "V = Q / A = Q / (pi * D^2 / 4)"
  steps: FormulaStep[];
  reference: string;    // "Ecuacion de continuidad"
  norm?: string;        // "NOM-001-CONAGUA-2011"
}

export function FormulaDetail({ title, value, unit, formula, steps, reference, norm }: FormulaDetailProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-[#1C3D5A]/50 hover:text-[#1C3D5A] dark:text-blue-400/50 dark:hover:text-blue-300 transition-colors underline decoration-dotted"
      >
        {open ? "Ocultar calculo" : "Ver calculo"}
      </button>
      {open && (
        <div className="mt-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 text-xs">
          {/* Formula */}
          <div className="font-mono text-[#1C3D5A] dark:text-blue-300 bg-white dark:bg-gray-800 rounded px-3 py-2 border border-gray-100 dark:border-gray-700">
            {formula}
          </div>
          {/* Steps */}
          {steps.map((s, i) => (
            <div key={i} className="space-y-0.5 pl-2 border-l-2 border-[#1C3D5A]/20">
              {s.label && <p className="text-gray-500 dark:text-gray-400">{s.label}</p>}
              {s.substitution && <p className="font-mono text-gray-700 dark:text-gray-300">{s.substitution}</p>}
              {s.result && <p className="font-mono font-semibold text-[#1C3D5A] dark:text-blue-300">{s.result}</p>}
            </div>
          ))}
          {/* Reference */}
          <div className="pt-1 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 space-y-0.5">
            <p>Ref: {reference}</p>
            {norm && <p>Norma: {norm}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pre-built formula generators ──────────────────────────────

export function velocityFormula(Q_m3s: number, D_mm: number, V: number) {
  const D_m = D_mm / 1000;
  const A = Math.PI * Math.pow(D_m / 2, 2);
  return {
    title: "Velocidad V",
    value: V.toFixed(3),
    unit: "m/s",
    formula: "V = Q / A = Q / (π × D² / 4)",
    steps: [
      { label: "Area de la seccion:", substitution: `A = π × ${D_m.toFixed(3)}² / 4 = ${A.toFixed(5)} m²` },
      { label: "Velocidad:", substitution: `V = ${Q_m3s.toFixed(4)} / ${A.toFixed(5)}`, result: `V = ${V.toFixed(3)} m/s` },
    ],
    reference: "Ecuacion de continuidad — Mecanica de fluidos",
  };
}

export function hazenWilliamsFormula(Q_m3s: number, D_mm: number, L: number, C: number, hf: number) {
  const D_m = D_mm / 1000;
  return {
    title: "Perdida por friccion hf",
    value: hf.toFixed(3),
    unit: "m",
    formula: "hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)",
    steps: [
      { label: "Datos:", substitution: `Q = ${Q_m3s.toFixed(4)} m³/s, D = ${D_m.toFixed(3)} m, L = ${L} m, C = ${C}` },
      { label: "Sustitucion:", substitution: `hf = 10.67 × ${L} × ${Q_m3s.toFixed(4)}^1.852 / (${C}^1.852 × ${D_m.toFixed(3)}^4.87)` },
      { result: `hf = ${hf.toFixed(3)} m` },
    ],
    reference: "Formula de Hazen-Williams",
    norm: "NOM-001-CONAGUA-2011 / AWWA M11",
  };
}

export function gradientFormula(hf: number, L: number, J_km: number) {
  return {
    title: "Gradiente hidraulico J",
    value: J_km.toFixed(2),
    unit: "m/km",
    formula: "J = hf / L × 1000",
    steps: [
      { substitution: `J = ${hf.toFixed(3)} / ${L} × 1000`, result: `J = ${J_km.toFixed(2)} m/km` },
      { label: J_km <= 5 ? "Optimo (< 5 m/km)" : J_km <= 10 ? "Aceptable (< 10 m/km)" : "Alto (> 10 m/km) — revisar diametro" },
    ],
    reference: "Gradiente hidraulico",
    norm: "NOM-001-CONAGUA-2011: J optimo < 5, max 10 m/km",
  };
}

export function pressureFormula(P1_kgcm2: number, z1: number, z2: number, hf: number, hm: number, P2_kgcm2: number) {
  const P1_mca = P1_kgcm2 * 10;
  const dz = z2 - z1;
  return {
    title: "Presion de salida P2",
    value: P2_kgcm2.toFixed(2),
    unit: "kg/cm²",
    formula: "P2 = P1 + (z1 - z2) - hf - hm",
    steps: [
      { label: "En m.c.a.:", substitution: `P2 = ${P1_mca.toFixed(1)} + (${z1} - ${z2}) - ${hf.toFixed(3)} - ${hm.toFixed(3)}` },
      { substitution: `P2 = ${P1_mca.toFixed(1)} + (${(-dz).toFixed(1)}) - ${hf.toFixed(3)} - ${hm.toFixed(3)}` },
      { result: `P2 = ${(P2_kgcm2 * 10).toFixed(2)} m.c.a. = ${P2_kgcm2.toFixed(2)} kg/cm²` },
      { label: "Conversion: 1 kg/cm² = 10 m.c.a." },
    ],
    reference: "Ecuacion de Bernoulli simplificada",
    norm: "NOM-001-CONAGUA-2011: P min = 1.0 kg/cm²",
  };
}

export function waterHammerFormula(V0: number, a: number, deltaH: number) {
  return {
    title: "Sobrepresion golpe de ariete",
    value: (deltaH / 10).toFixed(2),
    unit: "kg/cm²",
    formula: "ΔH = a × V₀ / g  (Joukowsky)",
    steps: [
      { substitution: `ΔH = ${a.toFixed(1)} × ${V0.toFixed(2)} / 9.81` },
      { result: `ΔH = ${deltaH.toFixed(2)} m.c.a. = ${(deltaH / 10).toFixed(2)} kg/cm²` },
    ],
    reference: "Ecuacion de Joukowsky — Golpe de ariete",
    norm: "Ref: Streeter-Wylie, Hydraulic Transients",
  };
}

export function waveSpeedFormula(D_mm: number, e_mm: number, E_Pa: number, a: number) {
  const Kw = 2.1e9;
  return {
    title: "Velocidad de onda a",
    value: a.toFixed(1),
    unit: "m/s",
    formula: "a = √(Kw/ρ) / √(1 + (Kw×D)/(E×e))",
    steps: [
      { label: "Datos:", substitution: `Kw = 2.1×10⁹ Pa, D = ${D_mm} mm, e = ${e_mm} mm, E = ${(E_Pa/1e9).toFixed(1)}×10⁹ Pa` },
      { result: `a = ${a.toFixed(1)} m/s` },
    ],
    reference: "Velocidad de onda en tuberia elastica",
    norm: "Crane TP-410 / Wylie & Streeter",
  };
}

export function cvFormula(Q_m3h: number, deltaP_bar: number, Cv: number) {
  return {
    title: "Coeficiente de flujo Cv",
    value: Cv.toFixed(1),
    unit: "",
    formula: "Cv = Q(m³/h) / √(ΔP en bar)",
    steps: [
      { substitution: `Cv = ${Q_m3h.toFixed(1)} / √(${deltaP_bar.toFixed(2)})` },
      { substitution: `Cv = ${Q_m3h.toFixed(1)} / ${Math.sqrt(deltaP_bar).toFixed(3)}` },
      { result: `Cv = ${Cv.toFixed(1)}` },
    ],
    reference: "Coeficiente de flujo para valvulas de control",
    norm: "IEC 60534 / ISA S75.01 / Crane TP-410",
  };
}
