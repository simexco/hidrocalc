"use client";

import { useState } from "react";
import type { PDFExportData } from "@/lib/export/pdf-generator";

interface ExportPDFButtonProps {
  getData: () => PDFExportData | null;
  filename?: string;
  disabled?: boolean;
}

export function ExportPDFButton({ getData, filename, disabled = false }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const data = getData();
    if (!data) return;

    setLoading(true);
    try {
      // Dynamic import to avoid SSR issues
      const { generateHidroCalcPDF, downloadPDF } = await import("@/lib/export/pdf-generator");
      const doc = await generateHidroCalcPDF(data);
      const name = filename || `HidroCalc_${data.projectName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadPDF(doc, name);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF. Revisa la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || loading}
      className="flex items-center gap-2 text-sm bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {loading ? "Generando..." : "Descargar PDF"}
    </button>
  );
}
