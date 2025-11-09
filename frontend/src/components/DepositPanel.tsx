import { useEffect, useState } from "react"
import btc from "../../assets/Bitcoin.svg.png"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Wallet,
  Repeat,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react"
import OrderTypes from "./OrderTypes"
import AmountInput from "./AmountInput"
import CoinSearchPanel from "./CoinSearchPanel"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function DepositPanel({ selectedCoin, onSelectCoin, onBalanceUpdate }) {
  const [mode, setMode] = useState("buy")
  const [showOrderTypes, setShowOrderTypes] = useState(false)
  const [orderType, setOrderType] = useState("One-time order")
  const [usd, setUsd] = useState("")
  const [coinEquivalent, setCoinEquivalent] = useState("")
  const [isReversed, setIsReversed] = useState(false)
  const [showCoinSearch, setShowCoinSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error" | null; title: string; desc: string }>({
    type: null,
    title: "",
    desc: "",
  })

  const userId = "U01"

  useEffect(() => {
    if (selectedCoin) {
      setUsd("")
      setCoinEquivalent("")
      setIsReversed(false)
    }
  }, [selectedCoin])

  const handleChange = (val: string) => {
    const price = selectedCoin?.price || 95000
    const num = parseFloat(val) || 0
    if (isReversed) {
      setCoinEquivalent(val)
      setUsd(num ? (num * price).toFixed(2) : "")
    } else {
      setUsd(val)
      setCoinEquivalent(num ? (num / price).toFixed(6) : "")
    }
  }

  const handleRevert = () => {
    const price = selectedCoin?.price || 95000
    setIsReversed(!isReversed)
    if (isReversed) {
      const coinVal = parseFloat(coinEquivalent) || 0
      setUsd(coinVal ? (coinVal * price).toFixed(2) : "")
      setCoinEquivalent(coinVal ? coinVal.toString() : "")
    } else {
      const usdVal = parseFloat(usd) || 0
      setCoinEquivalent(usdVal ? (usdVal / price).toFixed(6) : "")
      setUsd(usdVal ? usdVal.toString() : "")
    }
  }

  const coinName = selectedCoin?.name || "Bitcoin"
  const coinThumb = selectedCoin?.thumb_image || btc
  const coinSym = selectedCoin?.symbol || "BTC"

  const handleBuy = async () => {
    console.log("Buy button clicked")

    if (!selectedCoin) {
      console.error("No coin selected")
      setAlert({
        type: "error",
        title: "Missing Coin",
        desc: "Please select a cryptocurrency first.",
      })
      return
    }

    const amount = parseFloat(coinEquivalent)
    if (!amount || amount <= 0) {
      console.error("Invalid amount:", coinEquivalent)
      setAlert({
        type: "error",
        title: "Invalid Amount",
        desc: "Please enter a valid amount before purchasing.",
      })
      return
    }

    try {
      setLoading(true)
      setAlert({ type: null, title: "", desc: "" })

      const tx = {
        user_id: userId,
        symbol: coinSym,
        transaction_type: "BUY",
        amount_coin: amount,
        price_per_coin: selectedCoin.price,
      }

      console.log("Sending transaction payload:", tx)

      const endpoint = "http://localhost:8000/portfolio/transact"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      })

      console.log("Response status:", res.status)

      if (!res.ok) {
        const errText = await res.text()
        console.error("Raw error response:", errText)
        throw new Error(`Transaction failed: ${errText}`)
      }

      const data = await res.json()
      console.log("Transaction success:", data)

      setAlert({
        type: "success",
        title: "Purchase Complete!",
        desc: `You successfully bought ${amount} ${coinSym}.`,
      })
      setTimeout(() => setAlert({ type: null, title: "", desc: "" }), 2000)

      if (onBalanceUpdate) onBalanceUpdate()

      setUsd("")
      setCoinEquivalent("")
    } catch (err) {
      console.error("Transaction failed:", err)
      setAlert({
        type: "error",
        title: "Transaction Failed",
        desc: err.message || "Something went wrong.",
      })
    } finally {
      setLoading(false)
      console.log("Buy request finished.")
    }
  }


  if (showOrderTypes) {
    return (
      <div className="bg-[#0d0d0d] rounded-xl p-6 text-white">
        <OrderTypes
          onBack={() => setShowOrderTypes(false)}
          onSelect={(type) => {
            setOrderType(type)
            setShowOrderTypes(false)
          }}
        />
      </div>
    )
  }

  if (showCoinSearch) {
    return (
      <CoinSearchPanel
        onBack={() => setShowCoinSearch(false)}
        onSelectCoin={(coin) => {
          onSelectCoin(coin)
          setShowCoinSearch(false)
        }}
      />
    )
  }

  return (
    <div className="bg-[#0d0d0d] rounded-xl pt-4 text-white space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 bg-neutral-800 rounded-full cursor-pointer w-fit">
        {["buy", "sell", "convert"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMode(tab)}
            className={`capitalize px-5 py-2 rounded-full text-sm font-medium transition ${mode === tab ? "bg-white text-black" : "text-gray-300 hover:text-white"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order Type */}
      <button
        onClick={() => setShowOrderTypes(true)}
        className="w-[60%] items-center bg-neutral-800 px-4 py-2 cursor-pointer rounded-3xl text-white font-bold hover:bg-neutral-900 transition"
      >
        <span>{orderType}</span>
        <svg className="ml-3 h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Amount Input */}
      <div>
        <AmountInput
          amount={isReversed ? coinEquivalent : usd}
          currency={isReversed ? coinSym : "USD"}
          onChange={handleChange}
        />
        <button
          onClick={handleRevert}
          className="text-[#587BFA] text-sm flex items-center justify-center mt-2 select-none hover:text-[#3b6ef0] transition w-full"
        >
          <Repeat className="w-4 h-4 mr-1" />
          {isReversed ? `${usd || "0"} USD` : `${coinEquivalent || "0"} ${coinName}`}
        </button>
      </div>

      {/* Payment + Buy */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 font-semibold py-2 px-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
            alt="visa"
            className="w-8"
          />
          <div>
            <span>Pay with</span>
            <p className="text-sm text-gray-400">Debit ***5813</p>
          </div>
        </div>

        <button
          onClick={() => setShowCoinSearch(true)}
          className="flex justify-between cursor-pointer w-full items-center gap-3 font-semibold hover:bg-gray-900 rounded-lg py-2 px-3"
        >
          <div className="flex items-center gap-3">
            <img src={coinThumb} alt="coin" className="w-8" />
            <div>
              <span className="flex">Buy</span>
              <p className="text-sm text-gray-400">{coinName}</p>
            </div>
          </div>
          <span className="font-light">{'>'}</span>
        </button>
      </div>

      {/* Buy Now Button */}
      <button
        onClick={handleBuy}
        disabled={!coinEquivalent || loading}
        className="w-full bg-[#587BFA] hover:bg-[#3b6ef0] transition py-4 rounded-full cursor-pointer font-semibold disabled:opacity-50"
      >
        {loading ? "Processing..." : `Buy Now`}
      </button>

      {alert.type && (
        <Alert
          variant={alert.type === "error" ? "destructive" : "default"}
          className={`mt-3 ${alert.type === "success" ? "border-green-500 bg-green-950/40" : "bg-red-400"
            }`}
        >
          {alert.type === "success" ? (
            <CheckCircle2Icon className="h-5 w-5 text-white" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-white" />
          )}
          <AlertTitle className="text-white">{alert.title}</AlertTitle>
          <AlertDescription>{alert.desc}</AlertDescription>
        </Alert>
      )}


      {/* Bottom Quick Actions */}
      <div className="space-y-3 border-t border-neutral-800 pt-4 font-bold">
        {[
          { icon: ArrowUpCircle, text: "Send crypto" },
          { icon: ArrowDownCircle, text: "Receive crypto" },
          { icon: Landmark, text: "Deposit cash" },
          { icon: Wallet, text: "Withdraw cash" },
        ].map(({ icon: Icon, text }) => (
          <button
            key={text}
            className="flex items-center gap-3 w-full hover:bg-neutral-800 transition px-4 py-3 rounded-xl text-left"
          >
            <Icon className="text-[#587BFA] w-7 h-7" />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}