"use client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocation } from "wouter"
import { persistCoinSnapshot } from "@/lib/coinSelection"

interface Coin {
  NAME: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  THUMB_IMAGE: string
  SYMBOL: string
  VOLUME: number
  TIMESTAMP: string
}

interface CryptoListProps {
  showAll: boolean
  setShowAll: (v: boolean) => void
  onSelectCoin: (coin: { name: string; price: number; thumb_image: string; symbol: string }) => void
}

export default function CryptoList({ showAll, setShowAll, onSelectCoin }: CryptoListProps) {
  const [cryptos, setCryptos] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"Market cap" | "Top gainers" | "Top losers">("Market cap")
  const [, navigate] = useLocation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/crypto/top-20-coins")
        const json = await res.json()
        const data: Coin[] = json.data || []
        setCryptos(sortCoins(data, "Market cap"))
      } catch (err) {
        console.error("Error fetching crypto list:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const sortCoins = (list: Coin[], criteria: typeof sortBy): Coin[] => {
    const sorted = [...list]
    switch (criteria) {
      case "Market cap":
        sorted.sort((a, b) => b.MARKET_CAP - a.MARKET_CAP)
        break
      case "Top gainers":
        sorted.sort((a, b) => b.CHANGE - a.CHANGE)
        break
      case "Top losers":
        sorted.sort((a, b) => a.CHANGE - b.CHANGE)
        break
    }
    return sorted
  }

  const handleSort = (criteria: typeof sortBy) => {
    setSortBy(criteria)
    setCryptos((prev) => sortCoins(prev, criteria))
  }

  const formatNumber = (v: number): string => {
    if (v >= 1e12) return (v / 1e12).toFixed(2) + "T"
    if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
    if (v >= 1e3) return (v / 1e3).toFixed(2) + "K"
    return v.toString()
  }

  const navigateToDetails = (coin: Coin) => {
    persistCoinSnapshot(coin)
    onSelectCoin({
      name: coin.NAME,
      price: coin.PRICE,
      thumb_image: coin.THUMB_IMAGE,
      symbol: coin.SYMBOL,
    })
    const slug = encodeURIComponent(coin.SYMBOL || coin.NAME)
    navigate(`/coin/${slug}`, { state: coin })
  }

  const displayList = showAll ? cryptos : cryptos.slice(0, 5)

  if (loading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-32 h-4" />
          </div>
        ))}
      </div>
    )

  return (
    <div className="py-5 text-gray-200">
      {/* Sorting Buttons */}
      <div className="flex gap-3 mb-6">
        {["Market cap", "Top gainers", "Top losers"].map((filter) => (
          <button
            key={filter}
            onClick={() => handleSort(filter as typeof sortBy)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              sortBy === filter
                ? "bg-white text-black"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="grid grid-cols-7 text-gray-500 text-sm pb-2">
        <div className="col-span-2">Name</div>
        <div className="text-left">Price</div>
        <div className="text-left">Volume</div>
        <div className="text-left">Market Cap</div>
        <div className="text-left">Change</div>
        <div className="text-left pr-2"></div>
      </div>

      {/* Rows */}
      <div className="mt-1">
        {displayList.map((coin) => (
          <div
            key={coin.NAME}
            role="button"
            tabIndex={0}
            onClick={() => navigateToDetails(coin)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                navigateToDetails(coin)
              }
            }}
            className="grid grid-cols-7 items-center py-5 w-full flex-1 hover:bg-neutral-900 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
          >
            {/* Name */}
            <div className="flex items-center gap-3 col-span-2">
              <img
                src={coin.THUMB_IMAGE}
                alt={coin.NAME}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-medium">{coin.NAME}</p>
                <p className="text-sm text-gray-400">{coin.SYMBOL}</p>
              </div>
            </div>

            {/* Price */}
            <p className="text-left">${coin.PRICE.toLocaleString()}</p>

            {/* Volume */}
            <p className="text-left">{formatNumber(coin.VOLUME)}</p>

            {/* Market Cap */}
            <p className="text-left">{formatNumber(coin.MARKET_CAP)}</p>

            {/* Change */}
            <p
              className={`text-left ${
                coin.CHANGE >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {coin.CHANGE.toFixed(2)}%
            </p>

            {/* Buy Button */}
            <div className="text-left pr-2">
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectCoin({
                    name: coin.NAME,
                    price: coin.PRICE,
                    thumb_image: coin.THUMB_IMAGE,
                    symbol: coin.SYMBOL,
                  })
                }}
                className="px-4 py-1 text-sm rounded-full text-[#587BFA] font-medium cursor-pointer hover:text-[#3b6ef0] transition"
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Browse All */}
      {!showAll && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 cursor-pointer bg-neutral-800 rounded-full text-gray-300 hover:bg-[#011D5B] hover:text-[#587BFA] transition"
          >
            Browse all
          </button>
        </div>
      )}
    </div>
  )
}
