import { eventMocks } from '../../../features/events'
import { formatRequestPeriod, requestStatusLabels, type StudentRequest } from '../../../features/requests'
import { Icon } from '../../../shared/ui/Icon'
import './requests.css'
import './request-overview.css'

export function RequestSentPage({ request }: { request?: StudentRequest }) {
  if (!request) return <div className="requests-page"><div className="request-empty"><h1>Заявка не найдена</h1><p>Проверьте её в списке ваших заявок.</p><a href="#/requests" className="request-primary">К моим заявкам</a></div></div>
  return <div className="requests-page request-sent-page">
    <section className="request-sent-card" aria-labelledby="request-sent-title">
      <div className="request-sent-intro"><div><p className="request-number">Заявка № {request.id}</p><h1 id="request-sent-title">Заявка отправлена</h1><p className="request-sent-description">Куратор рассмотрит комплект и даты. Бронь появится после одобрения.</p></div><span className="request-sent-check" aria-hidden="true"><Icon name="check" /></span></div>
      <dl className="request-sent-facts"><div><dt>Даты</dt><dd>{formatRequestPeriod(request.range)}</dd></div><div><dt>Мероприятие</dt><dd>{eventMocks.find((event) => event.id === request.eventId)?.name}</dd></div></dl>
      <span className={`request-status status-${request.status}`}>{requestStatusLabels[request.status]}</span>
      <div className="request-sent-actions"><a href="#/requests" className="request-primary">К моим заявкам<Icon name="arrow" /></a><a href="#/" className="request-secondary">В каталог</a></div>
    </section>
  </div>
}
