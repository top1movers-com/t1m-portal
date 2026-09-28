import type { ReactNode } from 'react'
import { cx } from './cx'

export interface PanelProps {
  title?: ReactNode
  /** Right side of the panel head: filters, one primary action. */
  actions?: ReactNode
  children: ReactNode
  /** Skip body padding, e.g. for a DataTable or document rows that run edge to edge. */
  flush?: boolean
  className?: string
  id?: string
}

/** One panel per topic. Panels are never nested. */
export function Panel({ title, actions, children, flush, className, id }: PanelProps) {
  return (
    <section className={cx('ds-panel', className)} id={id}>
      {(title || actions) && (
        <div className="ds-panel__head">
          {title && <h3>{title}</h3>}
          {actions && <div className="app-row">{actions}</div>}
        </div>
      )}
      {flush ? children : <div className="ds-panel__body">{children}</div>}
    </section>
  )
}
