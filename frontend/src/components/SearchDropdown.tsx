"use client"

interface Coin {
  NAME: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  THUMB_IMAGE: string
}

interface SearchDropdownProps {
  search: string
  coins: Coin[]
  onSelectCoin: (coin: { name: string; price: number; thumb_image: string }) => void
}

export default function SearchDropdown({ search, coins, onSelectCoin }: SearchDropdownProps) {
  // if data not ready yet, show nothing (or a tiny loader if you want)
  if (!coins || coins.length === 0) {
    return (
      <div className="absolute top-12 left-0 bg-[#0d0d0d] w-[420px] rounded-2xl border border-gray-800 text-white shadow-lg z-50">
        <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  const filtered =
    search.trim() === ""
      ? coins.slice(0, 5) // default top 5
      : coins
          .filter((c) => c.NAME.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 5)

  return (
    <div className="absolute top-12 left-0 bg-[#0d0d0d] w-[420px] rounded-2xl border border-gray-800 text-white shadow-lg z-50">
      {filtered.map((coin) => (
        <div
          key={coin.NAME}
          onClick={() =>
            onSelectCoin({
              name: coin.NAME,
              price: coin.PRICE,
              thumb_image: coin.THUMB_IMAGE,
            })
          }
          className="flex items-center justify-between px-4 py-3 cursor-pointer transition"
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
  )
}

function formatMarketCap(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + "T"
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
  return v.toLocaleString()
}