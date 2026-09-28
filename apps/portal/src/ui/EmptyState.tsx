import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface EmptyStateProps {
  title: string
  icon?: IconName
  /** One or two sentences: why it is empty and what to do next. */
  children?: ReactNode
  /** Usually a single Button or LinkButton. */
  action?: ReactNode
  headingLevel?: 2 | 3
}

export function EmptyState({ title, icon = 'info', children, action, headingLevel = 3 }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <div className="ds-empty">
      <Icon name={icon} />
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
