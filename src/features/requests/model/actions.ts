import type { RequestAction, RequestHistoryEntry, StudentRequest } from './draft'
import { formatRequestPeriod } from './presentation'

export function applyRequestAction(
  request: StudentRequest,
  action: RequestAction,
  at: string,
): { request: StudentRequest } | { error: string } {
  let kind: RequestHistoryEntry['kind']
  let status = request.status
  let extension = request.extension
  let returnReport = request.returnReport
  if (action.type === 'receive') {
    if (status !== 'approved') {
      return { error: 'Получение можно отметить только после одобрения заявки.' }
    }
    status = 'issued'
    kind = 'received'
  } else if (action.type === 'return') {
    if (status !== 'issued') {
      return { error: 'Возврат можно отметить только для полученного комплекта.' }
    }
    const returnedEquipmentIds = [...new Set(action.returnedEquipmentIds)]
    if (returnedEquipmentIds.some((id) => !request.equipmentIds.includes(id))) {
      return { error: 'В отметке есть оборудование из другой заявки.' }
    }
    const issue = action.issue.trim()
    if (returnedEquipmentIds.length !== request.equipmentIds.length && !issue) {
      return { error: 'Если вернули не всё, опишите, что случилось с остальным оборудованием.' }
    }
    if (issue.length > 1000) {
      return { error: 'Сократите описание проблемы до 1000 символов.' }
    }
    returnReport = { returnedEquipmentIds, issue, submittedAt: at }
    status = 'return_pending'
    kind = 'return_marked'
  } else if (action.type === 'cancel') {
    if (status !== 'pending' && status !== 'approved') {
      return { error: 'После получения оборудования отменить заявку нельзя.' }
    }
    status = 'cancelled'
    kind = 'cancelled'
  } else {
    if (status !== 'issued') {
      return { error: 'Продление доступно только для полученного комплекта.' }
    }
    if (extension) {
      return { error: 'Запрос продления уже на рассмотрении.' }
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(action.requestedEnd) ||
      Number.isNaN(Date.parse(`${action.requestedEnd}T12:00:00Z`)) ||
      action.requestedEnd <= request.range.end
    ) {
      return { error: 'Выберите дату позже текущего срока возврата.' }
    }
    extension = { requestedEnd: action.requestedEnd, reason: action.reason.trim() }
    kind = 'extension_requested'
  }
  const note =
    action.type === 'extend'
      ? `Запрошено до ${formatRequestPeriod({ start: action.requestedEnd, end: action.requestedEnd })}`
      : action.type === 'return' && returnReport
        ? `Отмечено предметов: ${returnReport.returnedEquipmentIds.length} из ${request.equipmentIds.length}${returnReport.issue ? '. Есть описание проблемы.' : ''}`
        : undefined
  return {
    request: {
      ...request,
      status,
      extension,
      returnReport,
      history: [{ kind, at, note }, ...request.history],
    },
  }
}
