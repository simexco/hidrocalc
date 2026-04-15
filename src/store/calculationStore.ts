"use client";

import { create } from "zustand";
import type {
  SinglePipeInputs,
  SinglePipeResults,
  SeriesPipeInputs,
  SeriesPipeResults,
  WaterHammerInputs,
  WaterHammerResults,
  PumpOperationInputs,
  PumpOperationResults,
  PipeSizingInputs,
  PipeSizingResults,
  VRPInputs,
  VRPResults,
  CalcMode,
  FlowUnit,
  Fitting,
  SeriesTramo,
  PumpPoint,
} from "@/types/hydraulic";
import { DEFAULTS, MATERIALS } from "@/lib/constants";

// ── Single Pipe Store ──
interface SinglePipeState {
  inputs: SinglePipeInputs;
  results: SinglePipeResults | null;
  setInput: <K extends keyof SinglePipeInputs>(key: K, value: SinglePipeInputs[K]) => void;
  setResults: (results: SinglePipeResults | null) => void;
  addFitting: (fitting: Fitting) => void;
  removeFitting: (id: string) => void;
  updateFitting: (id: string, updates: Partial<Fitting>) => void;
  reset: () => void;
}

const defaultSinglePipeInputs: SinglePipeInputs = {
  projectName: "Tramo sin nombre",
  mode: "A" as CalcMode,
  Q: null,
  flowUnit: "L/s" as FlowUnit,
  rawQ: null,
  DN: 100,
  customDN: false,
  L: null,
  materialName: MATERIALS[0].name,
  C: MATERIALS[0].c,
  P1: null,
  z1: 0,
  z2: 0,
  P2min: DEFAULTS.P2min,
  maxVelocity: DEFAULTS.maxVelocity,
  fittings: [],
};

export const useSinglePipeStore = create<SinglePipeState>((set) => ({
  inputs: { ...defaultSinglePipeInputs },
  results: null,
  setInput: (key, value) => set((state) => ({
    inputs: { ...state.inputs, [key]: value },
  })),
  setResults: (results) => set({ results }),
  addFitting: (fitting) => set((state) => ({
    inputs: { ...state.inputs, fittings: [...state.inputs.fittings, fitting] },
  })),
  removeFitting: (id) => set((state) => ({
    inputs: { ...state.inputs, fittings: state.inputs.fittings.filter((f) => f.id !== id) },
  })),
  updateFitting: (id, updates) => set((state) => ({
    inputs: {
      ...state.inputs,
      fittings: state.inputs.fittings.map((f) => f.id === id ? { ...f, ...updates } : f),
    },
  })),
  reset: () => set({ inputs: { ...defaultSinglePipeInputs }, results: null }),
}));

// ── Series Pipe Store ──
interface SeriesPipeState {
  inputs: SeriesPipeInputs;
  results: SeriesPipeResults | null;
  setInput: <K extends keyof SeriesPipeInputs>(key: K, value: SeriesPipeInputs[K]) => void;
  setResults: (results: SeriesPipeResults | null) => void;
  addTramo: (tramo: SeriesTramo) => void;
  removeTramo: (id: string) => void;
  updateTramo: (id: string, updates: Partial<SeriesTramo>) => void;
  reset: () => void;
}

export const useSeriesPipeStore = create<SeriesPipeState>((set) => ({
  inputs: {
    projectName: "Línea en serie",
    Q: null,
    flowUnit: "L/s",
    rawQ: null,
    P1: null,
    z1: 0,
    variableFlow: false,
    tramos: [],
  },
  results: null,
  setInput: (key, value) => set((state) => ({
    inputs: { ...state.inputs, [key]: value },
  })),
  setResults: (results) => set({ results }),
  addTramo: (tramo) => set((state) => ({
    inputs: { ...state.inputs, tramos: [...state.inputs.tramos, tramo] },
  })),
  removeTramo: (id) => set((state) => ({
    inputs: { ...state.inputs, tramos: state.inputs.tramos.filter((t) => t.id !== id) },
  })),
  updateTramo: (id, updates) => set((state) => ({
    inputs: {
      ...state.inputs,
      tramos: state.inputs.tramos.map((t) => t.id === id ? { ...t, ...updates } : t),
    },
  })),
  reset: () => set({
    inputs: { projectName: "Línea en serie", Q: null, flowUnit: "L/s", rawQ: null, P1: null, z1: 0, variableFlow: false, tramos: [] },
    results: null,
  }),
}));

// ── Water Hammer Store ──
interface WaterHammerState {
  inputs: WaterHammerInputs;
  results: WaterHammerResults | null;
  setInput: <K extends keyof WaterHammerInputs>(key: K, value: WaterHammerInputs[K]) => void;
  setResults: (results: WaterHammerResults | null) => void;
  reset: () => void;
}

export const useWaterHammerStore = create<WaterHammerState>((set) => ({
  inputs: {
    projectName: "Golpe de ariete",
    V0: null,
    D: null,
    e: null,
    materialName: "Hierro dúctil",
    E: 169e9,
    P0: null,
    Tc: null,
    L: null,
  },
  results: null,
  setInput: (key, value) => set((state) => ({
    inputs: { ...state.inputs, [key]: value },
  })),
  setResults: (results) => set({ results }),
  reset: () => set({
    inputs: { projectName: "Golpe de ariete", V0: null, D: null, e: null, materialName: "Hierro dúctil", E: 169e9, P0: null, Tc: null, L: null },
    results: null,
  }),
}));

// ── Pump Operation Store ──
interface PumpOperationState {
  inputs: PumpOperationInputs;
  results: PumpOperationResults | null;
  setInput: <K extends keyof PumpOperationInputs>(key: K, value: PumpOperationInputs[K]) => void;
  setResults: (results: PumpOperationResults | null) => void;
  addPumpPoint: (point: PumpPoint) => void;
  removePumpPoint: (index: number) => void;
  updatePumpPoint: (index: number, point: PumpPoint) => void;
  reset: () => void;
}

export const usePumpOperationStore = create<PumpOperationState>((set) => ({
  inputs: {
    projectName: "Punto de operación",
    Hg: null,
    L: null,
    DN: 150,
    C: 140,
    kTotal: 0,
    pumpMethod: "equation",
    pumpPoints: [],
    H0: null,
    Kbomba: null,
  },
  results: null,
  setInput: (key, value) => set((state) => ({
    inputs: { ...state.inputs, [key]: value },
  })),
  setResults: (results) => set({ results }),
  addPumpPoint: (point) => set((state) => ({
    inputs: { ...state.inputs, pumpPoints: [...state.inputs.pumpPoints, point] },
  })),
  removePumpPoint: (index) => set((state) => ({
    inputs: { ...state.inputs, pumpPoints: state.inputs.pumpPoints.filter((_, i) => i !== index) },
  })),
  updatePumpPoint: (index, point) => set((state) => ({
    inputs: {
      ...state.inputs,
      pumpPoints: state.inputs.pumpPoints.map((p, i) => i === index ? point : p),
    },
  })),
  reset: () => set({
    inputs: {
      projectName: "Punto de operación", Hg: null, L: null, DN: 150, C: 140, kTotal: 0,
      pumpMethod: "equation", pumpPoints: [], H0: null, Kbomba: null,
    },
    results: null,
  }),
}));

// ── Pipe Sizing Store ──
interface PipeSizingState {
  inputs: PipeSizingInputs;
  results: PipeSizingResults | null;
  setInput: <K extends keyof PipeSizingInputs>(key: K, value: PipeSizingInputs[K]) => void;
  setResults: (results: PipeSizingResults | null) => void;
  reset: () => void;
}

export const usePipeSizingStore = create<PipeSizingState>((set) => ({
  inputs: {
    projectName: "Dimensionamiento",
    Q: null,
    flowUnit: "L/s",
    rawQ: null,
    L: null,
    C: 140,
    materialName: MATERIALS[0].name,
    P1: null,
    P2min: DEFAULTS.P2min,
    z1: 0,
    z2: 0,
    maxVelocity: DEFAULTS.maxVelocity,
  },
  results: null,
  setInput: (key, value) => set((state) => ({
    inputs: { ...state.inputs, [key]: value },
  })),
  setResults: (results) => set({ results }),
  reset: () => set({
    inputs: {
      projectName: "Dimensionamiento", Q: null, flowUnit: "L/s", rawQ: null, L: null,
      C: 140, materialName: MATERIALS[0].name, P1: null, P2min: DEFAULTS.P2min,
      z1: 0, z2: 0, maxVelocity: DEFAULTS.maxVelocity,
    },
    results: null,
  }),
}));

// ── VRP Store ──
interface VRPState {
  inputs: VRPInputs;
  results: VRPResults | null;
  setInput: <K extends keyof VRPInputs>(key: K, value: VRPInputs[K]) => void;
  setResults: (results: VRPResults | null) => void;
  reset: () => void;
}

const vrpDefaults: VRPInputs = {
  projectName: "Válvula reductora",
  qMax: null,
  qMin: null,
  flowUnit: "L/s",
  rawQMax: null,
  rawQMin: null,
  P1: null,
  P2: null,
  DN: 150,
};

export const useVRPStore = create<VRPState>((set) => ({
  inputs: { ...vrpDefaults },
  results: null,
  setInput: (key, value) => set((state) => ({
    inputs: { ...state.inputs, [key]: value },
  })),
  setResults: (results) => set({ results }),
  reset: () => set({ inputs: { ...vrpDefaults }, results: null }),
}));
