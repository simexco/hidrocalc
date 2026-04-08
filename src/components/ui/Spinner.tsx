"use client";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-block w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-[#1C3D5A] rounded-full animate-spin ${className}`} />
  );
}
