"use client";

import { useEffect, useRef, useState } from "react";
import { InputField } from "@/components/ui/InputField";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { CATALOG_ITEMS, CATALOG_CATEGORIES, type CatalogItem } from "@/lib/simex-catalog";

interface BomRow {
  id: string;
  desc: string;
  medida: string;
  sku: string;
  cantidad: number;
  unidad: string;
  ubicacion: string;
}

const FREE = "Otro (libre)";

export default function DespiecePage() {
  const [projectName, setProjectName] = useState("");
  const [rows, setRows] = useState<BomRow[]>([]);

  // Form de captura
  const [categoria, setCategoria] = useState(CATALOG_CATEGORIES[0] ?? FREE);
  const [productoIdx, setProductoIdx] = useState(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [ubicacion, setUbicacion] = useState("");
  // Modo libre
  const [freeDesc, setFreeDesc] = useState("");
  const [freeMedida, setFreeMedida] = useState("");
  const [freeUnidad, setFreeUnidad] = useState("pza");

  const idRef = useRef(0);
  const newId = () => `r${idRef.current++}-${rows.length}`;

  // Cargar guardado
  useEffect(() => {
    const saved = loadFormState<{ projectName?: string; rows?: BomRow[] }>("despiece");
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (Array.isArray(saved.rows)) setRows(saved.rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("despiece", { projectName, rows }), 800);
  }, [projectName, rows]);

  const productosDeCategoria: CatalogItem[] = CATALOG_ITEMS.filter((i) => i.category === categoria);

  const handleAdd = () => {
    const qty = cantidad && cantidad > 0 ? cantidad : 1;
    if (categoria === FREE) {
      if (!freeDesc.trim()) return;
      setRows((prev) => [...prev, { id: newId(), desc: freeDesc.trim(), medida: freeMedida.trim(), sku: "—", cantidad: qty, unidad: freeUnidad.trim() || "pza", ubicacion: ubicacion.trim() }]);
      setFreeDesc(""); setFreeMedida("");
    } else {
      const p = productosDeCategoria[productoIdx];
      if (!p) return;
      setRows((prev) => [...prev, { id: newId(), desc: p.desc, medida: p.medida, sku: p.sku, cantidad: qty, unidad: p.unidad, ubicacion: ubicacion.trim() }]);
    }
    setCantidad(1);
  };

  const updateRow = (id: string, patch: Partial<BomRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const handleReset = () => {
    setRows([]); setProjectName(""); setCantidad(1); setUbicacion("");
    setFreeDesc(""); setFreeMedida("");
  };

  const totalPiezas = rows.filter((r) => r.unidad === "pza").reduce((s, r) => s + r.cantidad, 0);

  // ── Export Excel ──
  const handleExportExcel = async () => {
    if (rows.length === 0) return;
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Despiece");
    ws.addRow([`Despiece de materiales${projectName ? ` — ${projectName}` : ""}`]);
    ws.getRow(1).font = { bold: true, size: 13 };
    ws.addRow([]);
    const header = ws.addRow(["Cant.", "Unidad", "Descripción", "Medida", "SKU Sigma Flow", "Ubicación / Tramo"]);
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C3D5A" } };
      cell.alignment = { horizontal: "center" };
    });
    rows.forEach((r) => ws.addRow([r.cantidad, r.unidad, r.desc, r.medida, r.sku, r.ubicacion]));
    ws.getColumn(1).width = 8;
    ws.getColumn(2).width = 9;
    ws.getColumn(3).width = 42;
    ws.getColumn(4).width = 14;
    ws.getColumn(5).width = 20;
    ws.getColumn(6).width = 22;
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Despiece_${(projectName || "tramo").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Captura ── */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos</h2>
              <ResetButton moduleKey="despiece" onReset={handleReset} />
            </div>
            <InputField label="Proyecto / Obra" value={projectName} onChange={setProjectName} type="text" placeholder="Ej. Línea conducción El Roble" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">Agregar accesorio</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setProductoIdx(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {CATALOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value={FREE}>{FREE}</option>
              </select>
            </div>

            {categoria !== FREE ? (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto</label>
                <select
                  value={productoIdx}
                  onChange={(e) => setProductoIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                >
                  {productosDeCategoria.map((p, i) => (
                    <option key={p.sku + i} value={i}>{p.desc} — {p.sku}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <InputField label="Descripción" value={freeDesc} onChange={setFreeDesc} type="text" placeholder="Ej. Tubería PVC C900 6&quot;" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Medida" value={freeMedida} onChange={setFreeMedida} type="text" placeholder='6"' />
                  <InputField label="Unidad" value={freeUnidad} onChange={setFreeUnidad} type="text" placeholder="pza / m" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Cantidad" value={cantidad} onChange={(v) => setCantidad(parseFloat(v) || 0)} min={0} step="any" />
              <InputField label="Ubicación / Tramo" value={ubicacion} onChange={setUbicacion} type="text" placeholder="Opcional" />
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-[#1C3D5A] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F2438] transition-colors"
            >
              + Agregar al despiece
            </button>
          </div>
        </div>

        {/* ── Tabla del despiece ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Despiece de tramo</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lista de materiales y accesorios. Catálogo Sigma Flow con SKU.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                disabled={rows.length === 0}
                className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
              >
                Excel
              </button>
              <ExportPDFButton
                disabled={rows.length === 0}
                getData={() => ({
                  title: "Despiece de materiales",
                  module: "Despiece de tramo",
                  projectName: projectName || "Sin nombre",
                  hasAssumedValues: false,
                  inputs: [{ label: "Total de renglones", value: `${rows.length}` }, { label: "Total de piezas", value: `${totalPiezas}` }],
                  results: [],
                  alerts: [],
                  tableData: {
                    head: ["Cant.", "Unidad", "Descripción", "Medida", "SKU", "Ubicación"],
                    body: rows.map((r) => [`${r.cantidad}`, r.unidad, r.desc, r.medida, r.sku, r.ubicacion]),
                  },
                })}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Aún no hay piezas. Agrega accesorios desde el catálogo o como artículo libre.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      <th className="px-2 py-2 text-center w-16">Cant.</th>
                      <th className="px-2 py-2 text-center w-14">Unidad</th>
                      <th className="px-2 py-2 text-left">Descripción</th>
                      <th className="px-2 py-2 text-center w-20">Medida</th>
                      <th className="px-2 py-2 text-left w-28">SKU</th>
                      <th className="px-2 py-2 text-left w-32">Ubicación</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-2 py-1.5 text-center">
                          <input
                            type="number"
                            value={r.cantidad}
                            min={0}
                            onChange={(e) => updateRow(r.id, { cantidad: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1 py-1 text-center border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center text-gray-500">{r.unidad}</td>
                        <td className="px-2 py-1.5 text-gray-800 dark:text-gray-200">{r.desc}</td>
                        <td className="px-2 py-1.5 text-center font-mono text-gray-600 dark:text-gray-300">{r.medida}</td>
                        <td className="px-2 py-1.5 font-mono text-[#1C3D5A] dark:text-blue-300">{r.sku}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={r.ubicacion}
                            onChange={(e) => updateRow(r.id, { ubicacion: e.target.value })}
                            placeholder="—"
                            className="w-full px-1 py-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-gray-300 rounded bg-transparent dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => removeRow(r.id)} className="text-red-500 hover:text-red-700" title="Eliminar">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-semibold text-gray-700 dark:text-gray-300">
                      <td className="px-2 py-2 text-center">{totalPiezas}</td>
                      <td className="px-2 py-2 text-center text-[10px] text-gray-400">pza</td>
                      <td className="px-2 py-2" colSpan={5}>{rows.length} renglón(es) en el despiece</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400">
            Tip: la tubería y materiales fuera de catálogo agrégalos con &quot;{FREE}&quot; indicando la unidad (m, pza, etc.). Contacte a su distribuidor Sigma Flow autorizado para cotización — S.H.I. de México, simexco.com.mx
          </p>
        </div>
      </div>
    </div>
  );
}
