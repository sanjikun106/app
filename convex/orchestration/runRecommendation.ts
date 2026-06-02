import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { scorePlan, Preset } from "../lib/scoring/planScore";
import { pickRoutesForParticipant } from "../lib/routeEstimator";
import { BENGALURU_CINEMAS, BENGALURU_CAFES } from "../lib/bengaluruVenues";

const presetValidator = v.union(
  v.literal("balanced"),
  v.literal("fastest"),
  v.literal("fairest"),
  v.literal("cheapest"),
  v.literal("metro_friendly"),
  v.literal("best_venue"),
  v.literal("least_hassle"),
);

export const insertRecommendation = internalMutation({
  args: {
    planId: v.id("plans"),
    runId: v.id("recommendationRuns"),
    venueName: v.string(),
    neighbourhood: v.optional(v.string()),
    venueId: v.optional(v.id("venues")),
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
    routes: v.array(
      v.object({
        participantId: v.id("participants"),
        legs: v.array(
          v.object({
            mode: v.string(),
            description: v.string(),
            durationSec: v.number(),
            costEstimateInr: v.optional(v.number()),
          }),
        ),
        totalDurationSec: v.number(),
        totalCostEstimateInr: v.number(),
        walkingSec: v.number(),
        waitingSec: v.number(),
        transfers: v.number(),
        confidence: v.union(v.literal("estimated"), v.literal("range")),
        summaryLabel: v.string(),
      }),
    ),
  },
  returns: v.id("recommendations"),
  handler: async (ctx, args) => {
    const recId = await ctx.db.insert("recommendations", {
      planId: args.planId,
      runId: args.runId,
      venueId: args.venueId,
      venueName: args.venueName,
      neighbourhood: args.neighbourhood,
      planScore: args.planScore,
      scoreBreakdown: args.scoreBreakdown,
      explanationShort: args.explanationShort,
      diversityTag: args.diversityTag,
      rank: args.rank,
      showtime: args.showtime,
      venueRating: args.venueRating,
    });
    for (const r of args.routes) {
      await ctx.db.insert("routeOptions", {
        recommendationId: recId,
        participantId: r.participantId,
        legs: r.legs,
        totalDurationSec: r.totalDurationSec,
        totalCostEstimateInr: r.totalCostEstimateInr,
        walkingSec: r.walkingSec,
        waitingSec: r.waitingSec,
        transfers: r.transfers,
        confidence: r.confidence,
        summaryLabel: r.summaryLabel,
      });
    }
    return recId;
  },
});

export const completeRun = internalMutation({
  args: {
    runId: v.id("recommendationRuns"),
    planId: v.id("plans"),
    candidateCount: v.number(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.error ? "failed" : "completed",
      completedAt: Date.now(),
      candidateCount: args.candidateCount,
      error: args.error,
    });
    await ctx.scheduler.runAfter(0, internal.orchestration.internal.setPlanStatus, {
      planId: args.planId,
      status: args.error ? "collecting" : "ready",
    });
    return null;
  },
});

export const runRecommendation = internalAction({
  args: {
    planId: v.id("plans"),
    runId: v.id("recommendationRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await ctx.runQuery(internal.domain.plans.getPlanInternal, {
      planId: args.planId,
    });
    if (!plan) {
      await ctx.runMutation(internal.orchestration.runRecommendation.completeRun, {
        runId: args.runId,
        planId: args.planId,
        candidateCount: 0,
        error: "Plan not found",
      });
      return null;
    }

    const participants = await ctx.runQuery(
      internal.domain.participants.listWithOriginsInternal,
      { planId: args.planId },
    );

    const withOrigin = participants.filter((p) => p.origin);
    if (withOrigin.length < 2) {
      await ctx.runMutation(internal.orchestration.runRecommendation.completeRun, {
        runId: args.runId,
        planId: args.planId,
        candidateCount: 0,
        error: "Need at least 2 participants with locations",
      });
      return null;
    }

    await ctx.runMutation(
      internal.orchestration.internal.clearRecommendationsForPlan,
      { planId: args.planId },
    );

    const preset = plan.groupSettings.preset as Preset;
    const venues =
      plan.mode === "movie" || plan.activityType === "movie"
        ? BENGALURU_CINEMAS
        : BENGALURU_CAFES;

    type Scored = {
      venue: (typeof venues)[0];
      planScore: number;
      breakdown: ReturnType<typeof scorePlan>["breakdown"];
      routes: Array<{
        participantId: (typeof withOrigin)[0]["_id"];
        primary: ReturnType<typeof pickRoutesForParticipant>["primary"];
      }>;
    };

    const scored: Scored[] = [];

    for (const venue of venues) {
      const routeResults = withOrigin.map((p) => {
        const preferMetro = p.travelConstraints?.preferMetro ?? false;
        const { primary } = pickRoutesForParticipant(
          p.origin!.lat,
          p.origin!.lng,
          venue.lat,
          venue.lng,
          preferMetro,
        );
        return {
          participantId: p._id,
          primary,
        };
      });

      const { planScore, breakdown } = scorePlan(
        routeResults.map((r) => ({
          durationMin: r.primary.durationMin,
          costInr: r.primary.costInr,
          transfers: r.primary.transfers,
          walkingMin: r.primary.walkingMin,
          usesMetro: r.primary.usesMetro,
        })),
        { rating: venue.rating, name: venue.name },
        preset,
      );

      scored.push({
        venue,
        planScore,
        breakdown,
        routes: routeResults,
      });
    }

    scored.sort((a, b) => a.planScore - b.planScore);

    const pickTag = (
      item: Scored,
      index: number,
    ): "balanced" | "fastest" | "fairest" | "cheapest" | "best_venue" | "metro" => {
      if (index === 0) return "balanced";
      const fastest = [...scored].sort(
        (a, b) => a.breakdown.combinedMinutes - b.breakdown.combinedMinutes,
      )[0];
      const fairest = [...scored].sort(
        (a, b) =>
          a.breakdown.timeImbalanceMinutes - b.breakdown.timeImbalanceMinutes,
      )[0];
      const cheapest = [...scored].sort(
        (a, b) => a.breakdown.combinedCostInr - b.breakdown.combinedCostInr,
      )[0];
      const bestVenue = [...scored].sort((a, b) => b.venue.rating - a.venue.rating)[0];
      if (item.venue.name === fastest.venue.name) return "fastest";
      if (item.venue.name === fairest.venue.name) return "fairest";
      if (item.venue.name === cheapest.venue.name) return "cheapest";
      if (item.venue.name === bestVenue.venue.name) return "best_venue";
      return "metro";
    };

    const top = scored.slice(0, Math.min(5, scored.length));
    let rank = 1;
    for (const item of top) {
      const imbalance = item.breakdown.timeImbalanceMinutes;
      const explanationShort =
        rank === 1
          ? `Best ${preset.replace("_", " ")} option: combined ${item.breakdown.combinedMinutes} min, longest journey ${item.breakdown.maxIndividualMinutes} min, imbalance ${imbalance} min.`
          : `${item.venue.name}: ${item.breakdown.combinedMinutes} min combined · ₹${item.breakdown.combinedCostInr} est.`;

      await ctx.runMutation(
        internal.orchestration.runRecommendation.insertRecommendation,
        {
          planId: args.planId,
          runId: args.runId,
          venueName: item.venue.name,
          neighbourhood: item.venue.neighbourhood,
          planScore: item.planScore,
          scoreBreakdown: item.breakdown,
          explanationShort,
          diversityTag: pickTag(item, rank - 1),
          rank,
          showtime:
            "showtime" in item.venue
              ? (item.venue as { showtime?: string }).showtime
              : undefined,
          venueRating: item.venue.rating,
          routes: item.routes.map((r) => ({
            participantId: r.participantId,
            legs: r.primary.legs,
            totalDurationSec: r.primary.durationMin * 60,
            totalCostEstimateInr: r.primary.costInr,
            walkingSec: r.primary.walkingMin * 60,
            waitingSec: 0,
            transfers: r.primary.transfers,
            confidence: r.primary.confidence,
            summaryLabel: r.primary.summaryLabel,
          })),
        },
      );
      rank++;
    }

    await ctx.runMutation(internal.orchestration.runRecommendation.completeRun, {
      runId: args.runId,
      planId: args.planId,
      candidateCount: venues.length,
    });

    return null;
  },
});
