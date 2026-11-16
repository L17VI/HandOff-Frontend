import type { LabEvent } from '../model/event'

export const eventMocks: LabEvent[] = [
  {
    id: 'light',
    name: 'Показ «Световая среда»',
    shortName: 'Показ',
    range: { start: '2026-11-18', end: '2026-11-20' },
    venue: 'Лаборатория',
    kind: 'internal',
    bookings: [
      { equipmentId: '035', range: { start: '2026-11-18', end: '2026-11-20' } },
      { equipmentId: '028', range: { start: '2026-11-18', end: '2026-11-20' } },
    ],
  },
  {
    id: 'exhibition',
    name: 'Выставка цифрового искусства',
    shortName: 'Выставка',
    range: { start: '2026-11-28', end: '2026-11-30' },
    venue: 'Внешняя площадка',
    kind: 'external',
    bookings: [{ equipmentId: '074', range: { start: '2026-11-28', end: '2026-11-30' } }],
  },
  {
    id: 'defence',
    name: 'Защита учебных проектов',
    shortName: 'Предзащита',
    range: { start: '2026-11-25', end: '2026-11-25' },
    venue: 'Лаборатория',
    kind: 'internal',
    bookings: [],
  },
]
