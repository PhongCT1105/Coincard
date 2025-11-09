type RangeKey = "1H" | "1D" | "1W" | "1M" | "1Y" | "ALL"

const manualMap: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  BNB: "binancecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  TRX: "tron",
}

const idCache = new Map<string, string | null>()

export const resolveCoinGeckoId = async (
  symbol: string,
  name?: string
): Promise<string | null> => {
  const key = symbol?.toUpperCase()
  if (!key) return null
  if (idCache.has(key)) return idCache.get(key) ?? null
  if (manualMap[key]) {
    idCache.set(key, manualMap[key])
    return manualMap[key]
  }

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name || symbol)}`)
    if (!res.ok) throw new Error("Search failed")
    const data = await res.json()
    const symbolLower = key.toLowerCase()
    const exact = data?.coins?.find((c: any) => c.symbol?.toLowerCase() === symbolLower)
    const fallback = data?.coins?.[0]
    const found = exact?.id || fallback?.id || null
    idCache.set(key, found)
    return found
  } catch {
    idCache.set(key, null)
    return null
  }
}

const RANGE_CONFIG: Record<RangeKey, { type: "days" | "range"; value: number | "max" }> = {
  "1H": { type: "range", value: 60 * 60 },
  "1D": { type: "days", value: 1 },
  "1W": { type: "days", value: 7 },
  "1M": { type: "days", value: 30 },
  "1Y": { type: "days", value: 365 },
  ALL: { type: "days", value: "max" },
}

export type MarketPoint = { time: number; price: number }

export const fetchMarketData = async (
  coinId: string,
  range: RangeKey
): Promise<MarketPoint[]> => {
  const cfg = RANGE_CONFIG[range]
  if (!cfg) throw new Error("Invalid range")

  let url = ""
  if (cfg.type === "days") {
    url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${cfg.value}&interval=daily`
  } else {
    const now = Math.floor(Date.now() / 1000)
    const from = now - (cfg.value as number)
    url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${now}`
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch market data")
  const data = await res.json()
  const prices: Array<[number, number]> = data?.prices || []
  return prices.map(([time, price]) => ({ time, price }))
}

export type { RangeKey }
