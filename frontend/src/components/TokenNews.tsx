import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

type NewsDoc = {
  id?: string
  title?: string
  context?: string
  link?: string
  sentiment_score?: number
  sentiment?: Record<string, number>
}

interface TokenNewsProps {
  token: string
}

const endpoint = "http://127.0.0.1:8000/news"

const formatHost = (url?: string) => {
  if (!url) return "Newswire"
  try {
    const host = new URL(url).hostname.replace("www.", "")
    return host
  } catch {
    return "Newswire"
  }
}

const truncate = (text?: string, limit = 160) => {
  if (!text) return "No summary available."
  if (text.length <= limit) return text
  return text.slice(0, limit).trimEnd() + "…"
}

const getSentimentMeta = (score?: number) => {
  if (typeof score !== "number") {
    return {
      label: "Neutral",
      color: "text-gray-300",
      bg: "bg-neutral-900/70",
      border: "border-gray-700",
      Icon: Activity,
    }
  }
  if (score >= 0.15) {
    return {
      label: "Bullish",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      Icon: TrendingUp,
    }
  }
  if (score <= -0.15) {
    return {
      label: "Bearish",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      Icon: TrendingDown,
    }
  }
  return {
    label: "Neutral",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-400/30",
    Icon: Activity,
  }
}

export default function TokenNews({ token }: TokenNewsProps) {
  const [docs, setDocs] = useState<NewsDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, top_k: 3 }),
        })
        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) {
          setDocs((data?.results || []).slice(0, 3))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch token news.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <section className="bg-neutral-900 rounded-2xl p-6 space-y-4 border border-neutral-800/50">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">News</p>
          <p className="text-xs uppercase tracking-wide text-gray-500">Latest for {token.toUpperCase()}</p>
        </div>
        {docs.length > 0 && (
          <a
            href={`https://news.google.com/search?q=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-green-400 hover:text-green-300 transition"
          >
            Show more
          </a>
        )}
      </header>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl bg-neutral-800/60 h-20" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/40 rounded-xl p-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {docs.map((doc) => (
            <a
              key={doc.id ?? doc.link ?? doc.title}
              href={doc.link || "#"}
              target={doc.link ? "_blank" : undefined}
              rel="noreferrer"
              className="flex gap-4 rounded-2xl bg-neutral-800/60 px-4 py-5 hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
            >
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {formatHost(doc.link)} • {token.toUpperCase()}
                </p>
                <p className="text-base font-semibold mt-1">{doc.title || "Untitled update"}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {truncate(doc.context)}
                </p>
              </div>
              <div className="hidden sm:flex w-32 items-center justify-center">
                {(() => {
                  const meta = getSentimentMeta(doc.sentiment_score)
                  const scoreLabel =
                    typeof doc.sentiment_score === "number"
                      ? `${doc.sentiment_score >= 0 ? "+" : ""}${doc.sentiment_score.toFixed(2)}`
                      : "--"
                  const Icon = meta.Icon
                  return (
                    <div className={`w-full rounded-xl ${meta.bg} ${meta.border} border px-3 py-3 flex flex-col items-center gap-1`}>
                      <Icon className={`${meta.color} h-5 w-5`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-gray-400">Score {scoreLabel}</span>
                    </div>
                  )
                })()}
              </div>
            </a>
          ))}

          {docs.length === 0 && (
            <p className="text-sm text-gray-500">
              No recent documents for {token}. Try again later for more updates.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
