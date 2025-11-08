import { useState } from "react"
import btc from '../../assets/Bitcoin.svg.png'
import { ArrowDownCircle, ArrowUpCircle, Landmark, Wallet } from "lucide-react"

export default function DepositPanel() {
  const [mode, setMode] = useState("buy")
  const [showOrderTypes, setShowOrderTypes] = useState(false)
  const [orderType, setOrderType] = useState("One-time order")
  const [currency, setCurrency] = useState("USD")
  const [buyCoin, setBuyCoin] = useState("Bitcoin")

  if (showOrderTypes) {
    return (
      <div className="bg-[#0d0d0d] rounded-xl p-6 text-white space-y-6">
        <div className="relative flex items-center mb-4">
          <button
            className="absolute left-0 text-white text-sm hover:text-[#587BFA] font-bold"
            onClick={() => setShowOrderTypes(false)}
          >
            ←
          </button>
          <h2 className="text-xl font-semibold w-full text-center">Order Types</h2>
        </div>


        <div className="space-y-4">
          {[
            {
              title: "One-time order",
              desc: "Order executes as soon as possible at the current price",
              icon: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/dark/fast-3.svg",
            },
            {
              title: "Limit order",
              desc: "Order executes at a target price you set, or better",
              icon: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/dark/lowFees-3.svg",
            },
            {
              title: "Recurring buy",
              desc: "Set up automatic daily, weekly, bi-weekly or monthly purchases",
              icon: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/dark/restaking-3.svg",
            },
          ].map((t) => (
            <button
              key={t.title}
              onClick={() => {
                setOrderType(t.title)
                setShowOrderTypes(false)
              }}
              className={`w-full text-left p-4 rounded-xl transition ${orderType === t.title
                ? "bg-neutral-800 text-white"
                : "bg-neutral-900 hover:bg-neutral-800"
                }`}
            >
              <div className="flex justify-between items-center">
                <img src={t.icon} alt={t.title} className="w-10 h-10 mr-5" />
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-sm text-gray-400">{t.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0d0d0d] rounded-xl pt-5 text-white space-y-6">
      <div className="flex gap-2 bg-neutral-900 p-1 rounded-full w-fit">
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
          className="w-full flex items-center justify-between bg-neutral-900 px-4 py-3 rounded-xl text-gray-300 hover:bg-neutral-800 transition"
        >
          <span>{orderType}</span>
          <span className="text-gray-400">▼</span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="relative text-center py-6">
        <div className="text-6xl font-semibold text-gray-400">0{currency}</div>
        <button
          onClick={() =>
            setCurrency(currency === "USD" ? "BTC" : "USD")
          }
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm text-[#587BFA] hover:underline"
        >
          Convert to {currency === "USD" ? "BTC" : "USD"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center pt-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                alt="visa"
                className="w-8 mr-2"
              />
              <div>
                <span>Pay with</span>
                <p className="text-sm text-gray-400">Debit ***5813</p>
              </div>
            </div>
          </div>
        </div>

        <div className=" pt-4">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <img
              src={btc}
              alt="btc"
              className="w-8 mr-2"
            />
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
