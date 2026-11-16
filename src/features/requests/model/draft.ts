import type { DateRange } from '../../equipment'

export interface RequestDraftData {
  equipmentIds: string[]
  range: DateRange
  eventId: string
  location: string
  comment: string
}

export interface StudentRequest extends RequestDraftData {
  id: string
  status: 'pending'
}

export type RequestErrors = Partial<Record<'start' | 'end' | 'eventId' | 'equipment', string>>

export function createEmptyDraft(): RequestDraftData {
  return { equipmentIds: [], range: { start: '2026-11-18', end: '2026-11-20' }, eventId: '', location: '', comment: '' }
}
