"use client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Transaction {
  transaction_id: string
  symbol: string
  transaction_type: string
  amount_coin: number
  price_per_coin: number
  total_usd: number
  timestamp: string
}

interface Coin {
  SYMBOL: string
  THUMB_IMAGE: string
}

export default function TransactionList({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [coinMap, setCoinMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, coinsRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/portfolio/${userId}/history`),
          fetch(`http://127.0.0.1:8000/crypto/top-20-coins`),
        ])

        const txData: Transaction[] = await txRes.json()
        const coinsJson = await coinsRes.json()
        const coins: Coin[] = coinsJson.data || []

        const map: Record<string, string> = {}
        coins.forEach((c) => (map[c.SYMBOL] = c.THUMB_IMAGE))

        setCoinMap(map)
        setTransactions(txData)
      } catch (err) {
        console.error("Error fetching transaction or coin data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const totalPages = Math.ceil(transactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = transactions.slice(startIndex, endIndex)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatAmount = (usd: number) =>
    `${usd >= 0 ? "+" : "-"}$${Math.abs(usd).toFixed(2)}`

  if (loading) {
    return (
      <div className="w-full text-white">
        <div className="space-y-6 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-4 border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-4 rounded-md" />
                  <Skeleton className="w-20 h-3 rounded-md" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="w-16 h-4 rounded-md" />
                <Skeleton className="w-20 h-3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (transactions.length === 0)
    return <p className="text-gray-400 text-center mt-10">No transactions found.</p>

  return (
    <div className="w-full text-white">
      <h2 className="text-xl font-semibold mb-4 mt-8">Transaction History</h2>
      <div className="space-y-4">
        {paginatedData.map((tx) => {
          const isPositive = tx.total_usd >= 0
          const icon = coinMap[tx.symbol] || "/coin.png"
          return (
            <div
              key={tx.transaction_id}
              className="flex justify-between items-center py-5 border-b border-gray-800"
            >
              {/* Left: Icon + Name */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <img
                  src={icon}
                  className="w-9 h-9 rounded-full object-contain"
                  alt={tx.symbol}
                />
                <p className="font-semibold capitalize">
                  {tx.transaction_type === "BUY"
                    ? `Bought ${tx.symbol}`
                    : tx.transaction_type === "SELL"
                      ? `Sold ${tx.symbol}`
                      : `Converted to ${tx.symbol}`}
                </p>
              </div>

              {/* Middle: Value + Coin amount */}
              <div className="text-left min-w-[120px]">
                <p
                  className={`font-semibold ${isPositive ? "text-green-400" : "text-red-400"
                    }`}
                >
                  {formatAmount(tx.total_usd)}
                </p>
                <p className="text-gray-400 text-sm">
                  {tx.amount_coin > 0 ? `+${tx.amount_coin.toFixed(6)} ${tx.symbol}` : ""}
                </p>
              </div>

              {/* Right: Date */}
              <div className="text-right text-white font-light min-w-[100px]">
                {formatDate(tx.timestamp)}
              </div>
            </div>

          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(i + 1)
                    }}
                    className={`px-3 py-1 rounded-md transition ${currentPage === i + 1
                      ? "bg-white text-black font-semibold"
                      : "text-gray-300 hover:text-black"
                      }`}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {totalPages > 3 && <PaginationEllipsis />}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }}
                />
              </PaginationItem>
            </PaginationContent>

          </Pagination>
        </div>
      )}
    </div>
  )
}
