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
  onSendoutFailed?: (e: {
    tradeId: number;
    code: "SENDOUT_NOT_SUPPORTED" | "SENDOUT_QUOTE_FAILED" | "SENDOUT_BRIDGE_FAILED" | "SENDOUT_UNKNOWN";
    message: string;
  }) => void;
  onWidgetError?: (e: {
    code: "WIDGET_MISSING_SENDOUT_ADDRESS" | "WIDGET_MISSING_SENDOUT_NETWORK" | "WIDGET_INVALID_SENDOUT_ADDRESS";
    message: string;
  }) => void;
}

export interface UnigoxConfigureParams {
  type?: "buy" | "sell";
  crypto?: string;
  fiat?: string;
  amount?: number | string;
  vendor?: string;
}

export interface UnigoxHandle {
  configure(params: UnigoxConfigureParams): void;
  reset(): void;
  destroy(): void;
}

const LOADER_SRC = "https://unigox.com/widget.js";

// Module-level promise so that mounting multiple <UnigoxWidget /> instances on
// the same page resolves to a single in-flight loader request — without it,
// two components racing in the same tick both miss the DOM check and inject
// duplicate <script> tags.
let loaderPromise: Promise<void> | null = null;

function ensureLoader(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.UnigoxWidget) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  // On failure (CSP block, network error) we null the cached promise so the
  // next mount can retry — otherwise every subsequent <UnigoxWidget /> on
  // the page would re-throw the same rejection forever.
  const reset = () => {
    loaderPromise = null;
  };

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${LOADER_SRC}"]`);
  if (existing) {
    loaderPromise = new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("widget.js failed to load")),
        { once: true },
      );
    });
    loaderPromise.catch(reset);
    return loaderPromise;
  }

  loaderPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LOADER_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("widget.js failed to load"));
    document.head.appendChild(script);
  });
  loaderPromise.catch(reset);
  return loaderPromise;
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
