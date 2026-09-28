import type { ReactNode } from 'react'
import type { CheckState } from '../data'
import { Icon, type IconName } from './Icon'

export interface ChecklistItem {
  id: string
  state: CheckState
  label: ReactNode
  detail?: ReactNode
  /** One small action, e.g. <Button size="sm" variant="ghost">Review</Button>. */
  action?: ReactNode
}

const STATE_ICON: Record<CheckState, IconName> = { pass: 'check', fail: 'alert', pending: 'clock' }
const STATE_WORD: Record<CheckState, string> = { pass: 'Done', fail: 'Needs action', pending: 'Waiting' }

export function Checklist({ items, label }: { items: ChecklistItem[]; label?: string }) {
  return (
    <ul className="ds-checklist" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="ds-checklist__item" data-state={item.state}>
          <Icon name={STATE_ICON[item.state]} className="ds-checklist__icon" />
          <div>
            <div className="ds-checklist__label">
              <span className="ds-vh">{STATE_WORD[item.state]}: </span>
              {item.label}
            </div>
            {item.detail && <div className="ds-checklist__detail">{item.detail}</div>}
          </div>
          {item.action && <span className="ds-checklist__action">{item.action}</span>}
        </li>
      ))}
    </ul>
  )
}
