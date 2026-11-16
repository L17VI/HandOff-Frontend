import { useState } from 'react'
import type { NotificationItem } from '../../../features/notifications'
import { Icon } from '../../../shared/ui/Icon'
import { PageHeading } from '../../../shared/ui/PageHeading'

interface NotificationsPageProps {
  notifications: NotificationItem[]
  onRead: (id: string) => void
  onReadAll: () => void
}

export function NotificationsPage({ notifications, onRead, onReadAll }: NotificationsPageProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notice, setNotice] = useState('')
  const unreadCount = notifications.filter((entry) => !entry.read).length
  const visible = notifications
    .filter((entry) => filter === 'all' || !entry.read)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  return (
    <div className="notifications-page">
      <PageHeading
        title="Уведомления"
        description="Решения по заявкам и напоминания о возврате."
      />
      <div className="notifications-toolbar">
        <div
          className="notification-filters"
          role="group"
          aria-label="Показать уведомления"
        >
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            Все<span>{notifications.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Непрочитанные<span>{unreadCount}</span>
          </button>
        </div>
        <button
          type="button"
          className="account-secondary mark-all-read"
          disabled={!unreadCount}
          onClick={() => {
            onReadAll()
            setNotice('Все уведомления отмечены как прочитанные.')
          }}
        >
          <Icon name="check" />
          Всё прочитано
        </button>
      </div>
      <p
        className="sr-only"
        role="status"
      >
        {notice || `Непрочитанных уведомлений: ${unreadCount}`}
      </p>
      {visible.length ? (
        <section
          className="notifications-panel"
          aria-label="Список уведомлений"
        >
          <div
            className="notification-columns"
            aria-hidden="true"
          >
            <span>Сообщение</span>
            <span>Дата</span>
            <span />
          </div>
          <ul className="notification-list">
            {visible.map((notification) => {
              return (
                <li
                  key={notification.id}
                  className={`notification-row ${notification.read ? '' : 'is-unread'}`}
                >
                  <div className="notification-message">
                    <span className={`notification-icon notification-icon-${notification.kind}`}>
                      <Icon name={notification.icon} />
                    </span>
                    <div>
                      <div className="notification-title">
                        <h2>{notification.title}</h2>
                        {!notification.read && <span className="notification-new">Новое</span>}
                      </div>
                      <p>{notification.description}</p>
                    </div>
                  </div>
                  <time dateTime={notification.at}>{notification.dateLabel}</time>
                  <a
                    href={`#/requests/${notification.requestId}`}
                    className="notification-link"
                    aria-label={`Посмотреть заявку № ${notification.requestId}`}
                    onClick={() => onRead(notification.id)}
                  >
                    Посмотреть заявку
                    <Icon name="arrow" />
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <div className="account-empty">
          <Icon name="bell" />
          <h2>{filter === 'unread' ? 'Всё прочитано' : 'Уведомлений пока нет'}</h2>
          <p>
            {filter === 'unread'
              ? 'Новые решения и напоминания появятся здесь.'
              : 'Здесь будут решения по заявкам и напоминания о возврате техники.'}
          </p>
          {filter === 'unread' && notifications.length > 0 && (
            <button
              type="button"
              className="account-secondary"
              onClick={() => setFilter('all')}
            >
              Показать все уведомления
            </button>
          )}
        </div>
      )}
    </div>
  )
}
