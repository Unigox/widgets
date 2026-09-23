# Changelog

All partner-visible changes to the Unigox embed widget — init options,
callbacks, postMessage protocol, supported URL params, address/network
formats — are tracked here. See the
[Versioning & compatibility](./docs/client-integration.md#versioning--compatibility)
section of the integration guide for what "partner-visible" covers.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The widget loader is currently on its first major version, served at
`https://unigox.com/widget.js`.

## [Unreleased]

### Added

- `sendoutNetwork` accepts `"tron"` / `"trx"` / `"trc20"` and `"ton"` / `"toncoin"`.
  `sendoutAddress` is validated per network: Tron as a base58check `T…` address,
  TON as a raw `0:<hex>` or canonical `EQ…` / `UQ…` basechain address (testnet-only
  and masterchain addresses are refused). Whether either network is actually
  offered is still decided at runtime from the bridge catalog
  (`enabled_for_withdrawal`), so an unsupported combination renders the existing
  "Sendout misconfigured" screen. Solana validation is tightened to a 32-byte
  public key: a Tron address is also base58 and 34 characters long and used to
  pass as Solana.

- `onTradeStarted` and `onTradeCompleted` now carry `orderId` — the partner-facing
  order UUID, the same `order_id` your webhooks carry. It is the value the partner
  API accepts: `GET /partner/orders/{order_id}` validates the path segment as a
  UUID and answers `400 invalid order_id format` for the numeric `tradeId`, so
  before this there was no identifier a host could carry from a widget callback to
  a partner API call, and no way to obtain one.

  `orderId` is optional — a trade opened outside a partner widget has no partner
  order behind it — so read it defensively rather than asserting it.

### Fixed

- `onTradeStarted`, `onTradeCompleted` and `onAuthChange` now actually fire.
  They have been documented and wired in the loader since the first release,
  but the widget never emitted the underlying `UNIGOX_TRADE_STARTED`,
  `UNIGOX_TRADE_COMPLETED` and `UNIGOX_AUTH_STATE` messages, so a host page
  only ever received `onReady` and the sendout events. No integration change
  is needed — handlers already registered start receiving events.
  - `onTradeStarted` fires when a liquidity provider accepts and the trade
    exists, not the moment the user presses confirm. `tradeId` is then the
    same value `onTradeCompleted` and the `onSendout*` events carry; before
    acceptance only a *request* exists, under a different id.
  - `onAuthChange` also fires once on mount with the settled state, so a host
    that mounts the widget for an already-signed-in user does not have to
    wait for a sign-out to learn it.

### Added

- `sendoutNetwork` now accepts Unichain (`unichain` / `uni`), Avalanche
  (`avalanche` / `avax`), HyperEVM (`hyperevm` / `hype`) and Solana
  (`solana` / `sol`) in addition to the existing Ethereum, Optimism, Polygon,
  Base and Arbitrum tickers.
- `sendoutAddress` validation is chain-aware: EVM networks keep strict EIP-55
  checksum validation, Solana accepts standard base58 addresses.
- `language` URL param actually selects the locale (`en`, `es`). Unsupported
  values fall back to `en`. Previously the value was silently ignored.
- The embed-widget input page shows a **chain icon next to each asset
  balance** plus a compact chain switcher. The displayed balance always
  reflects the currently-selected source — Unigox (the user's internal
  Unigox wallet) by default when it has funds, otherwise the highest
  external balance. Click-to-fill mirrors the selected source so the
  amount stays equal to what the user can actually deposit / sell in one
  go.
- The chain switcher is a **single compact icon dropdown for the whole
  row** — picking a chain updates both the USDT and the USDC badge
  simultaneously. Trigger is the current source's icon plus a chevron
  (rotates when open). The list always begins with **Unigox** (label
  forced to "Unigox" so the underlying chain ticker never leaks to
  partners), followed by every queried external chain — including chains
  the user holds 0 of, so they can pre-empt-switch to a chain they plan
  to fund. Each row shows the chain icon and name on the left and **both
  USDT and USDC balances** (USDT first) on the right; zero amounts are
  dimmed. When only one source is available (e.g. an email-auth user with
  no connected wallet), the trigger degrades to a static icon — no
  dropdown to confuse the user.

### Changed (embed-only UX)

- **Fund Escrow → Web3 tab is locked to the auth wallet.** Embed users who
  signed in with an EVM wallet now see only the EVM funding card on this
  tab — the Solana option and the EVM "Disconnect" action are hidden, so
  the user cannot accidentally swap wallets mid-flow. Email-auth users
  outside the embed see the original multi-wallet UX unchanged.
- **Fund Escrow Web3 tab is hidden for TON-auth users in embed.** The tab
  supports EVM and Solana but not TON, so for TON-auth embed sessions only
  the "External Wallet or Exchange" tab is offered (the tab bar itself is
  removed when there is just one tab).
- **Fund Escrow tab bar redesigned for the embed widget.** The shared
  `AnimatedTabBar` ships heavy per-button borders that look crammed in a
  500-px iframe. The embed now renders a slim horizontal pill bar with a
  task-meaningful icon on each tab (`Building2` for "External Wallet",
  `Wallet` for "Web3 Wallet") and uses a filled yellow background as the
  active-state indicator — the previous checkmark is removed since it
  duplicated that signal. The main-site experience keeps the original
  animated tab bar, just with the same icons in place of the checkmark.
- New `onWidgetError({ code, message })` callback and new
  `UNIGOX_WIDGET_ERROR` postMessage event for misconfig failures that fire
  before any trade exists. Codes: `WIDGET_MISSING_SENDOUT_ADDRESS`,
  `WIDGET_MISSING_SENDOUT_NETWORK`, `WIDGET_INVALID_SENDOUT_ADDRESS`.
- `UNIGOX_SENDOUT_FAILED` is now also emitted when the (`crypto`, `sendoutNetwork`)
  pair is unsupported by the bridge (previously the user landed on a
  "Sendout misconfigured" screen with no host signal). Code:
  `SENDOUT_NOT_SUPPORTED`.
- New "Error codes" section in
  [`docs/client-integration.md`](./docs/client-integration.md#error-codes)
  documents every `WIDGET_*` and `SENDOUT_*` code with retry and recovery
  guidance.

### Changed

- `widget.configure({ type })` is now case-insensitive — `"buy"` and
  `"BUY"` both work, matching the existing `init({ type: "buy" })` form.
- **Breaking — `onSendoutFailed` payload.** Was
  `{ tradeId: number, reason: string }`, now
  `{ tradeId: number, code: SendoutErrorCode, message: string }`.
  Branch on `code`; treat `message` as a non-stable hint. The previous
  free-form `reason` had no guarantees and could not be safely matched.
  Acceptable to ship as a non-bumping change because the loader has not yet
  been published to external partners.

### Documentation

- Stack-specific copy/paste examples added under
  [`examples/`](./examples/) — `vanilla-html/`, `react/` (with a reusable
  SSR-safe wrapper component) and `wordpress/` (with notes on caching
  plugins, AMP and CSP). Linked from the integration guide and the
  repo README.
- "Callbacks" section now leads with an explicit warning that every
  event is **client-emitted and not authoritative** — partners must
  verify trade and sendout state via the Unigox API before crediting
  users / paying out. The callbacks table gained a "Verifiable?" column;
  `onSendoutCompleted` is the only event whose payload (the on-chain
  `txHash`) can be independently verified, all others are UX-only or
  must be confirmed via API. Server-signed webhooks remain on the
  roadmap as the future authoritative channel.
- Single integration guide at
  [`docs/client-integration.md`](./docs/client-integration.md). Previous
  `docs/embed-widget.md` and `docs/gitbook-client-integration.md` removed.
- Live playground link points to <https://widgets.unigox.app>.
- postMessage payload tables document actual TypeScript shapes
  (e.g. `UNIGOX_TRADE_STARTED` carries `tradeType`, `UNIGOX_AUTH_STATE`
  payload is `{ isAuthenticated: boolean }`).
- New "Versioning & compatibility" section documents the stability contract
  and breaking-change policy.
- "Host-page headers" section rewritten: one-block paste for sites with a
  strict CSP, explicit `script-src https://unigox.com` directive (was
  missing — `widget.js` would not load on strict-CSP sites), and per-feature
  tables explaining what breaks without each directive.
