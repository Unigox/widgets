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

type EmbedType = "both" | "buy" | "sell"
type EmbedTheme = "light" | "dark"
type LoginMethod = "email" | "web3" | "ton"

const loginMethodOptions: LoginMethod[] = ["email", "web3", "ton"]

interface Config {
  baseUrl: string
  type: EmbedType
  theme: EmbedTheme
  language: string
  partner: string
  email: string
  loginMethods: LoginMethod[]
  width: string
  height: string
  showBorder: boolean
}

const defaultConfig: Config = {
  baseUrl: "http://localhost:3000/embed",
  type: "both",
  theme: "light",
  language: "en",
  partner: "",
  email: "",
  loginMethods: ["email"],
  width: "480px",
  height: "720px",
  showBorder: true,
}

function buildUrl(config: Config): string {
  const params = new URLSearchParams()
  if (config.type !== "both") params.set("type", config.type)
  if (config.theme) params.set("theme", config.theme)
  if (config.language && config.language !== "en")
    params.set("language", config.language)
  if (config.partner) params.set("partner", config.partner)
  if (config.email) params.set("email", config.email)
  if (
    config.loginMethods.length > 0 &&
    !(config.loginMethods.length === 1 && config.loginMethods[0] === "email")
  ) {
    params.set(
      "loginMethods",
      config.loginMethods.length === 3 ? "all" : config.loginMethods.join(",")
    )
  }
  const qs = params.toString()
  return qs ? `${config.baseUrl}?${qs}` : config.baseUrl
}

export function EmbedPlayground() {
  const [config, setConfig] = React.useState<Config>(defaultConfig)
  const [iframeKey, setIframeKey] = React.useState(0)
  const [copied, setCopied] = React.useState(false)

  const url = React.useMemo(() => buildUrl(config), [config])

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be unavailable (e.g. no secure context)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="lg:sticky lg:top-6 lg:self-start">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Tweak the embed URL and iframe dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Source
            </h3>
            <Field label="Base URL">
              <Input
                value={config.baseUrl}
                onChange={e => update("baseUrl", e.target.value)}
                placeholder="https://unigox.com/embed"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              URL params
            </h3>
            <Field label="Type">
              <NativeSelect
                value={config.type}
                onChange={e => update("type", e.target.value as EmbedType)}
              >
                <option value="both">both</option>
                <option value="buy">buy</option>
                <option value="sell">sell</option>
              </NativeSelect>
            </Field>
            <Field label="Theme">
              <NativeSelect
                value={config.theme}
                onChange={e => update("theme", e.target.value as EmbedTheme)}
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
              </NativeSelect>
            </Field>
            <Field label="Language">
              <Input
                value={config.language}
                onChange={e => update("language", e.target.value)}
                placeholder="en"
              />
            </Field>
            <Field label="Partner">
              <Input
                value={config.partner}
                onChange={e => update("partner", e.target.value)}
                placeholder="acme"
              />
            </Field>
            <Field label="Email">
              <Input
                value={config.email}
                onChange={e => update("email", e.target.value)}
                placeholder="user@example.com"
                type="email"
              />
            </Field>
            <Field label="Login methods">
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
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Iframe
            </h3>
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
                  placeholder="720px"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.showBorder}
                onChange={e => update("showBorder", e.target.checked)}
                className="size-4 rounded border-input"
              />
              <span>Show iframe border</span>
            </label>
          </section>

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

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Live iframe rendering the widget at the URL below
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </div>
          <code className="block overflow-x-auto whitespace-nowrap rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
            {url}
          </code>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center rounded-lg bg-muted/30 p-6">
            <iframe
              key={iframeKey}
              src={url}
              title="Unigox embed widget"
              style={{
                width: config.width,
                height: config.height,
                maxWidth: "100%",
              }}
              className={
                config.showBorder
                  ? "rounded-lg border border-border bg-background shadow-sm"
                  : "rounded-lg bg-background"
              }
              allow="storage-access; publickey-credentials-get *; publickey-credentials-create *; clipboard-read; clipboard-write; payment"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-modals"
            />
          </div>
        </CardContent>
      </Card>
    </div>
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
