// Example use of <UnigoxWidget /> in a React page.
//
// Renders the widget in a centred 480-px column and logs the events to
// the console. Replace the handlers with your own analytics / redirect
// logic — but verify trade and sendout state via the Unigox API before
// crediting users; see "Callbacks" in client-integration.md.

import { useRef } from "react";
import { UnigoxWidget, UnigoxHandle } from "./UnigoxWidget";

export default function App() {
  // Hold the handle so we can call configure() / reset() / destroy() later.
  const widgetRef = useRef<UnigoxHandle | null>(null);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 20px" }}>
      <h1>Buy crypto on ExampleCo</h1>

      <UnigoxWidget
        type="buy-sell"
        crypto="USDT"
        fiat="USD"
        partner="examplecorp"
        onHandle={handle => {
          widgetRef.current = handle;
        }}
        onTradeCompleted={e => {
          console.log("[ExampleCo] trade completed", e.tradeId);
          // Verify via the Unigox API before releasing anything to the user.
        }}
        onSendoutCompleted={e => {
          console.log("[ExampleCo] sendout confirmed", e.txHash);
          // The txHash is the only independently verifiable signal — safe
          // to use as a delivery indicator after on-chain confirmation.
        }}
        onSendoutFailed={e => {
          console.warn("[ExampleCo] sendout failed", e.code, e.message);
        }}
      />

      {/* Example of runtime control via the handle. */}
      <button
        type="button"
        onClick={() => widgetRef.current?.configure({ crypto: "USDC" })}
      >
        Switch to USDC
      </button>
    </div>
  );
}
