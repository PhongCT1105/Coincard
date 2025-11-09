// Home.tsx
"use client"
import Topbar from "@/components/Topbar"
import CryptoList from "@/components/CryptoList"
import DepositPanel from "@/components/DepositPanel"
import BalanceCard from "@/components/BalanceCard"
import { useState } from "react"

export default function Home() {
  const [showAll, setShowAll] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<{ name: string; price: number; thumb_image: string } | null>(null)

  const handleSelectCoin = (coin: { name: string; price: number; thumb_image: string }) => {
    setSelectedCoin(coin)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-white w-full overflow-hidden">
      <div className="w-full px-10 py-5 border-b border-gray-800">
        <Topbar showAll={showAll} setShowAll={setShowAll} />
      </div>

      <div className="flex flex-1 px-10 gap-8">
        {/* LEFT 69% */}
        <div className="w-[69%] border-r border-gray-800 pr-8">
          <BalanceCard />
          <CryptoList
            showAll={showAll}
            setShowAll={setShowAll}
            onSelectCoin={handleSelectCoin}
          />
        </div>

        {/* RIGHT 31% */}
        <div className="w-[31%]">
          <DepositPanel
            selectedCoin={selectedCoin}
            onSelectCoin={handleSelectCoin}
          />
        </div>
      </div>
    </div>
  )
}
