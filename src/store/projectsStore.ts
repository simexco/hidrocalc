"use client";

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { Project } from "@/types/hydraulic";

const STORAGE_KEY = "hidrocalc_projects";

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

interface ProjectsState {
  projects: Project[];
  loadFromStorage: () => void;
  saveProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => string | null;
  getProject: (id: string) => Project | undefined;
  exportAll: () => string;
  importProjects: (json: string) => boolean;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],

  loadFromStorage: () => {
    set({ projects: loadProjects() });
  },

  saveProject: (project) => {
    const id = uuid();
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const updated = [...state.projects, newProject];
      saveProjects(updated);
      return { projects: updated };
    });
    return id;
  },

  updateProject: (id, updates) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      saveProjects(updated);
      return { projects: updated };
    });
  },

  deleteProject: (id) => {
    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      saveProjects(updated);
      return { projects: updated };
    });
  },

  duplicateProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return null;
    const newId = uuid();
    const now = new Date().toISOString();
    const dup: Project = {
      ...project,
      id: newId,
      name: `${project.name} (copia)`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const updated = [...state.projects, dup];
      saveProjects(updated);
      return { projects: updated };
    });
    return newId;
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  exportAll: () => {
    return JSON.stringify(get().projects, null, 2);
  },

  importProjects: (json) => {
    try {
      const imported = JSON.parse(json) as Project[];
      if (!Array.isArray(imported)) return false;
      set((state) => {
        const updated = [...state.projects, ...imported];
        saveProjects(updated);
        return { projects: updated };
      });
      return true;
    } catch {
      return false;
    }
  },
}));
