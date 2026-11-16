import { equipmentMocks } from '../../equipment'
import { eventMocks } from '../../events'
import { Icon } from '../../../shared/ui/Icon'
import type { StudentRequest } from '../model/draft'
import { requestStatusLabels, requestStatusHints, formatRequestPeriod } from '../model/presentation'

export function StudentRequestCard({ request }: { request: StudentRequest }) {
  const equipment = request.equipmentIds.flatMap((id) =>
    equipmentMocks.filter((item) => item.id === id),
  )
  const event = eventMocks.find((entry) => entry.id === request.eventId)
  return (
    <article
      className="student-request-card"
      aria-labelledby={`request-${request.id}-title`}
    >
      <div className="request-card-top">
        <span className="request-number">Заявка № {request.id}</span>
        <span className={`request-status status-${request.status}`}>
          {requestStatusLabels[request.status]}
        </span>
      </div>
      <div className="request-card-main">
        <div>
          <h2 id={`request-${request.id}-title`}>
            <a
              className="open-request-link"
              href={`#/requests/${request.id}`}
            >
              {event?.name}
            </a>
          </h2>
          <div className="request-kit-preview">
            <div
              className="request-kit-images"
              aria-hidden="true"
            >
              {equipment.map((item) => (
                <img
                  key={item.id}
                  src={item.image}
                  alt=""
                  width="44"
                  height="36"
                />
              ))}
            </div>
            <p>{equipment.map((item) => item.name).join(', ')}</p>
          </div>
        </div>
        <div className="request-card-period">
          <Icon name="calendar" />
          <div>
            <span>Период использования</span>
            <p>{formatRequestPeriod(request.range)}</p>
          </div>
        </div>
      </div>
      <details className="request-card-details">
        <summary>
          <span>Состав и детали</span>
          <Icon name="chevron" />
        </summary>
        <div className="request-expanded">
          <p className="request-state-hint">
            <Icon name="info" />
            {requestStatusHints[request.status]}
          </p>
          <ul className="submitted-equipment">
            {equipment.map((item) => (
              <li key={item.id}>
                <img
                  src={item.image}
                  alt=""
                  width="56"
                  height="44"
                />
                <div>
                  <a href={`#/equipment/${item.id}`}>{item.name}</a>
                  <p>
                    Инв. № {item.id} / {item.location}
                  </p>
                </div>
                <span>1 шт.</span>
              </li>
            ))}
          </ul>
          {request.location && (
            <p className="submitted-note">
              <strong>Место использования:</strong> {request.location}
            </p>
          )}
          {request.comment && (
            <p className="submitted-note">
              <strong>Комментарий:</strong> {request.comment}
            </p>
          )}
        </div>
      </details>
    </article>
  )
}
