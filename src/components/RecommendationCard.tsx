"use client";

type Route = {
  displayName: string;
  totalDurationSec: number;
  totalCostEstimateInr: number;
  summaryLabel: string;
  legs: Array<{
    mode: string;
    description: string;
    durationSec: number;
  }>;
};

export type Recommendation = {
  _id: string;
  venueName: string;
  neighbourhood?: string;
  explanationShort: string;
  diversityTag: string;
  rank: number;
  showtime?: string;
  venueRating?: number;
  scoreBreakdown: {
    combinedMinutes: number;
    maxIndividualMinutes: number;
    timeImbalanceMinutes: number;
    combinedCostInr: number;
  };
  routes: Route[];
};

type Props = {
  rec: Recommendation;
  voteCount?: number;
  onVote?: () => void;
  onLock?: () => void;
  locking?: boolean;
};

function formatMin(sec: number) {
  return Math.round(sec / 60);
}

export function RecommendationCard({
  rec,
  voteCount = 0,
  onVote,
  onLock,
  locking,
}: Props) {
  return (
    <article className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
        <div>
          <span className="chip">{rec.diversityTag.replace("_", " ")}</span>
          <h2 style={{ fontSize: "1.15rem", margin: "0.5rem 0 0.15rem" }}>
            {rec.venueName}
          </h2>
          {rec.neighbourhood && (
            <p className="muted">{rec.neighbourhood}</p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {rec.venueRating && (
            <p>
              <strong>{rec.venueRating.toFixed(1)}</strong>
              <span className="muted"> ★</span>
            </p>
          )}
          {rec.showtime && <p className="muted">{rec.showtime}</p>}
        </div>
      </div>

      <p className="muted" style={{ margin: "0.65rem 0" }}>
        {rec.explanationShort}
      </p>

      <div className="stat-row">
        <span>
          Combined <strong>{rec.scoreBreakdown.combinedMinutes} min</strong>
        </span>
        <span>
          Longest <strong>{rec.scoreBreakdown.maxIndividualMinutes} min</strong>
        </span>
        <span>
          Imbalance <strong>{rec.scoreBreakdown.timeImbalanceMinutes} min</strong>
        </span>
        <span>
          Est. <strong>₹{rec.scoreBreakdown.combinedCostInr}</strong>
        </span>
        {voteCount > 0 && (
          <span>
            Votes <strong>{voteCount}</strong>
          </span>
        )}
      </div>

      {rec.routes.map((r) => (
        <div
          key={r.displayName}
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <p>
            <strong>{r.displayName}</strong> — {formatMin(r.totalDurationSec)} min ·
            est. ₹{r.totalCostEstimateInr} · {r.summaryLabel}
          </p>
          {r.legs.map((leg, i) => (
            <div className="route-leg" key={i}>
              <span>{leg.mode}</span>
              <span>
                {leg.description} — {formatMin(leg.durationSec)} min
              </span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        {onVote && (
          <button type="button" className="btn btn-secondary" onClick={onVote}>
            Vote
          </button>
        )}
        {onLock && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onLock}
            disabled={locking}
          >
            {locking ? "Locking…" : "Lock this plan"}
          </button>
        )}
      </div>
    </article>
  );
}
