# Embed widget

Embeds the full Unigox buy/sell flow inside a third-party site via an `<iframe>`
loaded from `https://unigox.com/embed`. Handles KYC, payments, wallet setup and
session reuse inside the same iframe — the host page only needs to drop in a
container and a loader script.

One of several widgets in this repo. See also the playground route
[`/widgets/embed`](../src/app/widgets/embed) for a live sandbox to exercise the
configuration. Deployed playground: `<PLAYGROUND_URL>`.

> This doc is the **developer reference** for maintainers of the embed widget.
> For the partner-facing quickstart with a full options table, see
> [`client-integration.md`](./client-integration.md).

## Quick start

```html
<div id="unigox-widget"></div>
<script src="https://unigox.com/widget.js"></script>
<script>
  const widget = UnigoxWidget.init({
    container: "#unigox-widget",
    partner: "your-partner-id",
    crypto: "ETH",
    fiat: "USD",
    onTradeCompleted: (e) => console.log("trade", e.tradeId),
  });
</script>
```

The loader injects an `<iframe src="https://unigox.com/embed?…">` with the
correct `sandbox` and `allow` attributes. Host pages do not need to construct
the iframe manually.

## Init options

Passed to `UnigoxWidget.init(options)`.

| Option             | Type                                         | Required | Description                                                                                                                                                                                    |
| ------------------ | -------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `container`        | `string \| HTMLElement`                      | yes      | CSS selector or element the iframe is appended to.                                                                                                                                             |
| `partner`          | `string`                                     | no       | Partner identifier for attribution.                                                                                                                                                            |
| `type`             | `"buy" \| "sell" \| "both" \| "buy-with-sendout"` | no  | Which mode the widget opens in. Default `"both"`. `"buy-with-sendout"` adds an auto sendout step — see below.                                                                                  |
| `sendoutAddress`   | `string`                                     | conditional | Destination address for the post-trade bridge. Required when `type=buy-with-sendout`.                                                                                                    |
| `sendoutNetwork`   | `number`                                     | conditional | Destination chain id for the post-trade bridge. Required when `type=buy-with-sendout`.                                                                                                   |
| `crypto`           | `string`                                     | no       | Pre-selected crypto (e.g. `"ETH"`, `"BTC"`, `"USDT"`).                                                                                                                                         |
| `fiat`             | `string`                                     | no       | Pre-selected fiat (e.g. `"USD"`, `"EUR"`).                                                                                                                                                     |
| `amount`           | `number`                                     | no       | Pre-filled amount. For `type=buy` it is the fiat side; for `type=sell` it is the crypto side.                                                                                                  |
| `email`            | `string`                                     | no       | Prefill for auto-login.                                                                                                                                                                        |
| `theme`            | `"light" \| "dark"`                          | no       | Visual theme. Defaults to `"light"`.                                                                                                                                                           |
| `language`         | `string`                                     | no       | Language code. Default `"en"`.                                                                                                                                                                 |
| `loginMethods`     | `"email" \| "web3" \| "ton" \| "all"` or CSV | no       | Which login methods to expose. CSV combos are allowed (`"email,web3"`). Default `"email"`.                                                                                                     |
| `requireLogin`     | `boolean`                                    | no       | If `true`, force the login screen before the widget opens, even for anonymous flows. Default `false`.                                                                                          |
| `applyAttribution` | `boolean`                                    | no       | Toggles the "Powered by Unigox" footer inside the widget. Default `true`.                                                                                                                      |
| `width`            | `string`                                     | no       | Iframe width (CSS value). Default `"100%"`.                                                                                                                                                    |
| `height`           | `string`                                     | no       | Iframe height (CSS value). Default `"700px"`. When set, `UNIGOX_RESIZE` auto-resize is disabled.                                                                                               |

### Callbacks

| Callback             | Payload                                    | Fired when                                                                         |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `onReady`            | —                                          | Widget finished its initial render.                                                |
| `onAuthChange`       | `{ isAuthenticated }`                      | User signs in or signs out.                                                        |
| `onTradeStarted`     | `{ tradeId }`                              | User confirmed a trade.                                                            |
| `onTradeCompleted`   | `{ tradeId }`                              | Trade reached a terminal success state.                                            |
| `onSendoutStarted`   | `{ tradeId, address, chainId }`            | *(buy-with-sendout)* Bridge submitted.                                             |
| `onSendoutCompleted` | `{ tradeId, address, chainId, txHash? }`   | *(buy-with-sendout)* Bridge confirmed on destination chain.                        |
| `onSendoutFailed`    | `{ tradeId, reason }`                      | *(buy-with-sendout)* Bridge errored; user can retry inside the widget.             |

### Handle methods

```js
widget.configure({ crypto: "BTC", type: "sell" }); // live reconfigure
widget.reset();                                    // return to the start view
widget.destroy();                                  // remove the iframe + listeners
```

## Direct URL (without `widget.js`)

For iframe-only integrations (e.g. CMS blocks that cannot run arbitrary scripts)
use the `/embed` route directly:

```
https://unigox.com/embed?partner=acme&type=buy&crypto=USDT&fiat=USD&amount=100&theme=light&email=user@example.com&loginMethods=email,web3
```

The supported query params mirror the init options above. Without `widget.js`
the host page is responsible for creating the iframe with the required
`sandbox` and `allow` attributes — see the next section.

## Iframe attributes

`widget.js` sets these automatically. Reproduce them verbatim if you build the
iframe yourself:

```html
<iframe
  src="https://unigox.com/embed?…"
  sandbox="allow-scripts allow-same-origin allow-forms
           allow-popups allow-popups-to-escape-sandbox
           allow-storage-access-by-user-activation allow-modals"
  allow="storage-access;
         publickey-credentials-get *;
         publickey-credentials-create *;
         clipboard-read; clipboard-write; payment"
  style="border:none;width:100%;height:700px;display:block;"
  scrolling="no"
  title="Unigox Widget"
></iframe>
```

Each flag is load-bearing — removing one silently breaks a user-visible flow
(popup logins, passkeys, Apple/Google Pay, ambient session reuse).

## Host-page headers

### Content Security Policy

If the host page ships a CSP, it must permit framing `unigox.com`:

```
frame-src https://unigox.com;
```

(Or `child-src` on the legacy directive.) No additional entries to `script-src`
are required — `widget.js` is a normal third-party script.

### Permissions-Policy

If the host page sets `Permissions-Policy`, delegate these features to
`unigox.com` so the iframe's `allow="storage-access …"` attribute is honored:

```
Permissions-Policy: storage-access=(self "https://unigox.com"),
                    publickey-credentials-get=(self "https://unigox.com"),
                    publickey-credentials-create=(self "https://unigox.com")
```

Without this, ambient session reuse degrades — the user is prompted to log in
again on every visit instead of reusing an existing `unigox.com` session.

## postMessage protocol

For integrators building custom glue on top of the raw iframe (instead of
using `widget.js`), the widget speaks `window.postMessage` with
`data.source === "unigox-widget"`. Host → widget messages use
`data.source === "unigox-host"`.

**Widget → host**

| `type`                   | Payload                                    |
| ------------------------ | ------------------------------------------ |
| `UNIGOX_READY`           | —                                          |
| `UNIGOX_RESIZE`          | `{ height: number }`                       |
| `UNIGOX_AUTH_STATE`      | `{ isAuthenticated }`                      |
| `UNIGOX_TRADE_STARTED`   | `{ tradeId }`                              |
| `UNIGOX_TRADE_COMPLETED` | `{ tradeId }`                              |
| `UNIGOX_SENDOUT_STARTED` | `{ tradeId, address, chainId }`            |
| `UNIGOX_SENDOUT_COMPLETED` | `{ tradeId, address, chainId, txHash? }` |
| `UNIGOX_SENDOUT_FAILED`  | `{ tradeId, reason }`                      |

**Host → widget**

| `type`          | Payload                         |
| --------------- | ------------------------------- |
| `UNIGOX_CONFIG` | Same shape as `init` URL params |
| `UNIGOX_RESET`  | —                               |

## Buy with sendout (`type=buy-with-sendout`)

Variant of the buy flow: after the trade terminally succeeds and the crypto
lands in the user's internal Unigox wallet, the widget auto-navigates to a
**sendout view** that bridges funds to a partner-controlled external address.
The sendout view reuses the same relay-based bridge used by the main-site
"Send to external wallet" flow (hooks in `components/wallet/send/hooks/`).

### Surface

- New `EmbedType` value: `"buy-with-sendout"`
  (see `contexts/embed-config-context.tsx`).
- New widget-config URL params: `sendoutAddress`, `sendoutNetwork` (chain id).
- New `Views.SENDOUT` (see `contexts/widget-context.tsx`) rendered by
  `components/widget/sendout/sendout-view.tsx`.
- Persistent yellow banner
  (`components/widget/sendout/sendout-banner.tsx`) shown on every pre-sendout
  view. Hidden inside the sendout view itself.
- Auto-transition `TRADE → SENDOUT` lives in
  `components/widget/trade/states/trade-complete.tsx` and triggers once the
  escrow is fully released (`canResolveEscrow === false`).
- New outbound postMessages `UNIGOX_SENDOUT_STARTED / COMPLETED / FAILED`
  (see `contexts/embed-postmessage-context.tsx`) with matching SDK callbacks
  `onSendoutStarted / onSendoutCompleted / onSendoutFailed` in
  `public/widget.js`.

### UI rules in this mode

- Buy/sell toggle is hidden in `StartView`; the `embedType === "buy-with-sendout"`
  branch renders the "Buy Crypto" header only.
- Everything else in `StartView` stays normal (fiat/crypto selectors, amount,
  exchange-partner picker, best offer). The crypto selector is **not** filtered
  — unsupported combinations surface as a "Sendout misconfigured" error on the
  sendout step instead of at selection time.
- The `SendoutView` drives `useWithdrawalBridgeState` imperatively: on mount it
  resolves `(crypto_currency_code, sendoutNetwork)` against
  `useBridgeCryptocurrencies()` to find the destination `TokenOnChain`, then
  calls `setSelectedCryptocurrency`, `setRecipient`, `setAmount` with the
  trade's `crypto_amount_to_buyer`.

### Not yet implemented (MVP scope)

These are intentional follow-ups. Track them before expanding the surface:

- **No trade-level localStorage tagging.** Created trades are not tagged with
  the widget's sendout config, so there is no record of intent beyond the
  in-memory React state of the current tab.
- **No `PENDING_PAYOUTS`-style resume view.** If the user closes the widget
  between trade-complete and sendout submission, the next widget mount does
  not detect the orphan. The recovery path today is the main-site wallet
  page (`unigox.com/wallet → send → external`).
- **No cross-device resume.** Same reason — state is only in the current
  browser session's memory.
- **No reconciliation with main-site activity.** Trades/sendouts performed on
  `unigox.com` directly by the same user are not mapped against the widget's
  sendout expectations. Accept this as a known gap.
- **No backend coupling.** Server-side, a trade in this mode is identical to
  a regular BUY — nothing links it to `sendoutAddress`/`sendoutNetwork`.
  Partners that need server-enforced delivery guarantees are not covered
  by this MVP.

## Session reuse & storage partitioning

Modern browsers partition cross-site iframe storage by the top-level site, so
a user signed into `unigox.com` directly would otherwise have no session
inside the embedded widget on a partner site. On the first user gesture, the
widget calls `document.requestStorageAccess()` to bridge the partitions.

Per-browser behavior:

- **Chrome** — one-time prompt, or silent if both sites are in the same
  Related Website Set.
- **Safari** — prompts once per partner site.
- **Firefox** — silent under ETP, prompts under strict mode.

If the user denies the prompt the widget still works with a fresh session
scoped to the partner site.

## Testing changes locally

1. Run `unigox.com` on the `feature/embed-widget` branch (`npm run dev`, port
   3000).
2. In this repo run `npm run dev` and open `/widgets/embed`.
3. The playground's **Base URL** defaults to `http://localhost:3000/embed`;
   change to staging / production when validating releases.

The playground exposes every URL param as a form field and lets you resize the
iframe, which covers most regressions the integration surface can introduce.
