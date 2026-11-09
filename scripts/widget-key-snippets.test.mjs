import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

// Execute the production snippet builders without mounting the remote preview or fetching rates.
const source = readFileSync(new URL("../src/app/widgets/embed/embed-playground.tsx", import.meta.url), "utf8");
const functions = source.slice(source.indexOf("function typeParamValue"), source.indexOf('type PreviewMode ='));
const context = { URL, URLSearchParams };
vm.createContext(context);
vm.runInContext(ts.transpile(functions, { target: ts.ScriptTarget.ES2022 }), context);
const config = { baseUrl: "https://www.unigox.com/embed", type: "buy-sell", theme: "light", language: "en", loginMethods: ["email", "web3", "ton"], applyAttribution: true };

test("personal and legacy keys survive URL and script generation without fee overrides", () => {
  for (const key of ["uw1_" + "a".repeat(64), "wk_legacy"]) {
    const input = { ...config, widgetKey: key, partner: "company", ref: "alice", fee_pct: 9 };
    const url = new URL(context.buildUrl(input));
    assert.equal(url.searchParams.get("widget_key"), key);
    assert.equal(url.searchParams.get("partner"), "company");
    assert.equal(url.searchParams.get("ref"), "alice");
    assert.equal(url.searchParams.has("fee_pct"), false);
    const snippet = context.buildInitSnippet(input);
    let received;
    vm.runInNewContext(snippet.match(/<script>\n([\s\S]*?)<\/script>/)[1], { UnigoxWidget: { init: options => { received = options; } } });
    assert.equal(received.widgetKey, key);
    assert.equal(received.fee_pct, undefined);
  }
});

test("unkeyed previews stay unkeyed; quotes in an entered key cannot break JavaScript", () => {
  assert.equal(new URL(context.buildUrl(config)).searchParams.has("widget_key"), false);
  const key = 'public"key\\value';
  let received;
  const snippet = context.buildInitSnippet({ ...config, widgetKey: key });
  vm.runInNewContext(snippet.match(/<script>\n([\s\S]*?)<\/script>/)[1], { UnigoxWidget: { init: options => { received = options; } } });
  assert.equal(received.widgetKey, key);
});
