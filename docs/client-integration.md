# Unigox Widget — Integration Guide

Embed the Unigox buy/sell flow into your site with a single `<script>` tag. The
loader creates a cross-origin `<iframe>` pointing at `https://unigox.com/embed`,
wires up the required browser permissions, and exposes callbacks for trade and
auth events.

> **Live playground:** [widgets.unigox.app](https://widgets.unigox.app)
>
> Use it to try every option below in your browser and copy the generated
> snippet straight into your page.

---

## Quickstart

```html
<div id="unigox-widget"></div>
<script src="https://unigox.com/widget.js"></script>
<script>
  const widget = UnigoxWidget.init({
    container: "#unigox-widget",
    crypto: "USDT",
    fiat: "USD",
    amount: 100,
    onTradeCompleted: function (e) {
      console.log("trade", e.tradeId, "order", e.orderId);
    },
  });
</script>
```

That's it. The loader injects the iframe with the right `sandbox` and `allow`
attributes — you do **not** need to construct the iframe yourself.

No registration, partner agreement or API key is required to embed the widget.
All options below are optional unless marked otherwise.

> **Need a starting point for your stack?** Copy one of the
> [`examples/`](../examples/) folders — vanilla HTML, React, or
> WordPress — and tweak from there. Each example mirrors this guide and
> stays in sync with releases.

---

## Earn referrals from your traffic (no integration)

If you have a Unigox account and want every signup that goes through the widget
on your site to count as your referral, just pass your Unigox username as `ref`:

```html
<div id="unigox-widget"></div>
<script src="https://unigox.com/widget.js"></script>
<script>
  UnigoxWidget.init({
    container: "#unigox-widget",
    ref: "your-unigox-username",
  });
</script>
```

That's the entire integration. Anyone who signs up while the widget is loaded
on your page is attributed to your account — same mechanism as the
`unigox.com/?ref=…` link, but built into the widget so you can earn off the
buy flow directly on your site.

---

## Init options

Pass these to `UnigoxWidget.init(options)`.

| Option              | Type                                      | Required | Default       | Description                                                                                                               |
| ------------------- | ----------------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `container`         | `string \| HTMLElement`                   | yes      | —             | CSS selector or DOM element. The iframe is appended to it.                                                                |
| `partner`           | `string`                                  | no       | —             | Free-form attribution identifier — any string you want to see in your reports. Not validated. Optional.                   |
| `ref`               | `string`                                  | no       | —             | Your Unigox username. New signups initiated inside the widget are credited to this user (referral). Use this for no-integration deployments — paste your username and earn referrals from anyone who signs up via the widget on your site. |
| `type`              | `"buy" \| "sell" \| "buy-sell" \| "buy-with-sendout"` | no | `"buy-sell"`  | Which side opens first. `"buy-sell"` shows the full buy/sell toggle. `"buy-with-sendout"` adds an automatic sendout step — see below. `"both"` is still accepted as an alias for `"buy-sell"` for back-compat. |
| `sendoutAddress`    | `string`                                  | conditional | —          | **Required when `type=buy-with-sendout`.** Destination address the purchased crypto is sent to after the trade (EVM `0x…`, Solana base58, Tron `T…` base58 or TON `EQ…`/`UQ…`). |
| `sendoutNetwork`    | `string`                                  | conditional | —          | **Required when `type=buy-with-sendout`.** Destination network as a blockchain ticker or name. Accepted values: `"ethereum"` / `"eth"`, `"optimism"` / `"op"`, `"polygon"` / `"pol"`, `"unichain"` / `"uni"`, `"base"`, `"arbitrum"` / `"arb"`, `"avalanche"` / `"avax"`, `"hyperevm"` / `"hype"`, `"solana"` / `"sol"`, `"tron"` / `"trx"` / `"trc20"`, `"ton"` / `"toncoin"`. Numeric chain ids are not accepted. |
| `crypto`            | `string`                                  | no       | auto          | Pre-selected crypto ticker (e.g. `"USDT"`, `"BTC"`, `"ETH"`). Falls back to USDT or the user's balance.                   |
| `fiat`              | `string`                                  | no       | auto          | Pre-selected fiat code (e.g. `"USD"`, `"EUR"`, `"VND"`). Falls back to the user's country currency.                       |
| `amount`            | `number`                                  | no       | —             | Pre-filled amount. For `type=buy` this is the **fiat** side ("You spend"); for `type=sell` it is the **crypto** side.     |
| `email`             | `string`                                  | no       | —             | Prefills the login email. Combined with `requireLogin` it drives the auto-login flow.                                     |
| `theme`             | `"light" \| "dark"`                       | no       | `"light"`     | Visual theme.                                                                                                             |
| `language`          | `"en" \| "es"`                            | no       | `"en"`        | UI language. Unsupported values fall back to `"en"`. More locales arrive as they are translated.                          |
| `loginMethods`      | `"email" \| "web3" \| "ton" \| "all"` or multiple options | no | `"all"` | Which login options to show. Pass a single value, `"all"` for all three, or multiple options separated by commas: `"email,web3"`, `"email,ton"`, `"web3,ton"`. |
| `requireLogin`      | `boolean`                                 | no       | `false`       | If `true`, force the login screen before the widget opens even when anonymous trading would otherwise be possible.        |
| `applyAttribution`  | `boolean`                                 | no       | `true`        | Toggles the "Powered by Unigox" footer inside the widget.                                                                 |
| `width`             | `string`                                  | no       | `"100%"`      | Iframe width (any CSS length).                                                                                            |
| `height`            | `string`                                  | no       | `"700px"`     | Iframe height. When **omitted**, the widget auto-resizes to fit its content.                                              |

### Callbacks

> **All callbacks are informational, not authoritative.** They are fired
> from the iframe via `window.postMessage` — anything running in the
> top-level page can spoof or replay them. Use callbacks for UX (loading
> state, redirect after success, fire your own analytics) and for
> non-financial logging. **Do not** use them as proof-of-state for
> business decisions like releasing a product, crediting an account, or
> paying out funds. For those, verify via the Unigox API (server-to-server)
> or, when applicable, via independent on-chain confirmation.
>
> Server-signed webhooks are on the roadmap and will be the authoritative
> channel; until they ship, treat every event below as a hint, not a fact.

| Callback             | Payload                                                    | Fires when                                                                                 | Verifiable? |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------- |
| `onReady`            | —                                                          | The widget finished its initial render.                                                    | UX-only     |
| `onAuthChange`       | `{ isAuthenticated }`                                      | The user signs in or signs out, and once on mount with the settled state.                  | UX-only     |
| `onTradeStarted`     | `{ tradeId, tradeType, orderId? }`                         | A liquidity provider accepted the user's request and the trade now exists.                 | Verify via API |
| `onTradeCompleted`   | `{ tradeId, orderId? }`                                    | A trade reached a terminal success.                                                        | Verify via API |
| `onSendoutStarted`   | `{ tradeId, address, chainId }`                            | *(buy-with-sendout only)* The bridge to the partner address was submitted.                 | Verify via API |
| `onSendoutCompleted` | `{ tradeId, address, chainId, txHash? }`                   | *(buy-with-sendout only)* The bridge confirmed on the destination chain.                   | `txHash` independently verifiable on-chain |
| `onSendoutFailed`    | `{ tradeId, code, message }`                               | *(buy-with-sendout only)* The sendout step failed. `code` is one of the `SENDOUT_*` codes — see [Error codes](#error-codes). | UX-only     |
| `onWidgetError`      | `{ code, message }`                                        | A misconfig error fired before any trade existed (e.g. missing/invalid `sendoutAddress`). `code` is one of the `WIDGET_*` codes. | UX-only     |

> **`tradeId` is the same value in every event that carries it** —
> `onTradeStarted`, `onTradeCompleted` and all three `onSendout*` callbacks.
> That is why `onTradeStarted` fires at acceptance rather than the moment the
> user presses confirm: before a liquidity provider accepts, only a *request*
> exists, and it has a different id.
>
> `tradeId` is a Unigox-internal id. It correlates the widget events with each
> other; it is **not** the `order_id` your webhooks carry, and the partner API
> will not accept it — `GET /partner/orders/{order_id}` validates the path
> segment as a UUID and answers `400 invalid order_id format` for a numeric id.
>
> **`orderId` is the value to use against the partner API.** It is the same
> `order_id` your webhooks carry, so `onTradeStarted` and `onTradeCompleted`
> can be correlated directly with `GET /partner/orders/{order_id}` and with
> your webhook stream.
>
> It is optional because a trade opened outside a partner widget has no partner
> order behind it. Inside a widget session keyed to your `widgetKey` it is
> always present — but read it defensively rather than asserting it, so a host
> built today still runs against an older widget build.

> **Widget orders are notify-only.** You can read them —
> `GET /partner/orders/{order_id}` and `GET /partner/orders` both return them in
> full — but partner *actions* on them (authorize-crypto-transfer, cancel, and
> the rest) answer `404 ORDER_NOT_FOUND`. The crypto in a widget trade belongs
> to the end user, while every partner action moves crypto from *your* wallet.

### Handle methods

`init` returns a handle for live control:

```js
widget.configure({ crypto: "BTC", type: "sell" }); // update options at runtime
widget.reset();                                     // send user back to the start view
widget.destroy();                                   // remove the iframe + listeners
```

`configure(params)` accepts a subset of the init options:

| Param      | Type     | Notes                                                                                                |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `type`     | `string` | `"buy"` or `"sell"`. Case-insensitive (`"BUY"` works too).                                           |
| `crypto`   | `string` | Crypto ticker — same values as `init({ crypto })`.                                                   |
| `fiat`     | `string` | Fiat code — same values as `init({ fiat })`.                                                         |
| `amount`   | `string \| number` | Pre-fills the amount field. Fiat side for BUY, crypto side for SELL.                       |
| `vendor`   | `string` | Unigox username to bias the offer matcher toward (post-init only — there is no `init({ vendor })`).  |

---

## Direct URL (no `widget.js`)

For iframe-only integrations (CMS blocks, email, no-script environments) embed
`https://unigox.com/embed` directly. Every init option above maps to a query
parameter of the same name:

```
https://unigox.com/embed?partner=acme&type=buy&crypto=USDT&fiat=USD&amount=100&theme=light&email=user@example.com&loginMethods=email,web3
```

When you build the iframe yourself, reproduce the `sandbox` and `allow`
attributes verbatim — each flag gates a user-visible flow:

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

| Flag                                       | Why it matters                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `allow-same-origin`                        | Session rehydration — the widget reads its own `localStorage` / cookies.               |
| `allow-scripts`                            | Runs the widget JS bundle.                                                             |
| `allow-forms`                              | KYC and payment-detail forms.                                                          |
| `allow-popups(-to-escape-sandbox)`         | OAuth and wallet-connect popups open as real top-level windows.                        |
| `allow-storage-access-by-user-activation`  | Enables `document.requestStorageAccess()` — required for ambient session reuse.        |
| `allow-modals`                             | `confirm()` dialogs used in a few edge flows.                                          |
| `publickey-credentials-*`                  | Passkeys (WebAuthn).                                                                   |
| `clipboard-read` / `clipboard-write`       | Copy/paste of wallet addresses and trade links.                                        |
| `payment`                                  | Apple / Google Pay paths.                                                              |

---

## Host-page headers

> **Skip this section** if your site does not set a `Content-Security-Policy`
> or a `Permissions-Policy` header. The widget works out of the box on the
> default browser permissions — these rules only matter if you have already
> tightened them.

### One-block paste (strict-CSP sites)

If your site ships **both** a strict CSP and a Permissions-Policy, drop these
two response headers on every page that loads the widget:

```
Content-Security-Policy: script-src https://unigox.com; frame-src https://unigox.com
Permissions-Policy: storage-access=(self "https://unigox.com"), publickey-credentials-get=(self "https://unigox.com"), publickey-credentials-create=(self "https://unigox.com")
```

Merge them into your existing directives — do not replace what you already have.
Each line below explains what it unlocks and what breaks without it.

### Content-Security-Policy

| Directive                              | Why it matters                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `script-src https://unigox.com`        | Allows `widget.js` to execute. Without it the loader silently fails with a CSP-violation error in the console — no iframe is created. |
| `frame-src https://unigox.com`         | Allows the iframe at `unigox.com/embed` to load. Without it the iframe stays blank. (`child-src` on the legacy directive.) |

Anything else (`connect-src`, `style-src`, `img-src`) does not need a Unigox
entry: all those requests originate **inside** the iframe, which has its own
document and is not constrained by the host page's CSP.

### Permissions-Policy

The widget asks for several powerful browser features via the iframe's `allow`
attribute (set automatically by `widget.js`). If your top-level page also sets
a `Permissions-Policy`, the host's policy wins — you must delegate those
features to `unigox.com` for the `allow` attribute to take effect:

```
Permissions-Policy: storage-access=(self "https://unigox.com"),
                    publickey-credentials-get=(self "https://unigox.com"),
                    publickey-credentials-create=(self "https://unigox.com")
```

| Feature                          | What breaks without it                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `storage-access`                 | Ambient session reuse — users have to log in on every visit instead of reusing their `unigox.com` session. |
| `publickey-credentials-get/create` | Passkey (WebAuthn) sign-in stops working.                                                     |

---

## Session reuse & storage partitioning

Modern browsers partition cross-site iframe storage by the top-level site, so a
user signed into `unigox.com` directly would otherwise have no session inside
the embedded widget on your page. On the first user gesture inside the widget,
the loader calls `document.requestStorageAccess()` to bridge the partitions.

Per-browser behavior:

- **Chrome** — one-time prompt, or silent if both sites are in the same Related
  Website Set.
- **Safari** — prompts once per partner site.
- **Firefox** — silent under ETP, prompts under strict mode.

If the user denies the prompt the widget still works with a fresh session
scoped to your site.

---

## postMessage protocol (advanced)

For integrators building custom glue on top of the raw iframe, the widget
speaks `window.postMessage`. Messages are tagged with
`data.source === "unigox-widget"` (widget → host) or
`data.source === "unigox-host"` (host → widget).

**Widget → host**

| `type`                    | Payload                                    |
| ------------------------- | ------------------------------------------ |
| `UNIGOX_READY`            | —                                          |
| `UNIGOX_RESIZE`           | `{ height: number }`                       |
| `UNIGOX_AUTH_STATE`       | `{ isAuthenticated: boolean }`             |
| `UNIGOX_TRADE_STARTED`    | `{ tradeId: number, tradeType: "BUY" \| "SELL", orderId?: string }` |
| `UNIGOX_TRADE_COMPLETED`  | `{ tradeId: number, orderId?: string }`    |
| `UNIGOX_SENDOUT_STARTED`  | `{ tradeId: number, address: string, chainId: number }` |
| `UNIGOX_SENDOUT_COMPLETED`| `{ tradeId: number, address: string, chainId: number, txHash?: string }` |
| `UNIGOX_SENDOUT_FAILED`   | `{ tradeId: number, code: SendoutErrorCode, message: string }` |
| `UNIGOX_WIDGET_ERROR`     | `{ code: WidgetErrorCode, message: string }` |

**Host → widget**

| `type`          | Payload                                                                |
| --------------- | ---------------------------------------------------------------------- |
| `UNIGOX_PING`   | —. Reply is `UNIGOX_READY`.                                            |
| `UNIGOX_CONFIG` | `{ type?, crypto?, fiat?, amount?, vendor? }` — same fields as `widget.configure()`. |
| `UNIGOX_RESET`  | —                                                                      |

---

## Buy with sendout

`type="buy-with-sendout"` turns the widget into a **one-shot fiat → crypto →
partner-address** flow. The user buys crypto normally, and the widget then
automatically opens a sendout step that bridges the funds to a
partner-configured external address over our existing bridge relay.

```html
<div id="unigox-widget"></div>
<script src="https://unigox.com/widget.js"></script>
<script>
  UnigoxWidget.init({
    container: "#unigox-widget",
    partner: "acme",
    type: "buy-with-sendout",
    sendoutAddress: "0xAbCdEf0123456789abcdef0123456789AbCdEf01",
    sendoutNetwork: "ethereum", // also "eth", "polygon"/"pol", "optimism"/"op", "unichain"/"uni", "base", "arbitrum"/"arb", "avalanche"/"avax", "hyperevm"/"hype", "solana"/"sol", "tron"/"trx", "ton"
    crypto: "USDC",
    fiat: "USD",
    amount: 100,
    onSendoutCompleted: (e) => console.log("sendout ok", e.tradeId, e.txHash),
  });
</script>
```

### Behaviour

- The buy/sell toggle is hidden — only BUY is available in this mode.
- A persistent banner shows the sendout destination on every pre-sendout
  screen (`Sendout to 0xAb…cd on Ethereum`).
- After the trade reaches terminal success and the purchased crypto lands in
  the user's internal Unigox wallet, the widget auto-navigates to the
  sendout view (~1.5 s after completion).
- The sendout view shows a locked amount (matching the trade result), the
  destination, an expandable quote breakdown, and — if the account has it
  enabled — inline 2FA fields. The user confirms with a single click.
- Bridge progress, fees and final tx hash are shown inline. The host is
  notified via `onSendoutStarted / onSendoutCompleted / onSendoutFailed`.

### Requirements & constraints

- `sendoutAddress` must match the chosen network's address format. EVM
  networks require a `0x…` address that passes EIP-55 checksum validation when
  mixed-case; Solana requires a base58 address. Malformed addresses render a
  "Widget misconfigured" screen before any trade is created, so the user
  cannot proceed.
- `sendoutNetwork` must be a ticker the widget recognises (`ethereum` / `eth`,
  `optimism` / `op`, `polygon` / `pol`, `unichain` / `uni`, `base`,
  `arbitrum` / `arb`, `avalanche` / `avax`, `hyperevm` / `hype`,
  `solana` / `sol`, `tron` / `trx` / `trc20`, `ton` / `toncoin`) **and** the resulting chain must be supported by the
  Unigox bridge for the chosen `crypto`. Unsupported combinations render a
  "Sendout misconfigured" screen inside the widget. Unknown tickers render a
  "Missing required `sendoutNetwork` parameter." configuration error.
- Today the bridge supports **USDC** and **USDT** as source assets. If you
  plan to use other tickers, contact support first.
- The crypto selector inside the widget is **not** filtered — the user can
  still pick any listed token; misconfigurations surface at the sendout
  step rather than at selection time.

### Known limitations (as shipped today)

The following are intentionally out of scope for the first iteration and are
tracked as follow-ups. Plan for them on your side until they land:

- **Idempotency is per-tab, in-memory only.** The widget tracks which trades
  were created in the current session and which sendouts already fired, so
  it never auto-runs the bridge twice for the same trade within a tab. This
  survives logout→login in the same tab but **not** a full tab reload — see
  next point.
- **No resume across browser refresh or device switch.** If the user reloads
  or closes the tab after the trade but before the sendout confirms, the
  purchased crypto stays in the internal Unigox wallet. They can finish the
  transfer from the main site (`unigox.com/wallet`). An in-widget "Pending
  payouts" resume card is planned but not yet implemented.
- **Partial server-side reconciliation only.** The widget matches completed
  trades against the user's outgoing-bridge history (same amount, token,
  network, recipient) as a secondary "already sent" signal — but this is
  best-effort, not authoritative.
- **Mixed usage with the main site is not reconciled.** If the same account
  does trades or external withdrawals on `unigox.com` directly, those will
  not be mapped against the widget's sendout expectations.
- **No backend enforcement.** `sendoutAddress` / `sendoutNetwork` are client
  parameters only — nothing on the server links a trade to a specific
  sendout. Partners who need server-side guarantees should contact support.
- **Origin validation is not yet enforced.** The widget currently accepts
  embedding from any domain. Domain-locked embedding (per-partner allowed
  origins via CSP) is a planned follow-up; contact us before going live with
  end users to ensure your domains are registered.

---

## Error codes

Error events carry a stable `code` field — branch on `code` for business
logic, treat `message` as a human-readable hint that may be reworded between
releases. Codes never change shape or meaning within the **v1** loader.

### `WIDGET_*` — `onWidgetError({ code, message })`

These fire **before any trade exists**. Recovery is always a configuration
fix on the partner side; the user cannot continue. The widget also displays
a "Widget misconfigured" screen so end-users see something coherent.

| Code                                | When                                                                                  | Recovery                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `WIDGET_MISSING_SENDOUT_ADDRESS`    | `type=buy-with-sendout` was used without `sendoutAddress`.                            | Re-init with a non-empty `sendoutAddress`.                          |
| `WIDGET_MISSING_SENDOUT_NETWORK`    | `type=buy-with-sendout` was used without `sendoutNetwork`, or the ticker is unknown.  | Re-init with a recognised ticker (see [`sendoutNetwork`](#init-options)). |
| `WIDGET_INVALID_SENDOUT_ADDRESS`    | `sendoutAddress` does not match the chosen network's format (bad EIP-55 checksum on EVM, non-base58 on Solana, bad base58check on Tron, or a non-canonical / testnet / non-basechain address on TON). | Re-init with an address valid for the chosen `sendoutNetwork`. |

### `SENDOUT_*` — `onSendoutFailed({ tradeId, code, message })`

These fire **after a trade exists**. The user can usually retry from inside
the widget; the partner is informed so it can react in its own UI / analytics.

| Code                     | When                                                                          | Funds moved? | Retryable                                            |
| ------------------------ | ----------------------------------------------------------------------------- | ------------ | ---------------------------------------------------- |
| `SENDOUT_NOT_SUPPORTED`  | The combination of the user's chosen crypto and `sendoutNetwork` is not on the bridge. The widget shows a "Sendout misconfigured" screen. | No           | No — partner-side fix only (different `sendoutNetwork` or restrict `crypto`). |
| `SENDOUT_QUOTE_FAILED`   | The bridge quote API rejected the request (no liquidity, network down, etc.).  | No           | Yes — user retries from inside the widget.            |
| `SENDOUT_BRIDGE_FAILED`  | Source-chain transaction submitted but destination did not confirm, or the relay errored mid-flight. | Maybe — funds may be in flight. | Yes inside the widget; if it keeps failing, recovery via [`unigox.com/wallet`](https://unigox.com/wallet) and contact support. |
| `SENDOUT_UNKNOWN`        | Unclassified upstream failure. Treat as `SENDOUT_BRIDGE_FAILED` for retry purposes. | Maybe        | Yes — same recovery path.                             |

### Branching example

```js
UnigoxWidget.init({
  container: "#unigox-widget",
  type: "buy-with-sendout",
  sendoutAddress: "0xAbCd…",
  sendoutNetwork: "base",
  onWidgetError: (e) => {
    // Always a partner-side bug. Surface a config-error UI and re-init.
    analytics.track("unigox_widget_error", e);
  },
  onSendoutFailed: ({ tradeId, code, message }) => {
    if (code === "SENDOUT_NOT_SUPPORTED") {
      analytics.track("unigox_sendout_unsupported", { tradeId });
      // The user is stuck — direct them to support or restrict crypto on your side.
    } else if (code === "SENDOUT_BRIDGE_FAILED") {
      // Funds may be on the way. Direct the user to unigox.com/wallet to recover.
      showRecoveryUI(tradeId);
    }
    // SENDOUT_QUOTE_FAILED / SENDOUT_UNKNOWN — let the user retry inside the widget.
  },
});
```

---

## Versioning & compatibility

The loader at `https://unigox.com/widget.js` auto-updates — every page load
fetches the latest. We commit to the following stability rules within the
**v1** loader:

- **Init options.** No existing option is ever removed or renamed. Accepted
  types and the required-vs-optional split do not change. New optional
  options may be added; partners should ignore options they do not recognise.
- **Callbacks.** Existing payload fields are not renamed or removed. New
  optional fields may be added; partners should ignore unknown fields and
  not rely on absence.
- **postMessage protocol.** Existing `type` values and existing payload
  fields are stable. New `type`s and new optional payload fields may appear.
- **Direct `/embed` URL params.** Same rules as init options.

The widget UI (visual design, copy, internal step ordering, error wording)
is **not** covered by these rules — it changes continuously. Build your
integration on the contract above, not on screen flow or DOM structure.

### Breaking changes

When a breaking change is unavoidable we ship it as a new loader URL —
`https://unigox.com/widget.v2.js` — and keep the previous URL serving the
previous major for at least **90 days**. During that window both URLs work
and partners migrate by changing the `<script src>` and reading the migration
notes in [`CHANGELOG.md`](../CHANGELOG.md).

We never publish breaking changes by silently flipping `widget.js`.

### Tracking changes

All partner-visible changes are recorded in
[`CHANGELOG.md`](../CHANGELOG.md). Watch the file on GitHub if you want a
notification on every release.

---

## Examples

Stack-specific copy/paste examples live in
[`../examples/`](../examples/). Each folder is self-contained — no build
step beyond what your stack already needs.

| Stack                                          | What it shows                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| [`vanilla-html/`](../examples/vanilla-html/)   | One HTML file, one `<div>`, one `<script>`. The minimum integration. |
| [`react/`](../examples/react/)                 | A reusable `UnigoxWidget` wrapper plus a sample page. SSR-safe.     |
| [`wordpress/`](../examples/wordpress/)         | Snippet for the WordPress "Custom HTML" block, plus notes on caching plugins, AMP and CSP. |

The examples track the v1 loader, so they auto-pick up additive changes
without edits. When the contract changes (`v2`), the examples folder is
updated alongside.

---

## Debugging

- Open devtools **inside the iframe** (right-click → "Inspect frame").
- Look for log lines prefixed with `[StorageAccess]` when diagnosing session
  reuse issues.
- Use the [playground](https://widgets.unigox.app) to reproduce regressions
  with a configurable config panel before filing an issue.
