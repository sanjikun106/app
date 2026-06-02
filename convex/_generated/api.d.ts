/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as domain_participants from "../domain/participants.js";
import type * as domain_plans from "../domain/plans.js";
import type * as domain_recommendations from "../domain/recommendations.js";
import type * as domain_votes from "../domain/votes.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bengaluruVenues from "../lib/bengaluruVenues.js";
import type * as lib_geohash from "../lib/geohash.js";
import type * as lib_privacy from "../lib/privacy.js";
import type * as lib_routeEstimator from "../lib/routeEstimator.js";
import type * as lib_scoring_planScore from "../lib/scoring/planScore.js";
import type * as lib_validators from "../lib/validators.js";
import type * as orchestration_internal from "../orchestration/internal.js";
import type * as orchestration_runRecommendation from "../orchestration/runRecommendation.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "domain/participants": typeof domain_participants;
  "domain/plans": typeof domain_plans;
  "domain/recommendations": typeof domain_recommendations;
  "domain/votes": typeof domain_votes;
  "lib/auth": typeof lib_auth;
  "lib/bengaluruVenues": typeof lib_bengaluruVenues;
  "lib/geohash": typeof lib_geohash;
  "lib/privacy": typeof lib_privacy;
  "lib/routeEstimator": typeof lib_routeEstimator;
  "lib/scoring/planScore": typeof lib_scoring_planScore;
  "lib/validators": typeof lib_validators;
  "orchestration/internal": typeof orchestration_internal;
  "orchestration/runRecommendation": typeof orchestration_runRecommendation;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
