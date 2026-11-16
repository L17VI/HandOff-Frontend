import { equipmentMocks, formatPeriod } from '../../../features/equipment'
import { eventMocks } from '../../../features/events'
import type { RequestDraftData, StudentRequest } from '../../../features/requests'
import { Icon } from '../../../shared/ui/Icon'
import './requests.css'

export function RequestsPage({ draft, requests, createdId }: { draft: RequestDraftData; requests: StudentRequest[]; createdId: string | null }) {
  const created = requests.find((request) => request.id === createdId)
  return <div className="requests-page">
    <a className="back-link" href="#/"><Icon name="arrow" />В каталог</a>
    <div className="request-page-heading"><h1>Мои заявки</h1><p>Комплекты оборудования, даты и решения куратора.</p></div>
    {created && <div className="request-created" role="status"><Icon name="check" /><div><h2>Заявка № {created.id} отправлена</h2><p>Она на рассмотрении. Оборудование будет забронировано после одобрения куратора.</p></div></div>}
    <div className="requests-list">
      {draft.equipmentIds.length > 0 && <article className="request-list-card draft-request-card"><div className="request-panel-heading"><h2>Новая заявка</h2><span className="request-status draft-status">Черновик</span></div><p>{draft.equipmentIds.length} {draft.equipmentIds.length === 1 ? 'предмет' : 'предмета'} в комплекте</p><a href="#/requests/new" className="request-primary">Продолжить оформление<Icon name="arrow" /></a></article>}
      {requests.map((request) => <article className="request-list-card" key={request.id}><div className="request-panel-heading"><h2>Заявка № {request.id}</h2><span className="request-status">На рассмотрении</span></div><h3>{eventMocks.find((event) => event.id === request.eventId)?.name}</h3><p className="submitted-period"><Icon name="calendar" />{formatPeriod(request.range)}</p><ul className="submitted-equipment">{request.equipmentIds.map((id) => {
        const equipment = equipmentMocks.find((item) => item.id === id)
        return equipment && <li key={id}><img src={equipment.image} alt="" width="56" height="44" /><a href={`#/equipment/${id}`}>{equipment.name}</a><span>1 шт.</span></li>
      })}</ul>{request.location && <p className="submitted-note"><strong>Место использования:</strong> {request.location}</p>}{request.comment && <p className="submitted-note"><strong>Комментарий:</strong> {request.comment}</p>}</article>)}
    </div>
    {!draft.equipmentIds.length && !requests.length && <div className="request-empty"><span className="empty-box"><Icon name="box" /></span><h2>Заявок пока нет</h2><p>Выберите технику в каталоге и соберите комплект для своего проекта.</p><a href="#/" className="request-primary">Перейти в каталог<Icon name="arrow" /></a></div>}
  </div>
}
