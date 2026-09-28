import { Fragment, type ComponentType, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  formatDate,
  formatDateTime,
  getJob,
  getUser,
  JOB_TABS,
  jobFlags,
  jobTabCounts,
  jobTrack,
  plural,
  REFERENCE_NO_LABELS,
  SERVICE_TYPE_LABELS,
  useStore,
  type Job,
  type JobTab,
  type TrackStep,
} from '../data'
import { ChargesTab } from '../features/charges'
import { DeliveryTab } from '../features/delivery'
import { DocumentsTab } from '../features/documents'
import { ExceptionsTab } from '../features/exceptions'
import { TasksTab } from '../features/tasks'
import {
  Alert,
  BILLING_STATE_META,
  cx,
  EmptyState,
  Icon,
  JOB_STATUS_META,
  LinkButton,
  MILESTONE_STATE_META,
  Owner,
  PageHead,
  Panel,
  StatusPill,
} from '../ui'

const TAB_LABELS: Record<JobTab, string> = {
  tasks: 'Tasks',
  documents: 'Documents',
  exceptions: 'Exceptions',
  delivery: 'Delivery & POD',
  charges: 'Charges & billing',
}

const TAB_COMPONENTS: Record<JobTab, ComponentType<{ job: Job }>> = {
  tasks: TasksTab,
  documents: DocumentsTab,
  exceptions: ExceptionsTab,
  delivery: DeliveryTab,
  charges: ChargesTab,
}

function isJobTab(value: string | undefined): value is JobTab {
  return !!value && (JOB_TABS as readonly string[]).includes(value)
}

function stepDate({ milestone, state }: TrackStep): string {
  if (state === 'done') return formatDate(milestone.completedAt)
  if (state === 'overdue') return `Due ${formatDate(milestone.dueDate)}`
  return formatDate(milestone.dueDate)
}

function AttentionAlert({ job }: { job: Job }) {
  const { state } = useStore()
  if (job.billingState === 'ready_for_finance') {
    return (
      <Alert tone="success" title="Handed to Finance">
        Marked ready for billing {formatDateTime(job.readyAt)} by {getUser(state, job.readyBy)?.name ?? 'a sample user'}.
      </Alert>
    )
  }
  const f = jobFlags(state, job.id)
  const items: Array<{ tab: JobTab; text: string }> = []
  if (f.overdueTasks) items.push({ tab: 'tasks', text: plural(f.overdueTasks, 'overdue task') })
  if (f.rejectedDocs) items.push({ tab: 'documents', text: plural(f.rejectedDocs, 'rejected document') })
  if (f.missingDocs) items.push({ tab: 'documents', text: plural(f.missingDocs, 'missing document') })
  if (f.openExceptions) items.push({ tab: 'exceptions', text: plural(f.openExceptions, 'open exception') })
  if (items.length === 0) return null
  const danger = f.overdueTasks > 0 || f.rejectedDocs > 0 || f.openExceptions > 0
  return (
    <Alert tone={danger ? 'danger' : 'warning'} title="Needs attention">
      {items.map((item, i) => (
        <Fragment key={item.text}>
          {i > 0 && ' · '}
          <Link to={`/jobs/${job.id}/${item.tab}`}>{item.text}</Link>
        </Fragment>
      ))}
    </Alert>
  )
}

function JobTabs({ job, current }: { job: Job; current: JobTab }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const counts = jobTabCounts(state, job.id)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const index = JOB_TABS.indexOf(current)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? JOB_TABS.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + JOB_TABS.length) % JOB_TABS.length
    navigate(`/jobs/${job.id}/${JOB_TABS[next]}`, { replace: true })
    document.getElementById(`job-tab-${JOB_TABS[next]}`)?.focus()
  }

  return (
    <div className="ds-tabs" role="tablist" aria-label="Shipment 360 sections" onKeyDown={onKeyDown}>
      {JOB_TABS.map((tab) => {
        const count = counts[tab]
        const selected = tab === current
        return (
          <Link
            key={tab}
            id={`job-tab-${tab}`}
            to={`/jobs/${job.id}/${tab}`}
            replace
            role="tab"
            aria-selected={selected}
            aria-controls="job-tabpanel"
            tabIndex={selected ? 0 : -1}
            className="ds-tab"
            data-text={TAB_LABELS[tab]}
          >
            {TAB_LABELS[tab]}
            {count && (
              <span className={cx('ds-tab__count', count.tone && `ds-tab__count--${count.tone}`)}>
                {count.count}
                <span className="ds-vh"> ({count.label})</span>
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export function Shipment360() {
  const { jobId = '', tab } = useParams()
  const { state } = useStore()
  const job = getJob(state, jobId)

  if (!job) {
    return (
      <Panel>
        <EmptyState
          headingLevel={2}
          icon="search"
          title="Job not found"
          action={
            <LinkButton to="/jobs" variant="primary" icon="box">
              Back to shipment jobs
            </LinkButton>
          }
        >
          There is no shipment job with ID {jobId} in the sample data.
        </EmptyState>
      </Panel>
    )
  }
  if (!isJobTab(tab)) return <Navigate to={`/jobs/${job.id}/tasks`} replace />

  const track = jobTrack(state, job.id)
  const TabContent = TAB_COMPONENTS[tab]

  return (
    <div className="app-stack app-stack--lg">
      <div>
        <PageHead
          crumbs={[{ label: 'Shipment jobs', to: '/jobs' }, { label: <span className="ds-mono">{job.id}</span> }]}
          title={<span className="ds-mono">{job.id}</span>}
          meta={
            <span className="app-row">
              <span>{job.customer}</span>
              <span aria-hidden="true">·</span>
              <span>{SERVICE_TYPE_LABELS[job.serviceType]}</span>
              <span aria-hidden="true">·</span>
              <span className="ds-route">
                {job.origin}
                <Icon name="arrow-right" label="to" />
                {job.destination}
              </span>
            </span>
          }
          actions={
            <>
              <StatusPill meta={JOB_STATUS_META[job.status]} />
              <StatusPill meta={BILLING_STATE_META[job.billingState]} />
            </>
          }
        />
        <AttentionAlert job={job} />
      </div>

      <Panel title="Milestones">
        <ol className="ds-track" aria-label="Milestones">
          {track.map((step) => (
            <li
              key={step.milestone.id}
              className="ds-track__step"
              data-state={step.state === 'upcoming' ? undefined : step.state}
            >
              {step.milestone.name}
              <span className="ds-vh">, {MILESTONE_STATE_META[step.state].label}</span>
              <span className="ds-track__date">{stepDate(step)}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Summary">
        <dl className="ds-kv app-kv">
          {job.containerNo && (
            <div>
              <dt>Container no.</dt>
              <dd className="ds-mono">{job.containerNo}</dd>
            </div>
          )}
          <div>
            <dt>{REFERENCE_NO_LABELS[job.serviceType]}</dt>
            <dd className={job.blNo ? 'ds-mono' : 'ds-muted'}>{job.blNo ?? 'Not issued yet'}</dd>
          </div>
          <div>
            <dt>ETA</dt>
            <dd>{formatDate(job.eta)}</dd>
          </div>
          <div>
            <dt>Consignee</dt>
            <dd>{job.consignee}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>
              <Owner user={getUser(state, job.ownerId)} />
            </dd>
          </div>
        </dl>
      </Panel>

      <div>
        <JobTabs job={job} current={tab} />
        <div role="tabpanel" id="job-tabpanel" aria-labelledby={`job-tab-${tab}`} className="app-tabpanel">
          <TabContent key={job.id} job={job} />
        </div>
      </div>
    </div>
  )
}
