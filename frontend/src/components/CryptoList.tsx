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
  onSelectCoin: (coin: {name: string; price: number}) => void
}

export default function CryptoList({ showAll, setShowAll, onSelectCoin }: CryptoListProps) {
  const [cryptos, setCryptos] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"Market cap" | "Top gainers" | "Top losers">("Market cap")

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
            className="flex items-center justify-between py-3"
          >
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-32 h-4" />
          </div>
        ))}
      </div>
    )

  return (
    <div className="py-5 text-gray-200">
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

      {/* Table Header */}
      <div className="grid grid-cols-6 text-gray-500 text-sm pb-2">
        <div className="col-span-2">Name</div>
        <div>Price</div>
        <div className="pl-6">Market Cap</div>
        <div className="pl-12">Change</div>
      </div>

      {/* Table Rows */}
      <div className="mt-1">
        {displayList.map((coin) => (
          <div
            key={coin.NAME}
            className="grid grid-cols-6 items-center py-5 w-full flex-1 hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-3 col-span-2">
              {/* d */}
              <div>
                <p className="font-medium">{coin.NAME}</p>
              </div>
            </div>

            <p>${coin.PRICE.toLocaleString()}</p>
            <p className="pl-6">{formatMarketCap(coin.MARKET_CAP)}</p>
            <p
              className={`pl-12 ${
                coin.CHANGE >= 0 ?  "text-green-400" : "text-red-400"
              }`}
            >
              {coin.CHANGE.toFixed(2)}%
            </p>

            <div className="flex justify-end pr-2">
              <button 
                onClick={() => {
                  console.log("But button pressed: ", {name: coin.NAME, price: coin.PRICE})
                  onSelectCoin({name: coin.NAME, price: coin.PRICE})
                }}
                className="px-4 py-1 cursor-pointer text-sm rounded-full text-[#587BFA] font-medium transition"
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>

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
