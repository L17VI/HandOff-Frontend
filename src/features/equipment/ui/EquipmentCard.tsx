import { Icon } from '../../../shared/ui/Icon'
import { statusLabels, type Equipment } from '../model/equipment'

export function EquipmentCard({ item }: { item: Equipment }) {
  return <article className="equipment-card">
    <div className={`equipment-media equipment-media-${item.id}`}>
      <span className={`status status-${item.status}`}>{statusLabels[item.status]}</span>
      <img src={item.image} alt={item.name} width="560" height="310" />
    </div>
    <div className="equipment-info">
      <span className="inventory-number">№ {item.id}</span>
      <h3>{item.name}</h3>
      <p className="equipment-description">{item.description}</p>
      <p className="equipment-location"><Icon name="pin" /><span>{item.location}</span></p>
      <a href={`#/equipment/${item.id}`} className="details-link" aria-label={`Подробнее о ${item.name}`}>{item.status === 'busy' ? 'Встать в очередь' : 'Подробнее'}<Icon name="arrow" /></a>
    </div>
  </article>
}
