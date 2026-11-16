import epsonImage from '../../../shared/assets/images/projector-epson.svg'
import cableImage from '../../../shared/assets/images/hdmi-cable.svg'
import optomaImage from '../../../shared/assets/images/projector-optoma.svg'
import monitorImage from '../../../shared/assets/images/monitor.svg'

export const categories = [
  'Все',
  'Проекторы',
  'Кабели и переходники',
  'Мониторы',
  'Питание',
  'Мебель и реквизит',
] as const
export type Category = (typeof categories)[number]
export type EquipmentStatus = 'available' | 'busy' | 'closed'
export interface Equipment {
  id: string
  name: string
  description: string
  category: Category
  location: string
  sector: string
  status: EquipmentStatus
  image: string
}
export const statusLabels: Record<EquipmentStatus, string> = {
  available: 'Свободно',
  busy: 'Занято до 22 ноя',
  closed: 'Закрыто для брони',
}

// Локальные данные для вёрстки. Изображения можно заменить импортами фотографий.
export const equipmentMocks: Equipment[] = [
  {
    id: '035',
    name: 'Проектор Epson EB-X24',
    description: 'HDMI, VGA, USB-A, USB-B',
    category: 'Проекторы',
    location: 'Сектор А, коробка 03',
    sector: 'А',
    status: 'available',
    image: epsonImage,
  },
  {
    id: '028',
    name: 'Кабель HDMI',
    description: 'Два разъёма HDMI',
    category: 'Кабели и переходники',
    location: 'Сектор Б, коробка 07',
    sector: 'Б',
    status: 'available',
    image: cableImage,
  },
  {
    id: '034',
    name: 'Проектор Optoma C3E',
    description: '2 × HDMI, USB, 1080p',
    category: 'Проекторы',
    location: 'Сектор А, коробка 04',
    sector: 'А',
    status: 'busy',
    image: optomaImage,
  },
  {
    id: '074',
    name: 'Монитор HP L1950',
    description: 'VGA, DVI, USB-хаб',
    category: 'Мониторы',
    location: 'Сектор В, полка 02',
    sector: 'В',
    status: 'closed',
    image: monitorImage,
  },
]

export function filterEquipment(
  items: Equipment[],
  query: string,
  category: Category,
  sector: string,
  sort: string,
) {
  const search = query.trim().toLocaleLowerCase('ru')
  const statusOrder = { available: 0, busy: 1, closed: 2 }
  return items
    .filter(
      (item) =>
        (category === 'Все' || item.category === category) &&
        (!sector || item.sector === sector) &&
        `${item.name} ${item.description} ${item.id}`.toLocaleLowerCase('ru').includes(search),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name, 'ru')
        : statusOrder[a.status] - statusOrder[b.status],
    )
}
