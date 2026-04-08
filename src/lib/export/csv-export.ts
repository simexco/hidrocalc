/* ════════════════════════════════════════
   CSV Export Utility
   ════════════════════════════════════════ */

export function downloadCSV(headers: string[], rows: string[][], filename: string): void {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
