"use client"
import { useEffect, useState } from "react"

interface Coin {
  NAME: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  TIMESTAMP: string
}

export default function AllCryptos() {
  const [cryptos, setCryptos] = useState<Coin[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch("http://127.0.0.1:8000/crypto/top-20-coins")
      const json = await res.json()
      setCryptos(json.data || [])
    }
    fetchAll()
  }, [])

  const formatMarketCap = (v: number): string => {
    if (v >= 1e12) return (v / 1e12).toFixed(2) + "T"
    if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
    return v.toLocaleString()
  }

  return (
    <div className="bg-[#0d0d0d] rounded-xl p-6 text-gray-200 min-h-screen">
      <h2 className="text-xl font-semibold mb-6">All Cryptocurrencies</h2>

      <div className="grid grid-cols-5 text-gray-500 text-sm pb-2 border-b border-neutral-800">
        <div className="col-span-2">Name</div>
        <div>Price</div>
        <div>Market Cap</div>
        <div>Change</div>
      </div>

      <div className="divide-y divide-neutral-800">
        {cryptos.map((coin) => (
          <div key={coin.NAME} className="grid grid-cols-5 items-center py-3 hover:bg-neutral-900 transition">
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
            <p className={coin.CHANGE >= 0 ? "text-green-400" : "text-red-400"}>
              {coin.CHANGE.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
