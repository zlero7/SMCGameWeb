export default function PageBanner({ icon, title, subtitle, accent = 'border-cyan-400', right }) {
  return (
    <div className="bg-gradient-to-r from-[#1c2438] to-[#1e3a5f] rounded-xl px-6 py-3.5 mb-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{icon}</span>
          <h1 className="text-white text-base font-bold m-0">{title}</h1>
          {subtitle && <span className="text-gray-400 text-xs ml-1 hidden sm:inline">— {subtitle}</span>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
