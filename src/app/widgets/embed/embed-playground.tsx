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

const CURRENCIES_API =
  process.env.NEXT_PUBLIC_CURRENCIES_API ||
  "https://currencies-khccy.ondigitalocean.app/api/v1"

interface SupportedPair {
  crypto_currency_code: string
  fiat_currency_code: string
  type: "BUY" | "SELL"
}

interface BridgeToken {
  code: string
  chain: { id: number; name: string }
}

interface SendoutNetwork {
  id: string
  name: string
}

// Fallback list in case the currencies API is unreachable — matches what the
// main unigox.com frontend shows today.
const fallbackSendoutNetworks: SendoutNetwork[] = [
  { id: "1", name: "Ethereum" },
  { id: "10", name: "Optimism" },
  { id: "137", name: "Polygon" },
  { id: "8453", name: "Base" },
  { id: "42161", name: "Arbitrum" },
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

// Pulls the live bridge-supported chain list from the same endpoint the main
// unigox.com widget uses (`useBridgeCryptocurrencies`) so the sendout network
// dropdown stays in sync with what the widget will actually accept.
function useSendoutNetworks(): SendoutNetwork[] {
  const [networks, setNetworks] = React.useState<SendoutNetwork[]>(fallbackSendoutNetworks)

  React.useEffect(() => {
    let cancelled = false
    fetch(`${CURRENCIES_API}/bridge-cryptocurrencies`)
      .then(r => r.json())
      .then((body: { success?: boolean; data: BridgeToken[] }) => {
        if (cancelled || !Array.isArray(body?.data)) return
        const uniq = new Map<number, SendoutNetwork>()
        body.data.forEach(t => {
          if (t.chain?.id && t.chain?.name && !uniq.has(t.chain.id)) {
            uniq.set(t.chain.id, { id: String(t.chain.id), name: t.chain.name })
          }
        })
        if (uniq.size === 0) return
        setNetworks(
          Array.from(uniq.values()).sort((a, b) => Number(a.id) - Number(b.id)),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return networks
}

interface Config {
  baseUrl: string
  type: EmbedType
  theme: EmbedTheme
  language: EmbedLanguage
  partner: string
  email: string
  crypto: string
  fiat: string
  amount: string
  loginMethods: LoginMethod[]
  requireLogin: boolean
  applyAttribution: boolean
  width: string
  height: string
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
  partner: "acme",
  email: "",
  crypto: "",
  fiat: "",
  amount: "",
  loginMethods: ["email"],
  requireLogin: false,
  applyAttribution: true,
  width: "480px",
  height: "740px",
  sendoutAddress: "0x000000000000000000000000000000000000dead",
  sendoutNetwork: "1",
}

// `buy-sell` is the backend default — omit the URL param to keep snippets clean.
function typeParamValue(type: EmbedType): string | null {
  if (type === "buy-sell") return null
  return type
}

function serializeLoginMethods(methods: LoginMethod[]): string | null {
  if (methods.length === 0) return null
  if (methods.length === 1 && methods[0] === "email") return null
  return methods.length === 3 ? "all" : methods.join(",")
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
  const typeValue = typeParamValue(config.type)
  if (typeValue) opts.push(`type: "${typeValue}"`)
  if (config.type === "buy-with-sendout") {
    if (config.sendoutAddress)
      opts.push(`sendoutAddress: "${config.sendoutAddress}"`)
    if (config.sendoutNetwork)
      opts.push(`sendoutNetwork: ${config.sendoutNetwork}`)
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
  if (config.width) opts.push(`width: "${config.width}"`)
  if (config.height) opts.push(`height: "${config.height}"`)

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

export function EmbedPlayground() {
  const [config, setConfig] = React.useState<Config>(defaultConfig)
  const [iframeKey, setIframeKey] = React.useState(0)
  const { cryptos, fiats } = useSupportedPairs()
  const sendoutNetworks = useSendoutNetworks()

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
                <Field label="Sendout network (chain id)">
                  <NativeSelect
                    value={config.sendoutNetwork}
                    onChange={e => update("sendoutNetwork", e.target.value)}
                  >
                    {sendoutNetworks.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.id})
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

          <ConfigSection title="Partner">
            <Field label="Partner ID">
              <Input
                value={config.partner}
                onChange={e => update("partner", e.target.value)}
                placeholder="acme"
              />
            </Field>
            <SwitchField
              label="Attribution"
              checked={config.applyAttribution}
              onCheckedChange={value => update("applyAttribution", value)}
            />
          </ConfigSection>

          <ConfigSection title="Iframe size">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width">
                <Input
                  value={config.width}
                  onChange={e => update("width", e.target.value)}
                  placeholder="480px"
                />
              </Field>
              <Field label="Height">
                <Input
                  value={config.height}
                  onChange={e => update("height", e.target.value)}
                  placeholder="740px"
                />
              </Field>
            </div>
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
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Live iframe rendering the widget with the current configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center rounded-lg bg-white p-6">
              <iframe
                key={iframeKey}
                src={url}
                title="Unigox embed widget"
                style={{
                  width: config.width,
                  height: config.height,
                  maxWidth: "100%",
                  backgroundColor: "transparent",
                }}
                className="rounded-lg"
                allow="storage-access; publickey-credentials-get *; publickey-credentials-create *; clipboard-read; clipboard-write; payment"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-modals"
              />
            </div>
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
