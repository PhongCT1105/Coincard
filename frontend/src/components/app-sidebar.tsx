"use client"
import { Home, History, Workflow } from "lucide-react"
import { useMemo } from "react"
import { useLocation } from "wouter"

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: History },
  { title: "Strategic Lab", url: "/strategy", icon: Workflow },
]

export function AppSidebar({
  active,
  setActive,
}: {
  active?: string
  setActive?: (v: string) => void
}) {
  const [location, navigate] = useLocation()

  // Determine current active route or fallback to props
  const currentActive = useMemo(() => {
    if (active) return active
    const match = items.find((item) => item.url === location)
    return match?.title || "Home"
  }, [location, active])

  return (
    <div className="w-64 bg-[#0d0d0d] text-white h-screen flex flex-col">
      <div className="flex flex-col items-center py-8 h-full border-r border-gray-800">
        <div className="mb-10 text-3xl font-extrabold tracking-tight text-white">
          CoinCard
        </div>

        <nav className="w-full flex-1">
          <ul className="space-y-2 px-4">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = currentActive === item.title
              return (
                <li key={item.title}>
                  <a
                    href={item.url}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(item.url)
                      if (setActive) setActive(item.title)
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
      </div>
    </div>
  )
}
