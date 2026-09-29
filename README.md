🇺🇸 [한국어](./README.ko.md)

# EarlyRetireSim — FIRE Calculator for the 2030s

A mobile-first early retirement (FIRE) calculator for the Toss app. Enter your age, monthly income, expenses, and current net worth to instantly see when you can retire and compare savings rate scenarios.

Designed for the Toss mini-app platform (App-in-Toss) with native TDS components and optimized for users curious about financial independence. Calculates retirement age using the 4% rule, simulates monthly compound growth, and visualizes asset accumulation trajectories.

## Features

- 📊 **FIRE Input** — Age, monthly income, expenses, net worth, and expected return rate (4%, 6%, 8%)
- 🎯 **Retirement Age Calculation** — Monthly compound simulation up to 50 years; shows feasibility or barrier insights
- 📈 **Asset Growth Visualization** — Year-by-year asset curve with target line (in-app SVG, no charting library)
- 🔄 **Scenario Comparison** — Current vs. savings rate +10%p side-by-side; time saved breakdown
- 📋 **Result Sharing** — Copy summary text to clipboard or share via native Toss app
- 💾 **Persistent Input** — Auto-save last calculation to localStorage for quick re-runs
- 🎬 **Reward Ad Gating** — Results unlock after watching optional ad; fallback UI ensures non-blocking UX

## Tech Stack

- **Framework**: React 18 + Vite 6
- **Routing**: React Router 7
- **Design System**: Toss Design System (`@toss/tds-mobile`) + TDS Colors
- **Platform SDK**: App-in-Toss (`@apps-in-toss/web-framework`)
- **Styling**: Emotion (React CSS-in-JS)
- **Icons**: Lucide React
- **Language**: TypeScript 5
- **Testing**: Vitest (unit), Playwright (visual)
- **Build**: Vite (CSR/SSG, no SSR)

## Getting Started

### Install Dependencies
```bash
npm install
```

### Verify TypeScript
```bash
npx tsc --noEmit
```

### Run Tests
```bash
npx vitest run          # Unit tests
npm run test:visual     # Visual regression tests (Playwright)
```

### Production Build
```bash
npx vite build
```

Creates a static bundle in `dist/` ready for deployment to Toss CDN.

### Toss Deployment
```bash
npx ait build           # Bundle for Toss platform
npx ait deploy --api-key <YOUR_API_KEY>  # Deploy via Toss developer console
```

(Requires registration in [앱인토스 콘솔](https://console.tossmini.com) and valid API key.)

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_TOSS_AD_GROUP_ID` | Toss reward/banner ad group ID from 앱인토스 콘솔 | No* |

*If omitted, ads simply don't render; app functionality is unaffected.

## Project Structure

```
src/
├── pages/
│   ├── Home.tsx           # FIRE input form (age, income, expenses, net worth, rate chip)
│   └── Result.tsx         # Results: retirement age, asset chart, scenario comparison, sharing
├── components/
│   ├── ScreenScaffold.tsx # Page SafeArea + header/footer layout
│   ├── SummaryHero.tsx    # Hero card: headline number (retirement age)
│   ├── Card.tsx           # Generic card wrapper (results, charts)
│   ├── Amount.tsx         # Formatted currency display (nowrap, tabular)
│   ├── MiniBar.tsx        # Progress bar (0..1 ratio)
│   ├── AssetChart.tsx     # Inline SVG: asset growth curve + goal line
│   ├── ScenarioCompare.tsx # Side-by-side scenario cards + difference text
│   ├── RewardGate.tsx     # Ad gate: blocks results until ad watched/timeout
│   ├── BottomCTA.tsx      # Sticky footer buttons (SubmitFooter, ButtonStack)
│   ├── StateView.tsx      # Empty / Loading states
│   ├── FloatingTabBar.tsx # Bottom tab navigation
│   ├── AdSlot.tsx         # Banner ad wrapper
│   └── TossRewardAd.tsx   # Reward ad gate wrapper
├── lib/
│   ├── types.ts           # FireInput, ScenarioResult, RouteState, CompareMode
│   ├── fire.ts            # Core FIRE math: simulation, target asset, scenario
│   ├── validation.ts      # Input validation (range, format, business rules)
│   ├── analytics.ts       # Screen/click/impression logging (Toss SDK only)
│   ├── storage.ts         # localStorage helpers with error handling
│   ├── share.ts           # Share and clipboard APIs
│   ├── review.ts          # App Store/Play Store review prompt
│   ├── utils.ts           # formatCurrency, formatNumber
│   └── contract.ts        # Data validation contracts
├── __tests__/
│   ├── __helpers__/       # Shared test mocks and utilities
│   └── packet-*.test.ts   # Component/function tests
├── App.tsx                # React Router setup (routes: /, /result)
└── main.tsx               # React 18 root (TDSMobileAITProvider, BrowserRouter)
```

## Deployment

### Prerequisites
- Registered in [앱인토스 콘솔](https://console.tossmini.com) with matching app ID
- Valid developer API key
- `apps-in-toss.config.ts` configured with correct `appName` (case-sensitive; deploy fails if mismatch)

### Workflow
1. **Local build**: `npm run build` → creates `dist/`
2. **Toss bundle**: `npx ait build` → prepares for platform
3. **Deploy**: `npx ait deploy --api-key <KEY>` → uploads to Toss CDN
4. **Review**: Toss review team checks for compliance (19+, zero console errors, zero CORS errors, no outlinks, TDS components only)
5. **Release**: Appears in Toss app after approval

### Build Output Constraints
- Static CSR only (no SSR, no dynamic routes)
- Android 7+, iOS 16+ compatible Web APIs
- Bundle must be under 100MB
- No external fonts (Toss Products Sans auto-applied by platform)
- No hardcoded HEX colors (use `var(--tds-color-*)` CSS variables for dark mode support)

## License

MIT

---

**Built with [Claude Code](https://claude.com/claude-code)** · Mini-app for the [Toss platform](https://tossmini.com)
