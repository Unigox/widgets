"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"

type EmbedType = "buy" | "sell" | "buy-sell" | "buy-with-sendout"
type EmbedTheme = "light" | "dark"
type EmbedLanguage = "en"
type LoginMethod = "email" | "web3" | "ton"

const embedTypeOptions: EmbedType[] = ["buy", "sell", "buy-sell", "buy-with-sendout"]
const languageOptions: EmbedLanguage[] = ["en"]
const loginMethodOptions: LoginMethod[] = ["email", "web3", "ton"]

const OFFERS_API =
  process.env.NEXT_PUBLIC_OFFERS_API ||
  "https://offers-y5u4f.ondigitalocean.app/api/v1"

interface SupportedPair {
  crypto_currency_code: string
  fiat_currency_code: string
  type: "BUY" | "SELL"
}

interface SendoutNetwork {
  /** Canonical ticker passed to the widget (URL param value). */
  ticker: string
  name: string
}

// Tickers accepted by the widget's `sendoutNetwork` URL param. Mirrors
// `utils/sendout-network.ts` in the unigox.com repo — keep in sync.
const sendoutNetworkOptions: SendoutNetwork[] = [
  { ticker: "ethereum", name: "Ethereum" },
  { ticker: "optimism", name: "Optimism" },
  { ticker: "polygon", name: "Polygon" },
  { ticker: "base", name: "Base" },
  { ticker: "arbitrum", name: "Arbitrum" },
]

function useSupportedPairs() {
  const [cryptos, setCryptos] = React.useState<string[]>([])
  const [fiats, setFiats] = React.useState<string[]>([])

  React.useEffect(() => {
    let cancelled = false
    fetch(`${OFFERS_API}/get-supported-pairs`)
      .then(r => r.json())
      .then((body: { success: boolean; data: SupportedPair[] }) => {
        if (cancelled || !body?.success || !Array.isArray(body.data)) return
        const cryptoSet = new Set<string>()
        const fiatSet = new Set<string>()
        body.data.forEach(p => {
          cryptoSet.add(p.crypto_currency_code)
          fiatSet.add(p.fiat_currency_code)
        })
        setCryptos(Array.from(cryptoSet).sort())
        setFiats(Array.from(fiatSet).sort())
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return { cryptos, fiats }
}

interface Config {
  baseUrl: string
  type: EmbedType
  theme: EmbedTheme
  language: EmbedLanguage
  partner: string
  ref: string
  email: string
  crypto: string
  fiat: string
  amount: string
  loginMethods: LoginMethod[]
  requireLogin: boolean
  applyAttribution: boolean
  width: string
  height: string
  autoWidth: boolean
  autoHeight: boolean
  sendoutAddress: string
  sendoutNetwork: string
}

const defaultBaseUrl =
  process.env.NEXT_PUBLIC_EMBED_BASE_URL || "http://localhost:3000/embed"

const defaultConfig: Config = {
  baseUrl: defaultBaseUrl,
  type: "buy-sell",
  theme: "light",
  language: "en",
  partner: "",
  ref: "",
  email: "",
  crypto: "",
  fiat: "",
  amount: "",
  loginMethods: ["email", "web3", "ton"],
  requireLogin: false,
  applyAttribution: true,
  width: "480px",
  height: "740px",
  autoWidth: false,
  autoHeight: true,
  sendoutAddress: "0x000000000000000000000000000000000000dead",
  sendoutNetwork: "ethereum",
}

// `buy-sell` is the backend default — omit the URL param to keep snippets clean.
function typeParamValue(type: EmbedType): string | null {
  if (type === "buy-sell") return null
  return type
}

function serializeLoginMethods(methods: LoginMethod[]): string | null {
  if (methods.length === 0) return null
  // All three is the backend default — omit the URL param to keep snippets clean.
  if (methods.length === 3) return null
  return methods.join(",")
}

function buildUrl(config: Config): string {
  const params = new URLSearchParams()
  const typeValue = typeParamValue(config.type)
  if (typeValue) params.set("type", typeValue)
  if (config.type === "buy-with-sendout") {
    if (config.sendoutAddress) params.set("sendoutAddress", config.sendoutAddress)
    if (config.sendoutNetwork) params.set("sendoutNetwork", config.sendoutNetwork)
  }
  if (config.theme) params.set("theme", config.theme)
  if (config.language && config.language !== "en")
    params.set("language", config.language)
  if (config.partner) params.set("partner", config.partner)
  if (config.ref) params.set("ref", config.ref)
  if (config.email) params.set("email", config.email)
  if (config.crypto) params.set("crypto", config.crypto)
  if (config.fiat) params.set("fiat", config.fiat)
  if (config.amount) params.set("amount", config.amount)
  const loginMethods = serializeLoginMethods(config.loginMethods)
  if (loginMethods) params.set("loginMethods", loginMethods)
  if (config.requireLogin) params.set("requireLogin", "true")
  if (!config.applyAttribution) params.set("applyAttribution", "false")
  const qs = params.toString()
  return qs ? `${config.baseUrl}?${qs}` : config.baseUrl
}

function scriptOrigin(baseUrl: string): string {
  try {
    return new URL(baseUrl).origin
  } catch {
    return baseUrl.replace(/\/embed\/?$/, "")
  }
}

function buildInitSnippet(config: Config): string {
  const opts: string[] = [`container: "#unigox-widget"`]
  if (config.partner) opts.push(`partner: "${config.partner}"`)
  if (config.ref) opts.push(`ref: "${config.ref}"`)
  const typeValue = typeParamValue(config.type)
  if (typeValue) opts.push(`type: "${typeValue}"`)
  if (config.type === "buy-with-sendout") {
    if (config.sendoutAddress)
      opts.push(`sendoutAddress: "${config.sendoutAddress}"`)
    if (config.sendoutNetwork)
      opts.push(`sendoutNetwork: "${config.sendoutNetwork}"`)
  }
  if (config.crypto) opts.push(`crypto: "${config.crypto}"`)
  if (config.fiat) opts.push(`fiat: "${config.fiat}"`)
  if (config.amount) opts.push(`amount: ${JSON.stringify(config.amount)}`)
  if (config.email) opts.push(`email: "${config.email}"`)
  if (config.theme === "dark") opts.push(`theme: "dark"`)
  if (config.language && config.language !== "en")
    opts.push(`language: "${config.language}"`)
  const loginMethods = serializeLoginMethods(config.loginMethods)
  if (loginMethods) opts.push(`loginMethods: "${loginMethods}"`)
  if (config.requireLogin) opts.push(`requireLogin: true`)
  if (!config.applyAttribution) opts.push(`applyAttribution: false`)
  if (!config.autoWidth && config.width) opts.push(`width: "${config.width}"`)
  if (!config.autoHeight && config.height) opts.push(`height: "${config.height}"`)

  const body = opts.map(line => `    ${line},`).join("\n")
  const origin = scriptOrigin(config.baseUrl)

  return `<div id="unigox-widget"></div>
<script src="${origin}/widget.js"></script>
<script>
  UnigoxWidget.init({
${body}
  });
</script>`
}

type PreviewMode = "bare" | "website"

export function EmbedPlayground() {
  const [config, setConfig] = React.useState<Config>(defaultConfig)
  const [iframeKey, setIframeKey] = React.useState(0)
  const [previewMode, setPreviewMode] = React.useState<PreviewMode>("bare")
  const { cryptos, fiats } = useSupportedPairs()

  // Track the latest height the widget reports via UNIGOX_RESIZE so the preview
  // iframe behaves the same way the SDK does when the host leaves height unset.
  const [autoReportedHeight, setAutoReportedHeight] = React.useState<number | null>(null)
  React.useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data
      if (!data || data.source !== "unigox-widget") return
      if (data.type === "UNIGOX_RESIZE" && data.payload?.height) {
        setAutoReportedHeight(data.payload.height)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])
  // Reset reported height on iframe reload so the preview re-grows from scratch.
  React.useEffect(() => {
    setAutoReportedHeight(null)
  }, [iframeKey, config.autoHeight])

  const url = React.useMemo(() => buildUrl(config), [config])
  const snippet = React.useMemo(() => buildInitSnippet(config), [config])

  const update = <K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const toggleLoginMethod = (method: LoginMethod) => {
    setConfig(prev => {
      const has = prev.loginMethods.includes(method)
      const next = has
        ? prev.loginMethods.filter(m => m !== method)
        : [...prev.loginMethods, method]
      return { ...prev, loginMethods: next }
    })
  }


  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="lg:sticky lg:top-6 lg:self-start">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Tweak widget options and iframe size
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ConfigSection title="Trade">
            <Field label="Type">
              <div className="flex flex-wrap gap-2">
                {embedTypeOptions.map(option => {
                  const active = config.type === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => update("type", option)}
                      aria-pressed={active}
                      className={
                        active
                          ? "rounded-md border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                          : "rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      }
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </Field>
            {config.type === "buy-with-sendout" && (
              <>
                <Field label="Sendout address">
                  <Input
                    value={config.sendoutAddress}
                    onChange={e => update("sendoutAddress", e.target.value)}
                    placeholder="0x… (EVM) or Solana base58"
                  />
                </Field>
                <Field label="Sendout network">
                  <NativeSelect
                    value={config.sendoutNetwork}
                    onChange={e => update("sendoutNetwork", e.target.value)}
                  >
                    {sendoutNetworkOptions.map(n => (
                      <option key={n.ticker} value={n.ticker}>
                        {n.name} ({n.ticker})
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <p className="text-xs text-muted-foreground">
                  After the buy flow completes, the widget auto-navigates to
                  a sendout step that bridges the purchased crypto to the
                  address above.
                </p>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Crypto">
                <NativeSelect
                  value={config.crypto}
                  onChange={e => update("crypto", e.target.value)}
                  disabled={cryptos.length === 0}
                >
                  <option value="">—</option>
                  {cryptos.map(code => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Fiat">
                <NativeSelect
                  value={config.fiat}
                  onChange={e => update("fiat", e.target.value)}
                  disabled={fiats.length === 0}
                >
                  <option value="">—</option>
                  {fiats.map(code => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field label="Amount">
              <Input
                value={config.amount}
                onChange={e => update("amount", e.target.value)}
                placeholder="100"
                inputMode="decimal"
              />
            </Field>
          </ConfigSection>

          <ConfigSection title="Appearance">
            <InlineField label="Theme">
              <button
                type="button"
                role="switch"
                aria-checked={config.theme === "dark"}
                onClick={() =>
                  update("theme", config.theme === "dark" ? "light" : "dark")
                }
                className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                <span
                  aria-hidden="true"
                  className={
                    config.theme === "dark"
                      ? "inline-block size-3 rounded-full bg-neutral-900 ring-1 ring-border"
                      : "inline-block size-3 rounded-full bg-neutral-100 ring-1 ring-border"
                  }
                />
                {config.theme}
              </button>
            </InlineField>
            <InlineField label="Language">
              <div className="w-24">
                <NativeSelect
                  value={config.language}
                  onChange={e =>
                    update("language", e.target.value as EmbedLanguage)
                  }
                >
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </InlineField>
          </ConfigSection>

          <ConfigSection title="Auth">
            <InlineField label="Login methods">
              <div className="flex flex-wrap gap-2">
                {loginMethodOptions.map(method => {
                  const active = config.loginMethods.includes(method)
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => toggleLoginMethod(method)}
                      aria-pressed={active}
                      className={
                        active
                          ? "rounded-md border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                          : "rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      }
                    >
                      {method}
                    </button>
                  )
                })}
              </div>
            </InlineField>
            <Field label="Email (prefill)">
              <Input
                value={config.email}
                onChange={e => update("email", e.target.value)}
                placeholder="user@example.com"
                type="email"
              />
            </Field>
            <SwitchField
              label="Require login"
              checked={config.requireLogin}
              onCheckedChange={value => update("requireLogin", value)}
            />
          </ConfigSection>

          <ConfigSection title="Attribution & referral">
            <Field label="Partner identifier (free-form, optional)">
              <Input
                value={config.partner}
                onChange={e => update("partner", e.target.value)}
                placeholder="e.g. acme"
              />
            </Field>
            <Field label="Referral — your Unigox username (optional)">
              <Input
                value={config.ref}
                onChange={e => update("ref", e.target.value)}
                placeholder="e.g. alice"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Drop in your Unigox username to credit signups inside the widget
              to your account — works without any backend integration.
            </p>
            <SwitchField
              label="Show &quot;Powered by Unigox&quot; footer"
              checked={config.applyAttribution}
              onCheckedChange={value => update("applyAttribution", value)}
            />
          </ConfigSection>

          <ConfigSection title="Iframe size">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width">
                <Input
                  value={config.autoWidth ? "100%" : config.width}
                  onChange={e => update("width", e.target.value)}
                  placeholder="480px"
                  disabled={config.autoWidth}
                />
              </Field>
              <Field label="Height">
                <Input
                  value={config.autoHeight ? "auto" : config.height}
                  onChange={e => update("height", e.target.value)}
                  placeholder="740px"
                  disabled={config.autoHeight}
                />
              </Field>
            </div>
            <SwitchField
              label="Auto width"
              checked={config.autoWidth}
              onCheckedChange={value => update("autoWidth", value)}
            />
            <SwitchField
              label="Auto height"
              checked={config.autoHeight}
              onCheckedChange={value => update("autoHeight", value)}
            />
          </ConfigSection>

          <ConfigSection title="Source">
            <div className="flex items-center gap-2">
              <code
                className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground"
                title={config.baseUrl}
              >
                {config.baseUrl}
              </code>
              <CopyButton text={config.baseUrl} size="sm" variant="outline" />
            </div>
          </ConfigSection>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIframeKey(k => k + 1)}
            >
              Reload iframe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfig(defaultConfig)}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Live iframe rendering the widget with the current configuration
                </CardDescription>
              </div>
              <div
                role="tablist"
                aria-label="Preview mode"
                className="flex gap-1 rounded-md border border-input bg-transparent p-0.5"
              >
                {(["bare", "website"] as PreviewMode[]).map(mode => {
                  const active = previewMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPreviewMode(mode)}
                      className={
                        active
                          ? "rounded-[5px] bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                          : "rounded-[5px] px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      }
                    >
                      {mode === "bare" ? "Bare" : "In a website"}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {previewMode === "bare" ? (
              <div className="flex justify-center rounded-lg bg-white p-6">
                <WidgetIframe
                  iframeKey={iframeKey}
                  url={url}
                  width={config.autoWidth ? "100%" : config.width}
                  height={config.autoHeight ? (autoReportedHeight ?? 700) + "px" : config.height}
                />
              </div>
            ) : (
              <WebsiteMockup>
                <WidgetIframe
                  iframeKey={iframeKey}
                  url={url}
                  width="100%"
                  height={config.autoHeight ? (autoReportedHeight ?? 700) + "px" : config.height}
                />
              </WebsiteMockup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Embed code</CardTitle>
                <CardDescription>
                  Paste this snippet into your page to load the widget
                </CardDescription>
              </div>
              <CopyButton text={snippet} size="sm" variant="outline" />
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
              {snippet}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ConfigSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function InlineField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SwitchField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  const id = React.useId()
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function CopyButton({
  text,
  size,
  variant,
}: {
  text: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be unavailable (e.g. no secure context)
    }
  }

  return (
    <Button size={size} variant={variant} onClick={handleCopy}>
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

function WidgetIframe({
  iframeKey,
  url,
  width,
  height,
}: {
  iframeKey: number
  url: string
  width: string
  height: string
}) {
  return (
    <iframe
      key={iframeKey}
      src={url}
      title="Unigox embed widget"
      style={{
        width,
        // When autoHeight is on, the parent passes a height grown by the
        // UNIGOX_RESIZE listener so the iframe fits its content.
        height,
        maxWidth: "100%",
        backgroundColor: "transparent",
      }}
      className="rounded-lg"
      allow="storage-access; publickey-credentials-get *; publickey-credentials-create *; clipboard-read; clipboard-write; payment"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-modals"
    />
  )
}

// Wireframe of a generic marketing site that sandwiches the widget into a
// realistic-looking page. Pure presentational greys + dashed borders — no real
// content, no images, no copy. Lets the playground show how the widget looks
// when dropped onto a partner page.
function WebsiteMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        </div>
        <div className="ml-2 flex gap-1 text-zinc-300">
          <span aria-hidden>‹</span>
          <span aria-hidden>›</span>
          <span aria-hidden>↻</span>
        </div>
        <div className="ml-2 flex-1 truncate rounded-md bg-white px-2 py-1 text-[10px] text-zinc-400 ring-1 ring-zinc-200">
          https://www.example.com
        </div>
        <span className="text-zinc-300" aria-hidden>⋮</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm border border-zinc-300" />
          <span className="text-sm font-semibold text-zinc-700">ExampleCo</span>
        </div>
        <div className="hidden items-center gap-5 text-xs text-zinc-500 sm:flex">
          <span>Home</span>
          <span>Products</span>
          <span>Pricing</span>
          <span>Resources ▾</span>
        </div>
        <div className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600">
          Sign In
        </div>
      </div>

      {/* Body: hero + sidebar widget */}
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="flex gap-4 rounded-lg bg-muted/40 p-4">
            <div className="h-32 w-40 shrink-0 rounded-md border border-zinc-300 bg-white" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-2.5 w-3/4 rounded bg-zinc-300" />
              <div className="h-2.5 w-2/3 rounded bg-zinc-200" />
              <div className="h-2.5 w-1/2 rounded bg-zinc-200" />
              <div className="mt-2 h-5 w-24 rounded bg-zinc-300" />
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-700">About Us</h4>
            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-4">
              <div className="space-y-2 pt-2">
                <div className="h-2 w-full rounded bg-zinc-200" />
                <div className="h-2 w-11/12 rounded bg-zinc-200" />
                <div className="h-2 w-10/12 rounded bg-zinc-200" />
                <div className="h-2 w-9/12 rounded bg-zinc-200" />
              </div>
              <div className="aspect-square rounded-md border border-zinc-300 bg-white" />
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-700">Our Features</h4>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-lg border border-zinc-200 p-3">
                  <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-zinc-100" />
                  <div className="mx-auto mt-3 h-1.5 w-3/4 rounded bg-zinc-200" />
                  <div className="mx-auto mt-1.5 h-1.5 w-2/3 rounded bg-zinc-200" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 px-4 py-5 text-center">
            <div className="mx-auto h-2 w-2/3 rounded bg-zinc-300" />
            <div className="mx-auto mt-2 h-2 w-1/2 rounded bg-zinc-200" />
            <div className="mx-auto mt-3 inline-block rounded border border-zinc-300 px-3 py-1 text-[10px] text-zinc-500">
              Get Started
            </div>
          </div>
        </div>

        {/* Sidebar — the actual widget lives here */}
        <div className="lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 px-5 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm border border-zinc-300" />
            <span className="text-xs text-zinc-500">ExampleCo</span>
          </div>
          {["Company", "Products", "Resources", "Support"].map(label => (
            <div key={label} className="space-y-1.5">
              <div className="text-[10px] font-semibold text-zinc-500">{label}</div>
              <div className="h-1.5 w-16 rounded bg-zinc-200" />
              <div className="h-1.5 w-12 rounded bg-zinc-200" />
              <div className="h-1.5 w-14 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
