import { Icon } from '../../../shared/ui/Icon'
import { Modal } from '../../../shared/ui/Modal'
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
      <Modal title={item.name} trigger={<>{item.status === 'busy' ? 'Встать в очередь' : 'Подробнее'}<Icon name="arrow" /></>} triggerClassName="details-link" triggerLabel={`${item.status === 'busy' ? 'Очередь на' : 'Подробнее о'} ${item.name}`}>
        <div className="detail-media"><img src={item.image} alt={item.name} width="560" height="310" /></div>
        <span className={`status status-${item.status}`}>{statusLabels[item.status]}</span>
        <p className="detail-description">{item.description}</p>
        <p className="equipment-location"><Icon name="pin" />{item.location}</p>
        <p className="muted">{item.status === 'busy' ? 'Оборудование занято до 22 ноября. Заявки на пересекающиеся даты рассматривает куратор.' : item.status === 'closed' ? 'Бронирование этого оборудования временно недоступно.' : 'Оборудование доступно. Комплект резервируется после одобрения заявки куратором.'}</p>
      </Modal>
    </div>
  </article>
}
