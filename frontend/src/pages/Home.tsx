"use client"
import Topbar from "@/components/Topbar"
import CryptoList from "@/components/CryptoList"
import DepositPanel from "@/components/DepositPanel"
import BalanceCard from "@/components/BalanceCard"
import TransactionList from "@/components/TransactionList"
import { AppSidebar } from "@/components/app-sidebar"
import { useState } from "react"

export default function Home() {
  const [showAll, setShowAll] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<{ name: string; price: number; thumb_image: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeSection, setActiveSection] = useState("Home")

  const handleBalanceRefresh = () => setRefreshKey((prev) => prev + 1)
  const handleSelectCoin = (coin: { name: string; price: number; thumb_image: string }) => setSelectedCoin(coin)

  return (
    <div className="flex bg-[#0d0d0d] text-white min-h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <AppSidebar active={activeSection} setActive={setActiveSection} />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <div className="w-full px-10 py-5 border-b border-gray-800">
          <Topbar showAll={showAll} setShowAll={setShowAll} activeSection={activeSection}/>
        </div>

        <div className="flex flex-1 px-10 gap-8">
          <div className="w-[69%] border-r border-gray-800 pr-8">
            {activeSection === "Home" ? (
              <>
                {!showAll && <BalanceCard key={refreshKey} />}
                <CryptoList showAll={showAll} setShowAll={setShowAll} onSelectCoin={handleSelectCoin} />
              </>
            ) : (
              <TransactionList userId="U01" />
            )}
          </div>

          <div className="w-[31%]">
            <DepositPanel
              selectedCoin={selectedCoin}
              onSelectCoin={handleSelectCoin}
              onBalanceUpdate={handleBalanceRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
