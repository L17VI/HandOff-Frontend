import { useState } from 'react'
import type { StudentRequest } from '../../requests'
import { notificationMocks } from '../mocks/notifications'

export function useNotifications(requests: StudentRequest[]) {
  const [entries, setEntries] = useState(() => [...notificationMocks])
  const notifications = entries.filter((entry) =>
    requests.some(
      (request) =>
        request.id === entry.requestId &&
        (entry.kind !== 'return_reminder' || request.status === 'issued'),
    ),
  )
  const unreadCount = notifications.filter((entry) => !entry.read).length

  function markRead(id: string) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)),
    )
  }

  function markAllRead() {
    setEntries((current) => current.map((entry) => ({ ...entry, read: true })))
  }

  return { notifications, unreadCount, markRead, markAllRead }
}
