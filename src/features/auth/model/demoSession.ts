import { useState } from 'react'

export type DemoRole = 'student' | 'curator' | 'admin'

const sessionKey = 'handoff:demo-session'

function readDemoSession() {
  try {
    return sessionStorage.getItem(sessionKey) === 'student'
  } catch {
    return false
  }
}

export function useDemoSession() {
  const [signedIn, setSignedIn] = useState(readDemoSession)

  function signIn(role: DemoRole) {
    if (role !== 'student') {
      return
    }

    try {
      sessionStorage.setItem(sessionKey, role)
    } catch {
      // При недоступном хранилище демосеанс работает до обновления страницы.
    }
    window.location.hash = '/'
    setSignedIn(true)
  }

  function signOut() {
    try {
      sessionStorage.removeItem(sessionKey)
    } catch {
      // Состояние React сбрасывается и без браузерного хранилища.
    }
    window.location.hash = '/login'
    setSignedIn(false)
  }

  return { signedIn, signIn, signOut }
}
