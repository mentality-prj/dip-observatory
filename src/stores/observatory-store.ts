import { create } from "zustand";

import type {
  DipScalar,
  ObservatoryAlternativeInput,
  ObservatoryBootstrapPayload,
  ObservatoryRunResponse,
  ObservatoryScenario,
} from "@/lib/dip-contracts";

type RunStatus = "idle" | "loading" | "success" | "error";

type ObservatoryState = {
  bootstrap: ObservatoryBootstrapPayload | null;
  scenarios: ObservatoryScenario[];
  selectedScenarioId: string | null;
  scenario: ObservatoryScenario | null;
  alternatives: ObservatoryAlternativeInput[];
  selectedAlternativeId: string | null;
  status: RunStatus;
  error: string | null;
  runResponse: ObservatoryRunResponse | null;
  hydrate: (payload: ObservatoryBootstrapPayload) => void;
  selectScenario: (scenarioId: string) => void;
  updateFeature: (
    alternativeId: string,
    fieldName: string,
    value: DipScalar,
  ) => void;
  selectAlternative: (alternativeId: string) => void;
  setLoading: () => void;
  setSuccess: (response: ObservatoryRunResponse) => void;
  setError: (message: string) => void;
  resetAlternatives: () => void;
};

function findScenario(
  scenarios: ObservatoryScenario[],
  scenarioId: string | null,
) {
  if (!scenarioId) return null;
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? null;
}

function buildDefaultFeatures(scenario: ObservatoryScenario) {
  return Object.fromEntries(
    scenario.fields.map((field) => [field.name, field.defaultValue]),
  ) as Record<string, DipScalar>;
}

function buildInitialAlternatives(scenario: ObservatoryScenario | null) {
  if (!scenario) return [];

  if (scenario.presets.length > 0) {
    const mapped = scenario.presets.slice(0, 2).map((preset) => ({
      id: preset.id,
      label: preset.label,
      entityId: preset.entityId,
      features: preset.features,
    }));

    if (mapped.length === 1) {
      mapped.push({
        id: "challenger",
        label: "Alternative",
        entityId: "demo-alternative",
        features: { ...mapped[0].features },
      });
    }

    return mapped satisfies ObservatoryAlternativeInput[];
  }

  const defaultFeatures = buildDefaultFeatures(scenario);

  return [
    {
      id: "baseline",
      label: "Baseline",
      entityId: "demo-baseline",
      features: defaultFeatures,
    },
    {
      id: "challenger",
      label: "Alternative",
      entityId: "demo-alternative",
      features: { ...defaultFeatures },
    },
  ] satisfies ObservatoryAlternativeInput[];
}

export const useObservatoryStore = create<ObservatoryState>((set, get) => ({
  bootstrap: null,
  scenarios: [],
  selectedScenarioId: null,
  scenario: null,
  alternatives: [],
  selectedAlternativeId: null,
  status: "idle",
  error: null,
  runResponse: null,
  hydrate: (payload) => {
    set((state) => {
      const nextSelectedScenarioId =
        state.selectedScenarioId &&
        payload.scenarios.some(
          (scenario) => scenario.id === state.selectedScenarioId,
        )
          ? state.selectedScenarioId
          : (payload.selectedScenarioId ?? payload.scenarios[0]?.id ?? null);
      const nextScenario = findScenario(
        payload.scenarios,
        nextSelectedScenarioId,
      );
      const rebuildAlternatives =
        !state.scenario ||
        state.scenario.id !== nextScenario?.id ||
        state.alternatives.length === 0;
      const nextAlternatives = rebuildAlternatives
        ? buildInitialAlternatives(nextScenario)
        : state.alternatives;

      return {
        bootstrap: payload,
        scenarios: payload.scenarios,
        selectedScenarioId: nextSelectedScenarioId,
        scenario: nextScenario,
        alternatives: nextAlternatives,
        selectedAlternativeId: rebuildAlternatives
          ? (nextAlternatives[0]?.id ?? null)
          : (state.selectedAlternativeId ?? nextAlternatives[0]?.id ?? null),
      };
    });
  },
  selectScenario: (scenarioId) => {
    const nextScenario = findScenario(get().scenarios, scenarioId);
    const nextAlternatives = buildInitialAlternatives(nextScenario);

    set({
      selectedScenarioId: scenarioId,
      scenario: nextScenario,
      alternatives: nextAlternatives,
      selectedAlternativeId: nextAlternatives[0]?.id ?? null,
      runResponse: null,
      status: "idle",
      error: null,
    });
  },
  updateFeature: (alternativeId, fieldName, value) => {
    set((state) => ({
      alternatives: state.alternatives.map((alternative) =>
        alternative.id === alternativeId
          ? {
              ...alternative,
              features: {
                ...alternative.features,
                [fieldName]: value,
              },
            }
          : alternative,
      ),
    }));
  },
  selectAlternative: (alternativeId) => {
    set({ selectedAlternativeId: alternativeId });
  },
  setLoading: () => {
    set({ status: "loading", error: null });
  },
  setSuccess: (response) => {
    set((state) => ({
      status: "success",
      runResponse: response,
      error: null,
      scenario:
        state.scenario?.id === response.scenario.id
          ? response.scenario
          : state.scenario,
    }));
  },
  setError: (message) => {
    set({ status: "error", error: message });
  },
  resetAlternatives: () => {
    const scenario = get().scenario;
    const nextAlternatives = buildInitialAlternatives(scenario);
    set({
      alternatives: nextAlternatives,
      selectedAlternativeId: nextAlternatives[0]?.id ?? null,
      runResponse: null,
      status: "idle",
      error: null,
    });
  },
}));
