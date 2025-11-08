"use client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Coin {
  NAME: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  TIMESTAMP: string
}

interface CryptoListProps {
  showAll: boolean
  setShowAll: (v: boolean) => void
}

export default function CryptoList({ showAll, setShowAll }: CryptoListProps) {
  const [cryptos, setCryptos] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/crypto/top-20-coins")
        const json = await res.json()
        const sorted: Coin[] = (json.data || []).sort(
          (a: Coin, b: Coin) => b.MARKET_CAP - a.MARKET_CAP
        )
        setCryptos(sorted)
      } catch (err) {
        console.error("Error fetching crypto list:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatMarketCap = (v: number): string => {
    if (v >= 1e12) return (v / 1e12).toFixed(2) + "T"
    if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
    return v.toLocaleString()
  }

  const displayList = showAll ? cryptos : cryptos.slice(0, 5)

  if (loading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-neutral-800"
          >
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-32 h-4" />
          </div>
        ))}
      </div>
    )

  return (
    <div className="bg-[#0d0d0d] rounded-xl p-6 text-gray-200">
      {/* Filter bar stays only in Trade view */}
      {!showAll && (
        <div className="flex gap-3 mb-6">
          {["Market cap", "Top gainers", "Top losers"].map((filter) => (
            <button
              key={filter}
              className="px-4 py-2 rounded-full text-sm font-medium bg-neutral-800 hover:bg-[#011D5B] hover:text-[#587BFA] transition"
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 text-gray-500 text-sm pb-2 border-b border-neutral-800">
        <div className="col-span-2">Name</div>
        <div>Price</div>
        <div>Market Cap</div>
        <div>Change</div>
      </div>

      <div className="divide-y divide-neutral-800">
        {displayList.map((coin) => (
          <div
            key={coin.NAME}
            className="grid grid-cols-5 items-center py-3 hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-3 col-span-2">
              <img
                src={`/coin-icons/${coin.NAME.toLowerCase().replace(/\s+/g, "-")}.png`}
                alt={coin.NAME}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                }}
              />
              <div>
                <p className="font-medium">{coin.NAME}</p>
                <p className="text-xs text-gray-500">
                  {new Date(coin.TIMESTAMP).toLocaleString()}
                </p>
              </div>
            </div>
            <p>${coin.PRICE.toLocaleString()}</p>
            <p>{formatMarketCap(coin.MARKET_CAP)}</p>
            <p
              className={
                coin.CHANGE >= 0 ? "text-green-400" : "text-red-400"
              }
            >
              {coin.CHANGE.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      {!showAll && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 bg-neutral-800 rounded-full text-gray-300 hover:bg-[#011D5B] hover:text-[#587BFA] transition"
          >
            Browse all
          </button>
        </div>
      )}
    </div>
  )
}
