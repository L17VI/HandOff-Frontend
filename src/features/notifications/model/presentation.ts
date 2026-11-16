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

const icons: Record<LabNotification['kind'], IconName> = {
  return_reminder: 'clock',
  approved: 'check',
  returned: 'return',
}
const dateFormat = new Intl.DateTimeFormat('ru', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Vladivostok',
})

function getNotificationContent(kind: LabNotification['kind'], request: StudentRequest) {
  switch (kind) {
    case 'approved':
      return {
        title: `Заявку № ${request.id} одобрили`,
        description: `Оборудование зарезервировали на ${formatPeriod(request.range)}.`,
      }
    case 'returned':
      return {
        title: `Возврат по заявке № ${request.id} подтверждён`,
        description: 'Сотрудник лаборатории проверил и принял комплект.',
      }
    case 'return_reminder': {
      const equipment = request.equipmentIds
        .map((id) => equipmentMocks.find((item) => item.id === id)?.name ?? `Предмет № ${id}`)
        .join(', ')

      return {
        title: `Верните комплект ${formatDay(request.range.end)}`,
        description: `${equipment}. Заявка № ${request.id}.`,
      }
    }
  }
}

export function getNotificationItems(
  notifications: LabNotification[],
  requests: StudentRequest[],
): NotificationItem[] {
  return notifications
    .flatMap((notification) => {
      const request = requests.find((entry) => entry.id === notification.requestId)
      if (!request) {
        return []
      }
      return [
        {
          ...notification,
          ...getNotificationContent(notification.kind, request),
          icon: icons[notification.kind],
          dateLabel: dateFormat.format(new Date(notification.at)),
        },
      ]
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
