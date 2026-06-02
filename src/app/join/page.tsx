"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getGuestId } from "@/lib/guest";
import { href } from "@/lib/paths";
import Link from "next/link";
import { ConvexBanner } from "@/components/ConvexBanner";
import { isConvexConfigured } from "@/lib/convex";

function JoinForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const join = useMutation(api.domain.participants.join);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Missing invite token");
      return;
    }
    if (!isConvexConfigured()) {
      setError("Convex not configured");
      return;
    }
    setLoading(true);
    try {
      const guestId = getGuestId();
      const result = await join({
        inviteToken: token,
        displayName: name.trim(),
        guestId,
      });
      router.push(href(`/plan/?id=${result.planId}&token=${token}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1 style={{ margin: "1.5rem 0 0.5rem" }}>Join plan</h1>
      <ConvexBanner />
      <form onSubmit={handleSubmit}>
        <label className="label">Your name</label>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Samarth"
          required
        />
        {error && (
          <p style={{ color: "var(--danger)", marginBottom: "0.75rem" }}>{error}</p>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Joining…" : "Join plan"}
        </button>
      </form>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<main className="container">Loading…</main>}>
      <JoinForm />
    </Suspense>
  );
}
