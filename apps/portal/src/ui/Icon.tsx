import sprite from '@t1m/design-system/icons.svg'
import { cx } from './cx'

export type IconName =
  | 'search' | 'plus' | 'x' | 'check' | 'chevron-right' | 'chevron-left' | 'chevron-down' | 'alert' | 'info' | 'clock' | 'bell'
  | 'filter' | 'upload' | 'download' | 'file' | 'box' | 'truck' | 'dashboard' | 'users' | 'user' | 'tasks'
  | 'quote' | 'receipt' | 'shield' | 'pin' | 'building' | 'settings' | 'more' | 'arrow-right' | 'monitor'
  | 'tablet' | 'phone' | 'sun' | 'moon' | 'contrast' | 'sliders' | 'calendar' | 'paperclip' | 'history'
  | 'flag' | 'camera' | 'edit' | 'trash' | 'arrow-up' | 'arrow-down'

interface IconProps {
  name: IconName
  className?: string
  /** Give a label only when the icon carries meaning on its own; otherwise it is hidden from assistive tech. */
  label?: string
}

export function Icon({ name, className, label }: IconProps) {
  return (
    <svg
      className={cx('ds-icon', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      <use href={`${sprite}#i-${name}`} />
    </svg>
  )
}
