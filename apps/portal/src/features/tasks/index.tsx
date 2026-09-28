import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CURRENT_USER,
  formatDate,
  getJob,
  getMilestone,
  jobMilestones,
  jobTasks,
  milestoneState,
  milestoneTasks,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  sortTasks,
  taskBucket,
  taskCounts,
  tasksForUser,
  templateFor,
  useStore,
  type Job,
  type ServiceType,
  type Task,
  type TaskBucket,
} from '../../data'
import {
  Button,
  LinkButton,
  DataTable,
  EmptyState,
  PageHead,
  Panel,
  StatusPill,
  TASK_BUCKET_META,
  Timeline,
  type Column,
  type TimelineItem,
} from '../../ui'
import { CompleteTaskDialog } from './CompleteTaskDialog'
import { TemplateEditor } from './MilestoneTemplateEditor'
import { TaskDrawer } from './TaskDrawer'
import { TaskRow } from './TaskRow'
import './tasks.css'

/* ---------- Job milestone timeline (TasksTab) ---------- */

export function TasksTab({ job }: { job: Job }) {
  const { state } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCompleted, setShowCompleted] = useState(false)
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null)
  const openTaskId = searchParams.get('task')

  function openTask(taskId: string) {
    const next = new URLSearchParams(searchParams)
    next.set('task', taskId)
    setSearchParams(next, { replace: true })
  }

  function closeTask() {
    const next = new URLSearchParams(searchParams)
    next.delete('task')
    setSearchParams(next, { replace: true })
  }

  const milestones = jobMilestones(state, job.id)
  const counts = taskCounts(jobTasks(state, job.id))

  const items: TimelineItem[] = milestones.map((milestone) => {
    const stepState = milestoneState(state, milestone)
    const allMilestoneTasks = milestoneTasks(state, milestone.id)
    const visibleTasks = sortTasks(allMilestoneTasks).filter((t) => showCompleted || t.status === 'open')
    return {
      id: milestone.id,
      state: stepState,
      title: milestone.name,
      meta: (
        <>
          {stepState === 'done' ? `Completed ${formatDate(milestone.completedAt)}` : `Due ${formatDate(milestone.dueDate)}`}
          {milestone.role && (
            <span className="tasks-system-note">
              {' '}
              · System-linked ({milestone.role === 'delivery' ? 'Delivery' : 'POD'} module)
            </span>
          )}
        </>
      ),
      body: (
        <div className="tasks-milestone-body">
          {visibleTasks.length === 0 ? (
            <p className="tasks-empty-row ds-muted">
              {allMilestoneTasks.length === 0 ? 'No tasks for this milestone.' : 'All tasks complete.'}
            </p>
          ) : (
            <div className="tasks-list">
              {visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} onOpen={openTask} onComplete={setCompleteTaskId} />
              ))}
            </div>
          )}
          {stepState !== 'done' && (
            <div className="tasks-milestone-body__actions">
              <LinkButton to={`/jobs/${job.id}/exceptions?raise=1&stage=${milestone.id}`} variant="ghost" size="sm" icon="flag">
                Raise exception
              </LinkButton>
            </div>
          )}
        </div>
      ),
    }
  })

  return (
    <Panel
      title="Milestones and tasks"
      actions={
        <label className="ds-switch">
          <input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} />
          <span className="ds-switch__track" />
          Show completed
        </label>
      }
    >
      <div className="app-stack">
        <div className="ds-stats">
          <div className="ds-stat">
            <span className="ds-label">Overdue</span>
            <div className={counts.overdue ? 'ds-stat__value ds-stat__value--danger' : 'ds-stat__value'}>{counts.overdue}</div>
          </div>
          <div className="ds-stat">
            <span className="ds-label">Due soon</span>
            <div className="ds-stat__value">{counts.due}</div>
          </div>
          <div className="ds-stat">
            <span className="ds-label">Pending</span>
            <div className="ds-stat__value">{counts.pending}</div>
          </div>
          <div className="ds-stat">
            <span className="ds-label">Done</span>
            <div className="ds-stat__value">{counts.done}</div>
          </div>
        </div>

        {milestones.length === 0 ? (
          <EmptyState icon="flag" title="No milestones on this job yet" />
        ) : (
          <Timeline items={items} label="Job milestones" />
        )}
      </div>

      <TaskDrawer taskId={openTaskId} onClose={closeTask} onComplete={setCompleteTaskId} />
      <CompleteTaskDialog taskId={completeTaskId} onClose={() => setCompleteTaskId(null)} />
    </Panel>
  )
}

/* ---------- My tasks ---------- */

const FILTER_LABELS: Record<TaskBucket | 'all', string> = {
  overdue: 'Overdue',
  due: 'Due soon',
  pending: 'Pending',
  done: 'Done',
  all: 'All',
}

const EMPTY_TEXT: Record<TaskBucket | 'all', string> = {
  overdue: 'No overdue tasks. Nice.',
  due: 'Nothing due soon.',
  pending: 'No pending tasks right now.',
  done: 'Nothing completed yet.',
  all: 'No open tasks assigned to you.',
}

export function MyTasksPage() {
  const { state } = useStore()
  const [filter, setFilter] = useState<TaskBucket | 'all'>(() => {
    const c = taskCounts(tasksForUser(state, CURRENT_USER.id))
    return c.overdue > 0 ? 'overdue' : 'all'
  })
  const [includeUnassigned, setIncludeUnassigned] = useState(false)
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null)

  const mine = tasksForUser(state, CURRENT_USER.id)
  const myJobIds = new Set(state.jobs.filter((j) => j.ownerId === CURRENT_USER.id).map((j) => j.id))
  const unassigned = state.tasks.filter((t) => !t.ownerId && t.status === 'open' && myJobIds.has(t.jobId))
  const pool = includeUnassigned ? sortTasks([...mine, ...unassigned]) : mine

  const counts = taskCounts(pool)
  const filtered = filter === 'all' ? pool : pool.filter((t) => taskBucket(t) === filter)

  const columns: Column<Task>[] = [
    { key: 'title', header: 'Task', primary: true, render: (t) => t.title },
    {
      key: 'job',
      header: 'Job',
      mono: true,
      render: (t) => (
        <Link to={`/jobs/${t.jobId}/tasks?task=${t.id}`} className="ds-mono app-row-link">
          {t.jobId}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (t) => getJob(state, t.jobId)?.customer ?? '—' },
    { key: 'milestone', header: 'Milestone', render: (t) => getMilestone(state, t.milestoneId)?.name ?? '—' },
    {
      key: 'due',
      header: 'Due',
      render: (t) => (
        <span className={taskBucket(t) === 'overdue' ? 'ds-overdue' : undefined}>{formatDate(t.dueDate)}</span>
      ),
    },
    { key: 'bucket', header: 'Status', render: (t) => <StatusPill meta={TASK_BUCKET_META[taskBucket(t)]} /> },
    {
      key: 'actions',
      header: <span className="ds-vh">Actions</span>,
      render: (t) => (
        <Button size="sm" variant="secondary" onClick={() => setCompleteTaskId(t.id)} aria-label={`Complete task: ${t.title}`}>
          Complete
        </Button>
      ),
    },
  ]

  return (
    <div className="app-stack app-stack--lg">
      <PageHead title="My tasks" meta={`Assigned to ${CURRENT_USER.name}`} />

      <div className="app-row app-row--between">
        <fieldset className="ds-seg" aria-label="Filter my tasks">
          {(['overdue', 'due', 'pending', 'all'] as const).map((key) => (
            <label key={key}>
              <input type="radio" name="my-tasks-filter" value={key} checked={filter === key} onChange={() => setFilter(key)} />
              {FILTER_LABELS[key]} ({key === 'all' ? pool.length : counts[key]})
            </label>
          ))}
        </fieldset>
        <label className="ds-switch">
          <input
            type="checkbox"
            checked={includeUnassigned}
            onChange={(event) => setIncludeUnassigned(event.target.checked)}
          />
          <span className="ds-switch__track" />
          Include unassigned tasks on my jobs
        </label>
      </div>

      <Panel title="Tasks" flush>
        <DataTable
          caption="My tasks"
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          empty={<EmptyState icon="tasks" title={EMPTY_TEXT[filter]} />}
        />
      </Panel>

      <CompleteTaskDialog taskId={completeTaskId} onClose={() => setCompleteTaskId(null)} />
    </div>
  )
}

/* ---------- Milestone template settings ---------- */

export function MilestoneTemplatesPage() {
  const { state } = useStore()
  const [serviceType, setServiceType] = useState<ServiceType>(SERVICE_TYPES[0])
  const template = templateFor(state, serviceType)

  return (
    <div className="app-stack app-stack--lg">
      <PageHead
        title="Milestone templates"
        crumbs={[{ label: 'Settings' }, { label: 'Milestone templates' }]}
        meta="Configure the default milestones and tasks used for new jobs of each service type."
      />

      <fieldset className="ds-seg" aria-label="Service type">
        {SERVICE_TYPES.map((s) => (
          <label key={s}>
            <input type="radio" name="template-service-type" value={s} checked={serviceType === s} onChange={() => setServiceType(s)} />
            {SERVICE_TYPE_LABELS[s]}
          </label>
        ))}
      </fieldset>

      {template ? (
        <TemplateEditor key={template.id} template={template} />
      ) : (
        <Panel>
          <EmptyState icon="flag" title="No template yet for this service type" />
        </Panel>
      )}
    </div>
  )
}
