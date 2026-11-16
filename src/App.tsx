import { useEffect, useState } from 'react'
import { StudentLayout } from './app/layouts/StudentLayout'
import { CatalogPage } from './pages/student/catalog/CatalogPage'
import { EquipmentPage } from './pages/student/equipment/EquipmentPage'
import { equipmentMocks } from './features/equipment'
import { useRequests } from './features/requests'
import { NewRequestPage } from './pages/student/requests/NewRequestPage'
import { RequestsPage } from './pages/student/requests/RequestsPage'
import { RequestSentPage } from './pages/student/requests/RequestSentPage'
import { RequestDetailPage } from './pages/student/requests/RequestDetailPage'
import { ReturnEquipmentPage } from './pages/student/requests/ReturnEquipmentPage'
import { EventsPage } from './pages/student/events/EventsPage'
import { eventMocks, type LabEvent } from './features/events'
import { currentUserMock } from './features/users'
import { useNotifications, getNotificationItems, NotificationPopover } from './features/notifications'
import { NotificationsPage } from './pages/student/notifications/NotificationsPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { DemoSessionEndedPage } from './pages/login/DemoSessionEndedPage'
import './app/styles/account.css'

function App() {
  const [sessionActive, setSessionActive] = useState(true)
  return sessionActive ? <StudentApp onLogout={() => setSessionActive(false)} /> : <DemoSessionEndedPage onStart={() => { window.location.hash = '/'; setSessionActive(true) }} />
}

function StudentApp({ onLogout }: { onLogout: () => void }) {
  const [route, setRoute] = useState(() => window.location.hash)
  const { draft, setDraft, requests, addEquipment, removeEquipment, submitRequest, actOnRequest } = useRequests()
  const { notifications, markRead, markAllRead } = useNotifications(requests)
  const notificationItems = getNotificationItems(notifications, requests)
  const routePath = route.split('?')[0]
  const isNewRequest = routePath === '#/requests/new'
  const isRequests = routePath === '#/requests'
  const isEvents = routePath === '#/events'
  const isProfile = routePath === '#/profile'
  const isNotifications = routePath === '#/notifications'
  const catalogEvent = eventMocks.find((event) => event.id === draft.eventId && event.id === new URLSearchParams(route.split('?')[1]).get('event'))
  const sentRequestId = routePath.match(/^#\/requests\/(\d+)\/sent$/)?.[1]
  const requestId = routePath.match(/^#\/requests\/(\d+)$/)?.[1]
  const returnRequestId = routePath.match(/^#\/requests\/(\d+)\/return$/)?.[1]
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
    document.title = `${item ? item.name : isProfile ? 'Профиль' : isNotifications ? 'Уведомления' : isEvents ? 'Мероприятия' : isNewRequest ? 'Новая заявка' : returnRequestId ? 'Возврат оборудования' : sentRequestId ? 'Заявка отправлена' : requestId ? `Заявка № ${requestId}` : isRequests ? 'Мои заявки' : 'Каталог оборудования'} | handoff`
  }, [route, item, isNewRequest, isRequests, isEvents, isProfile, isNotifications, sentRequestId, requestId, returnRequestId])

  function chooseEvent(event: LabEvent) {
    setDraft((current) => ({ ...current, eventId: event.id, range: { ...event.range }, location: event.venue }))
  }

  let page = <CatalogPage key={catalogEvent?.id ?? 'catalog'} event={catalogEvent} />
  if (isNotifications) {
    page = <NotificationsPage notifications={notificationItems} onRead={markRead} onReadAll={markAllRead} />
  } else if (isProfile) {
    page = <ProfilePage user={currentUserMock} onLogout={onLogout} />
  } else if (isEvents) {
    page = <EventsPage events={eventMocks} onChooseEquipment={chooseEvent} />
  } else if (isNewRequest) {
    page = <NewRequestPage draft={draft} onChange={setDraft} onRemove={removeEquipment} onSubmit={submitRequest} />
  } else if (isRequests) {
    page = <RequestsPage draft={draft} requests={requests} />
  } else if (sentRequestId) {
    page = <RequestSentPage request={requests.find((request) => request.id === sentRequestId)} />
  } else if (requestId) {
    page = <RequestDetailPage key={requestId} request={requests.find((request) => request.id === requestId)} onAction={actOnRequest} />
  } else if (returnRequestId) {
    page = <ReturnEquipmentPage key={returnRequestId} request={requests.find((request) => request.id === returnRequestId)} onAction={actOnRequest} />
  } else if (equipmentId) {
    page = item
      ? <EquipmentPage key={item.id} item={item} draftIds={draft.equipmentIds} bookingRange={draft.range} onAdd={addEquipment} />
      : <div className="catalog-empty"><h1>Оборудование не найдено</h1><a href="#/">Вернуться в каталог</a></div>
  }

  return <StudentLayout user={currentUserMock} notificationControl={<NotificationPopover items={notificationItems} onRead={markRead} onReadAll={markAllRead} />} draftCount={draft.equipmentIds.length} activeSection={isProfile ? 'profile' : isNotifications ? 'notifications' : isEvents ? 'events' : isNewRequest || isRequests || sentRequestId || requestId || returnRequestId ? 'requests' : 'catalog'}>{page}</StudentLayout>
}

export default App
