import Link from "next/link"

import { WidgetsNav } from "@/components/widgets-nav"

export default function WidgetsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <Link href="/" className="text-sm font-semibold">
          Unigox Widgets
        </Link>
        <span className="ml-2 text-xs text-muted-foreground">
          Integration playground
        </span>
      </header>
      <WidgetsNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
