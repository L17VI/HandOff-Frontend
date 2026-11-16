import { equipmentMocks, formatPeriod } from '../../equipment'
import type { DraftItem } from '../model/draft'
import { Icon } from '../../../shared/ui/Icon'

export function RequestDraft({ items, onRemove }: { items: DraftItem[]; onRemove: (id: string) => void }) {
  if (!items.length) return <div className="mock-empty"><Icon name="box" /><h3>Заявок пока нет</h3><p>Выберите оборудование и добавьте его в заявку.</p></div>
  return <div className="request-draft"><p className="muted">Черновик заявки. Бронь появится после одобрения.</p>{items.map((entry) => {
    const item = equipmentMocks.find((equipment) => equipment.id === entry.equipmentId)
    return item && <div className="draft-item" key={item.id}><img src={item.image} alt="" width="80" height="60" /><div><h3>{item.name}</h3><p>{formatPeriod(entry.range)}</p></div><button type="button" className="icon-button" aria-label={`Убрать ${item.name}`} onClick={() => onRemove(item.id)}><Icon name="close" /></button></div>
  })}</div>
}
