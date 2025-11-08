import { useState } from "react"
import btc from "../../assets/Bitcoin.svg.png"
import { ArrowDownCircle, ArrowUpCircle, Landmark, Wallet } from "lucide-react"
import OrderTypes from "./OrderTypes"
import AmountInput from "./AmountInput"

export default function DepositPanel() {
  const [mode, setMode] = useState("buy")
  const [showOrderTypes, setShowOrderTypes] = useState(false)
  const [orderType, setOrderType] = useState("One-time order")
  const [currency, setCurrency] = useState("USD")
  const [buyCoin, setBuyCoin] = useState("Bitcoin")

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


  return (
    <div className="bg-[#0d0d0d] rounded-xl pt-4 text-white space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 bg-neutral-800 p-1 rounded-full w-fit">
        {["buy", "sell", "convert"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMode(tab)}
            className={`capitalize px-5 py-2 rounded-full text-sm font-medium transition ${mode === tab
              ? "bg-white text-black"
              : "text-gray-300 hover:text-white"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        <button
          onClick={() => setShowOrderTypes(true)}
          className="w-[60%] items-center bg-neutral-800 px-4 py-3 rounded-3xl text-white font-bold hover:bg-neutral-900 transition"
        >
          <span>{orderType}</span>
          <svg
            className="ml-3 h-5 w-5 inline" // Tailwind classes for margin, height, and width
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <AmountInput />


      {/* Pay With + Buy Section */}
      <div className="space-y-6 relative">
        {/* Pay with */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-3 font-semibold">
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
        </div>

        <div className="pt-4">
          <div className="flex items-center gap-3 font-semibold">
            <img src={btc} alt="btc" className="w-8" />
            <div>
              <span>Buy</span>
              <p className="text-sm text-gray-400">{buyCoin}</p>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full bg-[#587BFA] hover:bg-[#3b6ef0] transition py-4 rounded-full font-semibold">
        Review order
      </button>

      {/* Actions */}
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
