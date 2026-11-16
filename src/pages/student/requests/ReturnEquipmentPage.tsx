import { useRef, useState, type FormEvent } from 'react'
import { equipmentMocks } from '../../../features/equipment'
import { type RequestAction, type StudentRequest } from '../../../features/requests'
import { Icon } from '../../../shared/ui/Icon'
import './requests.css'
import './request-overview.css'
import './return-equipment.css'

export function ReturnEquipmentPage({ request, onAction }: { request?: StudentRequest; onAction: (id: string, action: RequestAction) => string | undefined }) {
  const [returnedIds, setReturnedIds] = useState<string[]>([])
  const [issue, setIssue] = useState('')
  const [error, setError] = useState('')
  const issueRef = useRef<HTMLTextAreaElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  if (!request) return <div className="requests-page"><div className="request-empty"><h1>Заявка не найдена</h1><a className="request-primary" href="#/requests">К моим заявкам</a></div></div>
  if (request.status !== 'issued') return <div className="requests-page"><div className="request-empty"><Icon name="info" /><h1>{request.returnReport ? 'Возврат уже отмечен' : 'Возврат пока недоступен'}</h1><p>{request.returnReport ? 'Сотрудник лаборатории проверит вашу отметку.' : 'Отметить возврат можно после получения оборудования.'}</p><a className="request-primary" href={`#/requests/${request.id}`}>К заявке № {request.id}</a></div></div>

  const equipment = request.equipmentIds.flatMap((id) => equipmentMocks.filter((item) => item.id === id))
  const incomplete = returnedIds.length < request.equipmentIds.length
  const requestId = request.id
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (incomplete && !issue.trim()) {
      setError('Отметьте возвращённые предметы или опишите, что случилось с остальными.')
      issueRef.current?.focus()
      return
    }
    const message = onAction(requestId, { type: 'return', returnedEquipmentIds: returnedIds, issue })
    if (message) { setError(message); errorRef.current?.focus(); return }
    window.location.hash = `/requests/${requestId}`
  }
  function toggle(id: string) {
    setReturnedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
    setError('')
  }

  return <div className="requests-page return-equipment-page">
    <a className="back-link" href={`#/requests/${request.id}`}><Icon name="arrow" />К заявке № {request.id}</a>
    <div className="request-page-heading"><h1>Возврат оборудования</h1><p>Верните технику в лабораторию и отметьте каждый предмет.</p></div>
    <div className="return-equipment-layout">
      <form className="request-panel return-equipment-form" noValidate onSubmit={submit} aria-labelledby="return-items-title">
        <div className="request-panel-heading"><h2 id="return-items-title">Что возвращаете</h2><span className="request-item-count" role="status">Отмечено {returnedIds.length} из {equipment.length}</span></div>
        <p className="return-items-help">Сверьте инвентарные номера. Рядом указано место хранения.</p>
        <ul className="return-equipment-list">{equipment.map((item) => <li key={item.id} className={returnedIds.includes(item.id) ? 'is-marked' : ''}><img src={item.image} alt="" width="64" height="52" /><div className="return-item-description"><h3>{item.name}</h3><p>1 шт. / {item.location}</p><span>Инв. № {item.id}</span></div><label className="return-item-checkbox"><input type="checkbox" name="returnedEquipmentIds" value={item.id} checked={returnedIds.includes(item.id)} onChange={() => toggle(item.id)} aria-label={`${item.name}: возвращено`} /><span>Возвращено</span></label></li>)}</ul>
        <div className="request-field return-issue-field"><label htmlFor="return-issue">Если что-то сломалось или потерялось</label><textarea ref={issueRef} id="return-issue" name="issue" value={issue} rows={4} maxLength={1000} required={incomplete} aria-invalid={Boolean(error)} aria-describedby={error ? 'return-error' : 'return-issue-help'} onChange={(event) => { setIssue(event.target.value); setError('') }} placeholder="Опишите, что произошло и с каким предметом" /><p className="field-help" id="return-issue-help">Если вернули не весь комплект, описание обязательно. Можно сообщить и о повреждении возвращённой техники.</p></div>
        {error && <p className="field-error return-form-error" id="return-error" ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
        <div className="return-form-actions"><button type="submit" className="request-primary"><Icon name="check" />Отправить отметку</button><a href={`#/requests/${request.id}`} className="request-secondary">Назад</a></div>
      </form>
      <aside className="return-information"><div className="approval-notice"><Icon name="info" /><div><h2>Отметьте после возврата</h2><p>Сотрудник проверит состав и состояние техники. До проверки заявка останется открытой.</p></div></div><div className="return-place"><Icon name="pin" /><div><h3>Куда вернуть</h3><p>Лаборатория цифрового искусства</p><span>Места хранения указаны у каждого предмета.</span></div></div></aside>
    </div>
  </div>
}
