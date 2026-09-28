import { Link } from 'react-router-dom'
import { formatDate, getUser, taskBucket, useStore, type Task } from '../../data'
import { Button, Icon, Owner, StatusPill, TASK_BUCKET_META } from '../../ui'

export function TaskRow({
  task,
  onOpen,
  onComplete,
}: {
  task: Task
  onOpen: (taskId: string) => void
  onComplete: (taskId: string) => void
}) {
  const { state } = useStore()
  const bucket = taskBucket(task)
  const overdue = bucket === 'overdue'

  return (
    <div className="tasks-row">
      <div className="tasks-row__main">
        <div className="tasks-row__title-line">
          <button type="button" className="tasks-row__title" onClick={() => onOpen(task.id)}>
            {task.title}
          </button>
          {task.source === 'corrective' && task.exceptionId && (
            <Link
              to={`/jobs/${task.jobId}/exceptions?exception=${task.exceptionId}`}
              className="ds-pill tasks-row__tag"
            >
              <Icon name="flag" />
              Corrective
            </Link>
          )}
        </div>
        <div className="tasks-row__meta">
          <Owner user={getUser(state, task.ownerId)} />
          <span aria-hidden="true">·</span>
          <span className={overdue ? 'ds-overdue' : undefined}>
            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
          </span>
          {task.evidenceRequired && (
            <span className="tasks-row__evidence">
              <Icon name="paperclip" />
              Evidence required
            </span>
          )}
        </div>
      </div>
      <StatusPill meta={TASK_BUCKET_META[bucket]} />
      <div className="tasks-row__actions">
        <Button size="sm" variant="ghost" onClick={() => onOpen(task.id)} aria-label={`Assign task: ${task.title}`}>
          Assign
        </Button>
        {task.status === 'open' && (
          <Button size="sm" variant="secondary" onClick={() => onComplete(task.id)} aria-label={`Complete task: ${task.title}`}>
            Complete
          </Button>
        )}
      </div>
    </div>
  )
}
