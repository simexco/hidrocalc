"use client";

/* ════════════════════════════════════════
   Proyecto activo — estado compartido entre modulos
   Un solo proyecto a la vez. Los datos fluyen de un paso al siguiente
   y alimentan el reporte (Entregable). Persistencia automatica.
   ════════════════════════════════════════ */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReportData } from "@/lib/export/report-generator";

// El proyecto activo tiene el mismo shape que el reporte (ReportData):
// las entradas/datos clave que viajan entre modulos.
export type ActiveProject = ReportData;

export const emptyProject: ActiveProject = {
  proyecto: "", localidad: "", fecha: "", folio: "", elaboro: "",
  poblacion: null, proyectarCrecimiento: false, periodoDiseno: 20, dotacion: 150, cmd: 1.4, cmh: 2.0, horasTanque: 14.3,
  q_ls: null, longitud: null, desnivel: null, presionRequerida: 10,
  material: "PVC C900", dn: "", clase: "", diametroInterior: null, c: 150,
  presionMaxLinea: null, pnLinea: null,
  vertices: [], valvulas: [],
  incluyeBombeo: false, he: null, eficiencia: 70,
  despiece: [],
  vrpDN: null, golpeValvulaDN: null,
};

interface ProjectState {
  project: ActiveProject;
  patch: (p: Partial<ActiveProject>) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: { ...emptyProject },
      patch: (p) => set((s) => ({ project: { ...s.project, ...p } })),
      reset: () => set({ project: { ...emptyProject } }),
    }),
    { name: "hidrocalc-active-project" }
  )
);

// ── Estado de cada paso del flujo guiado ──
export interface StepStatus {
  key: string;
  done: boolean;
  summary: string;
}

export function getProjectSteps(p: ActiveProject): StepStatus[] {
  const gastoDone = p.poblacion != null && p.dotacion != null && p.q_ls != null;
  const condDone = p.q_ls != null && p.diametroInterior != null && p.longitud != null;
  const perfilDone = p.vertices.filter((v) => v.cad != null && v.cota != null).length >= 2;
  const valvDone = p.valvulas.filter((v) => v.cad || v.tipo).length > 0;
  const bombeoDone = !p.incluyeBombeo || (p.he != null);
  return [
    { key: "gasto", done: gastoDone, summary: p.q_ls != null ? `Qmd ${p.q_ls.toFixed(2)} L/s` : "Pendiente" },
    { key: "conduccion", done: condDone, summary: condDone ? `${p.material} ${p.dn || ""} · ${p.longitud} m` : "Pendiente" },
    { key: "perfil", done: perfilDone, summary: perfilDone ? `${p.vertices.length} puntos de perfil` : "Pendiente" },
    { key: "valvulas", done: valvDone, summary: valvDone ? `${p.valvulas.length} valvulas/accesorios` : "Pendiente" },
    { key: "bombeo", done: bombeoDone, summary: p.incluyeBombeo ? (p.he != null ? `He ${p.he} m` : "Pendiente") : "No aplica (gravedad)" },
  ];
}
