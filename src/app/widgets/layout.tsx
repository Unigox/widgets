import Image from "next/image"
import Link from "next/link"

// import { WidgetsNav } from "@/components/widgets-nav"

export default function WidgetsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col bg-design-blue-400">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-white px-6">
        <Link
          href="/"
          aria-label="Unigox"
          className="flex items-center"
        >
          <Image
            src="/images/logo-dark.svg"
            alt="Unigox"
            width={96}
            height={22}
            priority
            className="h-6 w-auto"
          />
        </Link>
        <span className="text-xs text-muted-foreground">
          Widgets · Integration playground
        </span>
      </header>
      {/* <WidgetsNav /> */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
