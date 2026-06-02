"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getGuestId } from "@/lib/guest";
import { href } from "@/lib/paths";
import { ConvexBanner } from "@/components/ConvexBanner";
import { isConvexConfigured } from "@/lib/convex";
import Link from "next/link";

const MODE_MAP = {
  movie: { mode: "movie" as const, activityType: "movie", label: "Watch a movie" },
  dine: { mode: "dine" as const, activityType: "cafe", label: "Eat or hang out" },
  meet: { mode: "meet" as const, activityType: "meetup", label: "Meet somewhere" },
  shared_dest: {
    mode: "shared_dest" as const,
    activityType: "travel",
    label: "Travel together",
  },
};

function CreateForm() {
  const searchParams = useSearchParams();
  const modeKey = (searchParams.get("mode") ?? "movie") as keyof typeof MODE_MAP;
  const config = MODE_MAP[modeKey] ?? MODE_MAP.movie;

  const router = useRouter();
  const createPlan = useMutation(api.domain.plans.create);
  const [name, setName] = useState("");
  const [movie, setMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (!isConvexConfigured()) {
      setError("Convex is not configured. Add NEXT_PUBLIC_CONVEX_URL to deploy.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const guestId = getGuestId();
      const scheduledAt = Date.now() + 4 * 60 * 60 * 1000;
      const result = await createPlan({
        creatorName: name.trim(),
        mode: config.mode,
        activityType: config.activityType,
        activityDetail: movie.trim() || undefined,
        scheduledAt,
        guestId,
        preset: "balanced",
      });
      router.push(
        href(
          `/plan/?id=${result.planId}&token=${result.inviteToken}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <Link href={href("/")} className="muted">
        ← Back
      </Link>
      <h1 style={{ margin: "1rem 0 0.5rem", fontSize: "1.5rem" }}>
        {config.label}
      </h1>
      <ConvexBanner />
      <form onSubmit={handleSubmit}>
        <label className="label">Your name</label>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Arth"
        />
        {config.mode === "movie" && (
          <>
            <label className="label">Movie (optional)</label>
            <input
              className="field"
              value={movie}
              onChange={(e) => setMovie(e.target.value)}
              placeholder="e.g. Dune: Part Three"
            />
          </>
        )}
        {error && (
          <p style={{ color: "var(--danger)", marginBottom: "0.75rem" }}>{error}</p>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create plan & get invite link"}
        </button>
      </form>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<main className="container">Loading…</main>}>
      <CreateForm />
    </Suspense>
  );
}
