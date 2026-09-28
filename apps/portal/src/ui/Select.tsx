import type { ComponentPropsWithRef } from 'react'
import { cx } from './cx'
import { useFieldControl } from './field-context'
import { Icon } from './Icon'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'children'> {
  options: SelectOption[]
  /** Adds a disabled first option with an empty value. */
  placeholder?: string
  compact?: boolean
}

/** Native select with the design-system chevron. Native is deliberate: its picker is better on phones. */
export function Select({ options, placeholder, compact, className, ...rest }: SelectProps) {
  const { attrs } = useFieldControl(rest)
  return (
    <div className="ds-select-wrap">
      <select {...rest} {...attrs} className={cx('ds-select', compact && 'ds-select--sm', className)}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" />
    </div>
  )
}
