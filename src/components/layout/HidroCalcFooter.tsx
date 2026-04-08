"use client";

export function HidroCalcFooter() {
  return (
    <footer className="bg-white border-t border-gray-200" style={{ height: 36 }}>
      <div className="h-full flex items-center justify-center text-[11px] text-gray-400 gap-1.5 tracking-wide">
        <span className="font-medium text-[#1C3D5A]/50">HidroCalc</span>
        <span>&middot;</span>
        <span>Sigma Flow &middot; Soluciones en Infraestructura Hidráulica</span>
        <span>&middot;</span>
        <span>v1.0</span>
      </div>
    </footer>
  );
}
