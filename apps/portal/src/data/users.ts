import type { User } from './types'

export const USERS: User[] = [
  { id: 'u-dispatch', name: 'Sample Dispatcher', role: 'dispatcher', initials: 'SD' },
  { id: 'u-coord', name: 'Demo Coordinator', role: 'dispatcher', initials: 'DC' },
  { id: 'u-field', name: 'Sample Field Lead', role: 'field', initials: 'SF' },
  { id: 'u-driver', name: 'Demo Driver', role: 'field', initials: 'DD' },
  { id: 'u-manager', name: 'Sample Ops Manager', role: 'manager', initials: 'SM' },
  { id: 'u-finance', name: 'Demo Finance Officer', role: 'finance', initials: 'DF' },
]

/** The signed-in demo user. In the mockup this person can act in every role. */
export const CURRENT_USER: User = USERS[0]
