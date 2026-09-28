import { createContext, useContext, type AriaAttributes } from 'react'

export interface FieldContextValue {
  id: string
  describedBy?: string
  invalid: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

interface ControlProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: AriaAttributes['aria-invalid']
}

/** Controls inside a <Field> pick up its id, aria-describedby, and aria-invalid automatically. */
export function useFieldControl(props: ControlProps) {
  const field = useContext(FieldContext)
  const ariaInvalid = props['aria-invalid'] ?? (field?.invalid || undefined)
  return {
    attrs: {
      id: props.id ?? field?.id,
      'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
      'aria-invalid': ariaInvalid,
    },
    invalid: ariaInvalid === true || ariaInvalid === 'true',
  }
}
