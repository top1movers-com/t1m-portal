import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  formatDateTime,
  getMilestone,
  getUser,
  ROLE_LABELS,
  taskBucket,
  USERS,
  useStore,
  type ISODate,
} from '../../data'
import { Alert, Button, Drawer, Field, FileList, Icon, Input, Select, StatusPill, TASK_BUCKET_META } from '../../ui'

export interface TaskDrawerProps {
  taskId: string | null
  onClose: () => void
  onComplete: (taskId: string) => void
}

/** Task detail + assign (owner, due date). Reachable from a task row or the `?task=` deep link. */
export function TaskDrawer({ taskId, onClose, onComplete }: TaskDrawerProps) {
  const { state, actions } = useStore()
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : undefined
  const milestone = task ? getMilestone(state, task.milestoneId) : undefined

  const [ownerId, setOwnerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string>()
  const [reopenError, setReopenError] = useState<string>()

  const [resetFor, setResetFor] = useState(task?.id)
  if (task?.id !== resetFor) {
    setResetFor(task?.id)
    setOwnerId(task?.ownerId ?? '')
    setDueDate(task?.dueDate ?? '')
    setError(undefined)
    setReopenError(undefined)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!task) return
    const result = actions.assignTask(task.id, ownerId, dueDate as ISODate)
    if (!result.ok) setError(result.error)
    else setError(undefined)
  }

  function handleReopen() {
    if (!task) return
    const result = actions.reopenTask(task.id)
    if (!result.ok) setReopenError(result.error)
  }

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      eyebrow="Task"
      title={task?.title ?? 'Task'}
      onSubmit={handleSubmit}
      footer={
        task && (
          <>
            {task.status === 'done' ? (
              <Button variant="secondary" onClick={handleReopen}>
                Reopen task
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => onComplete(task.id)}>
                Complete task
              </Button>
            )}
            <Button type="submit" variant="primary">
              Save assignment
            </Button>
          </>
        )
      }
    >
      {task && (
        <div className="app-stack">
          <div className="app-row app-row--between">
            <StatusPill meta={TASK_BUCKET_META[taskBucket(task)]} />
            {task.source === 'corrective' && task.exceptionId && (
              <Link to={`/jobs/${task.jobId}/exceptions?exception=${task.exceptionId}`} className="ds-pill">
                <Icon name="flag" />
                {task.exceptionId}
              </Link>
            )}
          </div>

          <dl className="ds-kv">
            <div>
              <dt>Milestone</dt>
              <dd>{milestone?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{task.source === 'corrective' ? 'Corrective, from exception' : 'Template default'}</dd>
            </div>
            {task.evidenceRequired && (
              <div>
                <dt>Evidence</dt>
                <dd>
                  <Icon name="paperclip" /> Required
                </dd>
              </div>
            )}
          </dl>

          {task.status === 'done' && (
            <Alert tone="success" title="Completed">
              {formatDateTime(task.completedAt)} by {getUser(state, task.completedBy)?.name ?? 'a sample user'}
              {task.completionNote && <p className="tasks-note tasks-note--tight">{task.completionNote}</p>}
            </Alert>
          )}
          {reopenError && (
            <Alert tone="danger" title="Couldn't reopen task" live>
              {reopenError}
            </Alert>
          )}

          {task.evidence.length > 0 && (
            <div>
              <span className="ds-label">Evidence</span>
              <FileList files={task.evidence} label="Task evidence" />
            </div>
          )}

          <div className="app-stack app-stack--sm">
            <Field label="Owner">
              <Select
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                placeholder="Choose an owner"
                options={USERS.map((u) => ({ value: u.id, label: `${u.name} — ${ROLE_LABELS[u.role]}` }))}
              />
            </Field>
            <Field label="Due date">
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </Field>
            {error && (
              <Alert tone="danger" title="Couldn't save assignment" live>
                {error}
              </Alert>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}
