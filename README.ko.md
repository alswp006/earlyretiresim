🇰🇷 [English](./README.md)

# 조기은퇴 계산기 — 2030년대 FIRE 계산기

토스 앱을 위한 모바일 우선 조기은퇴(FIRE) 계산기입니다. 나이, 월소득, 지출, 현재 순자산을 입력하면 언제 은퇴할 수 있을지 즉시 확인하고 저축률 시나리오를 비교할 수 있습니다.

토스 미니앱 플랫폼(App-in-Toss)용으로 설계되었으며 TDS 네이티브 컴포넌트를 사용하고 재정독립에 관심 있는 사용자를 위해 최적화했습니다. 4% 규칙으로 은퇴 나이를 계산하고, 월 복리 성장을 시뮬레이션하며, 자산 축적 궤적을 시각화합니다.

## 기능

- 📊 **FIRE 입력** — 나이, 월소득, 지출, 순자산, 기대 수익률(4%, 6%, 8%)
- 🎯 **은퇴 나이 계산** — 최대 50년까지 월 복리 시뮬레이션; 가능성 또는 장애 요인 표시
- 📈 **자산 성장 시각화** — 연도별 자산 곡선과 목표선(인앱 SVG, 차트 라이브러리 미사용)
- 🔄 **시나리오 비교** — 현재 대 저축률 +10%p 나란히; 절감 시간 분석
- 📋 **결과 공유** — 요약 텍스트를 클립보드에 복사하거나 토스 네이티브 앱을 통해 공유
- 💾 **지속적 입력** — 마지막 계산을 localStorage에 자동 저장해 빠른 재계산
- 🎬 **리워드 광고 게이팅** — 선택적 광고 시청 후 결과 잠금 해제; 폴백 UI는 차단 없는 UX 보장

## 기술 스택

- **프레임워크**: React 18 + Vite 6
- **라우팅**: React Router 7
- **디자인 시스템**: Toss Design System (`@toss/tds-mobile`) + TDS Colors
- **플랫폼 SDK**: App-in-Toss (`@apps-in-toss/web-framework`)
- **스타일링**: Emotion (React CSS-in-JS)
- **아이콘**: Lucide React
- **언어**: TypeScript 5
- **테스트**: Vitest (단위 테스트), Playwright (시각 테스트)
- **빌드**: Vite (CSR/SSG, SSR 미사용)

## 시작하기

### 의존성 설치
```bash
npm install
```

### TypeScript 검증
```bash
npx tsc --noEmit
```

### 테스트 실행
```bash
npx vitest run          # 단위 테스트
npm run test:visual     # 시각 회귀 테스트 (Playwright)
```

### 프로덕션 빌드
```bash
npx vite build
```

`dist/` 디렉토리에 토스 CDN 배포 준비가 완료된 정적 번들을 생성합니다.

### 토스 배포
```bash
npx ait build           # 토스 플랫폼용 번들
npx ait deploy --api-key <YOUR_API_KEY>  # 토스 개발자 콘솔을 통해 배포
```

([앱인토스 콘솔](https://console.tossmini.com)에 등록 및 유효한 API 키 필요)

## 환경 변수

| 변수 | 설명 | 필수 |
|---|---|---|
| `VITE_TOSS_AD_GROUP_ID` | 앱인토스 콘솔의 토스 리워드/배너 광고 그룹 ID | 아니오* |

*생략 시 광고가 단순히 렌더링되지 않음; 앱 기능은 영향 없음

## 프로젝트 구조

```
src/
├── pages/
│   ├── Home.tsx           # FIRE 입력 폼(나이, 소득, 지출, 순자산, 수익률 칩)
│   └── Result.tsx         # 결과: 은퇴 나이, 자산 차트, 시나리오 비교, 공유
├── components/
│   ├── ScreenScaffold.tsx # 페이지 SafeArea + 헤더/푸터 레이아웃
│   ├── SummaryHero.tsx    # 히어로 카드: 주요 숫자(은퇴 나이)
│   ├── Card.tsx           # 일반 카드 래퍼(결과, 차트)
│   ├── Amount.tsx         # 형식화된 통화 표시(줄바꿈 없음, 단위폭)
│   ├── MiniBar.tsx        # 진행률 바(0..1 비율)
│   ├── AssetChart.tsx     # 인라인 SVG: 자산 성장 곡선 + 목표선
│   ├── ScenarioCompare.tsx # 나란한 시나리오 카드 + 차이 텍스트
│   ├── RewardGate.tsx     # 광고 게이트: 광고 시청/타임아웃까지 결과 차단
│   ├── BottomCTA.tsx      # 고정 푸터 버튼(SubmitFooter, ButtonStack)
│   ├── StateView.tsx      # 빈 상태 / 로딩 상태
│   ├── FloatingTabBar.tsx # 하단 탭 네비게이션
│   ├── AdSlot.tsx         # 배너 광고 래퍼
│   └── TossRewardAd.tsx   # 리워드 광고 게이트 래퍼
├── lib/
│   ├── types.ts           # FireInput, ScenarioResult, RouteState, CompareMode
│   ├── fire.ts            # 핵심 FIRE 수학: 시뮬레이션, 목표 자산, 시나리오
│   ├── validation.ts      # 입력 검증(범위, 형식, 비즈니스 규칙)
│   ├── analytics.ts       # 화면/클릭/노출 로깅(토스 SDK만)
│   ├── storage.ts         # localStorage 헬퍼(에러 처리 포함)
│   ├── share.ts           # 공유 및 클립보드 API
│   ├── review.ts          # 앱 스토어/플레이 스토어 리뷰 프롬프트
│   ├── utils.ts           # formatCurrency, formatNumber
│   └── contract.ts        # 데이터 검증 계약
├── __tests__/
│   ├── __helpers__/       # 공유 테스트 목 및 유틸리티
│   └── packet-*.test.ts   # 컴포넌트/함수 테스트
├── App.tsx                # React Router 설정(라우트: /, /result)
└── main.tsx               # React 18 루트(TDSMobileAITProvider, BrowserRouter)
```

## 배포

### 선행 요구사항
- [앱인토스 콘솔](https://console.tossmini.com)에 일치하는 앱 ID로 등록됨
- 유효한 개발자 API 키
- `apps-in-toss.config.ts`가 올바른 `appName`으로 설정됨(대소문자 민감; 불일치 시 배포 실패)

### 워크플로
1. **로컬 빌드**: `npm run build` → `dist/` 생성
2. **토스 번들**: `npx ait build` → 플랫폼 준비
3. **배포**: `npx ait deploy --api-key <KEY>` → 토스 CDN에 업로드
4. **검수**: 토스 검수팀이 준수 사항 확인(19세 이상, 콘솔 에러 0개, CORS 에러 0개, 외부 링크 없음, TDS 컴포넌트만)
5. **출시**: 승인 후 토스 앱에 표시됨

### 빌드 출력 제약사항
- 정적 CSR만(SSR 없음, 동적 라우트 없음)
- Android 7+, iOS 16+ 호환 웹 API
- 번들은 100MB 미만이어야 함
- 외부 폰트 없음(토스 Products Sans는 플랫폼에서 자동 적용)
- 하드코딩된 HEX 색상 없음(`var(--tds-color-*)` CSS 변수로 다크 모드 지원)

## 라이선스

MIT

---

**[Claude Code](https://claude.com/claude-code)로 빌드됨** · [토스 플랫폼](https://tossmini.com)용 미니앱
