import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const DEFAULT_ICON: Record<AlertTone, IconName> = { info: 'info', success: 'check', warning: 'alert', danger: 'alert' }

export interface AlertProps {
  tone: AlertTone
  title: ReactNode
  /** One sentence naming the problem and the way out. */
  children?: ReactNode
  icon?: IconName
  /** Announce when it appears (use for results of an action, not for static notices). */
  live?: boolean
}

export function Alert({ tone, title, children, icon, live }: AlertProps) {
  return (
    <div className={`ds-alert ds-alert--${tone}`} role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}>
      <Icon name={icon ?? DEFAULT_ICON[tone]} />
      <div>
        <strong>{title}</strong>
        {children}
      </div>
    </div>
  )
}
