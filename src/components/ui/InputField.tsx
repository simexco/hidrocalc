"use client";

import { useState } from "react";

interface InputFieldProps {
  label: string;
  value: number | string | null;
  onChange: (value: string) => void;
  unit?: string;
  tooltip?: string;
  type?: "text" | "number";
  placeholder?: string;
  error?: string | null;
  assumed?: boolean;
  assumedLabel?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  required?: boolean;
  className?: string;
}

export function InputField({
  label,
  value,
  onChange,
  unit,
  tooltip,
  type = "number",
  placeholder,
  error,
  assumed = false,
  assumedLabel,
  disabled = false,
  min,
  max,
  step,
  required = false,
  className = "",
}: InputFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const borderClass = error
    ? "border-red-400 focus:ring-red-300"
    : assumed
      ? "border-yellow-400 focus:ring-yellow-300"
      : "border-gray-300 focus:ring-[#1C3D5A]/30 dark:border-gray-600";

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-[#1C3D5A] hover:text-white transition-colors flex items-center justify-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 text-xs bg-gray-900 text-white rounded-lg shadow-lg">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3 py-2 text-sm rounded-lg border ${borderClass} bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400`}
        />
        {unit && (
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[40px]">
            {unit}
          </span>
        )}
      </div>

      {assumed && assumedLabel && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <span>&#9888;</span> {assumedLabel}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
