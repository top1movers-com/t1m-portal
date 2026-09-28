import { cx } from './cx'

export type SkeletonVariant = 'text' | 'title' | 'pill' | 'avatar' | 'icon' | 'btn' | 'input' | 'block'

export interface SkeletonProps {
  variant?: SkeletonVariant
  /** CSS width, e.g. "40%". Vary widths so the scaffold reads as content. */
  width?: string
  className?: string
}

/** One placeholder shape. The container that holds skeletons should set aria-busy="true". */
export function Skeleton({ variant = 'text', width, className }: SkeletonProps) {
  return (
    <span
      className={cx('ds-skeleton', variant !== 'text' && `ds-skeleton--${variant}`, className)}
      style={width ? { width } : undefined}
      aria-hidden="true"
    />
  )
}

export interface SkeletonTableProps {
  /** Real header labels; they load immediately. */
  columns: string[]
  rows?: number
  /** Column indexes that hold a status pill. */
  pillColumns?: number[]
  label?: string
}

/** Table scaffold at real row height. Use while a table's rows are loading, never for empty or error. */
export function SkeletonTable({ columns, rows = 5, pillColumns = [], label = 'Loading' }: SkeletonTableProps) {
  return (
    <div className="ds-table-wrap">
      <table className="ds-table ds-table--loading" aria-busy="true">
        <caption className="ds-vh" role="status">
          {label}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {columns.map((c, i) => (
                <td key={c}>
                  <Skeleton variant={pillColumns.includes(i) ? 'pill' : 'text'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
