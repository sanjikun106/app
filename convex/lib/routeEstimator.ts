/** Haversine distance in km */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type RouteEstimate = {
  durationMin: number;
  costInr: number;
  transfers: number;
  walkingMin: number;
  usesMetro: boolean;
  legs: Array<{
    mode: string;
    description: string;
    durationSec: number;
    costEstimateInr?: number;
  }>;
  summaryLabel: string;
  confidence: "estimated" | "range";
};

export function estimateDirectBikeTaxi(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): RouteEstimate {
  const km = distanceKm(originLat, originLng, destLat, destLng);
  const durationMin = Math.round(km * 3.2 + 8);
  const costInr = Math.round(35 + km * 18);
  return {
    durationMin,
    costInr,
    transfers: 0,
    walkingMin: 2,
    usesMetro: false,
    confidence: "estimated",
    summaryLabel: "Rapido direct",
    legs: [
      {
        mode: "bike_taxi",
        description: "Rapido bike taxi to venue",
        durationSec: durationMin * 60,
        costEstimateInr: costInr,
      },
    ],
  };
}

export function estimateMetroRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): RouteEstimate {
  const km = distanceKm(originLat, originLng, destLat, destLng);
  const firstMile = Math.min(12, Math.round(km * 0.15 + 6));
  const metroMin = Math.round(km * 2.1 + 10);
  const walkMin = 7;
  const durationMin = firstMile + metroMin + walkMin;
  const costInr = Math.round(45 + km * 4 + 30);
  return {
    durationMin,
    costInr,
    transfers: 1,
    walkingMin: walkMin + 3,
    usesMetro: true,
    confidence: "estimated",
    summaryLabel: "Rapido → Metro → Walk",
    legs: [
      {
        mode: "bike_taxi",
        description: "Rapido to nearest metro station",
        durationSec: firstMile * 60,
        costEstimateInr: 55,
      },
      {
        mode: "metro",
        description: "Namma Metro to destination area",
        durationSec: metroMin * 60,
        costEstimateInr: 45,
      },
      {
        mode: "walk",
        description: "Walk to venue",
        durationSec: walkMin * 60,
      },
    ],
  };
}

export function pickRoutesForParticipant(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  preferMetro: boolean,
): { primary: RouteEstimate; alternate: RouteEstimate } {
  const direct = estimateDirectBikeTaxi(originLat, originLng, destLat, destLng);
  const metro = estimateMetroRoute(originLat, originLng, destLat, destLng);
  if (preferMetro && metro.durationMin <= direct.durationMin + 12) {
    return { primary: metro, alternate: direct };
  }
  if (direct.durationMin <= metro.durationMin) {
    return { primary: direct, alternate: metro };
  }
  return { primary: metro, alternate: direct };
}
