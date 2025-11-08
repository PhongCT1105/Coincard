import { useState } from "react"

export default function AmountInput() {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [showError, setShowError] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    if (value.length <= 5) {
      setAmount(value)
      setShowError(false)
    } else {
      setShowError(true)
    }
  }

  // shrink smoothly to fit 5 numbers
  const scale =
    amount.length === 5 ? 0.65 : amount.length >= 4 ? 0.8 : amount.length >= 3 ? 0.9 : 1

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[100px] w-full flex items-center justify-center overflow-hidden">
        <div
          className="flex items-center justify-center whitespace-nowrap transition-transform duration-200 origin-center"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="inline-flex left-1 justify-center text-gray-400 w-full">
            <div className="flex items-baseline justify-center">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleChange}
                placeholder="0"
                className="bg-transparent text-7xl text-white focus:outline-none appearance-none text-right shrink-0"
                style={{
                  minWidth: "1ch", 
                  width: `${Math.max(amount.length - 1, 1.3)}ch`,
                  letterSpacing: "-0.04em",
                }}
              />
              <span className="text-7xl text-gray-400 ml-[2px] leading-none">
                {currency}
              </span>
            </div>
          </div>
        </div>


        {/* Overlay error text */}
        {showError && (
          <p className="absolute bottom-0 text-red-500 text-sm">
            Too much
          </p>
        )}
      </div>

      <button
        onClick={() => setCurrency(currency === "USD" ? "BTC" : "USD")}
        className="mt-3 text-sm text-[#587BFA] hover:underline"
      >
        Convert to {currency === "USD" ? "BTC" : "USD"}
      </button>
    </div>
  )
}
