"use client";

import { tablaRegulacion, calcularCoefRegulacion, REGULATION_COEFFICIENTS, MAPAS_TANQUES_URL } from "@/lib/calculations/tank-storage";

const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

// Desplegable con el cálculo del coeficiente de regulación hora por hora (método MAPAS)
// y los valores oficiales publicados, para no mandar al usuario a buscar en el PDF.
export function TablaCoefRegulacion({ horas, inicio, manual = false }: { horas: number; inicio: number; manual?: boolean }) {
  const filas = tablaRegulacion(horas, inicio);
  const c = calcularCoefRegulacion(horas, inicio);
  const iMax = filas.reduce((b, r, i) => (r.acumulado > filas[b].acumulado ? i : b), 0);
  const iMin = filas.reduce((b, r, i) => (r.acumulado < filas[b].acumulado ? i : b), 0);
  const nacionales = REGULATION_COEFFICIENTS.filter((r) => !r.key.startsWith("cdmx"));
  const hNorm = Math.min(24, Math.max(1, Math.round(horas)));
  const iniNorm = ((Math.round(inicio) % 24) + 24) % 24;
  const coincide = (hrs: number, ini: number) => hrs === hNorm && (hrs === 24 || ini === iniNorm);

  return (
    <details className="group rounded-lg border border-[#1C3D5A]/15 bg-white dark:bg-gray-800">
      <summary className="cursor-pointer select-none px-2.5 py-1.5 text-[11px] font-semibold text-[#1C3D5A] dark:text-blue-300">
        Ver cálculo hora por hora y tabla oficial de R (MAPAS)
      </summary>
      <div className="px-2.5 pb-2.5 space-y-3 text-[11px] text-gray-700 dark:text-gray-300">
        {manual && (
          <p className="text-amber-700 dark:text-amber-400">
            Estás usando un R capturado a mano. El cálculo de abajo corresponde a la curva nacional con tu horario.
          </p>
        )}

        <div className="space-y-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            Cálculo con tu horario: {hNorm >= 24 ? "24 h continuas" : `${hNorm} h desde las ${iniNorm}:00`}
          </p>
          <p className="text-gray-500 dark:text-gray-400">Valores en % del gasto máximo diario (QMD).</p>
          <div className="max-h-72 overflow-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full tabular-nums">
              <thead className="sticky top-0 bg-[#E9EFF5] dark:bg-gray-900 text-[#1C3D5A] dark:text-blue-300">
                <tr>
                  <th className="px-1.5 py-1 text-left font-semibold">Hora</th>
                  <th className="px-1.5 py-1 text-right font-semibold">Entrada (bombeo)</th>
                  <th className="px-1.5 py-1 text-right font-semibold">Demanda</th>
                  <th className="px-1.5 py-1 text-right font-semibold">Diferencia</th>
                  <th className="px-1.5 py-1 text-right font-semibold">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r, i) => (
                  <tr key={r.hora} className={i === iMax ? "bg-green-50 dark:bg-green-900/20" : i === iMin ? "bg-red-50 dark:bg-red-900/20" : i % 2 ? "bg-gray-50 dark:bg-gray-900/40" : ""}>
                    <td className="px-1.5 py-0.5">{r.hora}–{r.hora + 1}</td>
                    <td className="px-1.5 py-0.5 text-right">{f1(r.suministro)}</td>
                    <td className="px-1.5 py-0.5 text-right">{f1(r.demanda)}</td>
                    <td className="px-1.5 py-0.5 text-right">{f1(r.diferencia)}</td>
                    <td className={`px-1.5 py-0.5 text-right ${i === iMax ? "font-bold text-green-700 dark:text-green-400" : i === iMin ? "font-bold text-red-700 dark:text-red-400" : ""}`}>{f1(r.acumulado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <span className="font-semibold text-green-700 dark:text-green-400">Máximo excedente {f1(c.maxExcedente)} %</span>
            {" · "}
            <span className="font-semibold text-red-700 dark:text-red-400">Máximo faltante {f1(c.maxFaltante)} %</span>
          </p>
          <p className="font-semibold text-[#1C3D5A] dark:text-blue-300">
            R = ({f1(c.maxExcedente)} + {f1(Math.abs(c.maxFaltante))}) × 3.6 / 100 = {c.R.toFixed(1)} m³/(L/s)
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200">Valores publicados en el manual</p>
          <table className="w-full tabular-nums rounded border border-gray-200 dark:border-gray-700">
            <thead className="bg-[#E9EFF5] dark:bg-gray-900 text-[#1C3D5A] dark:text-blue-300">
              <tr>
                <th className="px-1.5 py-1 text-left font-semibold">Horario de bombeo</th>
                <th className="px-1.5 py-1 text-right font-semibold">R (Tabla 1.3)</th>
              </tr>
            </thead>
            <tbody>
              {nacionales.map((r) => (
                <tr key={r.key} className={coincide(r.hours, r.inicio) ? "bg-[#E9EFF5] dark:bg-[#1C3D5A]/30 font-semibold" : ""}>
                  <td className="px-1.5 py-0.5">{r.label}</td>
                  <td className="px-1.5 py-0.5 text-right">{r.R.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!nacionales.some((r) => coincide(r.hours, r.inicio)) && (
            <p className="text-gray-500 dark:text-gray-400">
              Tu horario no está en la tabla publicada; por eso la plataforma calcula R con el método del manual (arriba).
            </p>
          )}
        </div>

        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
          Fuente: CONAGUA, Manual de Agua Potable, Alcantarillado y Saneamiento (MAPAS), <i>Diseño, construcción y operación
          de tanques de regulación</i>: método de la Tabla 1.1, curva de demanda horaria (Figura 1.1) y coeficientes de la
          Tabla 1.3.{" "}
          <a href={MAPAS_TANQUES_URL} target="_blank" rel="noreferrer" className="underline decoration-dotted">PDF oficial</a>
        </p>
      </div>
    </details>
  );
}
