"use client";

import type { AssumedValue } from "@/types/hydraulic";

interface DataStatusBannerProps {
  assumed: AssumedValue[];
  missingRequired?: string[];
}

export function DataStatusBanner({ assumed, missingRequired }: DataStatusBannerProps) {
  if (missingRequired && missingRequired.length > 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>&#9888;</span> Te {missingRequired.length === 1 ? "falta 1 dato" : `faltan ${missingRequired.length} datos`} por llenar (en amarillo)
        </p>
        <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
          {missingRequired.join(" · ")}. El resto ya trae valores precargados — revísalos y ajústalos a tu proyecto.
        </p>
      </div>
    );
  }

  if (assumed.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
        <span>&#9888;</span> Valores asumidos en este cálculo
      </div>
      <ul className="text-xs text-yellow-600 dark:text-yellow-500 space-y-0.5">
        {assumed.map((a) => (
          <li key={a.field}>&bull; {a.label}</li>
        ))}
      </ul>
    </div>
  );
}
