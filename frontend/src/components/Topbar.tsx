export default function Topbar() {
    return (
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Trade</h1>
  
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search"
            className="bg-neutral-900 text-white placeholder-gray-400 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
          />
          <div className="flex items-center justify-center bg-[#14213d] text-white w-10 h-10 rounded-full font-semibold">
            D
          </div>
        </div>
      </div>
    )
  }
  