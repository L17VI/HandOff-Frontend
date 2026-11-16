import { useEffect, useState } from 'react'
import { StudentLayout } from './app/layouts/StudentLayout'
import { CatalogPage } from './pages/student/catalog/CatalogPage'
import { EquipmentPage } from './pages/student/equipment/EquipmentPage'
import { equipmentMocks } from './features/equipment'
import { useRequests } from './features/requests'
import { NewRequestPage } from './pages/student/requests/NewRequestPage'
import { RequestsPage } from './pages/student/requests/RequestsPage'

function App() {
  const [route, setRoute] = useState(() => window.location.hash)
  const { draft, setDraft, requests, addEquipment, removeEquipment, submitRequest } = useRequests()
  const routePath = route.split('?')[0]
  const isNewRequest = routePath === '#/requests/new'
  const isRequests = routePath === '#/requests'
  const equipmentId = routePath.startsWith('#/equipment/') ? routePath.slice('#/equipment/'.length) : null
  const item = equipmentMocks.find((equipment) => equipment.id === equipmentId)

  useEffect(() => {
    const handleRoute = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleRoute)
    return () => window.removeEventListener('hashchange', handleRoute)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
    document.title = `${item ? item.name : isNewRequest ? 'Новая заявка' : isRequests ? 'Мои заявки' : 'Каталог оборудования'} | handoff`
  }, [route, item, isNewRequest, isRequests])

  let page = <CatalogPage />
  if (isNewRequest) {
    page = <NewRequestPage draft={draft} onChange={setDraft} onRemove={removeEquipment} onSubmit={submitRequest} />
  } else if (isRequests) {
    page = <RequestsPage draft={draft} requests={requests} createdId={new URLSearchParams(route.split('?')[1]).get('created')} />
  } else if (equipmentId) {
    page = item
      ? <EquipmentPage key={item.id} item={item} draftIds={draft.equipmentIds} bookingRange={draft.range} onAdd={addEquipment} />
      : <div className="catalog-empty"><h1>Оборудование не найдено</h1><a href="#/">Вернуться в каталог</a></div>
  }

  return <StudentLayout draftCount={draft.equipmentIds.length} activeSection={isNewRequest || isRequests ? 'requests' : 'catalog'}>{page}</StudentLayout>
}

export default App
