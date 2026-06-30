"use client";

import { useState } from "react";

// ── Categorías de conversión (factor = cuántas unidades hay en 1 unidad base) ──
interface Unit { u: string; f: number; nota?: string }
interface Categoria { key: string; label: string; base: string; units: Unit[] }

const CATEGORIAS: Categoria[] = [
  {
    key: "presion", label: "Presión", base: "Kilogramos por cm² (kg/cm²)",
    units: [
      { u: "Kilogramos por cm² (kg/cm²)", f: 1 },
      { u: "Metros de columna de agua (m.c.a.)", f: 10 },
      { u: "Bar", f: 0.980665 },
      { u: "Kilopascales (kPa)", f: 98.0665 },
      { u: "Libras por pulgada² (psi)", f: 14.223343 },
      { u: "Atmósferas (atm)", f: 0.967841 },
    ],
  },
  {
    key: "caudal", label: "Caudal / Gasto", base: "Litros por segundo (L/s)",
    units: [
      { u: "Litros por segundo (L/s)", f: 1 },
      { u: "Metros cúbicos por hora (m³/h)", f: 3.6 },
      { u: "Metros cúbicos por día (m³/día)", f: 86.4 },
      { u: "Litros por minuto (L/min)", f: 60 },
      { u: "Galones por minuto US (GPM)", f: 15.850323 },
    ],
  },
  {
    key: "longitud", label: "Longitud", base: "Metros (m)",
    units: [
      { u: "Milímetros (mm)", f: 1000 },
      { u: "Centímetros (cm)", f: 100 },
      { u: "Metros (m)", f: 1 },
      { u: "Kilómetros (km)", f: 0.001 },
      { u: "Pulgadas (in)", f: 39.370079 },
      { u: "Pies (ft)", f: 3.2808399 },
      { u: "Yardas (yd)", f: 1.0936133 },
      { u: "Millas (mi)", f: 0.000621371 },
    ],
  },
  {
    key: "area", label: "Área", base: "Metros cuadrados (m²)",
    units: [
      { u: "Milímetros cuadrados (mm²)", f: 1000000 },
      { u: "Centímetros cuadrados (cm²)", f: 10000 },
      { u: "Metros cuadrados (m²)", f: 1 },
      { u: "Hectáreas (ha)", f: 0.0001 },
      { u: "Pulgadas cuadradas (in²)", f: 1550.0031 },
      { u: "Pies cuadrados (ft²)", f: 10.76391 },
      { u: "Acres", f: 0.000247105 },
    ],
  },
  {
    key: "volumen", label: "Volumen", base: "Metros cúbicos (m³)",
    units: [
      { u: "Mililitros (mL)", f: 1000000 },
      { u: "Centímetros cúbicos (cm³)", f: 1000000 },
      { u: "Litros (L)", f: 1000 },
      { u: "Metros cúbicos (m³)", f: 1 },
      { u: "Pulgadas cúbicas (in³)", f: 61023.744 },
      { u: "Pies cúbicos (ft³)", f: 35.314667 },
      { u: "Galones US (gal)", f: 264.17205 },
      { u: "Onzas líquidas US (oz fl)", f: 33814.023 },
    ],
  },
  {
    key: "velocidad", label: "Velocidad", base: "Metros por segundo (m/s)",
    units: [
      { u: "Metros por segundo (m/s)", f: 1 },
      { u: "Pies por segundo (ft/s)", f: 3.2808399 },
      { u: "Kilómetros por hora (km/h)", f: 3.6 },
    ],
  },
  {
    key: "peso", label: "Peso / Masa", base: "Kilogramos (kg)",
    units: [
      { u: "Gramos (g)", f: 1000 },
      { u: "Kilogramos (kg)", f: 1 },
      { u: "Toneladas métricas (t)", f: 0.001 },
      { u: "Onzas (oz)", f: 35.273962 },
      { u: "Libras (lb)", f: 2.2046226 },
      { u: "Toneladas US (short ton)", f: 0.0011023113 },
    ],
  },
  {
    key: "potencia", label: "Potencia", base: "Kilovatios (kW)",
    units: [
      { u: "Kilovatios (kW)", f: 1 },
      { u: "Caballos de fuerza (HP)", f: 1.3410221 },
      { u: "Caballos de vapor (CV)", f: 1.3596216 },
    ],
  },
];

// Temperatura se maneja aparte (tiene offset, no es proporcional)
const TEMP_UNITS = ["Grados Celsius (°C)", "Grados Fahrenheit (°F)", "Kelvin (K)"];
const tempToC = (v: number, u: string) => (u.includes("Celsius") ? v : u.includes("Fahrenheit") ? (v - 32) * 5 / 9 : v - 273.15);
const tempFromC = (c: number, u: string) => (u.includes("Celsius") ? c : u.includes("Fahrenheit") ? c * 9 / 5 + 32 : c + 273.15);

// Diámetro por circunferencia: mides la circunferencia y D exterior = circunferencia / π
const PERIM_UNITS = ["Centímetros (cm)", "Milímetros (mm)", "Metros (m)", "Pulgadas (in)"];
const perimToMM = (v: number, u: string) => (u.includes("Milímetros") ? v : u.includes("Centímetros") ? v * 10 : u.includes("Metros") ? v * 1000 : v * 25.4);

// Formato legible: decimales según la magnitud, con separador de miles y sin notación exponencial
function fmt(v: number): string {
  if (!isFinite(v)) return "—";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  let dec: number;
  if (abs >= 1000) dec = 2;
  else if (abs >= 10) dec = 3;
  else if (abs >= 1) dec = 4;
  else if (abs >= 0.01) dec = 5;
  else if (abs >= 0.0001) dec = 7;
  else dec = 9;
  return v.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: dec });
}

export default function ConversorPage() {
  const [catKey, setCatKey] = useState("presion");
  const [valor, setValor] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("Kilogramos por cm² (kg/cm²)");
  const [tempFrom, setTempFrom] = useState<string>("Grados Celsius (°C)");
  const [perimUnit, setPerimUnit] = useState<string>("Centímetros (cm)");

  const cat = CATEGORIAS.find((c) => c.key === catKey);
  const esTemp = catKey === "temperatura";
  const esPerim = catKey === "perimetro";
  const v = parseFloat(valor);
  const valido = valor.trim() !== "" && isFinite(v);

  const cambiarCategoria = (key: string) => {
    setCatKey(key);
    if (key === "temperatura") setTempFrom("Grados Celsius (°C)");
    else if (key === "perimetro") setPerimUnit("Centímetros (cm)");
    else { const c = CATEGORIAS.find((x) => x.key === key)!; setFromUnit(c.units[0].u); }
  };

  // Resultados
  let resultados: { u: string; val: number; nota?: string; from: boolean }[] = [];
  if (esPerim && valido) {
    const perimMM = perimToMM(v, perimUnit);
    const dMM = perimMM / Math.PI; // diámetro exterior
    resultados = [
      { u: "Milímetros (mm)", val: dMM, from: false },
      { u: "Centímetros (cm)", val: dMM / 10, from: false },
      { u: "Pulgadas (in)", val: dMM / 25.4, from: false },
    ];
  } else if (esTemp && valido) {
    const c = tempToC(v, tempFrom);
    resultados = TEMP_UNITS.map((u) => ({ u, val: tempFromC(c, u), from: u === tempFrom }));
  } else if (cat && valido) {
    const fu = cat.units.find((u) => u.u === fromUnit) ?? cat.units[0];
    const baseVal = v / fu.f; // valor en unidad base
    resultados = cat.units.map((u) => ({ u: u.u, val: baseVal * u.f, nota: u.nota, from: u.u === fu.u }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Conversor de unidades</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Conversiones comunes en agua potable: presión, caudal, diámetro, área, volumen, velocidad, temperatura y potencia.</p>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {[...CATEGORIAS.map((c) => ({ key: c.key, label: c.label })), { key: "temperatura", label: "Temperatura" }, { key: "perimetro", label: "Diámetro por circunferencia" }].map((c) => (
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
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{esPerim ? "Circunferencia medida (con cinta métrica)" : "Valor a convertir"}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
            placeholder="0"
          />
          <select
            value={esTemp ? tempFrom : esPerim ? perimUnit : fromUnit}
            onChange={(e) => (esTemp ? setTempFrom(e.target.value) : esPerim ? setPerimUnit(e.target.value) : setFromUnit(e.target.value))}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
          >
            {(esTemp ? TEMP_UNITS : esPerim ? PERIM_UNITS : (cat?.units.map((u) => u.u) ?? [])).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {esPerim && <p className="text-[11px] text-gray-500 dark:text-gray-400">Mide la circunferencia exterior del tubo con una cinta métrica (flexómetro). El diámetro exterior = circunferencia ÷ π.</p>}
      </div>

      {/* Resultados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-[#1C3D5A] px-4 py-2">
          <h3 className="text-xs font-semibold text-white">{esPerim ? "Diámetro exterior de la tubería" : `Equivalencias${esTemp ? " — Temperatura" : cat ? ` — ${cat.label}` : ""}`}</h3>
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
