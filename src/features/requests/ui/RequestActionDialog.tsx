import { useId, useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import { Icon } from '../../../shared/ui/Icon'
import type { RequestAction, StudentRequest } from '../model/draft'

const actionCopy = {
  receive: { title: 'Отметить получение', button: 'Подтвердить получение', description: 'Сверьте инвентарные номера и убедитесь, что весь комплект у вас.', icon: 'check' },
  cancel: { title: 'Отменить заявку?', button: 'Да, отменить заявку', description: 'Заявка будет закрыта. При необходимости можно подать новую.', icon: 'close' },
  extend: { title: 'Запросить продление', button: 'Отправить запрос', description: 'Укажите новую дату. Текущий срок возврата действует до одобрения куратора.', icon: 'calendar' },
} as const

interface RequestActionDialogProps {
  type: Exclude<RequestAction['type'], 'return'>
  request: StudentRequest
  onAction: (action: RequestAction) => string | undefined
}

export function RequestActionDialog({ type, request, onAction }: RequestActionDialogProps) {
  const id = useId()
  const [error, setError] = useState('')
  const [requestedEnd, setRequestedEnd] = useState('')
  const [reason, setReason] = useState('')
  const copy = actionCopy[type]
  const isPrimary = type === 'receive'
  function submit(event: FormEvent<HTMLFormElement>) {
    const action: RequestAction = type === 'extend' ? { type, requestedEnd, reason } : { type }
    const message = onAction(action)
    if (message) { event.preventDefault(); setError(message) }
  }
  return <Modal title={copy.title} trigger={<><Icon name={copy.icon} />{type === 'cancel' ? 'Отменить заявку' : copy.title}</>} triggerClassName={isPrimary ? 'request-primary' : 'request-secondary'}>
    <form className="request-action-form" method="dialog" onSubmit={submit}>
      <p>{copy.description}</p>
      {type === 'extend' ? <><div className="request-field"><label htmlFor={`${id}-date`}>Новая дата возврата</label><input id={`${id}-date`} name="requestedEnd" type="date" required autoFocus min={request.range.end} value={requestedEnd} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => { setRequestedEnd(event.target.value); setError('') }} /></div><div className="request-field"><label htmlFor={`${id}-reason`}>Причина <span>необязательно</span></label><textarea id={`${id}-reason`} name="reason" rows={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Например, монтаж занимает больше времени" /></div></> : type !== 'cancel' && <label className="request-confirmation"><input type="checkbox" name="complete" required />Весь комплект у меня, номера совпадают</label>}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
      <div className="dialog-request-actions"><button type="button" className="request-secondary" autoFocus={type !== 'extend'} onClick={(event) => event.currentTarget.closest('dialog')?.close()}>Назад</button><button type="submit" className="request-primary">{copy.button}</button></div>
    </form>
  </Modal>
}
