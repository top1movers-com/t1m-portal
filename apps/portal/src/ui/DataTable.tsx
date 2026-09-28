import type { MouseEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cx } from './cx'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  /** Right-aligned, tabular numbers. */
  num?: boolean
  /** Monospace data face (IDs, container and BL numbers). */
  mono?: boolean
  /** The record's name/ID column. Rendered as the row's link when `rowHref` is set. */
  primary?: boolean
  /** Label shown beside the value when rows stack on phones. Defaults to `header` when it is a string. */
  label?: string
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Makes the whole row open this route; the primary cell becomes a real link for keyboard users. */
  rowHref?: (row: T) => string
  /** Row click handler for rows that open a drawer instead of a route. */
  onRowClick?: (row: T) => void
  selectedKey?: string
  /** Stack rows as labeled cards under 640px. */
  stack?: boolean
  density?: 'compact' | 'comfortable'
  caption?: string
  /** Shown instead of the table when there are no rows (use <EmptyState>). */
  empty?: ReactNode
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('a, button, input, select, textarea, label')
}

/** Thin typed wrapper over .ds-table. Put it directly inside a Panel; it scrolls horizontally in its panel. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  onRowClick,
  selectedKey,
  stack = true,
  density,
  caption,
  empty,
}: DataTableProps<T>) {
  const navigate = useNavigate()
  if (rows.length === 0 && empty) return <>{empty}</>

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, row: T) {
    if (isInteractive(event.target)) return
    if (rowHref) navigate(rowHref(row))
    else onRowClick?.(row)
  }

  return (
    <div className="ds-table-wrap">
      <table className={cx('ds-table', stack && 'ds-table--stack', density && `ds-table--${density}`)}>
        {caption && <caption className="ds-vh">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx(c.num && 'ds-num', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row)
            const clickable = !!rowHref || !!onRowClick
            return (
              <tr
                key={key}
                data-href={clickable ? '' : undefined}
                aria-selected={selectedKey === undefined ? undefined : selectedKey === key}
                onClick={clickable ? (event) => handleRowClick(event, row) : undefined}
              >
                {columns.map((c) => {
                  const value = c.render(row)
                  return (
                    <td
                      key={c.key}
                      data-label={c.label ?? (typeof c.header === 'string' ? c.header : undefined)}
                      className={cx(c.num && 'ds-num', c.mono && 'ds-mono', c.primary && 'ds-cell-primary', c.className)}
                    >
                      {c.primary && rowHref ? (
                        <Link to={rowHref(row)} className="app-row-link">
                          {value}
                        </Link>
                      ) : c.primary && onRowClick ? (
                        <button type="button" className="ds-cell-link" onClick={() => onRowClick(row)}>
                          {value}
                        </button>
                      ) : (
                        value
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
