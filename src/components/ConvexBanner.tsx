"use client";

import { isConvexConfigured } from "@/lib/convex";

export function ConvexBanner() {
  if (isConvexConfigured()) return null;
  return (
    <div className="banner">
      <strong>Demo mode:</strong> Set{" "}
      <code>NEXT_PUBLIC_CONVEX_URL</code> in GitHub Actions secrets and redeploy
      to enable live plans. UI preview works without backend.
    </div>
  );
}
