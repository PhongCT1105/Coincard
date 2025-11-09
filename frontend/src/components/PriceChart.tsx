import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js"
import { fetchMarketData, RangeKey, resolveCoinGeckoId, MarketPoint } from "@/lib/coinGecko"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const RANGE_ORDER: RangeKey[] = ["1H", "1D", "1W", "1M", "1Y", "ALL"]

interface PriceChartProps {
  symbol: string
  name: string
}

export default function PriceChart({ symbol, name }: PriceChartProps) {
  const [range, setRange] = useState<RangeKey>("1Y")
  const [coinId, setCoinId] = useState<string | null>(null)
  const [points, setPoints] = useState<MarketPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const resolve = async () => {
      setError(null)
      setPoints([])
      if (!symbol) {
        setCoinId(null)
        return
      }
      const id = await resolveCoinGeckoId(symbol, name)
      if (active) setCoinId(id)
      if (active && !id) setError("Coin data unavailable on CoinGecko.")
    }
    resolve()
    return () => {
      active = false
    }
  }, [symbol, name])

  useEffect(() => {
    if (!coinId) return
    let active = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchMarketData(coinId, range)
        if (active) setPoints(data)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load price history.")
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [coinId, range])

  const labels = useMemo(() => {
    const formatter =
      range === "1H"
        ? (time: number) => new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : range === "1D"
          ? (time: number) => new Date(time).toLocaleTimeString([], { hour: "2-digit" })
          : range === "1W"
            ? (time: number) => new Date(time).toLocaleDateString([], { weekday: "short" })
            : range === "1M" || range === "1Y"
              ? (time: number) => new Date(time).toLocaleDateString([], { month: "short", day: "numeric" })
              : (time: number) => new Date(time).toLocaleDateString([], { year: "numeric", month: "short" })

    return points.map((p) => formatter(p.time))
  }, [points, range])

  const chartData = useMemo(() => {
    const prices = points.map((p) => p.price)
    return {
      labels,
      datasets: [
        {
          label: `${symbol.toUpperCase()} Price`,
          data: prices,
          fill: true,
          tension: 0.32,
          pointRadius: 0,
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart
            const { ctx: canvasCtx, chartArea } = chart
            if (!chartArea) return "rgba(251, 191, 36, 0.1)"
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, "rgba(251,191,36,0.25)")
            gradient.addColorStop(1, "rgba(17,24,39,0)")
            return gradient
          },
          borderColor: "#fbbf24",
          borderWidth: 2,
        },
      ],
    }
  }, [points, labels, symbol])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111827",
          borderColor: "#fbbf24",
          borderWidth: 1,
          padding: 12,
          titleColor: "#fbbf24",
          bodyColor: "#f3f4f6",
          callbacks: {
            label: (ctx: any) => `$${ctx.parsed.y?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#6b7280" },
        },
        y: {
          grid: { color: "rgba(75, 85, 99, 0.2)" },
          ticks: {
            color: "#9ca3af",
            callback: (value: any) =>
              typeof value === "number"
                ? `$${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value.toFixed(0)}`
                : value,
          },
        },
      },
    }),
    []
  )

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 space-y-4 border border-neutral-800/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{symbol.toUpperCase()} performance</p>
          <p className="text-xs text-gray-500">Powered by CoinGecko</p>
        </div>
        <div className="flex gap-2 bg-neutral-800/60 rounded-full p-1">
          {RANGE_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1 text-xs rounded-full transition ${
                range === key ? "bg-white text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 md:h-72">
        {loading && <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>}
        {!loading && error && (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && points.length > 0 && <Line data={chartData} options={chartOptions} />}
      </div>
    </div>
  )
}
