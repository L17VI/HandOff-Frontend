import type { Equipment } from './equipment'

export interface DateRange {
  start: string
  end: string
}

// Календарные даты храним без часового пояса. UTC используется только для арифметики дней.
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function formatDay(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) {
  return new Intl.DateTimeFormat('ru', { ...options, timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  )
}

export function formatPeriod({ start, end }: DateRange) {
  if (!start && !end) {
    return 'Выберите даты'
  }
  if (!start) {
    return `До ${formatDay(end)}: выберите получение`
  }
  if (!end) {
    return `${formatDay(start)}: выберите возврат`
  }
  if (start === end) {
    return formatDay(start)
  }
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${Number(start.slice(-2))}–${formatDay(end)}`
    : `${formatDay(start)} – ${formatDay(end)}`
}

function getBookedDates(item: Equipment) {
  return item.status === 'busy'
    ? ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']
    : ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-23', '2026-11-24']
}

export function isBusyDate(item: Equipment, date: string) {
  return item.status === 'closed' || getBookedDates(item).includes(date)
}

export function isRangeAvailable(item: Equipment, range: DateRange) {
  if (!range.start || !range.end || range.end < range.start || item.status === 'closed') {
    return false
  }
  return !getBookedDates(item).some((date) => date >= range.start && date <= range.end)
}
