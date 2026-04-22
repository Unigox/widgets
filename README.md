# Unigox Widgets

Next.js app hosting the live **integration playground** for the Unigox embeddable
widget. Partners use it to configure the widget visually, copy the resulting
embed snippet, and preview the iframe before shipping it to their own site.

Live playground: `<PLAYGROUND_URL>`

## Docs

- [`docs/client-integration.md`](docs/client-integration.md) — **partner-facing**
  integration guide: copy-paste quickstart, full list of init options, callbacks,
  CSP / Permissions-Policy requirements, session-reuse behavior.
- [`docs/embed-widget.md`](docs/embed-widget.md) — developer-oriented reference
  for the `/embed` route on `unigox.com`, the postMessage protocol, and how to
  run the playground against a local `unigox.com` dev server.

## Development

```bash
npm install
npm run dev    # defaults to port 3003
```

The playground is available at [`/widgets/embed`](http://localhost:3003/widgets/embed).
By default it loads the widget from `http://localhost:3000/embed` — run
`unigox.com` in another terminal to exercise real flows. Point
`NEXT_PUBLIC_EMBED_BASE_URL` at staging or production to validate releases.
