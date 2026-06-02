import { v } from "convex/values";

export const presetValidator = v.union(
  v.literal("balanced"),
  v.literal("fastest"),
  v.literal("fairest"),
  v.literal("cheapest"),
  v.literal("metro_friendly"),
  v.literal("best_venue"),
  v.literal("least_hassle"),
);

export const planModeValidator = v.union(
  v.literal("meet"),
  v.literal("movie"),
  v.literal("dine"),
  v.literal("shared_dest"),
  v.literal("group"),
);

export const originInputValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  label: v.optional(v.string()),
  precision: v.optional(
    v.union(
      v.literal("exact"),
      v.literal("neighbourhood"),
      v.literal("hidden"),
    ),
  ),
});

export const visibilityValidator = v.union(
  v.literal("exact"),
  v.literal("approx"),
  v.literal("algorithm_only"),
);
