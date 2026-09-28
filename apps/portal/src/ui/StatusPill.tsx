import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'
import type { StatusMeta, Tone } from './status'

type StatusPillProps =
  | { meta: StatusMeta; tone?: never; icon?: never; children?: ReactNode; className?: string }
  | { meta?: never; tone?: Tone; icon: IconName; children: ReactNode; className?: string }

export function StatusPill({ meta, tone, icon, children, className }: StatusPillProps) {
  const t = meta?.tone ?? tone ?? 'neutral'
  return (
    <span className={cx('ds-pill', t !== 'neutral' && `ds-pill--${t}`, className)}>
      <Icon name={(meta?.icon ?? icon)!} />
      {children ?? meta?.label}
    </span>
  )
}
