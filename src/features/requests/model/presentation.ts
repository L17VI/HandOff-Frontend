import { equipmentMocks, formatPeriod, type DateRange } from '../../equipment'
import { eventMocks } from '../../events'
import type { StudentRequest } from './draft'

export const requestStatusLabels: Record<StudentRequest['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Можно забирать',
  issued: 'У вас',
  returned: 'Возвращено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
  return_pending: 'Возврат на проверке',
}

export const requestStatusHints: Record<StudentRequest['status'], string> = {
  pending: 'Оборудование будет забронировано после одобрения куратора.',
  approved: 'Заявка одобрена. Получите комплект в лаборатории.',
  issued: 'Комплект у вас. Верните его до указанной даты.',
  returned: 'Комплект возвращён в лабораторию.',
  rejected: 'Заявка отклонена. Подберите другое оборудование или даты.',
  cancelled: 'Заявка отменена, оборудование не зарезервировано.',
  return_pending: 'Вы отметили возврат. Сотрудник лаборатории проверит комплект.',
}

export const requestTabs = [
  { id: 'all', label: 'Все' },
  { id: 'pending', label: 'На рассмотрении' },
  { id: 'approved', label: 'К получению' },
  { id: 'issued', label: 'У меня' },
  { id: 'return_pending', label: 'На проверке' },
  { id: 'completed', label: 'Завершённые' },
] as const
export type RequestTab = (typeof requestTabs)[number]['id']

export function matchesRequestTab(request: StudentRequest, tab: RequestTab) {
  return (
    tab === 'all' ||
    (tab === 'completed'
      ? ['returned', 'rejected', 'cancelled'].includes(request.status)
      : request.status === tab)
  )
}

export function filterRequests(requests: StudentRequest[], tab: RequestTab, query: string) {
  const search = query.trim().toLocaleLowerCase('ru')
  return requests.filter((request) => {
    const event = eventMocks.find((entry) => entry.id === request.eventId)
    const equipmentNames = request.equipmentIds
      .map((id) => equipmentMocks.find((item) => item.id === id)?.name || '')
      .join(' ')
    return (
      matchesRequestTab(request, tab) &&
      `${request.id} ${event?.name || ''} ${equipmentNames}`
        .toLocaleLowerCase('ru')
        .includes(search)
    )
  })
}

export function formatRequestPeriod(range: DateRange) {
  if (range.start.slice(0, 4) === range.end.slice(0, 4)) {
    return `${formatPeriod(range)} ${range.end.slice(0, 4)}`
  }
  const format = (date: string) =>
    new Intl.DateTimeFormat('ru', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
      .format(new Date(`${date}T12:00:00Z`))
      .replace(' г.', '')
  return `${format(range.start)} – ${format(range.end)}`
}
