"use client";

import { useState, useEffect, useRef } from "react";

// Compact numeric input with local state — no spinners, no lag
// Used for tables where many numbers need to be entered quickly
interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
}

export function NumInput({ value, onChange, placeholder, className = "" }: NumInputProps) {
  const [local, setLocal] = useState(String(value));
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!focused.current) setLocal(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={local}
      placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        clearTimeout(timer.current);
        const n = parseFloat(local);
        if (!isNaN(n)) { onChange(n); setLocal(String(n)); }
        else setLocal(String(value));
      }}
      onChange={(e) => {
        setLocal(e.target.value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(n);
        }, 200);
      }}
      className={`w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white ${className}`}
    />
  );
}
