import { useEffect, useState } from 'react'
import { StudentLayout } from './app/layouts/StudentLayout'
import { CatalogPage } from './pages/student/catalog/CatalogPage'
import { EquipmentPage } from './pages/student/equipment/EquipmentPage'
import { equipmentMocks } from './features/equipment'
import { RequestDraft, type DraftItem } from './features/requests'

function App() {
  const [route, setRoute] = useState(() => window.location.hash)
  const [draft, setDraft] = useState<DraftItem[]>([])
  const equipmentId = route.startsWith('#/equipment/') ? route.slice('#/equipment/'.length) : null
  const item = equipmentMocks.find((equipment) => equipment.id === equipmentId)

  useEffect(() => {
    const handleRoute = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleRoute)
    return () => window.removeEventListener('hashchange', handleRoute)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
    document.title = `${item ? item.name : 'Каталог оборудования'} | handoff`
  }, [route, item])

  function addToDraft(entry: DraftItem) {
    setDraft((items) => [...items.filter((existing) => existing.equipmentId !== entry.equipmentId), entry])
  }

  return <StudentLayout draftCount={draft.length} requestsContent={<RequestDraft items={draft} onRemove={(id) => setDraft((items) => items.filter((entry) => entry.equipmentId !== id))} />}>
    {equipmentId ? item ? <EquipmentPage key={item.id} item={item} draft={draft} onAdd={addToDraft} /> : <div className="catalog-empty"><h1>Оборудование не найдено</h1><a href="#/">Вернуться в каталог</a></div> : <CatalogPage />}
  </StudentLayout>
}

export default App
