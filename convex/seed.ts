import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Run once via dashboard: seed Bengaluru providers */
export const seedProviders = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("providers").first();
    if (existing) return null;

    const providers = [
      { type: "mobility" as const, name: "Rapido", integrationLevel: 2, cities: ["bengaluru"] },
      { type: "mobility" as const, name: "Uber", integrationLevel: 2, cities: ["bengaluru"] },
      { type: "mobility" as const, name: "Namma Metro", integrationLevel: 3, cities: ["bengaluru"] },
      { type: "cinema" as const, name: "BookMyShow", integrationLevel: 2, cities: ["bengaluru"] },
    ];

    for (const p of providers) {
      await ctx.db.insert("providers", p);
    }
    return null;
  },
});
