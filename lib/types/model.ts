export type FactorKey =
  | "form"
  | "venue"
  | "attack"
  | "defence"
  | "league"
  | "availability"
  | "h2h"
  | "rest";

export interface ModelFactorWeight {
  factorKey: FactorKey;
  factorName: string;
  weightPct: number;
}

export interface ModelVersion {
  id: string;
  versionKey: string;
  name: string;
  description: string | null;
  isActive: boolean;
  factorWeights: ModelFactorWeight[];
}
