import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requirePlan } from "../lib/auth";

export const cast = mutation({
  args: {
    planId: v.id("plans"),
    participantId: v.id("participants"),
    recommendationId: v.id("recommendations"),
    guestId: v.string(),
    comment: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.guestId !== args.guestId) {
      throw new Error("Invalid participant");
    }
    await requirePlan(ctx, args.planId);

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect();
    for (const v of existing) {
      if (v.planId === args.planId) await ctx.db.delete(v._id);
    }

    await ctx.db.insert("votes", {
      planId: args.planId,
      participantId: args.participantId,
      recommendationId: args.recommendationId,
      createdAt: Date.now(),
      comment: args.comment,
    });
    return null;
  },
});

export const summary = query({
  args: { planId: v.id("plans") },
  returns: v.array(
    v.object({
      recommendationId: v.id("recommendations"),
      voteCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlan(ctx, args.planId);
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const counts = new Map<string, number>();
    for (const vote of votes) {
      const key = vote.recommendationId;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([recommendationId, voteCount]) => ({
      recommendationId: recommendationId as typeof votes[0]["recommendationId"],
      voteCount,
    }));
  },
});
