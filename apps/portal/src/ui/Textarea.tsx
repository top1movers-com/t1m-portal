import type { ComponentPropsWithRef } from 'react'
import { cx } from './cx'
import { useFieldControl } from './field-context'

export function Textarea({ className, ...rest }: ComponentPropsWithRef<'textarea'>) {
  const { attrs } = useFieldControl(rest)
  return <textarea {...rest} {...attrs} className={cx('ds-textarea', className)} />
}
