"use client";

import { useEffect, useRef } from "react";
import { useProjectsStore } from "@/store/projectsStore";

const moduleLabels: Record<string, string> = {
  "tramo-simple": "Tramo Simple",
  "en-serie": "En Serie",
  "golpe-ariete": "Golpe de Ariete",
  "bombeo": "Bombeo",
  "dimensionamiento": "Dimensionamiento",
};

export default function ProyectosPage() {
  const { projects, loadFromStorage, deleteProject, duplicateProject, exportAll, importProjects } = useProjectsStore();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleExport = () => {
    const json = exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HidroCalc_Proyectos_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      importProjects(json);
    };
    reader.readAsText(file);
  };

  const sorted = [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">Mis Proyectos</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={projects.length === 0}
            className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors disabled:opacity-50"
          >
            Exportar todos
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Importar
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">&#128193;</p>
          <p className="text-sm">No hay proyectos guardados.</p>
          <p className="text-xs mt-1">Los cálculos se guardan desde cada módulo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{p.name}</h3>
                  <span className="text-[10px] bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 text-[#1C3D5A] dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                    {moduleLabels[p.module] || p.module}
                  </span>
                </div>
                {p.hasAssumedValues && (
                  <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                    &#9888; Estimado
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                {new Date(p.updatedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => duplicateProject(p.id)}
                  className="text-xs text-[#1C3D5A] hover:underline"
                >
                  Duplicar
                </button>
                <button
                  onClick={() => { if (confirm("¿Eliminar este proyecto?")) deleteProject(p.id); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
