"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

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
      <button onClick={() => setOpen(true)} className="text-sm font-semibold text-white bg-[#1C3D5A] px-5 py-2 rounded-lg hover:bg-[#0F2438] transition-colors whitespace-nowrap shadow-md flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        ¿Cómo usar?
      </button>

      {/* Portal al body: el header tiene backdrop-blur y eso "atrapa" al position:fixed
          (el modal se centraba en la franja del header y se cortaba arriba) */}
      {open && createPortal(
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
        </div>,
        document.body
      )}
    </>
  );
}
