# WordPress example

Paste [`snippet.html`](./snippet.html) into a **Custom HTML** block (Gutenberg)
or any "Insert HTML" widget that your page builder offers (Elementor,
Divi, WPBakery, Beaver Builder).

No plugin required.

## Common gotchas

- **Caching plugins** that rewrite or defer scripts can break the loader.
  Mark the `<script src="https://unigox.com/widget.js">` tag as
  no-defer / no-async / no-minify in the cache plugin's exclusion list.
- **Strict CSP** (e.g. via Wordfence, Solid Security, custom nginx headers):
  allow `script-src https://unigox.com` and `frame-src https://unigox.com`.
  See [Host-page headers](../../docs/client-integration.md#host-page-headers).
- **AMP pages** are not supported — the embed needs ordinary JS to run.
  Render the widget on a non-AMP page or AMP-iframe-fallback page.

For the full options list, callbacks and CSP setup, see
[`docs/client-integration.md`](../../docs/client-integration.md).
