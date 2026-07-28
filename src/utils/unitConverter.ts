const UNIT_MAP: Record<string, Record<string, number>> = {
  g: {
    g: 1,
    kg: 1000,
  },
  kg: {
    g: 1 * 1000,
    kg: 1,
  },
}

export function convertUnit(value: number, fromUnit: string, toUnit: string): number | null {
  if (value <= 0) return 0
  if (fromUnit === toUnit) return value

  const from = fromUnit?.toLowerCase()
  const to = toUnit?.toLowerCase()

  if (!UNIT_MAP[from] || !UNIT_MAP[from][to]) {
    console.warn(`Unit conversion not supported: ${fromUnit} → ${toUnit}`)
    return null
  }

  return value * UNIT_MAP[from][to]
}
