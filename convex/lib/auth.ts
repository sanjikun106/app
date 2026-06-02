import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getPlanByInviteToken(
  ctx: QueryCtx | MutationCtx,
  inviteToken: string,
) {
  return await ctx.db
    .query("plans")
    .withIndex("by_invite_token", (q) => q.eq("inviteToken", inviteToken))
    .unique();
}

export async function requirePlan(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plans">,
) {
  const plan = await ctx.db.get(planId);
  if (!plan) throw new Error("Plan not found");
  return plan;
}

export async function getParticipantForGuest(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plans">,
  guestId: string,
) {
  return await ctx.db
    .query("participants")
    .withIndex("by_plan_and_guest", (q) =>
      q.eq("planId", planId).eq("guestId", guestId),
    )
    .unique();
}
