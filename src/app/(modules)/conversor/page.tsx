"use client";

import { useState } from "react";

// ── Categorías de conversión (factor = cuántas unidades hay en 1 unidad base) ──
interface Unit { u: string; f: number; nota?: string }
interface Categoria { key: string; label: string; base: string; units: Unit[] }

const CATEGORIAS: Categoria[] = [
  {
    key: "presion", label: "Presión", base: "kg/cm²",
    units: [
      { u: "kg/cm²", f: 1 },
      { u: "m.c.a.", f: 10, nota: "metros de columna de agua" },
      { u: "bar", f: 0.980665 },
      { u: "kPa", f: 98.0665 },
      { u: "psi", f: 14.223343 },
      { u: "atm", f: 0.967841 },
    ],
  },
  {
    key: "caudal", label: "Caudal / Gasto", base: "L/s",
    units: [
      { u: "L/s", f: 1 },
      { u: "m³/h", f: 3.6 },
      { u: "m³/día", f: 86.4 },
      { u: "L/min", f: 60 },
      { u: "GPM (US)", f: 15.850323, nota: "galones por minuto" },
    ],
  },
  {
    key: "longitud", label: "Longitud / Diámetro", base: "m",
    units: [
      { u: "m", f: 1 },
      { u: "cm", f: 100 },
      { u: "mm", f: 1000 },
      { u: 'pulg (")', f: 39.370079 },
      { u: "pie (ft)", f: 3.2808399 },
    ],
  },
  {
    key: "area", label: "Área", base: "m²",
    units: [
      { u: "m²", f: 1 },
      { u: "cm²", f: 10000 },
      { u: "ha", f: 0.0001, nota: "hectárea" },
      { u: "ft²", f: 10.76391 },
    ],
  },
  {
    key: "volumen", label: "Volumen", base: "m³",
    units: [
      { u: "m³", f: 1 },
      { u: "L", f: 1000 },
      { u: "gal (US)", f: 264.17205 },
      { u: "ft³", f: 35.314667 },
    ],
  },
  {
    key: "velocidad", label: "Velocidad", base: "m/s",
    units: [
      { u: "m/s", f: 1 },
      { u: "ft/s", f: 3.2808399 },
      { u: "km/h", f: 3.6 },
    ],
  },
  {
    key: "potencia", label: "Potencia", base: "kW",
    units: [
      { u: "kW", f: 1 },
      { u: "HP", f: 1.3410221 },
      { u: "CV", f: 1.3596216, nota: "caballos de vapor" },
    ],
  },
];

// Temperatura se maneja aparte (tiene offset, no es proporcional)
const TEMP_UNITS = ["°C", "°F", "K"];
const tempToC = (v: number, u: string) => (u === "°C" ? v : u === "°F" ? (v - 32) * 5 / 9 : v - 273.15);
const tempFromC = (c: number, u: string) => (u === "°C" ? c : u === "°F" ? c * 9 / 5 + 32 : c + 273.15);

// Formato legible (evita 0.0000001 y 123456.999)
function fmt(v: number): string {
  if (!isFinite(v)) return "—";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 100000 || abs < 0.001) return v.toExponential(3);
  if (abs >= 100) return v.toFixed(2);
  if (abs >= 1) return v.toFixed(3);
  return v.toFixed(5);
}

export default function ConversorPage() {
  const [catKey, setCatKey] = useState("presion");
  const [valor, setValor] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("kg/cm²");
  const [tempFrom, setTempFrom] = useState<string>("°C");

  const cat = CATEGORIAS.find((c) => c.key === catKey)!;
  const esTemp = catKey === "temperatura";
  const v = parseFloat(valor);
  const valido = valor.trim() !== "" && isFinite(v);

  const cambiarCategoria = (key: string) => {
    setCatKey(key);
    if (key === "temperatura") { setTempFrom("°C"); }
    else { const c = CATEGORIAS.find((x) => x.key === key)!; setFromUnit(c.units[0].u); }
  };

  // Resultados
  let resultados: { u: string; val: number; nota?: string; from: boolean }[] = [];
  if (!esTemp && valido) {
    const fu = cat.units.find((u) => u.u === fromUnit) ?? cat.units[0];
    const baseVal = v / fu.f; // valor en unidad base
    resultados = cat.units.map((u) => ({ u: u.u, val: baseVal * u.f, nota: u.nota, from: u.u === fu.u }));
  } else if (esTemp && valido) {
    const c = tempToC(v, tempFrom);
    resultados = TEMP_UNITS.map((u) => ({ u, val: tempFromC(c, u), from: u === tempFrom }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Conversor de unidades</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Conversiones comunes en agua potable: presión, caudal, diámetro, área, volumen, velocidad, temperatura y potencia.</p>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {[...CATEGORIAS.map((c) => ({ key: c.key, label: c.label })), { key: "temperatura", label: "Temperatura" }].map((c) => (
          <button
            key={c.key}
            onClick={() => cambiarCategoria(c.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catKey === c.key ? "bg-[#1C3D5A] text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#1C3D5A]/40"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Entrada */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor a convertir</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="flex-1 px-3 py-2 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
            placeholder="0"
          />
          <select
            value={esTemp ? tempFrom : fromUnit}
            onChange={(e) => (esTemp ? setTempFrom(e.target.value) : setFromUnit(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white min-w-[120px]"
          >
            {(esTemp ? TEMP_UNITS : cat.units.map((u) => u.u)).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-[#1C3D5A] px-4 py-2">
          <h3 className="text-xs font-semibold text-white">Equivalencias{esTemp ? " — Temperatura" : ` — ${cat.label}`}</h3>
        </div>
        {!valido ? (
          <div className="p-6 text-center text-sm text-gray-400">Escribe un valor para ver las equivalencias.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {resultados.map((r) => (
              <div key={r.u} className={`flex items-center justify-between px-4 py-2.5 ${r.from ? "bg-[#E9EFF5] dark:bg-[#1C3D5A]/20" : ""}`}>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {r.u}
                  {r.nota && <span className="text-[10px] text-gray-400 ml-2">{r.nota}</span>}
                  {r.from && <span className="text-[10px] text-[#1C3D5A] dark:text-blue-300 ml-2 font-medium">(entrada)</span>}
                </span>
                <span className={`font-mono text-base ${r.from ? "font-bold text-[#1C3D5A] dark:text-blue-200" : "text-gray-800 dark:text-gray-200"}`}>{fmt(r.val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        Referencias: 1 kg/cm² = 10 m.c.a. = 0.98 bar = 14.22 psi · 1&quot; = 25.4 mm · 1 L/s = 3.6 m³/h · °F = °C×9/5+32
      </p>
    </div>
  );
}
