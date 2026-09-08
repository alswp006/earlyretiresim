🇺🇸 [한국어](./README.ko.md)

# EarlyRetireSim — FIRE Retirement Age Calculator

A mobile-first FIRE (Financial Independence, Retire Early) simulator that calculates your retirement age based on the 4% rule. Input your monthly income, expenses, and current assets to discover when early retirement becomes possible, and compare savings scenarios at a glance.

Designed for 2030+ professionals curious about FIRE trends. Results are displayed within seconds, with optional scenario comparison showing how a 10% savings rate increase accelerates retirement.

## Features

- 📊 **Retirement age calculator** — Uses 4% rule (annual withdrawal = 25× annual expenses) with monthly compound interest simulation
- 📈 **Interactive asset growth graph** — SVG-based visualization of wealth accumulation over time, responsive to mobile screens
- 💡 **Real-time savings rate display** — Instant feedback as you adjust income and expenses
- 🎯 **Scenario comparison** — Side-by-side comparison of current vs. +10% savings rate with time savings
- 📋 **Results sharing** — Copy formatted summary to clipboard for quick sharing
- 💰 **Expected return rate selection** — Choose from 4%, 6%, 8% annual returns
- 🎬 **Reward ad gating** — Results unlocked after optional ad viewing (or skip after 5s timeout)
- 📱 **Mobile-native UX** — Dark mode support, touch-optimized inputs, keyboard handling, safe area insets
- 📦 **Offline-first** — All calculations run locally; persists last input to localStorage
- ⚠️ **Resilient fallbacks** — Handles ad failures, offline network, quota exceeded errors gracefully without crashes

## Tech Stack

- **Framework**: React 18 + Vite
- **UI**: TDS (Toss Design System) components + Emotion CSS-in-JS
- **Routing**: React Router DOM v7
- **Language**: TypeScript 5
- **Testing**: Vitest + @testing-library/react + Playwright (visual)
- **Icons**: lucide-react
- **State**: React hooks + localStorage
- **Deployment**: Toss CDN (App-in-Toss platform)

## Getting Started

### Prerequisites

- Node.js 18+
- npm (bundled with Node.js)

### Installation & Setup

```bash
npm install
npm run typecheck  # Verify TypeScript
npm run test       # Run unit tests
npm run test:visual  # Run visual/e2e tests (requires chromium)
npx tsc --noEmit   # Final type check before submission
```

### Development

The project uses Vite. Note: dev server cannot be verified in this environment, so rely on:

```bash
npm run build       # Production build
npm run test:visual # Playwright visual tests (includes local server)
npx vitest run      # Unit tests
```

### Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (for local development) |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run vitest (unit tests) |
| `npm run test:watch` | Run vitest in watch mode |
| `npm run test:visual` | Run Playwright visual tests + capture screenshots |
| `npm run test:visual:update` | Update visual test snapshots |
| `npm run gate` | Pre-submission quality gate (types + tests + visual + no console errors) |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TOSS_AD_SLOT_ID` | Toss Reward Ad slot ID (from console) | No (fallback provided) |

All configuration is set in `apps-in-toss.config.ts`. The app name (`earlyretiresim`) must match the Toss console registration exactly.

## Project Structure

```
src/
├── pages/              # Screen components
│   ├── Home.tsx        # Input screen (4 fields + return rate Chip + ad banner)
│   ├── Result.tsx      # Results screen (retirement age + graph + comparison)
│   └── __TdsGallery.tsx  # Dev-only TDS component gallery
├── components/         # Reusable UI components & SDK wrappers
│   ├── ScreenScaffold.tsx      # Page layout container (top header + content + bottom CTA)
│   ├── PageShell.tsx           # SafeArea wrapper
│   ├── SummaryHero.tsx         # Large hero number display (retirement age)
│   ├── AssetChart.tsx          # SVG asset growth graph
│   ├── ScenarioCompare.tsx     # Comparison card layout
│   ├── RewardGate.tsx          # Ad reward gate + fallback UI
│   ├── TossRewardAd.tsx        # Reward ad wrapper (SDK guard + cleanup)
│   ├── AdSlot.tsx              # Banner ad wrapper
│   ├── CountUp.tsx             # Animated number counter
│   ├── StateView.tsx           # Empty/Loading state components
│   └── ...                     # TDS helpers: Card, Amount, BottomCTA, etc.
├── lib/                # Utilities & business logic
│   ├── fire.ts         # FIRE calculation engine (retirement age, asset growth)
│   ├── validation.ts   # Input field validation & error messages
│   ├── types.ts        # Shared TypeScript types & RouteState
│   ├── storage.ts      # localStorage helpers (getItem/setItem)
│   ├── share.ts        # Clipboard API wrapper
│   ├── utils.ts        # Formatters (currency, number, months-to-years)
│   └── contract.ts     # App state type contracts
├── __tests__/          # Unit & integration tests
└── main.tsx            # App entry point (TDSMobileAITProvider preset)
```

## Key Implementation Details

### FIRE Calculation Engine (`src/lib/fire.ts`)

- Simulates monthly compound interest: `monthly_rate = (1 + annual_rate)^(1/12) - 1`
- Target asset: `monthly_expense × 12 × 25` (4% rule)
- Iterates up to 600 months (50 years)
- Returns retirement age + full year-by-year assets for graphing
- Handles edge cases: negative savings, unreachable targets (fallback UI shown)

### Input Validation & Persistence (`src/lib/validation.ts` + `src/lib/storage.ts`)

- All fields validated before calculation: age 19–70, income/expense 0–100M, assets 0–10B
- Invalid input prevents calculation button enable
- Last input saved to `localStorage:ers:lastInput` (survives page reload)
- Storage failures gracefully handled: calculation proceeds via route state, Toast shown once

### Reward Ad Gate (`src/components/RewardGate.tsx`)

- Results hidden until reward ad loads & completes **OR** 5-second timeout expires
- Timeout triggers fallback UI (retry button + "skip ad" button)
- Max 2 retry attempts; third failure disables retry button
- "Skip ad" button always available — ensures results never permanently locked

### Responsive Graph (`src/components/AssetChart.tsx`)

- Pure SVG (no charting library) — inlining reduces bundle
- `viewBox` scaling for mobile responsiveness
- Uses CSS variables for theme colors (dark mode auto-applied)
- Shows wealth curve + goal line + progress bar

## Testing Strategy

- **Unit tests** in `src/__tests__/` — business logic (FIRE calc, validation, storage)
- **Component tests** — integration with React Router, localStorage, TDS mocks
- **Visual tests** in `e2e/visual-smoke.spec.ts` — Playwright captures mobile screenshots
- **Pre-submission gate** — `npm run gate` runs types → tests → visual → console check

### Running Tests

```bash
npx vitest run              # Single run (exit after complete)
npx vitest                  # Watch mode (re-run on file changes)
npm run test:visual         # Playwright full suite + screenshot capture
npm run test:visual:update  # Re-baseline visual screenshots
```

## Deployment

The app is deployed to **Toss CDN** (not Vercel or external cloud) via the `ait` CLI in the build pipeline.

- **App name**: `earlyretiresim` (registered in Toss console; 4031 error if mismatched)
- **Runtime**: CSR only (static Vite build → browser rendering)
- **Build output**: `dist/` directory (uploaded to Toss CDN by pipeline)

### Pre-Deployment Checklist

1. ✅ Run `npx tsc --noEmit` — fix all TypeScript errors
2. ✅ Run `npx vitest run` — all tests passing
3. ✅ Run `npm run test:visual` — review `e2e/__shots__/*.png` screenshots
4. ✅ Run `npm run gate` — final quality gate (types + tests + visual + no console errors)
5. ✅ Verify imports resolve, no placeholder markers (`@ai-factory:placeholder`) remain
6. ✅ Routes in App.tsx match all navigation targets
7. ✅ Zero `console.error` in normal flow

## License

MIT
