# Delta Command

A polished engineering operations dashboard for delta engineering teams. Track the opportunity pipeline, team utilization, and active project delivery — built for both engineers and leadership.

## Features

### Executive Dashboard
- Weighted pipeline value and key metrics at a glance
- Pipeline funnel chart and team utilization visualization
- At-risk project alerts and upcoming opportunity closes
- Designed for leadership weekly syncs and status reviews

### Opportunity Pipeline
- Kanban board view organized by sales stage
- List view with full opportunity details
- Probability-weighted value tracking
- Stage updates to move opportunities through the funnel

### Team Utilization
- Per-engineer capacity and allocation bars
- Overallocation warnings and available capacity indicators
- Skills inventory and current project assignments
- Capacity heatmap for resource planning

### Project Execution
- Progress, budget, and milestone tracking
- At-risk project flagging
- Team assignment visibility
- Timeline and delivery status

## Quick Start

```bash
cd apps/delta-command
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 15** — App Router with server and client components
- **TypeScript** — Full type safety
- **Tailwind CSS** — Professional, responsive design system
- **Recharts** — Pipeline and utilization charts
- **File-based persistence** — JSON store with seed data (easily swappable for a database)

## Project Structure

```
apps/delta-command/
├── src/
│   ├── app/                  # Pages and API routes
│   │   ├── dashboard/        # Executive overview
│   │   ├── opportunities/  # Pipeline management
│   │   ├── team/             # Utilization tracking
│   │   ├── projects/         # Delivery monitoring
│   │   └── api/              # REST endpoints
│   ├── components/           # UI components
│   └── core/                  # Types, data store, utilities
└── data/                     # Runtime JSON database
```

## Customization

Seed data lives in `src/core/seed-data.ts`. Edit engineers, opportunities, and projects there, then reset via `POST /api/reset` or delete `data/db.json` to reload defaults.

## Production

```bash
npm run build
npm start
```

For production deployment, replace the file-based store in `src/core/store.ts` with PostgreSQL, SQLite, or your preferred database.
