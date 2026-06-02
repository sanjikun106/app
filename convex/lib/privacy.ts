import { Doc } from "../_generated/dataModel";

type Origin = NonNullable<Doc<"participants">["origin"]>;

export function redactOrigin(
  origin: Origin | undefined,
  visibility: Doc<"participants">["originVisibility"],
  viewerIsOwner: boolean,
): Origin | undefined {
  if (!origin) return undefined;
  if (viewerIsOwner) return origin;
  if (visibility === "algorithm_only") return undefined;
  if (visibility === "approx") {
    return {
      ...origin,
      lat: Math.round(origin.lat * 100) / 100,
      lng: Math.round(origin.lng * 100) / 100,
      label: origin.label ? `${origin.label.split(",")[0]} area` : "Nearby area",
      precision: "neighbourhood",
    };
  }
  return origin;
}
