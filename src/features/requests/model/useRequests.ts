import { useState } from 'react'
import type { DateRange } from '../../equipment'
import { createEmptyDraft, type StudentRequest } from './draft'
import { validateRequest } from './validation'
import { requestMocks } from '../mocks/requests'

export function useRequests() {
  const [draft, setDraft] = useState(createEmptyDraft)
  const [requests, setRequests] = useState<StudentRequest[]>(() => [...requestMocks])

  function addEquipment(equipmentId: string, range: DateRange) {
    setDraft((current) => ({ ...current, range: { ...range }, equipmentIds: current.equipmentIds.includes(equipmentId) ? current.equipmentIds : [...current.equipmentIds, equipmentId] }))
  }

  function removeEquipment(equipmentId: string) {
    setDraft((current) => ({ ...current, equipmentIds: current.equipmentIds.filter((id) => id !== equipmentId) }))
  }

  function submitRequest() {
    const errors = validateRequest(draft)
    if (Object.keys(errors).length) return errors
    const nextId = Math.max(0, ...requests.map((request) => Number(request.id))) + 1
    const request: StudentRequest = { ...draft, equipmentIds: [...draft.equipmentIds], range: { ...draft.range }, location: draft.location.trim(), comment: draft.comment.trim(), id: String(nextId).padStart(3, '0'), status: 'pending' }
    setRequests((current) => [request, ...current])
    setDraft(createEmptyDraft())
    window.location.hash = `/requests/${request.id}/sent`
    return {}
  }

  return { draft, setDraft, requests, addEquipment, removeEquipment, submitRequest }
}
