import { useEffect, useRef } from 'react'
import { Icon } from '../../shared/ui/Icon'

export function DemoSessionEndedPage({ onStart }: { onStart: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    document.title = 'Сеанс завершён | handoff'
    heading.current?.focus()
  }, [])
  return (
    <main className="demo-session-ended">
      <span className="demo-brand">
        <Icon name="box" />
        handoff
      </span>
      <div className="account-empty">
        <Icon name="logout" />
        <h1
          ref={heading}
          tabIndex={-1}
        >
          Сеанс завершён
        </h1>
        <p>
          Вы вышли из демоверсии. Можно начать новый сеанс с исходными примерами заявок и
          уведомлений.
        </p>
        <button
          type="button"
          className="account-primary"
          onClick={onStart}
        >
          Открыть демоверсию
        </button>
      </div>
    </main>
  )
}
