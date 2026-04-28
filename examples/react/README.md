# React example

Two files:

- [`UnigoxWidget.tsx`](./UnigoxWidget.tsx) — a thin React wrapper around the
  loader script. Loads `https://unigox.com/widget.js` once, initialises the
  widget against a managed container ref, and tears it down on unmount.
- [`App.tsx`](./App.tsx) — example usage in a page.

Both files are framework-agnostic React — they work in Next.js, Vite,
Create React App or any setup that runs React 18+ in the browser.

## Drop-in steps

1. Copy `UnigoxWidget.tsx` into your project.
2. Render `<UnigoxWidget … />` anywhere; props mirror the widget init
   options ([full list in client-integration.md](../../docs/client-integration.md#init-options)).
3. For runtime updates (`widget.configure(...)`, `widget.reset()`) forward
   a ref — see the comment in `UnigoxWidget.tsx` for the wiring pattern.

## SSR notes

The wrapper guards on `typeof window !== "undefined"` so it is safe to
import from a server-rendered page. Nothing renders on the server pass —
the iframe is created during the client-side `useEffect`.
