export default function PageBanner({ icon, title, subtitle, accent = 'border-cyan-400', right }) {
  return (
    <div className="bg-gradient-to-r from-[#1c2438] to-[#1e3a5f] rounded-2xl px-7 py-6 mb-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl leading-none">{icon}</span>
          <h1 className="text-white text-xl font-bold m-0">{title}</h1>
        </div>
        {subtitle && <p className="text-gray-400 text-sm mt-1 ml-9">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
