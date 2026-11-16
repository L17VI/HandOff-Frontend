import type { StudentRequest } from '../model/draft'

// Примеры состояний для студенческого интерфейса. Серверные данные пока не подключены.
export const requestMocks: StudentRequest[] = [
  { id: '042', status: 'pending', equipmentIds: ['035', '028'], range: { start: '2026-11-18', end: '2026-11-20' }, eventId: 'light', location: 'Мастерская цифрового искусства', comment: 'Для показа видео на монтаже и выставке.' },
  { id: '041', status: 'approved', equipmentIds: ['028'], range: { start: '2026-11-21', end: '2026-11-22' }, eventId: 'defence', location: 'Аудитория для защиты', comment: '' },
  { id: '040', status: 'issued', equipmentIds: ['074'], range: { start: '2026-11-16', end: '2026-11-17' }, eventId: 'exhibition', location: 'Выставочное пространство', comment: 'Монитор для интерактивной инсталляции.' },
  { id: '039', status: 'returned', equipmentIds: ['034', '028'], range: { start: '2026-11-09', end: '2026-11-12' }, eventId: 'light', location: '', comment: '' },
]
