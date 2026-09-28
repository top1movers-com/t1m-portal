import {
  formatDate,
  jobFlags,
  jobTasks,
  openExceptions,
  SERVICE_TYPE_LABELS,
  taskCounts,
  docFlags,
  useStore,
  type Job,
} from '../data'
import { BILLING_STATE_META, DataTable, JOB_STATUS_META, PageHead, Panel, StatusPill, type Column } from '../ui'
import { JobFlags } from './JobFlags'

export function JobsList() {
  const { state } = useStore()
  const jobs = [...state.jobs].sort((a, b) => b.id.localeCompare(a.id))

  const overdue = taskCounts(state.tasks).overdue
  const missingDocs = state.jobs.reduce((n, j) => n + docFlags(state, j.id).missing + docFlags(state, j.id).rejected, 0)
  const exceptions = openExceptions(state).length
  const ready = state.jobs.filter((j) => j.billingState === 'ready_for_finance').length

  const columns: Column<Job>[] = [
    { key: 'id', header: 'Job ID', primary: true, mono: true, render: (j) => j.id },
    {
      key: 'customer',
      header: 'Customer',
      render: (j) => (
        <span className="ds-cell-name">
          {j.customer}
          <span className="ds-cell-sub">{SERVICE_TYPE_LABELS[j.serviceType]}</span>
        </span>
      ),
    },
    { key: 'route', header: 'Route', render: (j) => `${j.origin} to ${j.destination}` },
    { key: 'status', header: 'Status', render: (j) => <StatusPill meta={JOB_STATUS_META[j.status]} /> },
    { key: 'flags', header: 'Needs attention', render: (j) => <JobFlags flags={jobFlags(state, j.id)} /> },
    {
      key: 'tasks',
      header: 'Open tasks',
      num: true,
      render: (j) => taskCounts(jobTasks(state, j.id)).open,
    },
    { key: 'eta', header: 'ETA', render: (j) => formatDate(j.eta) },
    { key: 'billing', header: 'Billing', render: (j) => <StatusPill meta={BILLING_STATE_META[j.billingState]} /> },
  ]

  return (
    <div className="app-stack app-stack--lg">
      <PageHead title="Shipment jobs" meta={`${jobs.length} shipment jobs. Sample data for the proposal mockup.`} />
      <div className="ds-stats">
        <div className="ds-stat">
          <span className="ds-label">Active jobs</span>
          <div className="ds-stat__value">{jobs.length}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Overdue tasks</span>
          <div className={overdue ? 'ds-stat__value ds-stat__value--danger' : 'ds-stat__value'}>{overdue}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Missing or rejected docs</span>
          <div className="ds-stat__value">{missingDocs}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Open exceptions</span>
          <div className={exceptions ? 'ds-stat__value ds-stat__value--danger' : 'ds-stat__value'}>{exceptions}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Ready for Finance</span>
          <div className="ds-stat__value">{ready}</div>
        </div>
      </div>
      <Panel title="All shipment jobs" flush>
        <DataTable
          caption="Shipment jobs"
          columns={columns}
          rows={jobs}
          rowKey={(j) => j.id}
          rowHref={(j) => `/jobs/${j.id}`}
        />
      </Panel>
    </div>
  )
}
