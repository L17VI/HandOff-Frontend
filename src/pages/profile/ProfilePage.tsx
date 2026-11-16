import { useState } from 'react'
import { userRoleLabels, type UserProfile } from '../../features/users'
import { ChangePasswordForm } from '../../features/auth/ui/ChangePasswordForm'
import { Icon } from '../../shared/ui/Icon'
import { Modal } from '../../shared/ui/Modal'
import { PageHeading } from '../../shared/ui/PageHeading'

export function ProfilePage({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const [passwordFormKey, setPasswordFormKey] = useState(0)
  return <div className="profile-page">
    <PageHeading title="Профиль" description="Данные учётной записи." />
    <section className="profile-panel" aria-labelledby="profile-name">
      <div className="profile-identity"><span className="profile-avatar" aria-hidden="true">{user.initials}</span><div><h2 id="profile-name">{user.name}</h2><p>Лаборатория цифрового искусства</p></div></div>
      <dl className="profile-details"><div><dt>Электронная почта</dt><dd>{user.email}</dd></div><div><dt>Роль</dt><dd>{userRoleLabels[user.role]}</dd></div></dl>
      <div className="profile-account-note"><Icon name="info" /><p>Учётную запись выдаёт лаборатория. Чтобы изменить имя, почту или роль, обратитесь к администратору.</p></div>
      <div className="profile-actions">
        <Modal title="Сменить пароль" trigger={<><Icon name="lock" />Сменить пароль</>} triggerClassName="account-secondary" onClose={() => setPasswordFormKey((current) => current + 1)}><ChangePasswordForm key={passwordFormKey} email={user.email} /></Modal>
        <Modal title="Выйти из аккаунта?" trigger={<><Icon name="logout" />Выйти</>} triggerClassName="account-secondary profile-logout"><p className="account-help">Демосеанс завершится. Черновик, изменения заявок и отметки о прочтении будут сброшены.</p><div className="account-dialog-actions"><button type="button" className="account-primary" onClick={onLogout}>Выйти</button><form method="dialog"><button type="submit" className="account-secondary">Остаться</button></form></div></Modal>
      </div>
    </section>
  </div>
}
