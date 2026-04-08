"use client";

import type { AlertLevel } from "@/types/hydraulic";

interface AlertBannerProps {
  level: AlertLevel;
  message: string;
  className?: string;
}

const icons: Record<AlertLevel, string> = {
  OK: "\u2713",
  WARN: "\u26A0",
  ERROR: "\u2716",
  CRITICAL: "\u26A0",
};

const styles: Record<AlertLevel, string> = {
  OK: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
  WARN: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
  ERROR: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
  CRITICAL: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200",
};

export function AlertBanner({ level, message, className = "" }: AlertBannerProps) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${styles[level]} ${className}`}>
      <span className="font-bold text-base leading-none mt-0.5">{icons[level]}</span>
      <span>{message}</span>
    </div>
  );
}
