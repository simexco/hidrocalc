"use client";

import { HidroCalcSidebar } from "./HidroCalcSidebar";
import { HidroCalcHeader } from "./HidroCalcHeader";
import { HidroCalcFooter } from "./HidroCalcFooter";

export function HidroCalcLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <div className="hidden lg:block">
        <HidroCalcSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <HidroCalcHeader />
        <main className="flex-1 p-5 lg:p-6 overflow-auto">{children}</main>
        <HidroCalcFooter />
      </div>
    </div>
  );
}
