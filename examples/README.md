# Examples

Drop-in copy/paste examples of the Unigox embed widget for the most common
host stacks.

| Stack                                  | What it shows                                                  |
| -------------------------------------- | -------------------------------------------------------------- |
| [`vanilla-html/`](./vanilla-html/)     | Plain HTML page with the widget — minimum integration.         |
| [`react/`](./react/)                   | A small React wrapper component plus a usage page.             |
| [`wordpress/`](./wordpress/)           | Snippet for a WordPress "Custom HTML" block.                   |

For the full options reference, callbacks, postMessage protocol, error
codes, CSP setup and the buy-with-sendout flow, see
[`docs/client-integration.md`](../docs/client-integration.md).

## Versioning

Every example loads the widget from `https://unigox.com/widget.js` — the
auto-updating v1 channel. The compatibility contract for that channel is
documented in
[Versioning & compatibility](../docs/client-integration.md#versioning--compatibility).
