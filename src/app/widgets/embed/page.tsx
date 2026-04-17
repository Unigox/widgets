import { EmbedPlayground } from "./embed-playground"

export default function EmbedWidgetPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Embed widget</h1>
        <p className="text-sm text-muted-foreground">
          Sandbox for testing the <code>/embed</code> route from unigox.com
        </p>
      </div>
      <EmbedPlayground />
    </div>
  )
}
