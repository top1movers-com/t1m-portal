import { useId } from 'react'
import { Icon, type IconName } from './Icon'

export interface Choice<T extends string> {
  value: T
  title: string
  description?: string
  icon: IconName
  tone?: 'danger' | 'warning'
  disabled?: boolean
}

export interface ChoiceGroupProps<T extends string> {
  /** Accessible name for the group, e.g. "Delivery outcome". */
  label: string
  value: T | undefined
  onChange: (value: T) => void
  options: Choice<T>[]
  name?: string
}

/** Radio group as explained cards, for either/or decisions worth describing (delivery outcome, approve/reject). */
export function ChoiceGroup<T extends string>({ label, value, onChange, options, name }: ChoiceGroupProps<T>) {
  const autoName = useId()
  return (
    <div className="ds-choices" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.value} className="ds-choice" data-tone={o.tone}>
          <input
            type="radio"
            className="ds-vh"
            name={name ?? autoName}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
          />
          <span className="ds-choice__icon">
            <Icon name={o.icon} />
          </span>
          <span className="ds-choice__title">{o.title}</span>
          {o.description && <span className="ds-choice__desc">{o.description}</span>}
        </label>
      ))}
    </div>
  )
}
