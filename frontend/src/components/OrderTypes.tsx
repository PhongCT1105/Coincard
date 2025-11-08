export default function OrderTypes({
  onBack,
  onSelect,
}: {
  onBack: () => void
  onSelect: (type: string) => void
}) {
  const orders = [
    {
      title: "One-time order",
      desc: "Order executes as soon as possible at the current price",
      img: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/dark/fast-3.svg",
    },
    {
      title: "Limit order",
      desc: "Order executes at a target price you set, or better",
      img: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/dark/lowFees-3.svg",
    },
    {
      title: "Recurring buy",
      desc: "Set up automatic daily, weekly, bi-weekly or monthly purchases",
      img: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/dark/restaking-3.svg",
    },
  ]

  return (
    <div className="text-white space-y-6">
      <div className="relative flex items-center mb-4">
        <button
          className="absolute left-0 text-white text-sm hover:text-[#587BFA] font-bold"
          onClick={onBack}
        >
          ←
        </button>
        <h2 className="text-xl font-semibold w-full text-center">
          Order Types
        </h2>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <button
            key={order.title}
            onClick={() => onSelect(order.title)} 
            className="flex items-center justify-between w-full bg-neutral-900 hover:bg-[#011D5B] transition px-4 py-3 rounded-xl text-left"
          >
            <div className="flex items-center gap-3">
              <img src={order.img} alt={order.title} className="w-8 h-8" />
              <div>
                <p className="font-semibold">{order.title}</p>
                <p className="text-sm text-gray-400">{order.desc}</p>
              </div>
            </div>
            <span className="text-white font-bold">{">"}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
