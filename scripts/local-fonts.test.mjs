import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const layout = new URL("../src/app/layout.tsx", import.meta.url);

test("layout resolves its fonts from bundled assets without a Google font loader", () => {
  const loaded = [];
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(layout, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "next/font/local") return (options) => { loaded.push(options); return { variable: options.variable }; };
    if (name === "./globals.css") return {};
    assert.notEqual(name, "next/font/google", "production builds must not fetch Google font CSS");
    return require(name);
  }, module, module.exports);
  const roboto = loaded.find((font) => font.variable === "--font-roboto");
  assert.ok(roboto);
  assert.deepEqual(roboto.src.map((source) => source.weight), ["300", "400", "500", "700"]);
  for (const font of loaded) {
    for (const source of font.src) {
      assert.ok(source.path.startsWith("../../public/fonts/"));
      const bytes = readFileSync(new URL(source.path, layout));
      assert.ok(bytes.length > 1000, `${source.path} must contain a font`);
      if (source.path.endsWith(".woff2")) assert.equal(bytes.subarray(0, 4).toString(), "wOF2");
      else assert.equal(bytes.readUInt32BE(0), 0x00010000);
    }
  }
});
