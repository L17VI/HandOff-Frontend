import { useRef, useState, type FormEvent } from 'react'
import { RequestDraft, validateRequest, type RequestDraftData, type RequestErrors } from '../../../features/requests'
import { eventMocks } from '../../../features/events'
import { formatPeriod } from '../../../features/equipment'
import { Icon } from '../../../shared/ui/Icon'
import './requests.css'

interface NewRequestPageProps {
  draft: RequestDraftData
  onChange: (draft: RequestDraftData) => void
  onRemove: (id: string) => void
  onSubmit: () => RequestErrors
}

export function NewRequestPage({ draft, onChange, onRemove, onSubmit }: NewRequestPageProps) {
  const [errors, setErrors] = useState<RequestErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  function updateDraft(patch: Partial<RequestDraftData>) {
    onChange({ ...draft, ...patch })
    setErrors((current) => {
      const next = { ...current }
      if (patch.range) { delete next.start; delete next.end; delete next.equipment }
      if (patch.eventId !== undefined) delete next.eventId
      return next
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateRequest(draft)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      const field = nextErrors.start ? '#request-start' : nextErrors.end ? '#request-end' : nextErrors.eventId ? '#request-event' : '#request-equipment-summary'
      formRef.current?.querySelector<HTMLElement>(field)?.focus()
      return
    }
    setErrors(onSubmit())
  }

  const firstEquipment = draft.equipmentIds[0]
  if (!firstEquipment) return <div className="requests-page"><a className="back-link" href="#/requests"><Icon name="arrow" />Мои заявки</a><div className="request-page-heading"><h1>Новая заявка</h1></div><div className="request-empty"><span className="empty-box"><Icon name="box" /></span><h2>Сначала выберите оборудование</h2><p>Добавьте технику из каталога, затем укажите даты и мероприятие.</p><a className="request-primary" href="#/">Перейти в каталог<Icon name="arrow" /></a></div></div>

  return <div className="requests-page">
    <a className="back-link" href={`#/equipment/${firstEquipment}`}><Icon name="arrow" />К карточке оборудования</a>
    <div className="request-page-heading"><h1>Новая заявка</h1><p>Проверьте комплект и укажите, когда и для чего он нужен.</p></div>
    <form ref={formRef} className="new-request-grid" noValidate aria-labelledby="request-details-heading" onSubmit={submit}>
      <section className="request-panel request-fields" aria-labelledby="request-details-heading">
        <h2 id="request-details-heading">Когда и для чего</h2>
        <p className="form-guidance">Даты и мероприятие обязательны. Остальное по желанию.</p>
        <fieldset className="request-date-fields"><legend className="sr-only">Период для всего комплекта</legend>
          <div className="request-field"><label htmlFor="request-start">Получение</label><input id="request-start" name="start" type="date" required value={draft.range.start} aria-invalid={Boolean(errors.start)} aria-describedby={errors.start ? 'request-start-error' : 'request-period-help'} onChange={(event) => updateDraft({ range: { ...draft.range, start: event.target.value } })} />{errors.start && <p className="field-error" id="request-start-error">{errors.start}</p>}</div>
          <div className="request-field"><label htmlFor="request-end">Возврат</label><input id="request-end" name="end" type="date" required min={draft.range.start || undefined} value={draft.range.end} aria-invalid={Boolean(errors.end)} aria-describedby={errors.end ? 'request-end-error' : 'request-period-help'} onChange={(event) => updateDraft({ range: { ...draft.range, end: event.target.value } })} />{errors.end && <p className="field-error" id="request-end-error">{errors.end}</p>}</div>
        </fieldset>
        <p className="field-help" id="request-period-help">Один период для всего оборудования в заявке.</p>
        <div className="request-field"><label htmlFor="request-event">Мероприятие</label><div className="request-select"><select id="request-event" name="eventId" required value={draft.eventId} aria-invalid={Boolean(errors.eventId)} aria-describedby={errors.eventId ? 'request-event-error' : undefined} onChange={(event) => updateDraft({ eventId: event.target.value })}><option value="" disabled>Выберите мероприятие</option>{eventMocks.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select><Icon name="chevron" /></div>{errors.eventId && <p className="field-error" id="request-event-error">{errors.eventId}</p>}</div>
        <div className="request-field"><label htmlFor="request-location">Где будете использовать <span>необязательно</span></label><input id="request-location" name="location" type="text" value={draft.location} maxLength={200} placeholder="Например, мастерская или аудитория" onChange={(event) => updateDraft({ location: event.target.value })} /></div>
        <div className="request-field"><label htmlFor="request-comment">Комментарий <span>необязательно</span></label><textarea id="request-comment" name="comment" rows={4} maxLength={1000} value={draft.comment} placeholder="Что куратору нужно знать о вашем проекте?" onChange={(event) => updateDraft({ comment: event.target.value })} /><p className="field-help">Можно уточнить задачу, время получения или особенности монтажа.</p></div>
      </section>
      <section className="request-panel request-summary" id="request-equipment-summary" tabIndex={-1} aria-labelledby="request-items-heading">
        <div className="request-panel-heading"><h2 id="request-items-heading">В заявке</h2><span className="request-item-count">{draft.equipmentIds.length} {draft.equipmentIds.length === 1 ? 'предмет' : 'предмета'}</span></div>
        <RequestDraft equipmentIds={draft.equipmentIds} range={draft.range} onRemove={(id) => { onRemove(id); setErrors({}) }} />
        {errors.equipment && <p className="field-error equipment-error" id="request-equipment-error" tabIndex={-1} role="alert">{errors.equipment}</p>}
        {draft.range.start && draft.range.end && draft.range.end >= draft.range.start && <div className="request-period-preview"><Icon name="calendar" /><span>{formatPeriod(draft.range)}</span><span>для всего комплекта</span></div>}
        <div className="approval-notice"><Icon name="info" /><div><h3>Сначала нужно одобрение</h3><p>Пока куратор рассматривает заявку, техника остаётся доступной другим студентам.</p></div></div>
        <div className="request-actions"><button type="submit" className="request-primary"><Icon name="arrow" />Отправить заявку</button><a href="#/" className="request-secondary">Продолжить выбор</a></div>
      </section>
    </form>
  </div>
}
