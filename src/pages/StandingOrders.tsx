const DAYS = ['Mon', 'Wed', 'Fri'] as const
type Day = (typeof DAYS)[number]

interface StandingOrderItem {
  name: string
  Mon: string | null
  Wed: string | null
  Fri: string | null
}

interface StandingOrderSection {
  label: string
  headerClass: string
  badgeClass: string
  dotClass: string
  rowClass: string
  items: StandingOrderItem[]
}

// Starts empty for this outlet — the original app's standing-order schedule (sauces,
// proteins, weekly kg quantities) is specific to that location's own prep routine.
// Add sections here once this outlet's own standing orders are known.
const DATA: Record<string, StandingOrderSection> = {}

function parseKg(val: string | null): number {
  if (!val) return 0
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

export default function StandingOrders() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3) as Day
  const sections = Object.entries(DATA)

  return (
    <div className="pb-6">
      {/* Title */}
      <div className="mb-4 text-center">
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">Standing Orders</h1>
        <p className="text-xs text-gray-400 mt-0.5">Weekly production schedule</p>
      </div>

      {sections.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-16">
          No standing orders configured yet
        </div>
      )}

      {sections.map(([type, section]) => {
        const dayTotals = DAYS.map((d) =>
          section.items.reduce((s, it) => s + parseKg(it[d]), 0)
        )

        return (
          <div key={type} className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Section header */}
            <div className={`px-4 py-3 border-b ${section.headerClass}`}>
              <span className="font-semibold text-sm">{section.label}</span>
            </div>

            {/* Column headers — day names */}
            <div className="flex items-center px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <span className="flex-1 text-xs text-gray-400">Item</span>
              {DAYS.map((d) => (
                <span
                  key={d}
                  className={`w-16 text-center text-xs font-bold shrink-0 ${
                    d === today ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {d}
                  {d === today && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle mb-0.5" />}
                </span>
              ))}
            </div>

            {/* Rows — sorted by total across all days, largest first */}
            <div className="divide-y divide-gray-50">
              {[...section.items].sort((a, b) =>
                DAYS.reduce((s, d) => s + parseKg(b[d]), 0) - DAYS.reduce((s, d) => s + parseKg(a[d]), 0)
              ).map((item, idx) => (
                <div key={idx} className={`flex items-center px-3 py-2 transition-colors ${section.rowClass}`}>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${section.dotClass}`} />
                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                  </div>
                  {DAYS.map((d) => (
                    <span key={d} className={`w-16 text-center text-xs font-semibold shrink-0 ${
                      item[d] ? section.badgeClass.split(' ')[1] : 'text-gray-200'
                    }`}>
                      {item[d] ?? '—'}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            {/* Totals row */}
            <div className={`flex items-center px-3 py-2 border-t ${section.headerClass}`}>
              <span className="flex-1 text-xs font-semibold">Total</span>
              {dayTotals.map((t, i) => (
                <span key={i} className={`w-16 text-center text-xs font-bold shrink-0 ${section.badgeClass}`}>
                  {t} kg
                </span>
              ))}
            </div>
          </div>
        )
      })}

      {/* Grand total row */}
      {sections.length > 0 && (
        <div className="bg-gray-800 rounded-2xl px-4 py-4 shadow-md">
          <div className="flex items-center mb-2">
            <span className="flex-1 text-xs text-gray-400 uppercase tracking-wider font-medium">Grand Total</span>
            {DAYS.map((d) => (
              <span key={d} className={`w-16 text-center text-xs font-medium shrink-0 ${d === today ? 'text-green-400' : 'text-gray-400'}`}>{d}</span>
            ))}
          </div>
          <div className="flex items-center">
            <span className="flex-1 text-xs text-gray-500">All items</span>
            {DAYS.map((d) => {
              const total = Object.values(DATA).reduce(
                (s, sec) => s + sec.items.reduce((ss, it) => ss + parseKg(it[d]), 0), 0
              )
              return (
                <span key={d} className={`w-16 text-center text-base font-bold shrink-0 ${d === today ? 'text-green-400' : 'text-white'}`}>
                  {total} kg
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
