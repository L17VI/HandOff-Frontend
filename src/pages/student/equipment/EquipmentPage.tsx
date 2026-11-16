import { useState } from 'react'
import { equipmentMocks, AvailabilityCalendar, formatPeriod, isRangeAvailable, type Equipment, type DateRange } from '../../../features/equipment'
import type { DraftItem } from '../../../features/requests'
import { Icon } from '../../../shared/ui/Icon'
import './equipment.css'

interface EquipmentPageProps {
  item: Equipment
  draft: DraftItem[]
  onAdd: (item: DraftItem) => void
}

export function EquipmentPage({ item, draft, onAdd }: EquipmentPageProps) {
  const [range, setRange] = useState<DateRange>({ start: '2026-11-18', end: '2026-11-20' })
  const available = isRangeAvailable(item, range)
  const isProjector = item.category === 'Проекторы'
  const recommended = isProjector ? equipmentMocks.find((equipment) => equipment.id === '028') : undefined
  const inDraft = (id: string) => draft.some((entry) => entry.equipmentId === id && entry.range.start === range.start && entry.range.end === range.end)
  const added = inDraft(item.id)
  const availabilityLabel = item.status === 'closed' ? 'Закрыто для брони' : !range.end ? 'Выберите дату возврата' : available ? 'Свободно на эти даты' : 'Занято на эти даты'
  const specs = [
    ['Разъёмы', item.description], ['Состояние', 'Рабочее'],
    ['Комплект', isProjector ? 'Проектор' : item.category === 'Мониторы' ? 'Монитор' : 'Кабель'],
    ['Владелец', 'Личный фонд лаборатории'], ['Где лежит', item.location],
  ]

  return <div className="equipment-page">
    <a className="back-link" href="#/"><Icon name="arrow" />В каталог</a>
    <div className="equipment-page-title"><h1>{item.name}</h1><p>{isProjector ? 'Проекционное оборудование' : item.category}</p></div>
    <div className="equipment-detail-grid">
      <div className="equipment-detail-left">
        <div className={`equipment-photo equipment-media-${item.id}`}><span>ИНВ. № {item.id}</span><img src={item.image} alt={item.name} width="560" height="310" /></div>
        <section className="detail-panel specifications" aria-labelledby="specifications-title"><h2 id="specifications-title">Характеристики</h2><dl>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
      </div>
      <div className="equipment-detail-right">
        <section className="detail-panel availability-panel" aria-labelledby="availability-title">
          <span className={`availability-badge ${available ? 'is-available' : 'is-unavailable'}`} role="status">{availabilityLabel}</span>
          <h2 id="availability-title">Доступность</h2>
          <AvailabilityCalendar item={item} range={range} onChange={setRange} />
          <dl className="booking-summary"><div><dt>Период</dt><dd>{formatPeriod(range)}</dd></div><div><dt>В наличии</dt><dd>1 экземпляр</dd></div></dl>
          <div className="booking-action"><button type="button" className="add-to-request" disabled={!available || added} onClick={() => onAdd({ equipmentId: item.id, range: { ...range } })}><Icon name={added ? 'check' : 'plus'} />{added ? 'Добавлено в заявку' : 'Добавить в заявку'}</button><p>{added ? 'Оборудование в черновике заявки.' : 'Бронь появится после одобрения.'}</p></div>
        </section>
        {recommended && <section className="detail-panel recommendation-panel" aria-labelledby="recommendation-title"><h2 id="recommendation-title">К проектору пригодится</h2><div className="recommendation-item"><a href={`#/equipment/${recommended.id}`} aria-label={`Подробнее о ${recommended.name}`}><img src={recommended.image} alt="" width="80" height="64" /></a><div><a className="recommendation-name" href={`#/equipment/${recommended.id}`}>{recommended.name}</a><p>Для подключения ноутбука. Коробка 07.</p></div><button type="button" className="add-accessory" disabled={!available || !isRangeAvailable(recommended, range) || inDraft(recommended.id)} onClick={() => onAdd({ equipmentId: recommended.id, range: { ...range } })}><Icon name={inDraft(recommended.id) ? 'check' : 'plus'} />{inDraft(recommended.id) ? 'Добавлено' : 'Добавить'}</button></div></section>}
      </div>
    </div>
  </div>
}
