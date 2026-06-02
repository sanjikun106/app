# MeetRoute

Smart urban rendezvous planner for Bengaluru — find the best place to meet with multimodal routes, fairness scoring, and group collaboration.

**Live demo:** [https://sanjikun106.github.io/app/](https://sanjikun106.github.io/app/)

## Stack

- **Frontend:** Next.js 15 (static export) → GitHub Pages
- **Backend:** [Convex](https://convex.dev) (real-time plans, recommendations, votes)

## Local development

```bash
npm install
npx convex dev   # creates deployment & writes NEXT_PUBLIC_CONVEX_URL to .env.local
npm run dev      # Next.js + Convex in parallel
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub Pages + Convex

1. Run `npx convex dev` locally and create a Convex project.
2. Generate a deploy key: Convex Dashboard → Settings → Deploy Key.
3. Add GitHub repository secrets:
   - `CONVEX_DEPLOY_KEY` — deploy backend on each push
   - `NEXT_PUBLIC_CONVEX_URL` — your production Convex URL (e.g. `https://happy-animal-123.convex.cloud`)
4. Push to `main` — Actions builds and deploys to Pages.

Enable **GitHub Pages** source: **GitHub Actions** (done automatically by workflow).

## Features (Phase 1)

- Create plans: movie, dine, meet, shared destination
- Invite link + guest join (no account required)
- Bengaluru location presets
- Recommendation engine with balanced / fastest / fairest presets
- Per-participant multimodal route cards (Rapido → Metro → walk estimates)
- Vote and lock plan
- Shareable final plan with Google Maps deep link

## Project structure

```
convex/           Convex backend (schema, domain, orchestration)
src/app/          Next.js pages (static export)
.github/          GitHub Actions deploy workflow
```

## License

MIT
