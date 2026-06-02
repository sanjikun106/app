"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getGuestId } from "@/lib/guest";
import { appPath, absoluteAppUrl } from "@/lib/paths";
import Link from "next/link";
import { ConvexBanner } from "@/components/ConvexBanner";
import { RecommendationCard } from "@/components/RecommendationCard";
import { RequiresConvex } from "@/components/RequiresConvex";
import { isConvexConfigured } from "@/lib/convex";

const PRESETS = [
  "balanced",
  "fastest",
  "fairest",
  "cheapest",
  "metro_friendly",
  "best_venue",
  "least_hassle",
] as const;

const BENGALURU_PRESETS = [
  { label: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { label: "Kodathi", lat: 12.8926, lng: 77.7094 },
  { label: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { label: "Koramangala", lat: 12.9352, lng: 77.6245 },
];

function PlanView() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("id") as Id<"plans"> | null;
  const inviteToken = searchParams.get("token") ?? "";
  const router = useRouter();
  const guestId = getGuestId();

  const planData = useQuery(
    api.domain.plans.getById,
    planId && isConvexConfigured() ? { planId, guestId } : "skip",
  );

  const recommendations = useQuery(
    api.domain.recommendations.listByPlan,
    planId && planData?.plan.status !== "collecting" && isConvexConfigured()
      ? { planId }
      : "skip",
  );

  const voteSummary = useQuery(
    api.domain.votes.summary,
    planId && isConvexConfigured() ? { planId } : "skip",
  );

  const setOrigin = useMutation(api.domain.participants.setOrigin);
  const requestRecs = useMutation(api.domain.plans.requestRecommendations);
  const updatePreset = useMutation(api.domain.plans.updatePreset);
  const castVote = useMutation(api.domain.votes.cast);
  const lockPlan = useMutation(api.domain.plans.lockPlan);

  const [originLabel, setOriginLabel] = useState("Whitefield");
  const [lat, setLat] = useState(12.9698);
  const [lng, setLng] = useState(77.7499);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !inviteToken) return "";
    return absoluteAppUrl(`/join/?token=${inviteToken}`);
  }, [inviteToken]);

  const voteCounts = useMemo(() => {
    const m = new Map<string, number>();
    voteSummary?.forEach((v) => m.set(v.recommendationId, v.voteCount));
    return m;
  }, [voteSummary]);

  const viewerId = planData?.viewerParticipantId;
  const viewer = planData?.participants.find((p) => p._id === viewerId);
  const hasOrigin = viewer?.hasOrigin ?? false;

  const copyInvite = useCallback(() => {
    if (inviteUrl) navigator.clipboard.writeText(inviteUrl);
  }, [inviteUrl]);

  async function saveOrigin() {
    if (!viewerId) return;
    setBusy(true);
    setError(null);
    try {
      await setOrigin({
        participantId: viewerId,
        guestId,
        origin: { lat, lng, label: originLabel },
        visibility: "algorithm_only",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function compute() {
    if (!planId) return;
    setBusy(true);
    try {
      await requestRecs({ planId, guestId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePreset(preset: (typeof PRESETS)[number]) {
    if (!planId) return;
    await updatePreset({ planId, preset, guestId });
    await requestRecs({ planId, guestId });
  }

  async function vote(recId: Id<"recommendations">) {
    if (!planId || !viewerId) return;
    await castVote({
      planId,
      participantId: viewerId,
      recommendationId: recId,
      guestId,
    });
  }

  async function lock(recId: Id<"recommendations">) {
    if (!planId) return;
    setBusy(true);
    try {
      await lockPlan({ planId, recommendationId: recId, guestId });
      router.push(appPath(`/final/?id=${planId}`));
    } finally {
      setBusy(false);
    }
  }

  if (!planId) {
    return (
      <main className="container">
        <p>Missing plan id.</p>
      </main>
    );
  }

  if (planData === undefined) {
    return <main className="container">Loading plan…</main>;
  }

  if (planData === null) {
    return <main className="container">Plan not found.</main>;
  }

  const { plan, participants } = planData;

  if (plan.status === "locked") {
    router.replace(appPath(`/final/?id=${planId}`));
    return null;
  }

  return (
    <main className="container">
      <Link href={appPath("/")} className="muted">
        ← Home
      </Link>
      <h1 style={{ margin: "1rem 0 0.25rem" }}>
        {plan.activityType === "movie" ? "Movie night" : "Group plan"}
      </h1>
      <p className="muted">Status: {plan.status}</p>
      <ConvexBanner />

      <section className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Invite friends</h3>
        <p className="muted" style={{ wordBreak: "break-all", fontSize: "0.8rem" }}>
          {inviteUrl || "…"}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: "0.5rem" }}
          onClick={copyInvite}
        >
          Copy invite link
        </button>
      </section>

      <section className="card" style={{ marginTop: "0.75rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Participants</h3>
        <ul className="muted" style={{ listStyle: "none" }}>
          {participants.map((p) => (
            <li key={p._id} style={{ marginBottom: "0.35rem" }}>
              {p.displayName}
              {p.hasOrigin ? " ✓ location set" : " — waiting for location"}
            </li>
          ))}
        </ul>
      </section>

      {viewerId && !hasOrigin && (
        <section className="card" style={{ marginTop: "0.75rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Your starting point</h3>
          <label className="label">Quick pick (Bengaluru)</label>
          <select
            className="field"
            value={originLabel}
            onChange={(e) => {
              const p = BENGALURU_PRESETS.find((x) => x.label === e.target.value);
              if (p) {
                setOriginLabel(p.label);
                setLat(p.lat);
                setLng(p.lng);
              }
            }}
          >
            {BENGALURU_PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveOrigin}
            disabled={busy}
          >
            Save my location
          </button>
        </section>
      )}

      {hasOrigin && plan.status === "collecting" && (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: "1rem", width: "100%" }}
          onClick={compute}
          disabled={busy || participants.filter((p) => p.hasOrigin).length < 2}
        >
          {participants.filter((p) => p.hasOrigin).length < 2
            ? "Waiting for another location…"
            : "Find best meetup options"}
        </button>
      )}

      {(plan.status === "computing" || plan.status === "ready") && (
        <>
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`preset-btn ${plan.groupSettings.preset === p ? "active" : ""}`}
                onClick={() => changePreset(p)}
              >
                {p.replace("_", " ")}
              </button>
            ))}
          </div>
          {plan.status === "computing" && (
            <p className="muted">Computing routes…</p>
          )}
          {recommendations?.map((rec) => (
            <RecommendationCard
              key={rec._id}
              rec={rec}
              voteCount={voteCounts.get(rec._id) ?? 0}
              onVote={() => vote(rec._id)}
              onLock={() => lock(rec._id)}
              locking={busy}
            />
          ))}
        </>
      )}

      {error && (
        <p style={{ color: "var(--danger)", marginTop: "1rem" }}>{error}</p>
      )}
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<main className="container">Loading…</main>}>
      <RequiresConvex>
        <PlanView />
      </RequiresConvex>
    </Suspense>
  );
}
