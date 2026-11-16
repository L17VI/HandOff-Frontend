import { useEffect, useRef, useState, type FormEvent } from 'react'
import { RoleSwitcher } from '../../features/auth/ui/RoleSwitcher'
import type { DemoRole } from '../../features/auth/model/demoSession'
import { Icon } from '../../shared/ui/Icon'
import projector from '../../shared/assets/images/projector-optoma.svg'
import cable from '../../shared/assets/images/hdmi-cable.svg'
import monitor from '../../shared/assets/images/monitor.svg'
import './login.css'

interface LoginPageProps {
  onSignIn: (role: DemoRole) => void
}

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [role, setRole] = useState<DemoRole>('student')
  const [notice, setNotice] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Вход | handoff'
    window.location.hash = '/login'
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [])

  function selectRole(nextRole: DemoRole) {
    setRole(nextRole)
    setNotice('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (role !== 'student') {
      setNotice(
        role === 'curator'
          ? 'Вход куратора пока недоступен.'
          : 'Вход администратора пока недоступен.',
      )
      return
    }
    onSignIn(role)
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <a
          className="login-brand"
          href="#/login"
          aria-label="handoff, вход"
        >
          <Icon name="box" />
          <span>handoff</span>
        </a>
      </header>
      <main className="login-main">
        <div
          className="login-art"
          aria-hidden="true"
        >
          <img
            className="login-art-projector"
            src={projector}
            alt=""
            width="560"
            height="310"
          />
          <img
            className="login-art-cable"
            src={cable}
            alt=""
            width="560"
            height="310"
          />
          <img
            className="login-art-monitor"
            src={monitor}
            alt=""
            width="560"
            height="310"
          />
        </div>
        <div className="login-content">
          <div className="login-intro">
            <h1
              ref={headingRef}
              tabIndex={-1}
            >
              Вход
            </h1>
            <p>Демоверсия без почты и пароля.</p>
          </div>
          <form
            className="login-form"
            aria-label="Вход в демоверсию"
            onSubmit={submit}
          >
            <RoleSwitcher
              value={role}
              onChange={selectRole}
            />
            <button
              type="submit"
              className="login-submit"
            >
              Войти
              <Icon name="arrow" />
            </button>
            <p
              className="login-notice"
              role="status"
            >
              {notice}
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
