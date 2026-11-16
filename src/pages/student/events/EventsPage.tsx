import { useState } from 'react'
import { equipmentMocks, formatPeriod } from '../../../features/equipment'
import type { LabEvent } from '../../../features/events'
import { EventCalendar } from '../../../features/events/ui/EventCalendar'
import { Icon } from '../../../shared/ui/Icon'
import './events.css'

interface EventsPageProps {
  events: LabEvent[]
  onChooseEquipment: (event: LabEvent) => void
}

export function EventsPage({ events, onChooseEquipment }: EventsPageProps) {
  const [month, setMonth] = useState(() => events[0]?.range.start.slice(0, 7) ?? new Intl.DateTimeFormat('sv-SE').format(new Date()).slice(0, 7))
  const [selectedId, setSelectedId] = useState<string | undefined>(events[0]?.id)
  const visibleEvents = events.filter((event) => event.range.start <= `${month}-31` && event.range.end >= `${month}-01`).sort((a, b) => a.range.start.localeCompare(b.range.start))
  const selected = visibleEvents.find((event) => event.id === selectedId)

  function changeMonth(next: string) {
    setMonth(next)
    setSelectedId(events.find((event) => event.range.start <= `${next}-31` && event.range.end >= `${next}-01`)?.id)
  }

  return <div className="events-page">
    <div className="events-heading"><h1>Мероприятия</h1><p>Выберите событие, чтобы посмотреть площадку и забронированную технику.</p></div>
    <div className="events-layout">
      <div className="events-schedule">
        <EventCalendar month={month} events={visibleEvents} selectedId={selected?.id} onSelect={setSelectedId} onMonthChange={changeMonth} />
        <section className="event-agenda" aria-labelledby="event-agenda-title"><div className="event-agenda-heading"><h2 id="event-agenda-title">События месяца</h2><span>{visibleEvents.length}</span></div>
          {visibleEvents.length ? <ul>{visibleEvents.map((event) => <li key={event.id}><button type="button" className={selected?.id === event.id ? 'is-selected' : ''} aria-pressed={selected?.id === event.id} onClick={() => setSelectedId(event.id)}><span>{formatPeriod(event.range)}</span><strong>{event.name}</strong><Icon name="arrow" /></button></li>)}</ul> : <p className="events-empty">В этом месяце событий пока нет. Посмотрите соседние месяцы.</p>}
        </section>
      </div>
      <section className="event-detail" aria-labelledby="event-detail-title" aria-live="polite">
        {selected ? <>
          <span className="event-kind">{selected.kind === 'internal' ? 'Внутреннее' : 'Внешнее'}</span>
          <h2 id="event-detail-title">{selected.name}</h2>
          <dl className="event-facts"><div><dt><Icon name="calendar" />Когда</dt><dd>{formatPeriod(selected.range)} {selected.range.end.slice(0, 4)}</dd></div><div><dt><Icon name="pin" />Где</dt><dd>{selected.venue}</dd></div></dl>
          <div className="event-bookings"><h3>Уже забронировали</h3>{selected.bookings.length ? <ul>{selected.bookings.map((booking, index) => {
            const item = equipmentMocks.find((equipment) => equipment.id === booking.equipmentId)
            return <li key={`${booking.equipmentId}-${index}`}><a href={`#/equipment/${booking.equipmentId}`}>{item?.name ?? `Оборудование № ${booking.equipmentId}`}<Icon name="arrow" /></a><span>{formatPeriod(booking.range)}</span></li>
          })}</ul> : <p className="events-empty">Для этого события технику пока не забронировали.</p>}</div>
          <a className="event-choose" href={`#/?event=${selected.id}`} onClick={() => onChooseEquipment(selected)}>Выбрать технику<Icon name="arrow" /></a>
          {selected.kind === 'external' && <aside className="event-venue-notice"><Icon name="info" /><div><h3>Для внешней площадки</h3><p>Если техника уже есть на площадке, уточните её доступность у администратора.</p></div></aside>}
        </> : <div className="event-detail-empty"><Icon name="calendar" /><h2 id="event-detail-title">Нет выбранного события</h2><p>Переключите месяц и выберите мероприятие в календаре или списке.</p></div>}
      </section>
    </div>
  </div>
}
