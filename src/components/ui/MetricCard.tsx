"use client";

import type { AlertLevel, DataStatus } from "@/types/hydraulic";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  alertLevel?: AlertLevel;
  alertMessage?: string;
  dataStatus?: DataStatus;
  unavailableMessage?: string;
}

const levelStyles: Record<AlertLevel, { bg: string; border: string; dot: string }> = {
  OK: { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", dot: "bg-green-500" },
  WARN: { bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-500" },
  ERROR: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
  CRITICAL: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-300 dark:border-red-700", dot: "bg-red-600" },
};

export function MetricCard({
  label,
  value,
  unit,
  alertLevel,
  alertMessage,
  dataStatus,
  unavailableMessage,
}: MetricCardProps) {
  if (dataStatus === "unavailable" || unavailableMessage) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 opacity-70">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          {unavailableMessage || "Datos insuficientes"}
        </p>
      </div>
    );
  }

  const style = alertLevel ? levelStyles[alertLevel] : { bg: "bg-white dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700", dot: "" };

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 transition-colors`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {dataStatus === "estimated" && (
          <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">
            &#9888; Estimado
          </span>
        )}
        {dataStatus === "calculated" && alertLevel === "OK" && (
          <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">
            &#10003; Calculado
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      {alertMessage && (
        <div className="flex items-center gap-1.5 mt-2">
          {style.dot && <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
          <p className="text-xs text-gray-600 dark:text-gray-400">{alertMessage}</p>
        </div>
      )}
    </div>
  );
}
