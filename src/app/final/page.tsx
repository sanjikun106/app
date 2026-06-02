"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { appPath } from "@/lib/paths";
import { RequiresConvex } from "@/components/RequiresConvex";

function FinalView() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("id") as Id<"plans"> | null;

  const finalPlan = useQuery(
    api.domain.recommendations.getFinalPlan,
    planId && isConvexConfigured() ? { planId } : "skip",
  );

  if (!planId) {
    return (
      <main className="container">
        <p>Missing plan.</p>
      </main>
    );
  }

  if (finalPlan === undefined) {
    return <main className="container">Loading…</main>;
  }

  if (!finalPlan) {
    return (
      <main className="container">
        <p>No locked plan yet.</p>
        <Link href={appPath(`/plan/?id=${planId}`)}>Back to plan</Link>
      </main>
    );
  }

  const when = new Date(finalPlan.scheduledAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="container">
      <p className="chip">Plan locked</p>
      <h1 style={{ margin: "0.75rem 0" }}>{finalPlan.venueName}</h1>
      {finalPlan.neighbourhood && (
        <p className="muted">{finalPlan.neighbourhood}</p>
      )}
      <p className="muted">{when}</p>
      {finalPlan.showtime && (
        <p>
          Showtime: <strong>{finalPlan.showtime}</strong>
        </p>
      )}

      <section style={{ marginTop: "1.25rem" }}>
        {finalPlan.routes.map((r) => (
          <article key={r.displayName} className="card">
            <h3>
              {r.displayName} — {Math.round(r.totalDurationSec / 60)} min · ₹
              {r.totalCostEstimateInr}
            </h3>
            <p className="muted">{r.summaryLabel}</p>
            {r.legs.map((leg, i) => (
              <div className="route-leg" key={i}>
                <span>{leg.mode}</span>
                <span>
                  {leg.description} — {Math.round(leg.durationSec / 60)} min
                </span>
              </div>
            ))}
            <a
              className="btn btn-secondary"
              style={{ marginTop: "0.75rem", display: "inline-flex" }}
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(finalPlan.venueName + " Bengaluru")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps
            </a>
          </article>
        ))}
      </section>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        Share this card in your group chat. MeetRoute compared travel burden and
        locked the fairest practical option.
      </p>
      <Link href={appPath("/")} className="btn btn-ghost" style={{ marginTop: "1rem" }}>
        Start another plan
      </Link>
    </main>
  );
}

export default function FinalPage() {
  return (
    <Suspense fallback={<main className="container">Loading…</main>}>
      <RequiresConvex>
        <FinalView />
      </RequiresConvex>
    </Suspense>
  );
}
