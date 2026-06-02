import Link from "next/link";
import { appPath } from "@/lib/paths";

export default function HomePage() {
  return (
    <main className="container">
      <header className="hero">
        <p className="chip" style={{ marginBottom: "0.75rem" }}>
          Bengaluru · Beta
        </p>
        <h1>Find the best place to meet — not the middle of the map.</h1>
        <p>
          MeetRoute compares real travel time, cost, metro routes, and venue
          quality so your group can lock one fair, actionable plan.
        </p>
      </header>

      <section className="grid-modes">
        <Link className="mode-card" href={appPath("/create/?mode=movie")}>
          <h3>Watch a movie</h3>
          <p className="muted">Theatres, showtimes, Rapido → Metro → walk</p>
        </Link>
        <Link className="mode-card" href={appPath("/create/?mode=dine")}>
          <h3>Eat or hang out</h3>
          <p className="muted">Cafés & restaurants ranked for the group</p>
        </Link>
        <Link className="mode-card" href={appPath("/create/?mode=meet")}>
          <h3>Meet somewhere</h3>
          <p className="muted">General meetup with fairness presets</p>
        </Link>
        <Link className="mode-card" href={appPath("/create/?mode=shared_dest")}>
          <h3>Travel together</h3>
          <p className="muted">En-route rendezvous to a shared destination</p>
        </Link>
      </section>

      <footer className="muted" style={{ marginTop: "2rem" }}>
        MeetRoute · Smart Rendezvous Planner ·{" "}
        <a
          href="https://github.com/sanjikun106/app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
        </a>
      </footer>
    </main>
  );
}
