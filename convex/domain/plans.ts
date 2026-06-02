import { v } from "convex/values";
import { mutation, query, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { planModeValidator, presetValidator } from "../lib/validators";
import { getPlanByInviteToken, requirePlan } from "../lib/auth";

function generateInviteToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const create = mutation({
  args: {
    creatorName: v.string(),
    mode: planModeValidator,
    activityType: v.string(),
    activityDetail: v.optional(v.string()),
    scheduledAt: v.number(),
    preset: v.optional(presetValidator),
    guestId: v.string(),
  },
  returns: v.object({
    planId: v.id("plans"),
    inviteToken: v.string(),
    participantId: v.id("participants"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const inviteToken = generateInviteToken();
    const preset = args.preset ?? "balanced";

    const planId = await ctx.db.insert("plans", {
      creatorName: args.creatorName,
      inviteToken,
      mode: args.mode,
      activityType: args.activityType,
      activityDetail: args.activityDetail,
      status: "collecting",
      scheduledAt: args.scheduledAt,
      flexibilityWindowMinutes: 60,
      groupSettings: { preset, fairnessSlider: 0.5 },
      cityId: "bengaluru",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    const participantId = await ctx.db.insert("participants", {
      planId,
      displayName: args.creatorName,
      guestId: args.guestId,
      originVisibility: "algorithm_only",
      isCreator: true,
      joinedAt: now,
    });

    return { planId, inviteToken, participantId };
  },
});

export const getByInvite = query({
  args: { inviteToken: v.string(), guestId: v.optional(v.string()) },
  returns: v.union(
    v.object({
      plan: v.object({
        _id: v.id("plans"),
        mode: v.string(),
        activityType: v.string(),
        activityDetail: v.optional(v.string()),
        status: v.string(),
        scheduledAt: v.number(),
        inviteToken: v.string(),
        groupSettings: v.object({ preset: v.string() }),
        selectedRecommendationId: v.optional(v.id("recommendations")),
        creatorName: v.string(),
      }),
      participants: v.array(
        v.object({
          _id: v.id("participants"),
          displayName: v.string(),
          isCreator: v.boolean(),
          hasOrigin: v.boolean(),
          originLabel: v.optional(v.string()),
          originVisibility: v.string(),
        }),
      ),
      viewerParticipantId: v.optional(v.id("participants")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const plan = await getPlanByInviteToken(ctx, args.inviteToken);
    if (!plan) return null;

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .collect();

    let viewerParticipantId;
    if (args.guestId) {
      const viewer = participants.find((p) => p.guestId === args.guestId);
      viewerParticipantId = viewer?._id;
    }

    return {
      plan: {
        _id: plan._id,
        mode: plan.mode,
        activityType: plan.activityType,
        activityDetail: plan.activityDetail,
        status: plan.status,
        scheduledAt: plan.scheduledAt,
        inviteToken: plan.inviteToken,
        groupSettings: { preset: plan.groupSettings.preset },
        selectedRecommendationId: plan.selectedRecommendationId,
        creatorName: plan.creatorName,
      },
      participants: participants.map((p) => ({
        _id: p._id,
        displayName: p.displayName,
        isCreator: p.isCreator,
        hasOrigin: !!p.origin,
        originLabel:
          p.origin?.label ??
          (p.origin ? `${p.origin.lat.toFixed(2)}, ${p.origin.lng.toFixed(2)}` : undefined),
        originVisibility: p.originVisibility,
      })),
      viewerParticipantId,
    };
  },
});

export const getById = query({
  args: {
    planId: v.id("plans"),
    guestId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      plan: v.object({
        _id: v.id("plans"),
        mode: v.string(),
        activityType: v.string(),
        activityDetail: v.optional(v.string()),
        status: v.string(),
        scheduledAt: v.number(),
        inviteToken: v.string(),
        groupSettings: v.object({ preset: v.string() }),
        selectedRecommendationId: v.optional(v.id("recommendations")),
        creatorName: v.string(),
      }),
      participants: v.array(
        v.object({
          _id: v.id("participants"),
          displayName: v.string(),
          isCreator: v.boolean(),
          hasOrigin: v.boolean(),
          originLabel: v.optional(v.string()),
        }),
      ),
      viewerParticipantId: v.optional(v.id("participants")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const plan = await requirePlan(ctx, args.planId);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .collect();

    const viewer = args.guestId
      ? participants.find((p) => p.guestId === args.guestId)
      : undefined;

    return {
      plan: {
        _id: plan._id,
        mode: plan.mode,
        activityType: plan.activityType,
        activityDetail: plan.activityDetail,
        status: plan.status,
        scheduledAt: plan.scheduledAt,
        inviteToken: plan.inviteToken,
        groupSettings: { preset: plan.groupSettings.preset },
        selectedRecommendationId: plan.selectedRecommendationId,
        creatorName: plan.creatorName,
      },
      participants: participants.map((p) => ({
        _id: p._id,
        displayName: p.displayName,
        isCreator: p.isCreator,
        hasOrigin: !!p.origin,
        originLabel: p.origin?.label,
      })),
      viewerParticipantId: viewer?._id,
    };
  },
});

export const updatePreset = mutation({
  args: {
    planId: v.id("plans"),
    preset: presetValidator,
    guestId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await requirePlan(ctx, args.planId);
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_plan_and_guest", (q) =>
        q.eq("planId", args.planId).eq("guestId", args.guestId),
      )
      .unique();
    if (!participant?.isCreator) throw new Error("Only creator can change preset");

    await ctx.db.patch(args.planId, {
      groupSettings: { ...plan.groupSettings, preset: args.preset },
      updatedAt: Date.now(),
      version: plan.version + 1,
    });
    return null;
  },
});

export const requestRecommendations = mutation({
  args: { planId: v.id("plans"), guestId: v.string() },
  returns: v.id("recommendationRuns"),
  handler: async (ctx, args) => {
    const plan = await requirePlan(ctx, args.planId);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const withOrigin = participants.filter((p) => p.origin);
    if (withOrigin.length < 2) {
      throw new Error("At least 2 participants need a starting location");
    }

    await ctx.db.patch(args.planId, {
      status: "computing",
      updatedAt: Date.now(),
      version: plan.version + 1,
    });

    const runId = await ctx.db.insert("recommendationRuns", {
      planId: args.planId,
      preset: plan.groupSettings.preset,
      status: "running",
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      0,
      internal.orchestration.runRecommendation.runRecommendation,
      { planId: args.planId, runId },
    );

    return runId;
  },
});

export const lockPlan = mutation({
  args: {
    planId: v.id("plans"),
    recommendationId: v.id("recommendations"),
    guestId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await requirePlan(ctx, args.planId);
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_plan_and_guest", (q) =>
        q.eq("planId", args.planId).eq("guestId", args.guestId),
      )
      .unique();
    if (!participant) throw new Error("Not a participant");

    await ctx.db.patch(args.planId, {
      status: "locked",
      selectedRecommendationId: args.recommendationId,
      updatedAt: Date.now(),
      version: plan.version + 1,
    });
    return null;
  },
});

export const getPlanInternal = internalQuery({
  args: { planId: v.id("plans") },
  returns: v.union(
    v.object({
      _id: v.id("plans"),
      mode: v.string(),
      activityType: v.string(),
      groupSettings: v.object({ preset: v.string() }),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    return {
      _id: plan._id,
      mode: plan.mode,
      activityType: plan.activityType,
      groupSettings: { preset: plan.groupSettings.preset },
    };
  },
});
