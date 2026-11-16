import type { ReactNode } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { Modal } from '../../shared/ui/Modal'

export function StudentLayout({ children, activeSection = 'catalog', draftCount = 0 }: { children: ReactNode; activeSection?: 'catalog' | 'requests'; draftCount?: number }) {
  return <div className="app-shell">
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="student-header">
      <a className="brand" href="#/" aria-label="handoff, каталог"><span className="brand-symbol"><Icon name="box" /></span><span>handoff</span></a>
      <nav className="student-nav" aria-label="Основная навигация">
        {([{ id: 'catalog', href: '#/', label: 'Каталог' }, { id: 'requests', href: '#/requests', label: 'Мои заявки' }] as const).map((link) => <a key={link.id} href={link.href} className={`nav-link ${activeSection === link.id ? 'is-active' : ''}`} aria-current={activeSection === link.id ? 'location' : undefined}>{link.label}{link.id === 'requests' && draftCount > 0 && <span className="draft-count">{draftCount}</span>}{activeSection === link.id && <svg viewBox="0 0 60 8" fill="none" aria-hidden="true"><path d="M1 5Q8-1 15 5T29 5T43 5T59 5" stroke="currentColor" strokeWidth="1.2" /></svg>}</a>)}
        <Modal title="Мероприятия" trigger="Мероприятия" triggerClassName="nav-link"><div className="event-preview"><Icon name="calendar" /><div><span className="muted">18–20 ноября</span><h3>Выставка цифрового искусства</h3><p>Лаборатория цифрового искусства</p></div></div></Modal>
      </nav>
      <div className="header-account">
        <Modal title="Уведомления" trigger={<Icon name="bell" />} triggerClassName="notification-button" triggerLabel="Открыть уведомления"><div className="mock-empty"><Icon name="bell" /><h3>Новых уведомлений нет</h3><p>Решения по заявкам и напоминания о возврате появятся здесь.</p></div></Modal>
        <Modal title="Профиль студента" trigger={<><span className="account-text"><strong>Анна Соколова</strong><span>Студент</span></span><span className="avatar">АС</span></>} triggerClassName="account-button" triggerLabel="Открыть профиль Анны Соколовой"><div className="profile-preview"><span className="avatar">АС</span><div><h3>Анна Соколова</h3><p>Студент</p></div></div></Modal>
      </div>
    </header>
    <main id="main" tabIndex={-1}>{children}</main>
  </div>
}
