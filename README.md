# Unigox Widgets

Next.js app hosting the live **integration playground** for the Unigox embeddable
widget. Partners use it to configure the widget visually, copy the resulting
embed snippet, and preview the iframe before shipping it to their own site.

Live playground: [widgets.unigox.app](https://widgets.unigox.app)

## Docs

[`docs/client-integration.md`](docs/client-integration.md) is the single
integration guide — quickstart, full init options, callbacks, postMessage
protocol, CSP / Permissions-Policy, session reuse, and the buy-with-sendout
flow. Partners and maintainers both work from this one file.

[`examples/`](examples/) holds stack-specific copy/paste integrations:
vanilla HTML, React, and WordPress. Each example tracks the v1 loader and
is updated alongside breaking-change releases.

[`CHANGELOG.md`](CHANGELOG.md) tracks every partner-visible change. When
shipping a change in `unigox.com/public/widget.js` or `unigox.com/app/embed/*`
that an integrator can observe, add a `[Unreleased]` entry here in the same
PR. The compatibility contract that constrains what we can change without a
new loader URL lives in
[Versioning & compatibility](docs/client-integration.md#versioning--compatibility).

## Development

```bash
npm install
npm run dev    # defaults to port 3003
```

The playground is available at [`/widgets/embed`](http://localhost:3003/widgets/embed).
By default it loads the widget from `http://localhost:3000/embed` — run
`unigox.com` in another terminal to exercise real flows. Point
`NEXT_PUBLIC_EMBED_BASE_URL` at staging or production to validate releases.
