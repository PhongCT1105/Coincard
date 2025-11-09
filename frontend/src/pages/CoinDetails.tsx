import { Link, useParams } from "wouter"
import { useHistoryState } from "wouter/use-browser-location"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Star } from "lucide-react"
import { CoinSnapshot, persistCoinSnapshot, readCoinSnapshot } from "@/lib/coinSelection"
import TokenNews, { NewsDoc } from "@/components/TokenNews"
import PriceChart from "@/components/PriceChart"
import ChatPanel from "@/components/ChatPanel"

const formatCurrency = (value: number) =>
  Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)

const formatCompact = (value: number) =>
  Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value)

export default function CoinDetails() {
  const params = useParams<{ symbol: string }>()
  const historyCoin = useHistoryState<CoinSnapshot | null>()
  const [coin, setCoin] = useState<CoinSnapshot | null>(() => historyCoin ?? readCoinSnapshot())
  const [newsDocs, setNewsDocs] = useState<NewsDoc[]>([])

  useEffect(() => {
    if (historyCoin?.NAME) {
      setCoin(historyCoin)
    }
  }, [historyCoin])

  useEffect(() => {
    if (coin) {
      persistCoinSnapshot(coin)
    }
  }, [coin])

  const changeBadge = useMemo(() => {
    if (!coin) return ""
    const sign = coin.CHANGE >= 0 ? "+" : ""
    return `${sign}${coin.CHANGE.toFixed(2)}%`
  }, [coin])

  if (!coin) {
    return (
      <div className="p-10 text-gray-300 space-y-4">
        <p className="text-2xl font-semibold">We could not find details for this asset.</p>
        <p className="text-sm text-gray-500">
          Try selecting the coin from the Trade list again to refresh its cached details.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold text-xl text-[#587BFA] hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trade
        </Link>
      </div>
    )
  }

  const updatedAt = new Date(coin.TIMESTAMP)
  const tokenKey = (coin.SYMBOL || params?.symbol || coin.NAME || "").toUpperCase()
  const stats = [
    { label: "Market cap", value: formatCompact(coin.MARKET_CAP) },
    { label: "24h volume", value: formatCompact(coin.VOLUME) },
    { label: "Last price", value: formatCurrency(coin.PRICE) },
    { label: "Change (24h)", value: changeBadge },
  ]

  return (
    <div className="p-8 text-white space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold text-white hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          Back to Trade
        </Link>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800 text-sm hover:bg-neutral-700 transition">
          <Star className="h-4 w-4" />
          Watchlist
        </button>
      </div>

      <section className="bg-neutral-900 rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={coin.THUMB_IMAGE} alt={coin.NAME} className="w-16 h-16 rounded-full" />
            <div>
              <p className="text-3xl font-semibold">{coin.NAME}</p>
              <p className="text-gray-400 uppercase tracking-wide">{params?.symbol || coin.SYMBOL}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold">{formatCurrency(coin.PRICE)}</p>
            <p
              className={`text-sm font-medium ${
                coin.CHANGE >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {changeBadge}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">Updated {updatedAt.toLocaleString()}</div>
      </section>

      {tokenKey && <PriceChart symbol={tokenKey} name={coin.NAME} />}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="bg-neutral-900 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Balance</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-xl bg-neutral-800/80 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="text-2xl font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">About {coin.NAME}</h2>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Insights</span>
          </div>
          <p className="text-sm text-gray-300 leading-6">
            {coin.NAME} ({coin.SYMBOL}) is currently trading near {formatCurrency(coin.PRICE)} with a market
            capitalization of {formatCompact(coin.MARKET_CAP)}. The latest trading session recorded{" "}
            {coin.CHANGE >= 0 ? "an uptick" : "a pullback"} of {changeBadge}, driven by {coin.VOLUME ? "spot volume of approximately " + formatCompact(coin.VOLUME) : "recent order flow"}.
          </p>
          <p className="text-sm text-gray-500">
            Use this page to keep an eye on the asset&apos;s balance, price action, and quick stats without losing the
            context from the trade dashboard.
          </p>
        </div>
      </section>

      {tokenKey && (
        <>
          <TokenNews token={tokenKey} onDocsReady={setNewsDocs} />
          <ChatPanel token={tokenKey} docs={newsDocs} />
        </>
      )}
    </div>
  )
}
