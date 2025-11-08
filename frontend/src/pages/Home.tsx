import Topbar from "@/components/Topbar"
import CryptoList from "@/components/CryptoList"
import DepositPanel from "@/components/DepositPanel"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-white w-full overflow-hidden">
      <div className="w-full px-10 py-5 border-b border-gray-800">
        <Topbar />
      </div>

      <div className="flex flex-1 px-10 gap-8">
        <div className="w-[70%] border-r border-gray-800 pr-8">
          <CryptoList />
        </div>

        <div className="w-[30%]">
          <DepositPanel />
        </div>
      </div>
    </div>
  )
}
