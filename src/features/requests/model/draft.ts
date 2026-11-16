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
  status:
    'pending' | 'approved' | 'issued' | 'return_pending' | 'returned' | 'rejected' | 'cancelled'
  history: RequestHistoryEntry[]
  extension?: { requestedEnd: string; reason: string }
  returnReport?: { returnedEquipmentIds: string[]; issue: string; submittedAt: string }
}

export interface RequestHistoryEntry {
  kind:
    | 'submitted'
    | 'approved'
    | 'received'
    | 'return_marked'
    | 'returned'
    | 'cancelled'
    | 'extension_requested'
  at: string
  note?: string
}

export type RequestAction =
  | { type: 'receive' }
  | { type: 'return'; returnedEquipmentIds: string[]; issue: string }
  | { type: 'cancel' }
  | { type: 'extend'; requestedEnd: string; reason: string }

export type RequestErrors = Partial<Record<'start' | 'end' | 'eventId' | 'equipment', string>>

export function createEmptyDraft(): RequestDraftData {
  return {
    equipmentIds: [],
    range: { start: '2026-11-18', end: '2026-11-20' },
    eventId: '',
    location: '',
    comment: '',
  }
}
