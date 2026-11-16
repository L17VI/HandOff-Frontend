export interface UserProfile {
  name: string
  email: string
  role: 'student'
  initials: string
}

export const userRoleLabels: Record<UserProfile['role'], string> = { student: 'Студент' }
