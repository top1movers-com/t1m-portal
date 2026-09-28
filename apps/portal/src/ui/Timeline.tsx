import type { ReactNode } from 'react'
import { cx } from './cx'

export type TimelineState = 'done' | 'current' | 'overdue' | 'upcoming' | 'rejected'

export interface TimelineItem {
  id: string
  state: TimelineState
  title: ReactNode
  /** e.g. "Sep 5 · Sample Dispatcher" */
  meta?: ReactNode
  body?: ReactNode
}

const STATE_WORD: Record<TimelineState, string> = {
  done: 'Done',
  current: 'In progress',
  overdue: 'Overdue',
  upcoming: 'Upcoming',
  rejected: 'Rejected',
}

/** Milestone timeline, document version history, approval log. */
export function Timeline({ items, compact, label }: { items: TimelineItem[]; compact?: boolean; label: string }) {
  return (
    <ol className={cx('ds-timeline', compact && 'ds-timeline--compact')} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="ds-timeline__item" data-state={item.state}>
          <span className="ds-timeline__marker" />
          <div className="ds-timeline__content">
            <p className="ds-timeline__title">
              <span className="ds-vh">{STATE_WORD[item.state]}: </span>
              {item.title}
            </p>
            {item.meta && <p className="ds-timeline__meta">{item.meta}</p>}
            {item.body && <div className="ds-timeline__body">{item.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
