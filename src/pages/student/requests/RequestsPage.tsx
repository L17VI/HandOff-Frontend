import { useState } from 'react'
import { formatPeriod } from '../../../features/equipment'
import { StudentRequestCard, filterRequests, matchesRequestTab, requestTabs, type RequestTab, type RequestDraftData, type StudentRequest } from '../../../features/requests'
import { Icon } from '../../../shared/ui/Icon'
import './requests.css'
import './request-overview.css'

export function RequestsPage({ draft, requests }: { draft: RequestDraftData; requests: StudentRequest[] }) {
  const [tab, setTab] = useState<RequestTab>('all')
  const [query, setQuery] = useState('')
  const visible = filterRequests(requests, tab, query)
  const hasDraft = draft.equipmentIds.length > 0
  function resetFilters() { setTab('all'); setQuery('') }
  return <div className="requests-page">
    <div className="requests-overview-heading"><div className="request-page-heading"><h1>Мои заявки</h1><p>Здесь видно, что можно забрать и когда вернуть комплект.</p></div><a className="request-secondary" href="#/"><Icon name="plus" />Выбрать оборудование</a></div>
    {hasDraft && <aside className="draft-request-card"><span className="draft-preview-icon"><Icon name="box" /></span><div><h2>У вас есть незавершённая заявка</h2><p>{draft.equipmentIds.length} {draft.equipmentIds.length === 1 ? 'предмет' : 'предмета'} в комплекте / {formatPeriod(draft.range)}</p></div><a href="#/requests/new" className="request-primary">Продолжить оформление<Icon name="arrow" /></a></aside>}
    <div className="request-list-toolbar"><div className="request-status-filters" aria-label="Фильтр по статусу">{requestTabs.map((entry) => <button key={entry.id} type="button" data-filter={entry.id} className={entry.id === tab ? 'is-selected' : ''} aria-pressed={entry.id === tab} onClick={() => setTab(entry.id)}>{entry.label}<span>{requests.filter((request) => matchesRequestTab(request, entry.id)).length}</span></button>)}</div><label className="request-list-search"><Icon name="search" /><span className="sr-only">Поиск по номеру, технике или мероприятию</span><input type="search" value={query} placeholder="Номер, техника или мероприятие" onChange={(event) => setQuery(event.target.value)} /></label></div>
    <span className="sr-only" role="status">Найдено заявок: {visible.length}</span>
    <div className="requests-list">{visible.map((request) => <StudentRequestCard key={request.id} request={request} />)}</div>
    {!visible.length && <div className="request-empty"><span className="empty-box"><Icon name={requests.length ? 'search' : 'box'} /></span><h2>{requests.length ? 'Таких заявок нет' : 'Заявок пока нет'}</h2><p>{requests.length ? 'Попробуйте другой запрос или выберите другой статус.' : 'Выберите технику в каталоге и соберите комплект для своего проекта.'}</p>{requests.length ? <button type="button" className="request-secondary" onClick={resetFilters}>Сбросить фильтры</button> : <a href="#/" className="request-primary">Перейти в каталог<Icon name="arrow" /></a>}</div>}
  </div>
}
