import { useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler)

export default function BalanceCard() {
  const [balance, setBalance] = useState<number | null>(null)
  const [chartData, setChartData] = useState<number[]>([])
  const [timeline, setTimeline] = useState("1D")
  const userId = "U01"

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/portfolio/${userId}`)
        if (!res.ok) throw new Error("Failed to fetch portfolio")
        const data = await res.json()
        setBalance(data.usd_balance)

        // Mock data for now
        const len = 50
        const values = Array.from({ length: len }, (_, i) => 
          data.usd_balance + Math.sin(i / 4) * 300 + Math.random() * 150
        )
        setChartData(values)
      } catch (err) {
        console.error("Error fetching portfolio:", err)
      }
    }

    fetchBalance()
  }, [userId, timeline])

  const data = {
    labels: chartData.map((_, i) => i.toString()),
    datasets: [
      {
        data: chartData,
        borderColor: "#587BFA",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, 200)
          gradient.addColorStop(0, "rgba(88, 123, 250, 0.15)")
          gradient.addColorStop(1, "rgba(88, 123, 250, 0)")
          return gradient
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    scales: {
      x: { 
        display: false, 
        grid: { display: false },
      },
      y: { 
        display: false, 
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(17, 17, 17, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        displayColors: false,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: () => '',
          label: (ctx: any) => `$${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
  }

  const timelines = ["1H", "1D", "1W", "1M", "1Y", "ALL"]

  return (
    <div className="text-white rounded-xl py-3 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          {balance === null ? (
            <Skeleton className="h-12 w-48 rounded-md bg-neutral-800" />
          ) : (
            <h2 className="text-5xl balance-number font-light">
              ${balance.toLocaleString()}
            </h2>
          )}
        </div>
      </div>

      <div className="w-full h-48 rounded-lg py-2">
        {chartData.length === 0 ? (
          <Skeleton className="h-full w-full rounded-md bg-neutral-800" />
        ) : (
          <Line data={data} options={options} />
        )}
      </div>

      <div className="flex justify-center gap-5 text-gray-400 text-sm mt-3">
        {timelines.map((t) => (
          <button
            key={t}
            onClick={() => setTimeline(t)}
            className={`px-2 py-1 rounded-md ${
              timeline === t ? "text-white bg-[#1a1a1a]" : "hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}