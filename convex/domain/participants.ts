import { v } from "convex/values";
import { mutation, internalQuery } from "../_generated/server";
import { requirePlan, getPlanByInviteToken } from "../lib/auth";
import { originInputValidator, visibilityValidator } from "../lib/validators";
import { toGeohash } from "../lib/geohash";

export const join = mutation({
  args: {
    inviteToken: v.string(),
    displayName: v.string(),
    guestId: v.string(),
  },
  returns: v.object({
    planId: v.id("plans"),
    participantId: v.id("participants"),
  }),
  handler: async (ctx, args) => {
    const plan = await getPlanByInviteToken(ctx, args.inviteToken);
    if (!plan) throw new Error("Invalid invite link");
    if (plan.status === "locked") throw new Error("Plan is already locked");

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_plan_and_guest", (q) =>
        q.eq("planId", plan._id).eq("guestId", args.guestId),
      )
      .unique();
    if (existing) {
      return { planId: plan._id, participantId: existing._id };
    }

    const participantId = await ctx.db.insert("participants", {
      planId: plan._id,
      displayName: args.displayName,
      guestId: args.guestId,
      originVisibility: "algorithm_only",
      isCreator: false,
      joinedAt: Date.now(),
    });

    return { planId: plan._id, participantId };
  },
});

export const setOrigin = mutation({
  args: {
    participantId: v.id("participants"),
    origin: originInputValidator,
    visibility: v.optional(visibilityValidator),
    guestId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found");
    if (participant.guestId !== args.guestId) {
      throw new Error("Cannot update another participant's location");
    }

    const plan = await requirePlan(ctx, participant.planId);
    if (plan.status === "locked") throw new Error("Plan is locked");

    await ctx.db.patch(args.participantId, {
      origin: {
        lat: args.origin.lat,
        lng: args.origin.lng,
        geohash: toGeohash(args.origin.lat, args.origin.lng),
        label: args.origin.label,
        precision: args.origin.precision ?? "exact",
      },
      originVisibility: args.visibility ?? participant.originVisibility,
    });

    await ctx.db.patch(plan._id, {
      updatedAt: Date.now(),
      version: plan.version + 1,
    });

    return null;
  },
});

export const listWithOriginsInternal = internalQuery({
  args: { planId: v.id("plans") },
  returns: v.array(
    v.object({
      _id: v.id("participants"),
      displayName: v.string(),
      origin: v.optional(
        v.object({
          lat: v.number(),
          lng: v.number(),
          geohash: v.string(),
          label: v.optional(v.string()),
          precision: v.string(),
        }),
      ),
      travelConstraints: v.optional(
        v.object({
          preferMetro: v.optional(v.boolean()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    return participants.map((p) => ({
      _id: p._id,
      displayName: p.displayName,
      origin: p.origin,
      travelConstraints: p.travelConstraints,
    }));
  },
});
