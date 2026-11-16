import type { StudentRequest } from '../model/draft'

// Примеры состояний для студенческого интерфейса. Серверные данные пока не подключены.
export const requestMocks: StudentRequest[] = [
  { id: '042', status: 'pending', equipmentIds: ['035', '028'], range: { start: '2026-11-18', end: '2026-11-20' }, eventId: 'light', location: 'Мастерская цифрового искусства', comment: 'Для показа видео на монтаже и выставке.', history: [{ kind: 'submitted', at: '2026-11-14T16:42:00+10:00' }] },
  { id: '041', status: 'approved', equipmentIds: ['035', '028'], range: { start: '2026-11-18', end: '2026-11-20' }, eventId: 'defence', location: 'Аудитория для защиты', comment: '', history: [{ kind: 'approved', at: '2026-11-15T11:08:00+10:00' }, { kind: 'submitted', at: '2026-11-14T15:30:00+10:00' }] },
  { id: '040', status: 'issued', equipmentIds: ['074'], range: { start: '2026-11-16', end: '2026-11-17' }, eventId: 'exhibition', location: 'Выставочное пространство', comment: 'Монитор для интерактивной инсталляции.', history: [{ kind: 'received', at: '2026-11-16T10:15:00+10:00' }, { kind: 'approved', at: '2026-11-15T12:20:00+10:00' }, { kind: 'submitted', at: '2026-11-14T14:10:00+10:00' }] },
  { id: '039', status: 'returned', equipmentIds: ['034', '028'], range: { start: '2026-11-09', end: '2026-11-12' }, eventId: 'light', location: '', comment: '', history: [{ kind: 'returned', at: '2026-11-12T17:00:00+10:00' }, { kind: 'return_marked', at: '2026-11-12T16:30:00+10:00' }, { kind: 'received', at: '2026-11-09T10:00:00+10:00' }, { kind: 'approved', at: '2026-11-08T11:00:00+10:00' }, { kind: 'submitted', at: '2026-11-07T15:00:00+10:00' }] },
]
