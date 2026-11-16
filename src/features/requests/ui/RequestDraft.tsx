import { equipmentMocks, isRangeAvailable, type DateRange } from '../../equipment'
import { Icon } from '../../../shared/ui/Icon'

export function RequestDraft({
  equipmentIds,
  range,
  onRemove,
}: {
  equipmentIds: string[]
  range: DateRange
  onRemove: (id: string) => void
}) {
  return (
    <ul className="request-items">
      {equipmentIds.map((id) => {
        const item = equipmentMocks.find((equipment) => equipment.id === id)
        const canCheck = Boolean(range.start && range.end && range.end >= range.start)
        const unavailable = item && canCheck && !isRangeAvailable(item, range)
        return (
          item && (
            <li
              className="request-equipment"
              key={item.id}
            >
              <a
                href={`#/equipment/${item.id}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                <img
                  src={item.image}
                  alt=""
                  width="80"
                  height="64"
                />
              </a>
              <div>
                <a
                  className="request-equipment-name"
                  href={`#/equipment/${item.id}`}
                >
                  {item.name}
                </a>
                <p>1 шт. / {item.location}</p>
                {unavailable && (
                  <span className="item-unavailable">
                    <Icon name="info" />
                    Недоступно на эти даты
                  </span>
                )}
              </div>
              <button
                type="button"
                className="remove-equipment"
                aria-label={`Убрать ${item.name}`}
                onClick={() => onRemove(item.id)}
              >
                <Icon name="close" />
              </button>
            </li>
          )
        )
      })}
    </ul>
  )
}
