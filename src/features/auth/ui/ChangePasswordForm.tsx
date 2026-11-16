import { useState, type FormEvent } from 'react'

export function ChangePasswordForm({ email }: { email: string }) {
  const [showPasswords, setShowPasswords] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<'current' | 'password' | 'confirm', string>>>({})
  const [notice, setNotice] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const current = String(data.get('current') ?? '')
    const password = String(data.get('password') ?? '')
    const confirm = String(data.get('confirm') ?? '')
    const next: typeof errors = {}
    if (!current) next.current = 'Введите текущий пароль.'
    if (password.length < 8) next.password = 'Введите не меньше 8 символов.'
    else if (password === current) next.password = 'Новый пароль должен отличаться от текущего.'
    if (!confirm) next.confirm = 'Повторите новый пароль.'
    else if (password !== confirm) next.confirm = 'Пароли не совпадают. Повторите новый пароль.'
    setErrors(next)
    setNotice('')
    const firstError = (['current', 'password', 'confirm'] as const).find((name) => next[name])
    if (firstError) { form.querySelector<HTMLInputElement>(`[name="${firstError}"]`)?.focus(); return }
    form.reset()
    setShowPasswords(false)
    setNotice('Форма проверена. В демоверсии пароль не меняется.')
  }

  return <form className="password-form" method="post" noValidate aria-label="Смена пароля" onSubmit={submit}>
    <p className="account-help">Это демоверсия. Используйте вымышленные пароли. Все поля обязательны.</p>
    <input className="sr-only" tabIndex={-1} type="email" name="username" autoComplete="username" value={email} readOnly aria-label="Электронная почта" />
    {([{ name: 'current', label: 'Текущий пароль', autocomplete: 'current-password' }, { name: 'password', label: 'Новый пароль', autocomplete: 'new-password' }, { name: 'confirm', label: 'Повторите новый пароль', autocomplete: 'new-password' }] as const).map((field) => <div key={field.name} className="password-field"><label htmlFor={`password-${field.name}`}>{field.label}</label>{field.name === 'password' && <p className="account-help" id="password-help">Не меньше 8 символов, с пробелами или без.</p>}<input id={`password-${field.name}`} name={field.name} type={showPasswords ? 'text' : 'password'} autoComplete={field.autocomplete} required minLength={field.name === 'current' ? undefined : 8} aria-invalid={Boolean(errors[field.name])} aria-describedby={[field.name === 'password' ? 'password-help' : '', errors[field.name] ? `password-${field.name}-error` : ''].filter(Boolean).join(' ') || undefined} onInput={() => { setNotice(''); setErrors((current) => ({ ...current, [field.name]: undefined, ...(field.name === 'password' ? { confirm: undefined } : {}) })) }} />{errors[field.name] && <p className="account-error" id={`password-${field.name}-error`}>{errors[field.name]}</p>}</div>)}
    <button type="button" className="password-visibility" aria-pressed={showPasswords} onClick={() => setShowPasswords((current) => !current)}>Показать пароли</button>
    <p role="status" className="password-notice">{notice}</p>
    <button type="submit" className="account-primary">Проверить форму</button>
  </form>
}
