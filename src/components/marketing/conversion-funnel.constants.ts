export const publicConversionStages=["recognize","understand","explore_demo","map_to_own_decision","pilot","evaluate","expand"] as const;
export type PublicConversionStage=(typeof publicConversionStages)[number];
