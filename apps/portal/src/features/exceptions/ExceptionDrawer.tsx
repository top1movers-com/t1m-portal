import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  correctiveTasks,
  formatDate,
  taskBucket,
  userName,
  useStore,
  type ExceptionRecord,
  type Job,
} from '../../data'
import { Alert, Button, LinkButton, Owner, StatusPill, TASK_BUCKET_META, Timeline, type TimelineItem } from '../../ui'
import { Drawer } from '../../ui'
import { ExceptionSummary } from './ExceptionSummary'

export interface ExceptionDrawerProps {
  job: Job
  exception: ExceptionRecord
  onClose: () => void
  onAssignCorrective: (milestoneId: string) => void
}

export function ExceptionDrawer({ job, exception, onClose, onAssignCorrective }: ExceptionDrawerProps) {
  const { state, actions } = useStore()
  const [closeError, setCloseError] = useState<string>()
  const tasks = correctiveTasks(state, exception)
  const openTasks = tasks.filter((t) => t.status === 'open')
  const canClose = (exception.status === 'approved' || exception.status === 'rejected') && openTasks.length === 0

  const timelineItems: TimelineItem[] = exception.log.map((entry, i) => ({
    id: `${exception.id}-log-${i}`,
    state: entry.action === 'Rejected' ? 'rejected' : 'done',
    title: `${entry.action} by ${userName(state, entry.by)}`,
    meta: formatDate(entry.at),
    body: entry.note,
  }))

  function handleClose() {
    const result = actions.closeException(exception.id)
    if (!result.ok) {
      setCloseError(result.error)
      return
    }
    setCloseError(undefined)
  }

  return (
    <Drawer open onClose={onClose} eyebrow="Exception" title={<span className="ds-mono">{exception.id}</span>}>
      <div className="app-stack app-stack--lg">
        {closeError && <Alert tone="danger" title="Could not close this exception" live>{closeError}</Alert>}
        <ExceptionSummary exception={exception} />

        <div className="app-row">
          {exception.status === 'pending_approval' && (
            <LinkButton variant="primary" icon="shield" to={`/approvals?exception=${exception.id}`}>
              Open approval
            </LinkButton>
          )}
          {exception.status === 'approved' && (
            <Button variant="primary" icon="plus" onClick={() => onAssignCorrective(exception.stageMilestoneId)}>
              Assign corrective task
            </Button>
          )}
          {canClose && (
            <Button variant="secondary" icon="check" onClick={handleClose}>
              Close exception
            </Button>
          )}
        </div>

        <div>
          <span className="ds-label">Corrective tasks</span>
          {tasks.length === 0 ? (
            <p className="ds-muted">No corrective tasks yet.</p>
          ) : (
            <ul className="app-stack app-stack--sm">
              {tasks.map((t) => (
                <li key={t.id} className="app-row app-row--between">
                  <span>
                    <Link to={`/jobs/${job.id}/tasks?task=${t.id}`}>{t.title}</Link>
                    <span className="ds-muted"> · due {formatDate(t.dueDate)}</span>
                  </span>
                  <span className="app-row app-row--tight">
                    <Owner user={state.users.find((u) => u.id === t.ownerId)} />
                    <StatusPill meta={TASK_BUCKET_META[taskBucket(t)]} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <span className="ds-label">Activity</span>
          <Timeline items={timelineItems} label="Exception activity" compact />
        </div>
      </div>
    </Drawer>
  )
}
