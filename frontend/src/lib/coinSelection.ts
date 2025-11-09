export type CoinSnapshot = {
  NAME: string
  SYMBOL: string
  PRICE: number
  MARKET_CAP: number
  CHANGE: number
  VOLUME: number
  THUMB_IMAGE: string
  TIMESTAMP: string
}

const STORAGE_KEY = "coincard:selected-coin"

export const persistCoinSnapshot = (coin: CoinSnapshot) => {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coin))
}

export const readCoinSnapshot = (): CoinSnapshot | null => {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CoinSnapshot
  } catch {
    return null
  }
}
