import { useEffect, useState } from "react"

export default function BalanceCard() {
  const [balance, setBalance] = useState<number | null>(null)
  const userId = "user_123" // replace with dynamic user id (from auth/session)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch(`http://localhost:8000/portfolio/U01`)
        if (!res.ok) throw new Error("Failed to fetch portfolio")
        const data = await res.json()
        setBalance(data.usd_balance)
      } catch (err) {
        console.error("Error fetching portfolio:", err)
      }
    }

    fetchBalance()
  }, [userId])

  return (
    <div className="text-white rounded-xl py-3 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-5xl balance-number font-light">
            {balance !== null ? `$${balance.toLocaleString()}` : "Loading..."}
          </h2>
        </div>
      </div>

      <div className="w-full h-32 bg-[#0d0d0d] rounded-lg border border-gray-800 flex items-center justify-center text-gray-500 text-sm">
        Chart Placeholder
      </div>
    </div>
  )
}
