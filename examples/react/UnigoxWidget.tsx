// Minimal React wrapper around the Unigox embed loader.
//
// Loads `https://unigox.com/widget.js` once per page, initialises the
// widget against a managed container ref, and tears it down on unmount.
// Drop this file into any React project and use it as <UnigoxWidget … />.
//
// Live config updates: this wrapper mounts once and does not auto-react
// to prop changes (re-mounting via React's lifecycle would re-create the
// iframe and lose user state). For runtime config use the returned
// handle — see the `onHandle` prop below.

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    UnigoxWidget?: { init(options: UnigoxOptions): UnigoxHandle };
  }
}

export interface UnigoxOptions {
  container: string | HTMLElement;
  type?: "buy" | "sell" | "buy-sell" | "buy-with-sendout";
  crypto?: string;
  fiat?: string;
  amount?: number | string;
  partner?: string;
  ref?: string;
  email?: string;
  theme?: "light" | "dark";
  language?: "en" | "es";
  loginMethods?: string;
  requireLogin?: boolean;
  applyAttribution?: boolean;
  sendoutAddress?: string;
  sendoutNetwork?: string;
  width?: string;
  height?: string;
  onReady?: () => void;
  onAuthChange?: (e: { isAuthenticated: boolean }) => void;
  onTradeStarted?: (e: { tradeId: number; tradeType: "BUY" | "SELL" }) => void;
  onTradeCompleted?: (e: { tradeId: number }) => void;
  onSendoutStarted?: (e: { tradeId: number; address: string; chainId: number }) => void;
  onSendoutCompleted?: (e: { tradeId: number; address: string; chainId: number; txHash?: string }) => void;
  onSendoutFailed?: (e: { tradeId: number; code: string; message: string }) => void;
  onWidgetError?: (e: { code: string; message: string }) => void;
}

export interface UnigoxHandle {
  configure(params: Record<string, unknown>): void;
  reset(): void;
  destroy(): void;
}

const LOADER_SRC = "https://unigox.com/widget.js";

function ensureLoader(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.UnigoxWidget) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${LOADER_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("widget.js failed to load")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LOADER_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("widget.js failed to load"));
    document.head.appendChild(script);
  });
}

type Props = Omit<UnigoxOptions, "container"> & {
  /** Receives the handle once the widget has mounted, so the parent can call `configure()` / `reset()`. */
  onHandle?: (handle: UnigoxHandle) => void;
};

export function UnigoxWidget(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<UnigoxHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureLoader()
      .then(() => {
        if (cancelled || !containerRef.current || !window.UnigoxWidget) return;
        const { onHandle, ...options } = props;
        handleRef.current = window.UnigoxWidget.init({
          container: containerRef.current,
          ...options,
        });
        onHandle?.(handleRef.current);
      })
      .catch(err => {
        // Network failure / blocked by CSP. Surface in console; partner UX
        // can render its own fallback if `onHandle` never fires.
        console.error("[UnigoxWidget]", err);
      });
    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // Mount-once on purpose — see the file header.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} />;
}
