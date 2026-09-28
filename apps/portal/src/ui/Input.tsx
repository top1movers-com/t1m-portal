import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from './cx'
import { useFieldControl } from './field-context'

export interface InputProps extends ComponentPropsWithRef<'input'> {
  compact?: boolean
  /** Adornment inside the field before the value, e.g. "PHP". */
  affixStart?: ReactNode
  /** Adornment inside the field after the value, e.g. "kg". */
  affixEnd?: ReactNode
}

export function Input({ compact, affixStart, affixEnd, className, ...rest }: InputProps) {
  const { attrs, invalid } = useFieldControl(rest)
  const input = (
    <input {...rest} {...attrs} className={cx('ds-input', compact && 'ds-input--sm', className)} />
  )
  if (!affixStart && !affixEnd) return input
  return (
    <div className="ds-input-group" data-invalid={invalid || undefined}>
      {affixStart && <span className="ds-affix">{affixStart}</span>}
      {input}
      {affixEnd && <span className="ds-affix">{affixEnd}</span>}
    </div>
  )
}
