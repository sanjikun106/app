import { v } from "convex/values";
import { query } from "../_generated/server";
import { requirePlan } from "../lib/auth";

export const listByPlan = query({
  args: { planId: v.id("plans") },
  returns: v.array(
    v.object({
      _id: v.id("recommendations"),
      venueName: v.string(),
      neighbourhood: v.optional(v.string()),
      planScore: v.number(),
      scoreBreakdown: v.object({
        combinedMinutes: v.number(),
        maxIndividualMinutes: v.number(),
        timeImbalanceMinutes: v.number(),
        combinedCostInr: v.number(),
      }),
      explanationShort: v.string(),
      diversityTag: v.string(),
      rank: v.number(),
      showtime: v.optional(v.string()),
      venueRating: v.optional(v.number()),
      routes: v.array(
        v.object({
          participantId: v.id("participants"),
          displayName: v.string(),
          totalDurationSec: v.number(),
          totalCostEstimateInr: v.number(),
          transfers: v.number(),
          summaryLabel: v.string(),
          legs: v.array(
            v.object({
              mode: v.string(),
              description: v.string(),
              durationSec: v.number(),
              costEstimateInr: v.optional(v.number()),
            }),
          ),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlan(ctx, args.planId);

    const recs = await ctx.db
      .query("recommendations")
      .withIndex("by_plan_and_rank", (q) => q.eq("planId", args.planId))
      .collect();

    recs.sort((a, b) => a.rank - b.rank);

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const nameById = new Map(participants.map((p) => [p._id, p.displayName]));

    const result = [];
    for (const rec of recs) {
      const routeOpts = await ctx.db
        .query("routeOptions")
        .withIndex("by_recommendation", (q) =>
          q.eq("recommendationId", rec._id),
        )
        .collect();

      result.push({
        _id: rec._id,
        venueName: rec.venueName,
        neighbourhood: rec.neighbourhood,
        planScore: rec.planScore,
        scoreBreakdown: {
          combinedMinutes: rec.scoreBreakdown.combinedMinutes,
          maxIndividualMinutes: rec.scoreBreakdown.maxIndividualMinutes,
          timeImbalanceMinutes: rec.scoreBreakdown.timeImbalanceMinutes,
          combinedCostInr: rec.scoreBreakdown.combinedCostInr,
        },
        explanationShort: rec.explanationShort,
        diversityTag: rec.diversityTag,
        rank: rec.rank,
        showtime: rec.showtime,
        venueRating: rec.venueRating,
        routes: routeOpts.map((r) => ({
          participantId: r.participantId,
          displayName: nameById.get(r.participantId) ?? "Guest",
          totalDurationSec: r.totalDurationSec,
          totalCostEstimateInr: r.totalCostEstimateInr,
          transfers: r.transfers,
          summaryLabel: r.summaryLabel,
          legs: r.legs,
        })),
      });
    }

    return result;
  },
});

export const getFinalPlan = query({
  args: { planId: v.id("plans") },
  returns: v.union(
    v.object({
      venueName: v.string(),
      neighbourhood: v.optional(v.string()),
      showtime: v.optional(v.string()),
      scheduledAt: v.number(),
      routes: v.array(
        v.object({
          displayName: v.string(),
          totalDurationSec: v.number(),
          totalCostEstimateInr: v.number(),
          summaryLabel: v.string(),
          legs: v.array(
            v.object({
              mode: v.string(),
              description: v.string(),
              durationSec: v.number(),
            }),
          ),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const plan = await requirePlan(ctx, args.planId);
    if (!plan.selectedRecommendationId) return null;

    const rec = await ctx.db.get(plan.selectedRecommendationId);
    if (!rec) return null;

    const routeOpts = await ctx.db
      .query("routeOptions")
      .withIndex("by_recommendation", (q) =>
        q.eq("recommendationId", rec._id),
      )
      .collect();

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const nameById = new Map(participants.map((p) => [p._id, p.displayName]));

    return {
      venueName: rec.venueName,
      neighbourhood: rec.neighbourhood,
      showtime: rec.showtime,
      scheduledAt: plan.scheduledAt,
      routes: routeOpts.map((r) => ({
        displayName: nameById.get(r.participantId) ?? "Guest",
        totalDurationSec: r.totalDurationSec,
        totalCostEstimateInr: r.totalCostEstimateInr,
        summaryLabel: r.summaryLabel,
        legs: r.legs.map((l) => ({
          mode: l.mode,
          description: l.description,
          durationSec: l.durationSec,
        })),
      })),
    };
  },
});
