import { useState } from 'react'
import type { DateRange } from '../../equipment'
import { createEmptyDraft, type StudentRequest } from './draft'
import { validateRequest } from './validation'

export function useRequests() {
  const [draft, setDraft] = useState(createEmptyDraft)
  const [requests, setRequests] = useState<StudentRequest[]>([])

  function addEquipment(equipmentId: string, range: DateRange) {
    setDraft((current) => ({ ...current, range: { ...range }, equipmentIds: current.equipmentIds.includes(equipmentId) ? current.equipmentIds : [...current.equipmentIds, equipmentId] }))
  }

  function removeEquipment(equipmentId: string) {
    setDraft((current) => ({ ...current, equipmentIds: current.equipmentIds.filter((id) => id !== equipmentId) }))
  }

  function submitRequest() {
    const errors = validateRequest(draft)
    if (Object.keys(errors).length) return errors
    const request: StudentRequest = { ...draft, equipmentIds: [...draft.equipmentIds], range: { ...draft.range }, location: draft.location.trim(), comment: draft.comment.trim(), id: String(requests.length + 1).padStart(3, '0'), status: 'pending' }
    setRequests((current) => [request, ...current])
    setDraft(createEmptyDraft())
    window.location.hash = `/requests?created=${request.id}`
    return {}
  }

  return { draft, setDraft, requests, addEquipment, removeEquipment, submitRequest }
}
