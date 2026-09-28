import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export interface Crumb {
  label: ReactNode
  to?: string
}

export interface PageHeadProps {
  title: ReactNode
  crumbs?: Crumb[]
  /** Line under the title, e.g. a short description or key facts. */
  meta?: ReactNode
  /** Page-level actions; at most one primary. */
  actions?: ReactNode
}

export function PageHead({ title, crumbs, meta, actions }: PageHeadProps) {
  return (
    <>
      {crumbs && crumbs.length > 0 && (
        <nav className="ds-crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && <Icon name="chevron-right" />}
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </Fragment>
          ))}
        </nav>
      )}
      <div className="ds-page-head">
        <div className="app-stack app-stack--xs">
          <h1>{title}</h1>
          {meta && <div className="ds-muted">{meta}</div>}
        </div>
        {actions && <div className="app-row">{actions}</div>}
      </div>
    </>
  )
}
