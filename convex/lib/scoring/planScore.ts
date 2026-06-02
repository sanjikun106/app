export type Preset =
  | "balanced"
  | "fastest"
  | "fairest"
  | "cheapest"
  | "metro_friendly"
  | "best_venue"
  | "least_hassle";

export type ParticipantRoute = {
  durationMin: number;
  costInr: number;
  transfers: number;
  walkingMin: number;
  usesMetro: boolean;
};

export type VenueMeta = {
  rating: number;
  name: string;
};

const WEIGHTS: Record<
  Preset,
  {
    sumTime: number;
    sumCost: number;
    maxTime: number;
    inequality: number;
    transfers: number;
    walking: number;
    venueQuality: number;
  }
> = {
  balanced: {
    sumTime: 0.35,
    sumCost: 0.15,
    maxTime: 0.25,
    inequality: 0.2,
    transfers: 0.03,
    walking: 0.02,
    venueQuality: 0.5,
  },
  fastest: {
    sumTime: 0.55,
    sumCost: 0.05,
    maxTime: 0.3,
    inequality: 0.05,
    transfers: 0.03,
    walking: 0.02,
    venueQuality: 0.2,
  },
  fairest: {
    sumTime: 0.15,
    sumCost: 0.1,
    maxTime: 0.2,
    inequality: 0.45,
    transfers: 0.05,
    walking: 0.05,
    venueQuality: 0.3,
  },
  cheapest: {
    sumTime: 0.2,
    sumCost: 0.45,
    maxTime: 0.15,
    inequality: 0.1,
    transfers: 0.05,
    walking: 0.05,
    venueQuality: 0.2,
  },
  metro_friendly: {
    sumTime: 0.25,
    sumCost: 0.1,
    maxTime: 0.2,
    inequality: 0.15,
    transfers: 0.05,
    walking: 0.05,
    venueQuality: 0.3,
  },
  best_venue: {
    sumTime: 0.15,
    sumCost: 0.1,
    maxTime: 0.15,
    inequality: 0.1,
    transfers: 0.05,
    walking: 0.05,
    venueQuality: 1.2,
  },
  least_hassle: {
    sumTime: 0.25,
    sumCost: 0.1,
    maxTime: 0.2,
    inequality: 0.1,
    transfers: 0.25,
    walking: 0.1,
    venueQuality: 0.3,
  },
};

export function scorePlan(
  routes: ParticipantRoute[],
  venue: VenueMeta,
  preset: Preset,
): {
  planScore: number;
  breakdown: {
    travelScore: number;
    fairnessPenalty: number;
    hasslePenalty: number;
    venueQualityBonus: number;
    combinedMinutes: number;
    maxIndividualMinutes: number;
    timeImbalanceMinutes: number;
    combinedCostInr: number;
  };
} {
  const w = WEIGHTS[preset];
  const durations = routes.map((r) => r.durationMin);
  const costs = routes.map((r) => r.costInr);
  const combinedMinutes = durations.reduce((a, b) => a + b, 0);
  const maxIndividualMinutes = Math.max(...durations);
  const minIndividualMinutes = Math.min(...durations);
  const timeImbalanceMinutes = maxIndividualMinutes - minIndividualMinutes;
  const combinedCostInr = costs.reduce((a, b) => a + b, 0);
  const totalTransfers = routes.reduce((a, r) => a + r.transfers, 0);
  const totalWalking = routes.reduce((a, r) => a + r.walkingMin, 0);
  const metroPenalty = routes.some((r) => r.usesMetro)
    ? preset === "metro_friendly"
      ? -8
      : 0
    : preset === "metro_friendly"
      ? 12
      : 0;

  const travelScore =
    w.sumTime * combinedMinutes +
    w.sumCost * combinedCostInr * 0.05 +
    w.maxTime * maxIndividualMinutes +
    w.inequality * timeImbalanceMinutes +
    w.transfers * totalTransfers * 4 +
    w.walking * totalWalking +
    metroPenalty;

  const fairnessPenalty = timeImbalanceMinutes * w.inequality;
  const hasslePenalty = totalTransfers * 3 + totalWalking * 0.5;
  const venueQualityBonus = (venue.rating ?? 4) * 10 * w.venueQuality;

  const planScore =
    travelScore + fairnessPenalty + hasslePenalty - venueQualityBonus;

  return {
    planScore,
    breakdown: {
      travelScore,
      fairnessPenalty,
      hasslePenalty,
      venueQualityBonus,
      combinedMinutes,
      maxIndividualMinutes,
      timeImbalanceMinutes,
      combinedCostInr,
    },
  };
}
