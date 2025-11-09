import { useState, useEffect } from "react"

export default function AmountInput({ amount, currency, onChange }) {
  const [localAmount, setLocalAmount] = useState(amount || "")
  const [showError, setShowError] = useState(false)

  useEffect(() => setLocalAmount(amount), [amount])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    if (value.length <= 5) {
      setLocalAmount(value)
      onChange(value)
      setShowError(false)
    } else setShowError(true)
  }

  const scale =
    localAmount.length >= 5 ? 0.6 :
    localAmount.length >= 4 ? 0.7 :
    localAmount.length >= 3 ? 0.8 :
    localAmount.length >= 2 ? 0.9 : 1

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[100px] w-full flex items-center justify-center overflow-hidden">
        <div
          className="flex items-center justify-center whitespace-nowrap transition-transform duration-200 origin-center"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="flex items-baseline justify-center">
            <input
              type="text"
              inputMode="numeric"
              value={localAmount}
              onChange={handleChange}
              placeholder="0"
              className="bg-transparent text-7xl text-white focus:outline-none appearance-none text-right shrink-0"
              style={{
                minWidth: "1ch",
                width: `${Math.max(localAmount.length - 1, 2)}ch`,
                letterSpacing: "-0.04em",
              }}
            />
            <span className="text-7xl text-gray-400 ml-[2px] leading-none">
              {currency}
            </span>
          </div>
        </div>
        {showError && (
          <p className="absolute bottom-0 text-red-500 text-sm">Max 5 digits</p>
        )}
      </div>
    </div>
  )
}