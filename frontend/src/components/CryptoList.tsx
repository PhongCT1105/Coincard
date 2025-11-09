"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocation } from "wouter"
import { persistCoinSnapshot } from "@/lib/coinSelection"
import { useAuth } from "@/context/AuthContext"

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

type SortFilter = "Market cap" | "Top gainers" | "Top losers" | "Style match"

interface CryptoListProps {
  showAll: boolean
  setShowAll: (v: boolean) => void
  onSelectCoin: (coin: { name: string; price: number; thumb_image: string; symbol: string }) => void
}

export default function CryptoList({ showAll, setShowAll, onSelectCoin }: CryptoListProps) {
  const [cryptos, setCryptos] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortFilter>("Market cap")

  const [styleOrder, setStyleOrder] = useState<string[]>([])
  const [styleMeta, setStyleMeta] = useState<Record<string, { score: number; trader?: string }>>({})
  const [styleCoins, setStyleCoins] = useState<Coin[]>([])
  const [styleLoading, setStyleLoading] = useState(false)
  const [styleError, setStyleError] = useState<string | null>(null)
  const [styleUser, setStyleUser] = useState<string | null>(null)

  const [, navigate] = useLocation()
  const { user } = useAuth()
  const userId = user?.user_id || "U01"

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

  useEffect(() => {
    if (!styleOrder.length) return
    const ranked = cryptos
      .filter((coin) => styleOrder.includes((coin.SYMBOL || "").toUpperCase()))
      .sort(
        (a, b) =>
          styleOrder.indexOf((a.SYMBOL || "").toUpperCase()) -
          styleOrder.indexOf((b.SYMBOL || "").toUpperCase()),
      )
    setStyleCoins(ranked)
  }, [styleOrder, cryptos])

  const sortCoins = (list: Coin[], criteria: SortFilter): Coin[] => {
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

  const handleSort = (criteria: SortFilter) => {
    setSortBy(criteria)
    if (criteria !== "Style match") {
      setCryptos((prev) => sortCoins(prev, criteria))
    }
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

  const fetchStyleRecommendations = useCallback(async () => {
    setStyleLoading(true)
    setStyleError(null)
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/behavioral/style?user_id=${encodeURIComponent(userId)}`
      )
      if (!res.ok) {
        throw new Error(`Behavioral agent returned ${res.status}`)
      }
      const data = await res.json()
      const recs = (data.recommendations || []).filter((r: any) => r?.symbol)
      const order = recs.map((r: any) => String(r.symbol).toUpperCase())
      const meta: Record<string, { score: number; trader?: string }> = {}
      recs.forEach((r: any) => {
        if (r?.symbol) {
          meta[String(r.symbol).toUpperCase()] = {
            score: Number(r.relevance ?? r.similarity ?? 0),
            trader: r.trader_type,
          }
        }
      })
      setStyleOrder(order)
      setStyleMeta(meta)
      setStyleUser(userId)
    } catch (err) {
      setStyleError(err instanceof Error ? err.message : "Failed to personalize ranking.")
      setStyleOrder([])
      setStyleMeta({})
      setStyleCoins([])
    } finally {
      setStyleLoading(false)
    }
  }, [userId])

  const hasStyleOrder = styleOrder.length > 0

  useEffect(() => {
    if (sortBy === "Style match") {
      const shouldRefetch = styleUser !== userId || !hasStyleOrder
      if (shouldRefetch && !styleLoading) {
        fetchStyleRecommendations()
      }
    }
  }, [sortBy, userId, styleUser, hasStyleOrder, styleLoading, fetchStyleRecommendations])

  const displayList = useMemo(() => {
    if (sortBy === "Style match") {
      return showAll ? styleCoins : styleCoins.slice(0, 5)
    }
    return showAll ? cryptos : cryptos.slice(0, 5)
  }, [sortBy, showAll, styleCoins, cryptos])

  const filters: SortFilter[] = ["Market cap", "Top gainers", "Top losers", "Style match"]

  const renderRows = () => {
    if (loading) {
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
    }

    if (sortBy === "Style match") {
      if (styleLoading) {
        return (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between py-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-2/3 h-4" />
              </div>
            ))}
          </div>
        )
      }
      if (styleError) {
        return <p className="text-sm text-red-400">{styleError}</p>
      }
      if (!styleCoins.length) {
        return <p className="text-sm text-gray-500">Not enough trading history to personalize yet.</p>
      }
    }

    return (
      <div className="mt-1">
        {displayList.map((coin) => (
          <div
            key={`${coin.NAME}-${sortBy}`}
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
            <div className="flex items-center gap-3 col-span-2">
              <img src={coin.THUMB_IMAGE} alt={coin.NAME} className="w-8 h-8 rounded-full" />
              <div>
                <p className="font-medium">{coin.NAME}</p>
                <p className="text-sm text-gray-400">{coin.SYMBOL}</p>
              </div>
            </div>

            <p className="text-left">${coin.PRICE.toLocaleString()}</p>
            <p className="text-left">{formatNumber(coin.VOLUME)}</p>
            <p className="text-left">{formatNumber(coin.MARKET_CAP)}</p>

            {sortBy === "Style match" ? (
              <div className="text-left">
                <p className="text-amber-300 font-semibold">
                  {(styleMeta[(coin.SYMBOL || "").toUpperCase()]?.score ?? 0).toFixed(2)}
                </p>
                {styleMeta[(coin.SYMBOL || "").toUpperCase()]?.trader && (
                  <p className="text-xs text-gray-500">
                    {styleMeta[(coin.SYMBOL || "").toUpperCase()]?.trader}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-left ${coin.CHANGE >= 0 ? "text-green-400" : "text-red-400"}`}>
                {coin.CHANGE.toFixed(2)}%
              </p>
            )}

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
    )
  }

  return (
    <div className="py-5 text-gray-200">
      <div className="flex gap-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleSort(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              sortBy === filter ? "bg-white text-black" : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 text-gray-500 text-sm pb-2">
        <div className="col-span-2">Name</div>
        <div className="text-left">Price</div>
        <div className="text-left">Volume</div>
        <div className="text-left">Market Cap</div>
        <div className="text-left">{sortBy === "Style match" ? "Relevance" : "Change"}</div>
        <div className="text-left pr-2"></div>
      </div>

      {renderRows()}

      {!showAll && sortBy !== "Style match" && (
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