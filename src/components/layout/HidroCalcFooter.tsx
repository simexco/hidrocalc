"use client";

import { GlossaryButton } from "@/components/ui/GlossaryModal";

export function HidroCalcFooter() {
  return (
    <footer className="bg-white border-t border-gray-200" style={{ height: 36 }}>
      <div className="h-full flex items-center justify-center text-[11px] text-gray-400 gap-2 tracking-wide">
        <span className="font-semibold text-[#1C3D5A]/50">Sigma Flow</span>
        <span>&middot;</span>
        <span>v2.0</span>
        <span>&middot;</span>
        <span className="hidden sm:inline">© 2026 S.H.I. de México — Todos los derechos reservados</span>
        <span className="hidden sm:inline">&middot;</span>
        <GlossaryButton />
      </div>
    </footer>
  );
}
