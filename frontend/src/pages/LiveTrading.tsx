import { useEffect, useState } from "react"
import PriceChart from "@/components/PriceChart"
import { Loader2, Newspaper, ArrowRight, Sparkles, TrendingUp, TrendingDown, Activity } from "lucide-react"

type NewsItem = {
  id?: string
  title?: string
  context?: string
  link?: string
  sentiment_score?: number
  sentiment?: Record<string, number>
}

const TOKENS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "BNB", name: "BNB" },
]

export default function LiveTrading() {
  const [selected, setSelected] = useState(TOKENS[0])
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [deal, setDeal] = useState<any | null>(null)
  const [dealLoading, setDealLoading] = useState(false)
  const [executionStatus, setExecutionStatus] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true)
      try {
        const res = await fetch("http://127.0.0.1:8000/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: selected.symbol, top_k: 3 }),
        })
        const data = await res.json()
        setNews(data.results || [])
      } catch (err) {
        console.error("Failed to fetch news", err)
        setNews([])
      } finally {
        setNewsLoading(false)
      }
    }
    fetchNews()
  }, [selected])

  useEffect(() => {
    requestDeal()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.symbol])

  const requestDeal = async () => {
    setDealLoading(true)
    setExecutionStatus(null)
    try {
      const res = await fetch("http://127.0.0.1:8000/live-trade/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: selected.symbol,
          prompt: `Provide a live trade idea for ${selected.symbol} considering the latest news and sentiment.`,
        }),
      })
      if (!res.ok) {
        throw new Error(`Planner failed with status ${res.status}`)
      }
      const data = await res.json()
      setDeal(data)
    } catch (err) {
      console.error(err)
      setDeal(null)
    } finally {
      setDealLoading(false)
    }
  }

  const executeTrade = (side: "trade" | "hold") => {
    if (!deal?.trade_plan) return
    if (side === "trade") {
      setExecutionStatus(
        `🎉 Bought ${deal.trade_plan.amount} ${deal.trade_plan.asset}. Reloading...`
      )
    } else {
      setExecutionStatus("⏸ Holding for the next deal. Reloading…")
    }
    setTimeout(() => {
      requestDeal()
    }, 1200)
  }

  const truncate = (text?: string, limit = 150) => {
    if (!text) return ""
    if (text.length <= limit) return text
    return text.slice(0, limit).trimEnd() + "…"
  }

  const sentimentMeta = (score?: number) => {
    if (typeof score !== "number") {
      return { label: "Neutral", color: "text-gray-300", bg: "bg-neutral-900/70", border: "border-neutral-800", Icon: Activity }
    }
    if (score >= 0.15) {
      return { label: "Bullish", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", Icon: TrendingUp }
    }
    if (score <= -0.15) {
      return { label: "Bearish", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", Icon: TrendingDown }
    }
    return { label: "Neutral", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-400/30", Icon: Activity }
  }

  const meanSentiment =
    news.length > 0
      ? news.reduce((sum, item) => sum + Number(item.sentiment_score || 0), 0) / news.length
      : null

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white p-10 space-y-10">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Live Trading Desk</p>
            <h1 className="text-4xl font-bold">Real-time strategy</h1>
          </div>
          <div className="flex gap-3">
            <select
              value={selected.symbol}
              onChange={(e) => {
                const pick = TOKENS.find((t) => t.symbol === e.target.value)
                if (pick) setSelected(pick)
              }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
            >
              {TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <button
              onClick={requestDeal}
              className="px-4 py-2 rounded-2xl bg-white text-black text-sm font-semibold flex items-center gap-2"
              disabled={dealLoading}
            >
              {dealLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Refresh suggestion
            </button>
          </div>
        </div>
        <p className="text-gray-400 max-w-3xl">
          Monitor {selected.name} with live price context, curated news, and an AI assistant that proposes
          actionable trades you can accept or ignore.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <PriceChart symbol={selected.symbol} name={selected.name} />
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#587BFA]" />
              <h2 className="text-xl font-semibold">Latest context</h2>
            </div>
            {newsLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching news…
              </div>
            ) : (
              <div className="space-y-3">
                {news.map((item) => {
                  const meta = sentimentMeta(item.sentiment_score)
                  const Icon = meta.Icon
                  return (
                    <a
                      key={item.id || item.link}
                      href={item.link || "#"}
                      target={item.link ? "_blank" : "_self"}
                      rel="noreferrer"
                      className="block rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 hover:border-[#587BFA] transition"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">
                          {item.title || "Untitled post"}
                        </p>
                        <div className={`px-2 py-1 rounded-full border ${meta.border} ${meta.bg} flex items-center gap-1`}>
                          <Icon className={`w-3 h-3 ${meta.color}`} />
                          <span className={`text-[11px] ${meta.color}`}>
                            {(item.sentiment_score ?? 0).toFixed(2)} {meta.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{truncate(item.context, 160)}</p>
                      {item.link && (
                        <span className="text-[11px] text-[#587BFA] flex items-center gap-1 mt-2">
                          Read source <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </a>
                  )
                })}
                {news.length === 0 && (
                  <p className="text-sm text-gray-500">No recent news found for {selected.symbol}.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-2">
            <p className="text-sm uppercase tracking-wide text-gray-500">Aggregate sentiment</p>
            {meanSentiment !== null ? (
              <p className="text-3xl font-semibold text-white">
                {meanSentiment.toFixed(2)}{" "}
                <span className="text-sm text-gray-400">({sentimentMeta(meanSentiment).label})</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">Waiting for news…</p>
            )}
            {deal?.analysis && (
              <p className="text-xs text-gray-500">
                AI reasoning: {truncate(deal.analysis, 200)}
              </p>
            )}
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#587BFA]" />
              <h2 className="text-xl font-semibold">Agentic deal</h2>
            </div>
            {dealLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating setup…
              </div>
            )}
            {deal?.trade_plan ? (
              <div className="rounded-2xl border border-[#587BFA]/40 bg-[#0f1b3a] p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">Agentic deal</p>
                  <span className="text-xs text-gray-400">
                    Confidence {(deal.trade_plan.confidence || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-gray-200 text-2xl font-semibold tracking-wide">
                  {deal.trade_plan.side?.toUpperCase()} {deal.trade_plan.amount} {deal.trade_plan.asset}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => executeTrade("trade")}
                    className="flex-1 px-4 py-3 rounded-2xl bg-white text-black text-sm font-semibold"
                  >
                    Trade
                  </button>
                  <button
                    onClick={() => executeTrade("hold")}
                    className="flex-1 px-4 py-3 rounded-2xl bg-neutral-800 text-gray-300 text-sm font-semibold"
                  >
                    Hold
                  </button>
                </div>
                {executionStatus && (
                  <p
                    className={`text-xs ${
                      executionStatus.startsWith("🎉") ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {executionStatus}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-gray-400">
                Agent is preparing a deal…
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  )
}
