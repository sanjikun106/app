import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const clearRecommendationsForPlan = internalMutation({
  args: { planId: v.id("plans") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recs = await ctx.db
      .query("recommendations")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    for (const rec of recs) {
      const routes = await ctx.db
        .query("routeOptions")
        .withIndex("by_recommendation", (q) =>
          q.eq("recommendationId", rec._id),
        )
        .collect();
      for (const r of routes) await ctx.db.delete(r._id);
      await ctx.db.delete(rec._id);
    }
    return null;
  },
});

export const setPlanStatus = internalMutation({
  args: {
    planId: v.id("plans"),
    status: v.union(
      v.literal("collecting"),
      v.literal("computing"),
      v.literal("ready"),
      v.literal("locked"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    await ctx.db.patch(args.planId, {
      status: args.status,
      updatedAt: Date.now(),
      version: plan.version + 1,
    });
    return null;
  },
});
