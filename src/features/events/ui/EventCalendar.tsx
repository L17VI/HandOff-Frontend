import { useState } from 'react'
import { addDays, formatDay } from '../../equipment/model/availability'
import type { LabEvent } from '../model/event'
import { Icon } from '../../../shared/ui/Icon'

interface EventCalendarProps {
  month: string
  events: LabEvent[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  onMonthChange: (month: string) => void
}

export function EventCalendar({
  month,
  events,
  selectedId,
  onSelect,
  onMonthChange,
}: EventCalendarProps) {
  const first = `${month}-01`
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
  const last = new Date(`${first}T12:00:00Z`)
  last.setUTCMonth(last.getUTCMonth() + 1, 0)
  const dayCount = last.getUTCDate()
  const [today] = useState(() => new Intl.DateTimeFormat('sv-SE').format(new Date()))
  const days = Array.from({ length: Math.ceil((offset + dayCount) / 7) * 7 }, (_, index) =>
    index >= offset && index < offset + dayCount ? addDays(first, index - offset) : null,
  )

  function shiftMonth(amount: number) {
    const next = new Date(`${first}T12:00:00Z`)
    next.setUTCMonth(next.getUTCMonth() + amount)
    onMonthChange(next.toISOString().slice(0, 7))
  }

  return (
    <section
      className="event-calendar"
      aria-labelledby="event-month"
    >
      <div className="event-calendar-toolbar">
        <h2
          id="event-month"
          aria-live="polite"
        >
          {formatDay(first, { month: 'long', year: 'numeric' }).replace(' г.', '')}
        </h2>
        <div className="event-month-controls">
          <button
            type="button"
            className="icon-button"
            aria-label="Предыдущий месяц"
            onClick={() => shiftMonth(-1)}
          >
            <Icon name="chevron" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Следующий месяц"
            onClick={() => shiftMonth(1)}
          >
            <Icon name="chevron" />
          </button>
        </div>
      </div>
      <div
        className="event-weekdays"
        aria-hidden="true"
      >
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="event-days">
        {days.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                aria-hidden="true"
              />
            )
          }
          const dayEvents = events.filter(
            (event) => event.range.start <= date && event.range.end >= date,
          )
          return (
            <div
              key={date}
              className={`event-day ${dayEvents.length ? 'has-event' : ''} ${dayEvents.some((event) => event.id === selectedId) ? 'is-selected' : ''}`}
            >
              <time
                dateTime={date}
                aria-current={date === today ? 'date' : undefined}
                aria-label={formatDay(date)}
              >
                {date.slice(-2)}
              </time>
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  aria-pressed={event.id === selectedId}
                  aria-label={`${formatDay(date)}: ${event.name}`}
                  onClick={() => onSelect(event.id)}
                >
                  {date === event.range.start ||
                  date === first ||
                  new Date(`${date}T12:00:00Z`).getUTCDay() === 1 ? (
                    event.shortName
                  ) : (
                    <span className="event-continuation">
                      Продолжение<span className="sr-only">: {event.shortName}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>
      <div className="event-calendar-legend">
        <span className="event-legend-selected">Выбранное событие</span>
        <span>Другие события</span>
      </div>
    </section>
  )
}
