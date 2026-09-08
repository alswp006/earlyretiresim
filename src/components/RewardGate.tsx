import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Loader, Paragraph, Spacing } from "@toss/tds-mobile";
import {
  generateHapticFeedback,
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { TossRewardAd } from "@/components/TossRewardAd";
import { REWARD_AD_TIMEOUT_MS, REWARD_AD_MAX_RETRY, type RewardGateState } from "@/lib/types";

/** RewardGate가 화면에 노출하지 않고 SDK에 넘기는 기본 광고 슬롯 ID */
const DEFAULT_REWARD_SLOT_ID = "result-unlock";

function fireHaptic(type: "success" | "tickWeak") {
  try {
    Promise.resolve(generateHapticFeedback({ type })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시 */
  }
}

interface RewardGateProps {
  /** 광고 슬롯 ID (TossRewardAd에 전달) */
  slotId: string;
  /** 시청 완료(revealed) 후 노출할 콘텐츠 */
  children?: ReactNode;
}

/**
 * 리워드 광고 상태 머신. TossRewardAd의 시청 완료 신호(onRewarded)를 받되,
 * adLoading -> adFailed 타임아웃 전이는 자체 5초 타이머로 소유한다.
 * TossRewardAd 자체는 화면에 노출하지 않고(SDK 로드/재생 트리거용으로만 마운트),
 * 로딩·실패 UI는 이 컴포넌트가 그린다.
 */
export function RewardGate({ slotId, children }: RewardGateProps) {
  const [state, setState] = useState<RewardGateState>("adLoading");
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state !== "adLoading") return;

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setState("adFailed");
    }, REWARD_AD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [state]);

  const handleRewarded = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    fireHaptic("success");
    setState("revealed");
  }, []);

  const handleRetry = () => {
    if (retryCount >= REWARD_AD_MAX_RETRY) return;
    fireHaptic("tickWeak");
    setRetryCount((count) => count + 1);
    setState("adLoading");
  };

  const handleSkip = () => {
    fireHaptic("tickWeak");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState("revealed");
  };

  if (state === "revealed") {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px",
      }}
    >
      {/*
        SDK 로드/재생 트리거 — 화면에는 이 컴포넌트의 자체 로딩/실패 UI만 노출.
        타임아웃으로 adFailed에 진입해도 언마운트하지 않고 retryCount로만 리마운트한다:
        실제 광고 SDK의 onRewarded가 5초 타임아웃 직후 지연 도착해도 보상을 놓치지 않기 위함.
      */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        <TossRewardAd key={retryCount} slotId={slotId} onRewarded={handleRewarded}>
          {null}
        </TossRewardAd>
      </div>

      {state === "adLoading" && (
        <>
          <Loader />
          <Spacing size={12} />
          <Paragraph.Text typography="st12">계산 중이에요</Paragraph.Text>
        </>
      )}

      {state === "adFailed" && (
        <>
          <Paragraph.Text typography="st12">
            광고를 불러올 수 없어요. 인터넷 연결을 확인해주세요
          </Paragraph.Text>
          <Spacing size={20} />
          <Button
            variant="fill"
            display="block"
            onClick={handleRetry}
            disabled={retryCount >= REWARD_AD_MAX_RETRY}
            aria-label="다시 시도"
          >
            다시 시도
          </Button>
          <Spacing size={8} />
          <Button variant="weak" display="block" onClick={handleSkip} aria-label="결과 보기">
            결과 보기
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * RewardGate 컴포넌트를 쓸 수 없는 곳(버튼 onClick 등 명령형 흐름)에서 같은
 * "시청해야 진행" 게이트를 훅으로 노출한다. load -> show 순으로 SDK를 호출하고,
 * WebView 밖(로컬 브라우저·검수자 PC)에서의 throw는 실패로 처리해 항상 resolve한다.
 */
export function useRewardGate(): {
  isWatched: boolean;
  isLoading: boolean;
  watchAd: () => Promise<boolean>;
} {
  const [isWatched, setIsWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const watchAd = useCallback((): Promise<boolean> => {
    if (isWatched) return Promise.resolve(true);
    setIsLoading(true);

    return new Promise<boolean>((resolve) => {
      const finish = (watched: boolean) => {
        setIsLoading(false);
        if (watched) setIsWatched(true);
        resolve(watched);
      };

      try {
        loadFullScreenAd({
          slotId: DEFAULT_REWARD_SLOT_ID,
          onEvent: () => {
            try {
              showFullScreenAd({
                slotId: DEFAULT_REWARD_SLOT_ID,
                onEvent: (event: { type?: string }) => {
                  finish(event?.type !== "dismissed");
                },
                onError: () => finish(false),
              } as Parameters<typeof showFullScreenAd>[0]);
            } catch {
              finish(false);
            }
          },
          onError: () => finish(false),
        } as Parameters<typeof loadFullScreenAd>[0]);
      } catch {
        finish(false);
      }
    });
  }, [isWatched]);

  return { isWatched, isLoading, watchAd };
}
