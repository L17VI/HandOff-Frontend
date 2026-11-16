import type { ReactNode } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { userRoleLabels, type UserProfile } from '../../features/users'

export function StudentLayout({ children, user, notificationControl, activeSection = 'catalog', draftCount = 0 }: { children: ReactNode; user: UserProfile; notificationControl: ReactNode; activeSection?: 'catalog' | 'requests' | 'events' | 'profile' | 'notifications'; draftCount?: number }) {
  return <div className="app-shell">
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="student-header">
      <a className="brand" href="#/" aria-label="handoff, каталог"><span className="brand-symbol"><Icon name="box" /></span><span>handoff</span></a>
      <nav className="student-nav" aria-label="Основная навигация">
        {([{ id: 'catalog', href: '#/', label: 'Каталог' }, { id: 'requests', href: '#/requests', label: 'Мои заявки' }] as const).map((link) => <a key={link.id} href={link.href} className={`nav-link ${activeSection === link.id ? 'is-active' : ''}`} aria-current={activeSection === link.id ? 'location' : undefined}>{link.label}{link.id === 'requests' && draftCount > 0 && <span className="draft-count">{draftCount}</span>}{activeSection === link.id && <svg viewBox="0 0 60 8" fill="none" aria-hidden="true"><path d="M1 5Q8-1 15 5T29 5T43 5T59 5" stroke="currentColor" strokeWidth="1.2" /></svg>}</a>)}
        <a href="#/events" className={`nav-link ${activeSection === 'events' ? 'is-active' : ''}`} aria-current={activeSection === 'events' ? 'page' : undefined}>Мероприятия{activeSection === 'events' && <svg viewBox="0 0 60 8" fill="none" aria-hidden="true"><path d="M1 5Q8-1 15 5T29 5T43 5T59 5" stroke="currentColor" strokeWidth="1.2" /></svg>}</a>
      </nav>
      <div className="header-account">
        {notificationControl}
        <a href="#/profile" className="account-button" aria-label={`Профиль: ${user.name}`} aria-current={activeSection === 'profile' ? 'page' : undefined}><span className="account-text"><strong>{user.name}</strong><span>{userRoleLabels[user.role]}</span></span><span className="avatar">{user.initials}</span></a>
      </div>
    </header>
    <main id="main" tabIndex={-1}>{children}</main>
  </div>
}
