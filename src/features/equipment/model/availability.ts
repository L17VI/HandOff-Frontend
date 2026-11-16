import type { Equipment } from './equipment'

export interface DateRange { start: string; end: string }

// Календарные даты храним без часового пояса. UTC используется только для арифметики дней.
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function formatDay(date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('ru', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}

export function formatPeriod({ start, end }: DateRange) {
  if (!end) return `${formatDay(start)}: выберите возврат`
  if (start === end) return formatDay(start)
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${Number(start.slice(-2))}–${formatDay(end)}`
    : `${formatDay(start)} – ${formatDay(end)}`
}

export function isBusyDate(item: Equipment, date: string) {
  if (item.status === 'closed') return true
  const bookedDates = item.status === 'busy'
    ? ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']
    : ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-23', '2026-11-24']
  return bookedDates.includes(date)
}

export function isRangeAvailable(item: Equipment, range: DateRange) {
  if (!range.end || range.end < range.start || item.status === 'closed') return false
  for (let date = range.start; date <= range.end; date = addDays(date, 1)) {
    if (isBusyDate(item, date)) return false
  }
  return true
}
