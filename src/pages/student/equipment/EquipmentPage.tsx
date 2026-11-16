import { useState } from 'react'
import {
  equipmentMocks,
  AvailabilityCalendar,
  formatPeriod,
  isRangeAvailable,
  type Equipment,
  type DateRange,
} from '../../../features/equipment'
import { Icon } from '../../../shared/ui/Icon'
import './equipment.css'

interface EquipmentPageProps {
  item: Equipment
  draftIds: string[]
  bookingRange: DateRange
  onAdd: (equipmentId: string, range: DateRange) => void
}

export function EquipmentPage({ item, draftIds, bookingRange, onAdd }: EquipmentPageProps) {
  const [range, setRange] = useState<DateRange>(bookingRange)
  const available = isRangeAvailable(item, range)
  const isProjector = item.category === 'Проекторы'
  const recommended = isProjector
    ? equipmentMocks.find((equipment) => equipment.id === '028')
    : undefined
  const sameRange = bookingRange.start === range.start && bookingRange.end === range.end
  const inDraft = (id: string) => draftIds.includes(id) && sameRange
  const added = inDraft(item.id)
  const availabilityLabel =
    item.status === 'closed'
      ? 'Закрыто для брони'
      : !range.start
        ? 'Выберите дату получения'
        : !range.end
          ? 'Выберите дату возврата'
          : available
            ? 'Свободно на эти даты'
            : 'Занято на эти даты'
  const specs = [
    ['Разъёмы', item.description],
    ['Состояние', 'Рабочее'],
    ['Комплект', isProjector ? 'Проектор' : item.category === 'Мониторы' ? 'Монитор' : 'Кабель'],
    ['Владелец', 'Личный фонд лаборатории'],
    ['Где лежит', item.location],
  ]

  return (
    <div className="equipment-page">
      <a
        className="back-link"
        href="#/"
      >
        <Icon name="arrow" />В каталог
      </a>
      <div className="equipment-page-title">
        <h1>{item.name}</h1>
        <p>{isProjector ? 'Проекционное оборудование' : item.category}</p>
      </div>
      <div className="equipment-detail-grid">
        <div className="equipment-detail-left">
          <div className={`equipment-photo equipment-media-${item.id}`}>
            <span>ИНВ. № {item.id}</span>
            <img
              src={item.image}
              alt={item.name}
              width="560"
              height="310"
            />
          </div>
          <section
            className="detail-panel specifications"
            aria-labelledby="specifications-title"
          >
            <h2 id="specifications-title">Характеристики</h2>
            <dl>
              {specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <div className="equipment-detail-right">
          <section
            className="detail-panel availability-panel"
            aria-labelledby="availability-title"
          >
            <span
              className={`availability-badge ${available ? 'is-available' : 'is-unavailable'}`}
              role="status"
            >
              {availabilityLabel}
            </span>
            <h2 id="availability-title">Доступность</h2>
            <AvailabilityCalendar
              item={item}
              range={range}
              onChange={setRange}
            />
            <dl className="booking-summary">
              <div>
                <dt>Период</dt>
                <dd>{formatPeriod(range)}</dd>
              </div>
              <div>
                <dt>В наличии</dt>
                <dd>1 экземпляр</dd>
              </div>
            </dl>
            <div className="booking-action">
              <button
                type="button"
                className="add-to-request"
                disabled={!available || added}
                onClick={() => onAdd(item.id, { ...range })}
              >
                <Icon name={added ? 'check' : 'plus'} />
                {added ? 'Добавлено в заявку' : 'Добавить в заявку'}
              </button>
              <p>
                {added ? 'Оборудование в черновике заявки.' : 'Бронь появится после одобрения.'}
              </p>
            </div>
            {draftIds.length > 0 && !sameRange && (
              <p className="range-change-notice">
                При добавлении выбранные даты применятся ко всему комплекту.
              </p>
            )}
            {draftIds.length > 0 && (
              <a
                className="checkout-link"
                href="#/requests/new"
              >
                Оформить заявку
                <Icon name="arrow" />
              </a>
            )}
          </section>
          {recommended && (
            <section
              className="detail-panel recommendation-panel"
              aria-labelledby="recommendation-title"
            >
              <h2 id="recommendation-title">К проектору пригодится</h2>
              <div className="recommendation-item">
                <a
                  href={`#/equipment/${recommended.id}`}
                  aria-label={`Подробнее о ${recommended.name}`}
                >
                  <img
                    src={recommended.image}
                    alt=""
                    width="80"
                    height="64"
                  />
                </a>
                <div>
                  <a
                    className="recommendation-name"
                    href={`#/equipment/${recommended.id}`}
                  >
                    {recommended.name}
                  </a>
                  <p>Для подключения ноутбука. Коробка 07.</p>
                </div>
                <button
                  type="button"
                  className="add-accessory"
                  disabled={
                    !available || !isRangeAvailable(recommended, range) || inDraft(recommended.id)
                  }
                  onClick={() => onAdd(recommended.id, { ...range })}
                >
                  <Icon name={inDraft(recommended.id) ? 'check' : 'plus'} />
                  {inDraft(recommended.id) ? 'Добавлено' : 'Добавить'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
