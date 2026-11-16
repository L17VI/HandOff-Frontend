import { useEffect, useRef, useState } from 'react'
import { equipmentMocks, formatPeriod } from '../../../features/equipment'
import { eventMocks } from '../../../features/events'
import {
  RequestHistory,
  RequestActionDialog,
  formatRequestPeriod,
  requestStatusLabels,
  type RequestAction,
  type StudentRequest,
} from '../../../features/requests'
import { Icon } from '../../../shared/ui/Icon'
import './requests.css'
import './request-overview.css'
import './request-detail.css'

interface RequestDetailPageProps {
  request?: StudentRequest
  onAction: (id: string, action: RequestAction) => string | undefined
}

const actionNotices: Record<RequestAction['type'], string> = {
  receive: 'Получение отмечено. Комплект теперь у вас.',
  return: 'Возврат отмечен. Сотрудник лаборатории проверит комплект.',
  cancel: 'Заявка отменена.',
  extend: 'Запрос продления отправлен. Текущая дата возврата пока не меняется.',
}

export function RequestDetailPage({ request, onAction }: RequestDetailPageProps) {
  const [notice, setNotice] = useState('')
  const noticeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (notice) {
      noticeRef.current?.focus()
    }
  }, [notice])
  if (!request) {
    return (
      <div className="requests-page">
        <div className="request-empty">
          <h1>Заявка не найдена</h1>
          <p>Проверьте номер или вернитесь к списку.</p>
          <a
            className="request-primary"
            href="#/requests"
          >
            К моим заявкам
          </a>
        </div>
      </div>
    )
  }

  const equipment = request.equipmentIds.flatMap((id) =>
    equipmentMocks.filter((item) => item.id === id),
  )
  const event = eventMocks.find((entry) => entry.id === request.eventId)
  const approved = request.status === 'approved'
  const issued = request.status === 'issued'
  const pending = request.status === 'pending'
  const requestId = request.id
  function act(action: RequestAction) {
    const error = onAction(requestId, action)
    if (!error) {
      setNotice(actionNotices[action.type])
    }
    return error
  }
  const actionDialog = (type: Exclude<RequestAction['type'], 'return'>) => (
    <RequestActionDialog
      key={type}
      type={type}
      request={request}
      onAction={act}
    />
  )

  return (
    <div className="requests-page request-detail-page">
      <a
        className="back-link"
        href="#/requests"
      >
        <Icon name="arrow" />
        Мои заявки
      </a>
      <div className="request-page-heading">
        <div className="request-detail-title">
          <h1>Заявка № {request.id}</h1>
          <span
            className={`request-status status-${request.status}`}
            role="status"
          >
            {requestStatusLabels[request.status]}
          </span>
        </div>
        <p>
          {event?.name} / {formatRequestPeriod(request.range)}
        </p>
      </div>
      {notice && (
        <div
          className="request-action-feedback"
          tabIndex={-1}
          ref={noticeRef}
          role="status"
        >
          <Icon name="check" />
          {notice}
        </div>
      )}
      <div className="request-detail-layout">
        <div className="request-detail-content">
          <section
            className="request-panel request-kit-panel"
            aria-labelledby="request-kit-title"
          >
            <div className="request-panel-heading">
              <h2 id="request-kit-title">
                {approved ? 'Что забрать' : issued ? 'Что у вас' : 'Комплект оборудования'}
              </h2>
              <span className="request-item-count">
                {equipment.length} {equipment.length === 1 ? 'предмет' : 'предмета'}
              </span>
            </div>
            <ul className="request-kit-list">
              {equipment.map((item) => (
                <li key={item.id}>
                  <img
                    src={item.image}
                    alt=""
                    width="64"
                    height="52"
                  />
                  <div>
                    <a href={`#/equipment/${item.id}`}>{item.name}</a>
                    <p>1 шт. / {item.location}</p>
                  </div>
                  <span className="kit-inventory">№ {item.id}</span>
                </li>
              ))}
            </ul>
          </section>
          {(approved || issued) && (
            <section
              className={`request-panel request-handover-panel ${issued ? 'is-issued' : ''}`}
              aria-labelledby="handover-title"
            >
              <h2 id="handover-title">
                {issued ? (
                  <>
                    <Icon name="clock" />
                    Верните до {formatPeriod({ start: request.range.end, end: request.range.end })}
                  </>
                ) : (
                  'Где забрать'
                )}
              </h2>
              <dl className="request-pickup-place">
                <dt>{issued ? 'Куда вернуть' : 'Место'}</dt>
                <dd>Лаборатория цифрового искусства</dd>
              </dl>
              <p className="request-handover-instructions">
                {issued
                  ? 'Передайте весь комплект сотруднику лаборатории, затем отметьте возврат. Инвентарные номера указаны в составе заявки.'
                  : 'Получите комплект в лаборатории. Сверьте номера на бирках и отметьте получение, когда всё оборудование будет у вас.'}
              </p>
              {issued && request.extension && (
                <div className="extension-pending">
                  <Icon name="calendar" />
                  <div>
                    <h3>Продление на рассмотрении</h3>
                    <p>
                      Запрошено до{' '}
                      {formatRequestPeriod({
                        start: request.extension.requestedEnd,
                        end: request.extension.requestedEnd,
                      })}
                      . До решения куратора действует прежний срок.
                    </p>
                    {request.extension.reason && <p>{request.extension.reason}</p>}
                  </div>
                </div>
              )}
              <div className="request-detail-actions">
                {approved ? (
                  <>
                    {actionDialog('receive')}
                    {actionDialog('cancel')}
                  </>
                ) : (
                  <>
                    <a
                      className="request-primary return-equipment-link"
                      href={`#/requests/${request.id}/return`}
                    >
                      <Icon name="return" />
                      Отметить возврат
                    </a>
                    {!request.extension && actionDialog('extend')}
                  </>
                )}
              </div>
            </section>
          )}
          {!approved && !issued && (
            <section className="request-panel request-waiting-panel">
              <Icon name={request.status === 'return_pending' || pending ? 'clock' : 'info'} />
              <div>
                <h2>
                  {pending
                    ? 'Ожидаем решение куратора'
                    : request.status === 'return_pending'
                      ? 'Возврат на проверке'
                      : requestStatusLabels[request.status]}
                </h2>
                <p>
                  {pending
                    ? 'После одобрения здесь появятся инструкции по получению. Пока оборудование не забронировано.'
                    : request.status === 'return_pending'
                      ? 'Вы отметили возврат. Сотрудник проверит состав и состояние оборудования, затем закроет заявку.'
                      : request.status === 'returned'
                        ? 'Сотрудник подтвердил возврат комплекта. Заявка завершена.'
                        : 'Эта заявка закрыта. При необходимости выберите оборудование и подайте новую.'}
                </p>
                {pending && <div className="request-detail-actions">{actionDialog('cancel')}</div>}
              </div>
            </section>
          )}
          {request.returnReport && (
            <section className="request-panel return-report-panel">
              <h2>Ваша отметка возврата</h2>
              <ul className="return-report-items">
                {equipment.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <span
                      className={
                        request.returnReport?.returnedEquipmentIds.includes(item.id)
                          ? 'is-returned'
                          : 'is-not-returned'
                      }
                    >
                      {request.returnReport?.returnedEquipmentIds.includes(item.id)
                        ? 'Возврат отмечен'
                        : 'Возврат не отмечен'}
                    </span>
                  </li>
                ))}
              </ul>
              {request.returnReport.issue && (
                <div className="return-reported-issue">
                  <h3>Описание проблемы</h3>
                  <p>{request.returnReport.issue}</p>
                </div>
              )}
            </section>
          )}
          {(request.location || request.comment) && (
            <details className="request-project-details">
              <summary>
                Информация о проекте
                <Icon name="chevron" />
              </summary>
              {request.location && (
                <p>
                  <strong>Место использования:</strong> {request.location}
                </p>
              )}
              {request.comment && (
                <p>
                  <strong>Комментарий:</strong> {request.comment}
                </p>
              )}
            </details>
          )}
        </div>
        <section
          className="request-panel request-history-panel"
          aria-labelledby="history-title"
        >
          <h2 id="history-title">История заявки</h2>
          <RequestHistory entries={request.history} />
        </section>
      </div>
    </div>
  )
}
