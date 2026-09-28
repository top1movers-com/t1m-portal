import { useId, type ReactNode } from 'react'
import { cx } from './cx'
import { FieldContext } from './field-context'
import { Icon } from './Icon'

export interface FieldProps {
  label: ReactNode
  children: ReactNode
  hint?: ReactNode
  /** Names the problem and the fix. Replaces the hint while shown. */
  error?: ReactNode
  /** Adds "optional" after the label. Required is the default and is not marked. */
  optional?: boolean
  /** e.g. "120 / 500" for a textarea. */
  count?: ReactNode
  id?: string
  className?: string
  /** For controls that are not a single input (ChoiceGroup, switch, segmented control): labels a role="group" instead of using label[for]. */
  group?: boolean
}

/** Label + control + hint/error. Input, Select, Textarea, and FileDrop inside it are wired up automatically. */
export function Field({ label, children, hint, error, optional, count, id, className, group }: FieldProps) {
  const autoId = useId()
  const controlId = id ?? autoId
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`
  const labelId = `${controlId}-label`
  const describedBy = error ? errorId : hint ? hintId : undefined
  const labelContent = (
    <>
      {label}
      {optional && <span className="ds-opt">optional</span>}
    </>
  )
  return (
    <div
      className={cx('ds-field', className)}
      {...(group && { role: 'group', 'aria-labelledby': labelId, 'aria-describedby': describedBy })}
    >
      {group ? (
        <span className="ds-field__label" id={labelId}>
          {labelContent}
        </span>
      ) : (
        <label htmlFor={controlId}>{labelContent}</label>
      )}
      <FieldContext.Provider value={{ id: controlId, describedBy, invalid: !!error }}>{children}</FieldContext.Provider>
      {error ? (
        <span className="ds-field__error" id={errorId} role="alert">
          <Icon name="alert" />
          {error}
        </span>
      ) : (
        hint && (
          <span className="ds-field__hint" id={hintId}>
            {hint}
          </span>
        )
      )}
      {count && <span className="ds-field__count">{count}</span>}
    </div>
  )
}
