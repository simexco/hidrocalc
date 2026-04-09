"use client";

import { GlossaryButton } from "@/components/ui/GlossaryModal";

export function HidroCalcFooter() {
  return (
    <footer className="bg-white border-t border-gray-200" style={{ height: 36 }}>
      <div className="h-full flex items-center justify-center text-[11px] text-gray-400 gap-2 tracking-wide">
        <span className="font-medium text-[#1C3D5A]/50">HidroCalc</span>
        <span>&middot;</span>
        <span>Sigma Flow</span>
        <span>&middot;</span>
        <span>v1.3</span>
        <span>&middot;</span>
        <GlossaryButton />
      </div>
    </footer>
  );
}
