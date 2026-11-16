import type { DateRange } from '../../equipment'

export interface LabEvent {
  id: string
  name: string
  shortName: string
  range: DateRange
  venue: string
  kind: 'internal' | 'external'
  bookings: { equipmentId: string; range: DateRange }[]
}
