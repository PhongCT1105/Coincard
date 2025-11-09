
"use client"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import SearchDropdown from "./SearchDropdown"

type Coin = {
  NAME: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  THUMB_IMAGE: string
}

interface TopbarProps {
  showAll: boolean
  setShowAll: (v: boolean) => void
  activeSection: string
}

export default function Topbar({ showAll, setShowAll, activeSection }: TopbarProps) {
  const [search, setSearch] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [coins, setCoins] = useState<Coin[]>([])
  const searchAreaRef = useRef<HTMLDivElement>(null)

  // fetch once, reuse
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/crypto/top-20-coins")
        const json = await res.json()
        const data: Coin[] = json.data || []
        data.sort((a, b) => b.MARKET_CAP - a.MARKET_CAP)
        setCoins(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  // click outside = close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelectCoin = (coin: { name: string; price: number; thumb_image: string }) => {
    console.log("Selected coin:", coin)
    setShowSearch(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {showAll ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAll(false)}
              className="p-2 hover:bg-neutral-800 rounded-3xl transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-semibold text-white">All Crypto</h1>
          </div>
        ) : (
          <h1 className="text-3xl font-semibold text-white balance-number">
            {activeSection === "Transactions" ? "Transactions" : "Home"}
          </h1>
        )}


        <div ref={searchAreaRef} className="flex items-center gap-4 relative">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onFocus={() => setShowSearch(true)}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowSearch(true)
            }}
            className="bg-neutral-900 text-white placeholder-gray-400 rounded-full px-5 py-2 w-[420px] focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
          />
          <div className="flex items-center justify-center bg-[#14213d] text-white w-10 h-10 rounded-full font-semibold">
            D
          </div>

          {showSearch && (
            <SearchDropdown
              search={search}
              coins={coins}
              onSelectCoin={handleSelectCoin}
            />
          )}
        </div>
      </div>
    </div>
  )
}
