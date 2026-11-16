import { equipmentMocks, isRangeAvailable } from '../../equipment'
import { eventMocks } from '../../events'
import type { RequestDraftData, RequestErrors } from './draft'

export function validateRequest(draft: RequestDraftData): RequestErrors {
  const errors: RequestErrors = {}
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T12:00:00Z`))
  if (!validDate(draft.range.start)) errors.start = 'Выберите дату получения.'
  if (!validDate(draft.range.end)) errors.end = 'Выберите дату возврата.'
  if (!errors.start && !errors.end && draft.range.end < draft.range.start) errors.end = 'Возврат не может быть раньше получения.'
  if (!eventMocks.some((event) => event.id === draft.eventId)) errors.eventId = 'Выберите мероприятие, для которого нужна техника.'
  if (!draft.equipmentIds.length) errors.equipment = 'Добавьте оборудование из каталога.'
  else if (!errors.start && !errors.end) {
    const unavailable = draft.equipmentIds.some((id) => {
      const item = equipmentMocks.find((equipment) => equipment.id === id)
      return !item || !isRangeAvailable(item, draft.range)
    })
    if (unavailable) errors.equipment = 'Часть оборудования недоступна на эти даты. Измените период или уберите её из заявки.'
  }
  return errors
}
