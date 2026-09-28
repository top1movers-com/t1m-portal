import type { JobFlags as Flags } from '../data'
import { StatusPill } from '../ui'

/** Compact pills for a jobs-list row: overdue tasks, rejected/missing documents, open exceptions. */
export function JobFlags({ flags }: { flags: Flags }) {
  const pills = [
    flags.overdueTasks > 0 && (
      <StatusPill key="overdue" tone="danger" icon="alert">
        {flags.overdueTasks} overdue
      </StatusPill>
    ),
    flags.rejectedDocs > 0 && (
      <StatusPill key="rejected" tone="danger" icon="x">
        {flags.rejectedDocs} rejected doc{flags.rejectedDocs === 1 ? '' : 's'}
      </StatusPill>
    ),
    flags.missingDocs > 0 && (
      <StatusPill key="missing" tone="warning" icon="file">
        {flags.missingDocs} missing doc{flags.missingDocs === 1 ? '' : 's'}
      </StatusPill>
    ),
    flags.openExceptions > 0 && (
      <StatusPill key="exceptions" tone="danger" icon="flag">
        {flags.openExceptions} exception{flags.openExceptions === 1 ? '' : 's'}
      </StatusPill>
    ),
  ].filter(Boolean)

  if (pills.length === 0) return <span className="ds-muted">None</span>
  return <span className="app-row app-row--tight app-nowrap">{pills}</span>
}
