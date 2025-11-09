"use client"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"

interface Coin {
  NAME: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  SYMBOL: string
  THUMB_IMAGE: string
}

export default function CoinSearchPanel({ onBack, onSelectCoin }) {
  const [search, setSearch] = useState("")
  const [coins, setCoins] = useState<Coin[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/crypto/top-20-coins")
        const json = await res.json()
        const data: Coin[] = json.data || []
        data.sort((a, b) => b.MARKET_CAP - a.MARKET_CAP)
        setCoins(data)
      } catch (err) {
        console.error("Error fetching coins:", err)
      }
    }
    fetchData()
  }, [])

  const filtered =
    search.trim() === ""
      ? coins.slice(0, 5)
      : coins
          .filter((c) => c.NAME.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 5)

  return (
    <div className="bg-[#0d0d0d] rounded-xl pt-3 text-white">
      {/* Header */}
      <div className="flex items-center mb-6 relative">
        <button
          onClick={onBack}
          className="p-2 hover:bg-neutral-800 rounded-full transition absolute left-0"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold w-full text-center">Select asset to buy</h2>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search crypto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-5 py-3 mb-4 rounded-full bg-neutral-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
      />

      {/* List */}
      <div className="space-y-1">
        {filtered.map((coin) => (
          <div
            key={coin.NAME}
            onClick={() => onSelectCoin({
              name: coin.NAME,
              price: coin.PRICE,
              thumb_image: coin.THUMB_IMAGE,
              symbol: coin.SYMBOL,
            })}
            className="flex items-center justify-between px-4 py-3 hover:bg-neutral-800 cursor-pointer rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <img src={coin.THUMB_IMAGE} alt={coin.NAME} className="w-8 h-8 rounded-full" />
              <div>
                <p className="font-medium">{coin.NAME}</p>
                <p className="text-sm text-gray-500">{formatMarketCap(coin.MARKET_CAP)} mcap</p>
              </div>
            </div>

            <div className="text-right">
              <p>${coin.PRICE.toLocaleString()}</p>
              <p className={`${coin.CHANGE >= 0 ? "text-green-400" : "text-red-400"} text-sm`}>
                {coin.CHANGE.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatMarketCap(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + "T"
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
  return v.toLocaleString()
}