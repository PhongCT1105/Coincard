import { Home, LineChart, History } from "lucide-react"
import { useState } from "react"
import AnomalyAlerts from "@/components/AnomalyAlerts";

const items = [
  { title: "Home", url: "#", icon: Home },
  { title: "Trade", url: "#", icon: LineChart },
  { title: "Transactions", url: "#", icon: History },
]

export function AppSidebar() {
  const [active, setActive] = useState("Home")
  
  return (
    <div className="w-64 bg-[#0d0d0d] text-white h-screen flex flex-col">
      <div className="flex flex-col items-center py-8 h-full border-r border-gray-800">
        {/* Title */}
        <div className="mb-10 text-3xl font-extrabold tracking-tight text-white">
          CoinCard
        </div>
        
        <nav className="w-full flex-1">
          <ul className="space-y-2 px-4">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = active === item.title
              return (
                <li key={item.title}>
                  <a
                    href={item.url}
                    onClick={(e) => {
                      e.preventDefault()
                      setActive(item.title)
                    }}
                    className={`flex items-center gap-4 w-full px-6 py-4 rounded-4xl text-lg font-semibold transition-all duration-200
                      ${
                        isActive
                          ? "bg-[#011D5B] text-[#5B8DEF]"
                          : "text-white hover:bg-[#011D5B]"
                      }`}
                  >
                    <Icon
                      className={`w-7 h-7 transition-colors duration-200 ${
                        isActive ? "text-[#5B8DEF]" : "text-white"
                      }`}
                    />
                    <span>{item.title}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="w-full px-4 mt-6">
          <AnomalyAlerts />
        </div>
      </div>
    </div>
  )
}