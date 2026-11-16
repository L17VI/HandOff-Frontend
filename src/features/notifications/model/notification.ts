export interface LabNotification {
  id: string
  requestId: string
  kind: 'return_reminder' | 'approved' | 'returned'
  at: string
  read: boolean
}
