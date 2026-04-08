"use client";

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  activeModule: string;
  isCalculating: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setActiveModule: (module: string) => void;
  setIsCalculating: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  darkMode: false,
  activeModule: "tramo-simple",
  isCalculating: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("hidrocalc_dark", next ? "1" : "0");
    }
    return { darkMode: next };
  }),
  setActiveModule: (module) => set({ activeModule: module }),
  setIsCalculating: (val) => set({ isCalculating: val }),
}));
