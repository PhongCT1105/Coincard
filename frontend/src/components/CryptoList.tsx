import { Skeleton } from "@/components/ui/skeleton"

export default function CryptoList() {
  return (
    <div className="bg-[#0d0d0d] rounded-xl p-6">
      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {["Trending", "Top volume", "Top gainers", "Top losers"].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-medium bg-neutral-800 text-gray-300 hover:bg-[#011D5B] hover:text-[#587BFA] transition`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Skeleton crypto rows */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="w-24 h-4 mb-2" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>

      {/* Browse all */}
      <div className="mt-6 flex justify-center">
        <button className="w-full py-3 bg-neutral-800 rounded-full text-gray-300 hover:bg-[#011D5B] hover:text-[#587BFA] transition">
          Browse all
        </button>
      </div>
    </div>
  )
}
