import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import type { Equipment } from '../model/equipment'
import { addDays, formatDay, isBusyDate, type DateRange } from '../model/availability'

interface AvailabilityCalendarProps {
  item: Equipment
  range: DateRange
  onChange: (range: DateRange) => void
}

export function AvailabilityCalendar({ item, range, onChange }: AvailabilityCalendarProps) {
  const [firstDate, setFirstDate] = useState('2026-11-09')
  const dates = Array.from({ length: 21 }, (_, index) => addDays(firstDate, index))
  const firstMonth = formatDay(firstDate, { month: 'long' })
  const lastMonth = formatDay(dates[20], { month: 'long', year: 'numeric' }).replace(' г.', '')
  const title =
    firstDate.slice(0, 7) === dates[20].slice(0, 7) ? lastMonth : `${firstMonth} / ${lastMonth}`

  function selectDate(date: string) {
    if (range.end || date < range.start) {
      onChange({ start: date, end: '' })
    } else {
      onChange({ start: range.start, end: date })
    }
  }

  return (
    <div className="availability-calendar">
      <div className="calendar-toolbar">
        <h3 aria-live="polite">{title}</h3>
        <div className="calendar-navigation">
          <button
            type="button"
            aria-label="Предыдущие три недели"
            onClick={() => setFirstDate(addDays(firstDate, -21))}
          >
            <Icon name="chevron" />
          </button>
          <button
            type="button"
            aria-label="Следующие три недели"
            onClick={() => setFirstDate(addDays(firstDate, 21))}
          >
            <Icon name="chevron" />
          </button>
        </div>
      </div>
      <div
        className="calendar-weekdays"
        aria-hidden="true"
      >
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        className="calendar-days"
        aria-label="Даты получения и возврата"
      >
        {dates.map((date) => {
          const busy = isBusyDate(item, date)
          const selected = date >= range.start && date <= (range.end || range.start)
          return (
            <button
              type="button"
              key={date}
              data-date={date}
              className={`calendar-day ${busy ? 'is-busy' : ''} ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              aria-label={`${formatDay(date)}, ${busy ? 'занято' : 'свободно'}${selected ? ', выбрано' : ''}`}
              onClick={() => selectDate(date)}
            >
              {Number(date.slice(-2))}
            </button>
          )
        })}
      </div>
      <div className="calendar-legend">
        <span className="legend-selected">Выбрано</span>
        <span className="legend-busy">Занято</span>
        <span className="legend-free">Свободно</span>
      </div>
      <p
        className="sr-only"
        aria-live="polite"
      >
        {!range.start
          ? 'Выберите дату получения'
          : range.end
            ? `Выбрано с ${formatDay(range.start)} по ${formatDay(range.end)}`
            : 'Выберите дату возврата'}
      </p>
    </div>
  )
}
