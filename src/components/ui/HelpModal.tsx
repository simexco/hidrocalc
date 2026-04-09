"use client";

import { useState } from "react";

interface HelpSection {
  title: string;
  content: string;
}

interface HelpModalProps {
  moduleTitle: string;
  sections: HelpSection[];
}

export function HelpButton({ moduleTitle, sections }: HelpModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-[#1C3D5A]/60 hover:text-[#1C3D5A] border border-[#1C3D5A]/20 px-2.5 py-1 rounded-lg hover:bg-[#1C3D5A]/5 transition-colors whitespace-nowrap">
        Como usar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#1C3D5A] px-5 py-3 flex items-center justify-between rounded-t-xl">
              <h2 className="text-sm font-semibold text-white">{moduleTitle}</h2>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg">&times;</button>
            </div>
            <div className="p-5 space-y-5">
              {sections.map((s, i) => (
                <div key={i}>
                  <h3 className="text-xs font-bold text-[#1C3D5A] dark:text-blue-300 uppercase tracking-wider mb-2">{s.title}</h3>
                  <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{s.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
