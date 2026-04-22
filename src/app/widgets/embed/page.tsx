import { EmbedPlayground } from "./embed-playground"

export default function EmbedWidgetPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Embed widget</h1>
        <p className="text-sm text-muted-foreground">
          Configure the widget and preview it live.
        </p>
      </div>
      <EmbedPlayground />
    </div>
  )
}
