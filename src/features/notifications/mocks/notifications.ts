import type { LabNotification } from '../model/notification'

// События относятся к существующим моковым заявкам; относительные даты не фиксируем в тексте.
export const notificationMocks: LabNotification[] = [
  {
    id: 'return-040',
    requestId: '040',
    kind: 'return_reminder',
    at: '2026-11-16T12:00:00+10:00',
    read: false,
  },
  {
    id: 'approved-041',
    requestId: '041',
    kind: 'approved',
    at: '2026-11-15T11:08:00+10:00',
    read: false,
  },
  {
    id: 'returned-039',
    requestId: '039',
    kind: 'returned',
    at: '2026-11-12T17:00:00+10:00',
    read: true,
  },
]
