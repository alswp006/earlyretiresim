# EarlyRetireSim

기존 내용을 그대로 유지하고, 두 시뮬레이션에서 발견된 누락 AC 7개(⭐ 표시)를 추가한 보완본입니다. --- - **한줄 요약**: 월 소득·지출·현재 자산을 입력하면 4% 룰 기반으로 몇 살에 조기은퇴(FIRE)가 가능한지 계산하고, 저축률 +10%p 시나리오와 비교해주는 시뮬레이터.

## Tech Stack

- React 18.0.0
- TypeScript
- Vitest

## Routes

| Path | Description |
|------|-------------|
| `/Home` | Home |
| `/Result` | Result |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Development

```bash
pnpm typecheck    # Type checking
pnpm test         # Run tests
pnpm build        # Production build
```

## Design Documents

See `.ai-factory/` directory for full design artifacts:
- `prd.md` — Product Requirements Document
- `spec.md` — Technical Specification
- `task.md` — Epic/Task Breakdown

---
Built with [AI Factory](https://github.com/alswp006/ai-factory) · Last synced: 2026-09-08
