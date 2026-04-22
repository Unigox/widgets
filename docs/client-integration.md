# Unigox Widget — Integration Guide

Embed the Unigox buy/sell flow into your site with a single `<script>` tag. The
loader creates a cross-origin `<iframe>` pointing at `https://unigox.com/embed`,
wires up the required browser permissions, and exposes callbacks for trade and
auth events.

> **Live playground:** `<PLAYGROUND_URL>`
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
    partner: "your-partner-id",
    crypto: "USDT",
    fiat: "USD",
    amount: 100,
    onTradeCompleted: function (e) {
      console.log("trade", e.tradeId);
    },
  });
</script>
```

That's it. The loader injects the iframe with the right `sandbox` and `allow`
attributes — you do **not** need to construct the iframe yourself.

---

## Init options

Pass these to `UnigoxWidget.init(options)`.

| Option              | Type                                      | Required | Default       | Description                                                                                                               |
| ------------------- | ----------------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `container`         | `string \| HTMLElement`                   | yes      | —             | CSS selector or DOM element. The iframe is appended to it.                                                                |
| `partner`           | `string`                                  | no       | —             | Your partner identifier for attribution and reporting.                                                                    |
| `type`              | `"buy" \| "sell" \| "both"`               | no       | `"both"`      | Which side opens first. `"both"` shows the full buy/sell toggle.                                                          |
| `crypto`            | `string`                                  | no       | auto          | Pre-selected crypto ticker (e.g. `"USDT"`, `"BTC"`, `"ETH"`). Falls back to USDT or the user's balance.                   |
| `fiat`              | `string`                                  | no       | auto          | Pre-selected fiat code (e.g. `"USD"`, `"EUR"`, `"VND"`). Falls back to the user's country currency.                       |
| `amount`            | `number`                                  | no       | —             | Pre-filled amount. For `type=buy` this is the **fiat** side ("You spend"); for `type=sell` it is the **crypto** side.     |
| `email`             | `string`                                  | no       | —             | Prefills the login email. Combined with `requireLogin` it drives the auto-login flow.                                     |
| `theme`             | `"light" \| "dark"`                       | no       | `"light"`     | Visual theme.                                                                                                             |
| `language`          | `string`                                  | no       | `"en"`        | BCP-47-style language code. Currently only English is fully translated.                                                   |
| `loginMethods`      | `"email" \| "web3" \| "ton" \| "all"` or CSV | no    | `"email"`     | Which login options are shown. CSV combinations allowed: `"email,web3"`, `"email,ton"`, `"web3,ton"`. `"all"` = all three. |
| `requireLogin`      | `boolean`                                 | no       | `false`       | If `true`, force the login screen before the widget opens even when anonymous trading would otherwise be possible.        |
| `applyAttribution`  | `boolean`                                 | no       | `true`        | Toggles the "Powered by Unigox" footer inside the widget.                                                                 |
| `width`             | `string`                                  | no       | `"100%"`      | Iframe width (any CSS length).                                                                                            |
| `height`            | `string`                                  | no       | `"700px"`     | Iframe height. When **omitted**, the widget auto-resizes to fit its content.                                              |

### Callbacks

| Callback           | Payload               | Fires when                              |
| ------------------ | --------------------- | --------------------------------------- |
| `onReady`          | —                     | The widget finished its initial render. |
| `onAuthChange`     | `{ isAuthenticated }` | The user signs in or signs out.         |
| `onTradeStarted`   | `{ tradeId }`         | The user confirmed a trade.             |
| `onTradeCompleted` | `{ tradeId }`         | A trade reached a terminal success.     |

### Handle methods

`init` returns a handle for live control:

```js
widget.configure({ crypto: "BTC", type: "sell" }); // update options at runtime
widget.reset();                                     // send user back to the start view
widget.destroy();                                   // remove the iframe + listeners
```

`configure` accepts the same shape as the init URL params (`type`, `crypto`,
`fiat`, `amount`, `vendor`).

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

### Content-Security-Policy

If your site ships a CSP, allow framing `unigox.com`:

```
frame-src https://unigox.com;
```

(Or `child-src` on the legacy directive.) You do **not** need anything in
`script-src` — `widget.js` is a normal third-party script.

### Permissions-Policy

If your site sets a `Permissions-Policy`, delegate these to `unigox.com` so the
iframe's `allow` attribute is honored:

```
Permissions-Policy: storage-access=(self "https://unigox.com"),
                    publickey-credentials-get=(self "https://unigox.com"),
                    publickey-credentials-create=(self "https://unigox.com")
```

Without this, ambient session reuse degrades — users will be asked to log in
again every visit instead of reusing their existing `unigox.com` session.

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

| `type`                    | Payload               |
| ------------------------- | --------------------- |
| `UNIGOX_READY`            | —                     |
| `UNIGOX_RESIZE`           | `{ height: number }`  |
| `UNIGOX_AUTH_STATE`       | `{ isAuthenticated }` |
| `UNIGOX_TRADE_STARTED`    | `{ tradeId }`         |
| `UNIGOX_TRADE_COMPLETED`  | `{ tradeId }`         |

**Host → widget**

| `type`          | Payload                         |
| --------------- | ------------------------------- |
| `UNIGOX_CONFIG` | Same shape as `init` URL params |
| `UNIGOX_RESET`  | —                               |

---

## Debugging

- Open devtools **inside the iframe** (right-click → "Inspect frame").
- Look for log lines prefixed with `[StorageAccess]` when diagnosing session
  reuse issues.
- Use the [playground](`<PLAYGROUND_URL>`) to reproduce regressions with a
  configurable config panel before filing an issue.
