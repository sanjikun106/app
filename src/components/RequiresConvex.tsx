"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { isConvexConfigured } from "@/lib/convex";
import { appPath } from "@/lib/paths";
import { ConvexBanner } from "@/components/ConvexBanner";

/** Renders children only when Convex is configured (avoids hook errors). */
export function RequiresConvex({ children }: { children: ReactNode }) {
  if (!isConvexConfigured()) {
    return (
      <main className="container">
        <ConvexBanner />
        <p className="muted" style={{ marginTop: "1rem" }}>
          Live planning needs a Convex backend. Add{" "}
          <code>NEXT_PUBLIC_CONVEX_URL</code> to GitHub Actions secrets and
          redeploy.
        </p>
        <Link href={appPath("/")} className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Back home
        </Link>
      </main>
    );
  }
  return <>{children}</>;
}
