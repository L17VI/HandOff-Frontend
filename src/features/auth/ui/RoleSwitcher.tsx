import { useId } from 'react'
import type { DemoRole } from '../model/demoSession'
import { Icon, type IconName } from '../../../shared/ui/Icon'

interface RoleOption {
  value: DemoRole
  label: string
  icon: IconName
}

const roles: RoleOption[] = [
  { value: 'student', label: 'Студент', icon: 'user' },
  { value: 'curator', label: 'Куратор', icon: 'clipboard' },
  { value: 'admin', label: 'Администратор', icon: 'shield' },
]

interface RoleSwitcherProps {
  value: DemoRole
  onChange: (role: DemoRole) => void
}

export function RoleSwitcher({ value, onChange }: RoleSwitcherProps) {
  const id = useId()

  return (
    <fieldset className="login-role-field">
      <legend className="sr-only">Выберите роль</legend>
      <div
        className="login-role-switcher"
        data-selected={value}
      >
        <span
          className="login-role-indicator"
          aria-hidden="true"
        />
        {roles.map((role) => (
          <label
            className="login-role-option"
            key={role.value}
            htmlFor={`${id}-${role.value}`}
          >
            <input
              className="sr-only"
              id={`${id}-${role.value}`}
              type="radio"
              name="demoRole"
              value={role.value}
              checked={value === role.value}
              onChange={() => onChange(role.value)}
            />
            <Icon name={role.icon} />
            <span>{role.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
