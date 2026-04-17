"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface WidgetTab {
  slug: string
  label: string
  description?: string
}

export const widgetTabs: WidgetTab[] = [
  {
    slug: "embed",
    label: "Embed",
    description: "Full buy/sell widget embedded via iframe",
  },
]

export function WidgetsNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Widgets"
      className="flex items-center gap-1 border-b border-border px-6"
    >
      {widgetTabs.map(tab => {
        const href = `/widgets/${tab.slug}`
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={tab.slug}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-10 items-center px-3 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}
