import { equipmentMocks, formatPeriod } from '../../equipment'
import { formatDay } from '../../equipment/model/availability'
import type { StudentRequest } from '../../requests'
import type { IconName } from '../../../shared/ui/Icon'
import type { LabNotification } from './notification'

export interface NotificationItem extends LabNotification {
  title: string
  description: string
  icon: IconName
  dateLabel: string
}

const icons: Record<LabNotification['kind'], IconName> = { return_reminder: 'clock', approved: 'check', returned: 'return' }
const dateFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Vladivostok' })

export function getNotificationItems(notifications: LabNotification[], requests: StudentRequest[]): NotificationItem[] {
  return notifications.flatMap((notification) => {
    const request = requests.find((entry) => entry.id === notification.requestId)
    if (!request) return []
    const equipment = request.equipmentIds.map((id) => equipmentMocks.find((item) => item.id === id)?.name ?? `Предмет № ${id}`).join(', ')
    const title = notification.kind === 'return_reminder' ? `Верните комплект ${formatDay(request.range.end)}` : notification.kind === 'approved' ? `Заявку № ${request.id} одобрили` : `Возврат по заявке № ${request.id} подтверждён`
    const description = notification.kind === 'approved' ? `Оборудование зарезервировали на ${formatPeriod(request.range)}.` : notification.kind === 'returned' ? 'Сотрудник лаборатории проверил и принял комплект.' : `${equipment}. Заявка № ${request.id}.`
    return [{ ...notification, title, description, icon: icons[notification.kind], dateLabel: dateFormat.format(new Date(notification.at)) }]
  }).sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
