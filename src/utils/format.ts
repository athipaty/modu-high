export function fmt(n: number | string | null | undefined): string {
  return Number(n ?? 0).toFixed(2).replace(/\.?0+$/, '')
}

export function valid(s: string): boolean {
  return /^(\d+(\.\d*)?|\.\d+)$/.test(s)
}

export function strip0(s: string): string {
  if (s === '' || s === '.' || s.startsWith('0.')) return s
  return s.replace(/^0+(?=\d)/, '')
}
