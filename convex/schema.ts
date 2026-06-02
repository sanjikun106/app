import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const originValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  geohash: v.string(),
  label: v.optional(v.string()),
  precision: v.union(
    v.literal("exact"),
    v.literal("neighbourhood"),
    v.literal("hidden"),
  ),
});

const travelConstraintsValidator = v.object({
  maxMinutes: v.optional(v.number()),
  maxBudgetInr: v.optional(v.number()),
  maxWalkingMinutes: v.optional(v.number()),
  maxTransfers: v.optional(v.number()),
  preferMetro: v.optional(v.boolean()),
  avoidBuses: v.optional(v.boolean()),
  willingBikeTaxi: v.optional(v.boolean()),
});

const groupSettingsValidator = v.object({
  preset: v.union(
    v.literal("balanced"),
    v.literal("fastest"),
    v.literal("fairest"),
    v.literal("cheapest"),
    v.literal("metro_friendly"),
    v.literal("best_venue"),
    v.literal("least_hassle"),
  ),
  fairnessSlider: v.optional(v.number()),
  maxIndividualMinutes: v.optional(v.number()),
  minVenueRating: v.optional(v.number()),
});

const legValidator = v.object({
  mode: v.string(),
  description: v.string(),
  durationSec: v.number(),
  costEstimateInr: v.optional(v.number()),
  providerId: v.optional(v.id("providers")),
});

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.optional(v.string()),
    name: v.string(),
    email: v.optional(v.string()),
    defaultCityId: v.string(),
    travelPrefs: v.optional(travelConstraintsValidator),
    createdAt: v.number(),
  }).index("by_token", ["tokenIdentifier"]),

  plans: defineTable({
    creatorName: v.string(),
    inviteToken: v.string(),
    mode: v.union(
      v.literal("meet"),
      v.literal("movie"),
      v.literal("dine"),
      v.literal("shared_dest"),
      v.literal("group"),
    ),
    activityType: v.string(),
    activityDetail: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("collecting"),
      v.literal("computing"),
      v.literal("ready"),
      v.literal("locked"),
    ),
    scheduledAt: v.number(),
    flexibilityWindowMinutes: v.optional(v.number()),
    finalDestination: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        label: v.string(),
      }),
    ),
    groupSettings: groupSettingsValidator,
    selectedRecommendationId: v.optional(v.id("recommendations")),
    cityId: v.string(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invite_token", ["inviteToken"])
    .index("by_status", ["status"]),

  participants: defineTable({
    planId: v.id("plans"),
    displayName: v.string(),
    guestId: v.optional(v.string()),
    origin: v.optional(originValidator),
    originVisibility: v.union(
      v.literal("exact"),
      v.literal("approx"),
      v.literal("algorithm_only"),
    ),
    travelConstraints: v.optional(travelConstraintsValidator),
    isCreator: v.boolean(),
    joinedAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_and_guest", ["planId", "guestId"]),

  venues: defineTable({
    cityId: v.string(),
    providerPlaceId: v.optional(v.string()),
    name: v.string(),
    category: v.string(),
    lat: v.number(),
    lng: v.number(),
    geohash: v.string(),
    neighbourhood: v.optional(v.string()),
    rating: v.optional(v.number()),
    priceLevel: v.optional(v.number()),
    activityMetadata: v.optional(
      v.object({
        movieTitle: v.optional(v.string()),
        showtime: v.optional(v.string()),
        cuisine: v.optional(v.string()),
      }),
    ),
  })
    .index("by_city", ["cityId"])
    .index("by_city_and_geohash", ["cityId", "geohash"]),

  providers: defineTable({
    type: v.union(
      v.literal("mobility"),
      v.literal("cinema"),
      v.literal("restaurant"),
      v.literal("activity"),
    ),
    name: v.string(),
    integrationLevel: v.number(),
    deepLinkTemplate: v.optional(v.string()),
    cities: v.array(v.string()),
  }),

  recommendationRuns: defineTable({
    planId: v.id("plans"),
    preset: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    candidateCount: v.optional(v.number()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_plan", ["planId"]),

  recommendations: defineTable({
    planId: v.id("plans"),
    runId: v.id("recommendationRuns"),
    venueId: v.optional(v.id("venues")),
    venueName: v.string(),
    neighbourhood: v.optional(v.string()),
    planScore: v.number(),
    scoreBreakdown: v.object({
      travelScore: v.number(),
      fairnessPenalty: v.number(),
      hasslePenalty: v.number(),
      venueQualityBonus: v.number(),
      combinedMinutes: v.number(),
      maxIndividualMinutes: v.number(),
      timeImbalanceMinutes: v.number(),
      combinedCostInr: v.number(),
    }),
    explanationShort: v.string(),
    explanationLong: v.optional(v.string()),
    diversityTag: v.union(
      v.literal("balanced"),
      v.literal("fastest"),
      v.literal("fairest"),
      v.literal("cheapest"),
      v.literal("best_venue"),
      v.literal("metro"),
    ),
    rank: v.number(),
    showtime: v.optional(v.string()),
    venueRating: v.optional(v.number()),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_and_rank", ["planId", "rank"]),

  routeOptions: defineTable({
    recommendationId: v.id("recommendations"),
    participantId: v.id("participants"),
    legs: v.array(legValidator),
    totalDurationSec: v.number(),
    totalCostEstimateInr: v.number(),
    walkingSec: v.number(),
    waitingSec: v.number(),
    transfers: v.number(),
    confidence: v.union(
      v.literal("live"),
      v.literal("estimated"),
      v.literal("range"),
      v.literal("unavailable"),
    ),
    summaryLabel: v.string(),
  })
    .index("by_recommendation", ["recommendationId"])
    .index("by_participant", ["participantId"]),

  votes: defineTable({
    planId: v.id("plans"),
    participantId: v.id("participants"),
    recommendationId: v.id("recommendations"),
    rank: v.optional(v.number()),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_participant", ["participantId"])
    .index("by_recommendation", ["recommendationId"]),

  routeCache: defineTable({
    originGeohash: v.string(),
    destGeohash: v.string(),
    modeSetHash: v.string(),
    departureTimeBucket: v.string(),
    durationSec: v.number(),
    costEstimateInr: v.number(),
    expiresAt: v.number(),
  }).index("by_key", [
    "originGeohash",
    "destGeohash",
    "modeSetHash",
    "departureTimeBucket",
  ]),
});
