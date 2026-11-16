import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { NotificationItem } from '../model/presentation'
import { Icon } from '../../../shared/ui/Icon'
import './notification-popover.css'

interface NotificationPopoverProps {
  items: NotificationItem[]
  onRead: (id: string) => void
  onReadAll: () => void
}

export function NotificationPopover({ items, onRead, onReadAll }: NotificationPopoverProps) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [nativePopover] = useState(() => 'popover' in HTMLElement.prototype)
  const [open, setOpen] = useState(false)
  const unreadCount = items.filter((item) => !item.read).length

  function positionPanel() {
    const button = trigger.current
    const card = panel.current
    if (!button || !card) {
      return
    }

    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const spacingUnit = rootFontSize / 4
    const gap = spacingUnit * 3
    const edgeGap = spacingUnit * 4
    const cardWidth = Math.min(spacingUnit * 105, window.innerWidth - edgeGap * 2)
    const rect = button.getBoundingClientRect()
    const headerBottom = button.closest('header')?.getBoundingClientRect().bottom ?? rect.bottom
    const top = Math.min(headerBottom + gap, Math.max(gap, window.innerHeight - spacingUnit * 40))
    const right = Math.max(
      edgeGap,
      Math.min(window.innerWidth - rect.right, window.innerWidth - cardWidth - edgeGap),
    )

    // DOM-координаты выражены в пикселях; отступы и ширина соответствуют шкале Tailwind.
    card.style.setProperty('--notification-top', `${top}px`)
    card.style.setProperty('--notification-right', `${right}px`)
  }

  const close = useCallback(
    (restoreFocus = false) => {
      if (nativePopover && panel.current?.matches(':popover-open')) {
        panel.current.hidePopover()
      }
      setOpen(false)
      if (restoreFocus) {
        trigger.current?.focus()
      }
    },
    [nativePopover],
  )

  useEffect(() => {
    if (!open) {
      return
    }
    // Нативный popover закрывается сам. В старых браузерах сохраняем те же способы закрытия.
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      ) {
        close()
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close(true)
      }
    }
    function routeChanged() {
      close()
    }
    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)
    window.addEventListener('hashchange', routeChanged)
    if (!nativePopover) {
      document.addEventListener('pointerdown', outside)
      document.addEventListener('keydown', escape)
    }
    return () => {
      window.removeEventListener('resize', positionPanel)
      window.removeEventListener('scroll', positionPanel, true)
      window.removeEventListener('hashchange', routeChanged)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, nativePopover, close])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="notification-button"
        popoverTarget={nativePopover ? id : undefined}
        aria-controls={id}
        aria-expanded={open}
        aria-label={`Уведомления${unreadCount ? `, непрочитанных: ${unreadCount}` : ''}`}
        onClick={() => {
          positionPanel()
          if (!nativePopover) {
            setOpen((current) => !current)
          }
        }}
      >
        <Icon name="bell" />
        {unreadCount > 0 && (
          <span
            className="notification-count"
            aria-hidden="true"
          >
            {unreadCount}
          </span>
        )}
      </button>
      <div
        ref={panel}
        id={id}
        popover={nativePopover ? 'auto' : undefined}
        hidden={!nativePopover && !open}
        className="notification-popover"
        role="region"
        aria-labelledby={`${id}-title`}
        onToggle={(event) => {
          setOpen(event.newState === 'open')
          if (event.newState === 'open') {
            positionPanel()
          }
        }}
      >
        <div className="notification-popover-heading">
          <div>
            <h2 id={`${id}-title`}>Уведомления</h2>
            <p role="status">{unreadCount ? `Непрочитанных: ${unreadCount}` : 'Всё прочитано'}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Закрыть уведомления"
            onClick={() => close(true)}
          >
            <Icon name="close" />
          </button>
        </div>
        <button
          type="button"
          className="notification-popover-read"
          disabled={!unreadCount}
          onClick={onReadAll}
        >
          <Icon name="check" />
          Прочитать все
        </button>
        {items.length ? (
          <ul className="notification-popover-list">
            {items.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className={item.read ? '' : 'is-unread'}
              >
                <a
                  href={`#/requests/${item.requestId}`}
                  onClick={() => {
                    onRead(item.id)
                    close(true)
                  }}
                >
                  <span className={`notification-icon notification-icon-${item.kind}`}>
                    <Icon name={item.icon} />
                  </span>
                  <div>
                    <div className="notification-popover-title">
                      <h3>{item.title}</h3>
                      {!item.read && <span className="notification-new">Новое</span>}
                    </div>
                    <p>{item.description}</p>
                    <time dateTime={item.at}>{item.dateLabel}</time>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="notification-popover-empty">
            <Icon name="bell" />
            <h3>Уведомлений пока нет</h3>
            <p>Решения по заявкам и напоминания появятся здесь.</p>
          </div>
        )}
        <a
          className="notification-popover-all"
          href="#/notifications"
          onClick={() => close(true)}
        >
          Все уведомления
          <Icon name="arrow" />
        </a>
      </div>
    </>
  )
}
