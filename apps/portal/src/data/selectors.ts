import { DEMO_TODAY, formatDate, isDueSoon, isOverdue } from './clock'
import { formatPHP, plural } from './format'
import type {
  BillingCheckItem,
  BillingChecklist,
  Charge,
  Delivery,
  DemoState,
  DocRequirement,
  DocumentRecord,
  DocVersion,
  ExceptionRecord,
  Job,
  JobTab,
  Milestone,
  MilestoneState,
  MilestoneTemplate,
  ServiceType,
  Task,
  TaskBucket,
  User,
} from './types'

/* ---------- Lookups ---------- */

export function getJob(state: DemoState, jobId: string): Job | undefined {
  return state.jobs.find((j) => j.id === jobId)
}

export function getUser(state: DemoState, userId: string | undefined): User | undefined {
  return userId ? state.users.find((u) => u.id === userId) : undefined
}

export function userName(state: DemoState, userId: string | undefined): string {
  return getUser(state, userId)?.name ?? 'Unassigned'
}

export function templateFor(state: DemoState, serviceType: ServiceType): MilestoneTemplate | undefined {
  return state.templates.find((t) => t.serviceType === serviceType)
}

export function docRequirementsFor(state: DemoState, serviceType: ServiceType): DocRequirement[] {
  return state.docRequirements.filter((r) => r.serviceType === serviceType)
}

/* ---------- Milestones and tasks ---------- */

export function jobMilestones(state: DemoState, jobId: string): Milestone[] {
  return state.milestones.filter((m) => m.jobId === jobId).sort((a, b) => a.order - b.order)
}

export function getMilestone(state: DemoState, milestoneId: string): Milestone | undefined {
  return state.milestones.find((m) => m.id === milestoneId)
}

export function jobTasks(state: DemoState, jobId: string): Task[] {
  return state.tasks.filter((t) => t.jobId === jobId)
}

export function milestoneTasks(state: DemoState, milestoneId: string): Task[] {
  return state.tasks.filter((t) => t.milestoneId === milestoneId)
}

export function taskBucket(task: Task): TaskBucket {
  if (task.status === 'done') return 'done'
  if (isOverdue(task.dueDate)) return 'overdue'
  if (isDueSoon(task.dueDate)) return 'due'
  return 'pending'
}

export interface TaskCounts {
  pending: number
  due: number
  overdue: number
  done: number
  open: number
  total: number
}

export function taskCounts(tasks: Task[]): TaskCounts {
  const counts: TaskCounts = { pending: 0, due: 0, overdue: 0, done: 0, open: 0, total: tasks.length }
  for (const t of tasks) {
    counts[taskBucket(t)] += 1
    if (t.status === 'open') counts.open += 1
  }
  return counts
}

const BUCKET_ORDER: Record<TaskBucket, number> = { overdue: 0, due: 1, pending: 2, done: 3 }

/** Overdue first, then due soon, then pending, then done; earliest due date first within a bucket. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      BUCKET_ORDER[taskBucket(a)] - BUCKET_ORDER[taskBucket(b)] ||
      (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  )
}

export function tasksForUser(state: DemoState, userId: string, includeDone = false): Task[] {
  return sortTasks(state.tasks.filter((t) => t.ownerId === userId && (includeDone || t.status === 'open')))
}

export function milestoneState(state: DemoState, milestone: Milestone): MilestoneState {
  if (milestone.completedAt) return 'done'
  if (milestone.dueDate < DEMO_TODAY) return 'overdue'
  const firstOpen = jobMilestones(state, milestone.jobId).find((m) => !m.completedAt)
  return firstOpen?.id === milestone.id ? 'current' : 'upcoming'
}

export interface TrackStep {
  milestone: Milestone
  state: MilestoneState
}

export function jobTrack(state: DemoState, jobId: string): TrackStep[] {
  return jobMilestones(state, jobId).map((milestone) => ({ milestone, state: milestoneState(state, milestone) }))
}

export function currentMilestone(state: DemoState, jobId: string): Milestone | undefined {
  return jobMilestones(state, jobId).find((m) => !m.completedAt)
}

/* ---------- Documents ---------- */

export function jobDocuments(state: DemoState, jobId: string): DocumentRecord[] {
  return state.documents.filter((d) => d.jobId === jobId)
}

export function getDocument(state: DemoState, docId: string): DocumentRecord | undefined {
  return state.documents.find((d) => d.id === docId)
}

export function currentVersion(doc: DocumentRecord): DocVersion | undefined {
  return doc.versions[doc.versions.length - 1]
}

export interface DocFlags {
  /** Required documents with no upload yet. */
  missing: number
  rejected: number
  pending: number
  approved: number
  requiredTotal: number
  requiredApproved: number
}

export function docFlags(state: DemoState, jobId: string): DocFlags {
  const docs = jobDocuments(state, jobId)
  const required = docs.filter((d) => d.required)
  return {
    missing: required.filter((d) => d.status === 'missing').length,
    rejected: docs.filter((d) => d.status === 'rejected').length,
    pending: docs.filter((d) => d.status === 'pending_review').length,
    approved: docs.filter((d) => d.status === 'approved').length,
    requiredTotal: required.length,
    requiredApproved: required.filter((d) => d.status === 'approved').length,
  }
}

/* ---------- Exceptions ---------- */

export function getException(state: DemoState, exceptionId: string): ExceptionRecord | undefined {
  return state.exceptions.find((e) => e.id === exceptionId)
}

export function jobExceptions(state: DemoState, jobId: string): ExceptionRecord[] {
  return state.exceptions.filter((e) => e.jobId === jobId).sort((a, b) => b.raisedAt.localeCompare(a.raisedAt))
}

/** Open means anything not yet closed, including decided exceptions still being worked. */
export function isExceptionOpen(exception: ExceptionRecord): boolean {
  return exception.status !== 'closed'
}

export function openExceptions(state: DemoState, jobId?: string): ExceptionRecord[] {
  return state.exceptions.filter((e) => isExceptionOpen(e) && (!jobId || e.jobId === jobId))
}

export function pendingApprovals(state: DemoState): ExceptionRecord[] {
  return state.exceptions
    .filter((e) => e.status === 'pending_approval')
    .sort((a, b) => a.raisedAt.localeCompare(b.raisedAt))
}

export function correctiveTasks(state: DemoState, exception: ExceptionRecord): Task[] {
  return state.tasks.filter((t) => exception.correctiveTaskIds.includes(t.id))
}

/* ---------- Delivery ---------- */

export function jobDelivery(state: DemoState, jobId: string): Delivery | undefined {
  return state.deliveries.find((d) => d.jobId === jobId)
}

/* ---------- Charges ---------- */

export function jobCharges(state: DemoState, jobId: string): Charge[] {
  return state.charges.filter((c) => c.jobId === jobId)
}

export interface ChargesTotals {
  charges: number
  expenses: number
  margin: number
  count: number
  chargeCount: number
  missingEvidence: number
}

export function chargesTotals(state: DemoState, jobId: string): ChargesTotals {
  const rows = jobCharges(state, jobId)
  const sum = (kind: Charge['kind']) =>
    rows.filter((c) => c.kind === kind).reduce((total, c) => total + c.amountPHP, 0)
  const charges = sum('charge')
  const expenses = sum('expense')
  return {
    charges,
    expenses,
    margin: charges - expenses,
    count: rows.length,
    chargeCount: rows.filter((c) => c.kind === 'charge').length,
    missingEvidence: rows.filter((c) => c.evidence.length === 0).length,
  }
}

/* ---------- Billing readiness ---------- */

export function billingChecklist(state: DemoState, jobId: string): BillingChecklist {
  const job = getJob(state, jobId)
  const delivery = jobDelivery(state, jobId)
  const docs = docFlags(state, jobId)
  const open = openExceptions(state, jobId)
  const tasks = taskCounts(jobTasks(state, jobId))
  const totals = chargesTotals(state, jobId)
  const items: BillingCheckItem[] = []

  if (delivery?.status === 'delivered') {
    const outcome = delivery.outcome === 'complete' ? 'complete' : `${delivery.outcome ?? 'recorded'}`
    items.push({
      id: 'delivery_confirmed',
      label: 'Delivery confirmed',
      detail: `Delivered ${formatDate(delivery.deliveredAt)}, ${outcome}`,
      state: 'pass',
      fixTab: 'delivery',
    })
  } else {
    items.push({
      id: 'delivery_confirmed',
      label: 'Delivery confirmed',
      detail: delivery ? `Scheduled for ${formatDate(delivery.scheduledFor)}` : 'No delivery scheduled yet',
      state: delivery ? 'pending' : 'fail',
      fixTab: 'delivery',
    })
  }

  const pod = delivery?.pod
  items.push({
    id: 'pod_approved',
    label: 'Proof of delivery approved',
    detail: !pod
      ? 'No POD uploaded yet'
      : pod.status === 'approved'
        ? `Approved ${formatDate(pod.reviewedAt)}`
        : pod.status === 'rejected'
          ? `Rejected: ${pod.rejectReason ?? 'no reason given'}`
          : 'Uploaded, awaiting review',
    state: pod?.status === 'approved' ? 'pass' : pod?.status === 'pending_review' ? 'pending' : 'fail',
    fixTab: 'delivery',
  })

  const docsOutstanding = docs.missing + docs.rejected
  items.push({
    id: 'documents_approved',
    label: 'Required documents approved',
    detail:
      docs.requiredApproved === docs.requiredTotal
        ? `All ${plural(docs.requiredTotal, 'required document')} approved`
        : docsOutstanding > 0
          ? [docs.missing && `${docs.missing} missing`, docs.rejected && `${docs.rejected} rejected`].filter(Boolean).join(', ')
          : `${plural(docs.requiredTotal - docs.requiredApproved, 'document')} awaiting review`,
    state:
      docs.requiredApproved === docs.requiredTotal ? 'pass' : docsOutstanding > 0 ? 'fail' : 'pending',
    fixTab: 'documents',
  })

  items.push({
    id: 'no_open_exceptions',
    label: 'No open exceptions',
    detail: open.length === 0 ? 'Nothing open' : `${plural(open.length, 'open exception')}: ${open.map((e) => e.id).join(', ')}`,
    state: open.length === 0 ? 'pass' : 'fail',
    fixTab: 'exceptions',
  })

  items.push({
    id: 'tasks_complete',
    label: 'All tasks complete',
    detail:
      tasks.open === 0
        ? `${plural(tasks.total, 'task')} done`
        : `${plural(tasks.open, 'open task')}${tasks.overdue ? `, ${tasks.overdue} overdue` : ''}`,
    state: tasks.open === 0 ? 'pass' : 'fail',
    fixTab: 'tasks',
  })

  items.push({
    id: 'evidence_complete',
    label: 'Every charge and expense has evidence',
    detail:
      totals.count === 0
        ? 'Nothing recorded yet'
        : totals.missingEvidence === 0
          ? `Evidence attached to all ${totals.count}`
          : `${plural(totals.missingEvidence, 'line')} without evidence`,
    state: totals.count === 0 ? 'pending' : totals.missingEvidence === 0 ? 'pass' : 'fail',
    fixTab: 'charges',
  })

  items.push({
    id: 'charges_recorded',
    label: 'At least one customer charge recorded',
    detail:
      totals.chargeCount > 0
        ? `${plural(totals.chargeCount, 'charge')}, ${formatPHP(totals.charges)}`
        : 'No customer charges yet',
    state: totals.chargeCount > 0 ? 'pass' : 'fail',
    fixTab: 'charges',
  })

  return {
    items,
    canMarkReady: !!job && job.billingState === 'not_ready' && items.every((i) => i.state === 'pass'),
  }
}

/* ---------- Job-level summaries ---------- */

export interface JobFlags {
  overdueTasks: number
  dueTasks: number
  missingDocs: number
  rejectedDocs: number
  pendingDocs: number
  openExceptions: number
  pendingApprovals: number
}

export function jobFlags(state: DemoState, jobId: string): JobFlags {
  const tasks = taskCounts(jobTasks(state, jobId))
  const docs = docFlags(state, jobId)
  const open = openExceptions(state, jobId)
  return {
    overdueTasks: tasks.overdue,
    dueTasks: tasks.due,
    missingDocs: docs.missing,
    rejectedDocs: docs.rejected,
    pendingDocs: docs.pending,
    openExceptions: open.length,
    pendingApprovals: open.filter((e) => e.status === 'pending_approval').length,
  }
}

export interface TabCount {
  count: number
  tone?: 'danger' | 'warning'
  /** Accessible description, e.g. "2 overdue". */
  label: string
}

export function jobTabCounts(state: DemoState, jobId: string): Record<JobTab, TabCount | null> {
  const tasks = taskCounts(jobTasks(state, jobId))
  const docs = docFlags(state, jobId)
  const open = openExceptions(state, jobId).length
  const totals = chargesTotals(state, jobId)
  const docIssues = docs.missing + docs.rejected
  return {
    tasks:
      tasks.overdue > 0
        ? { count: tasks.overdue, tone: 'danger', label: `${tasks.overdue} overdue` }
        : tasks.open > 0
          ? { count: tasks.open, label: `${tasks.open} open` }
          : null,
    documents:
      docIssues > 0
        ? {
            count: docIssues,
            tone: docs.rejected > 0 ? 'danger' : 'warning',
            label: [docs.missing && `${docs.missing} missing`, docs.rejected && `${docs.rejected} rejected`]
              .filter(Boolean)
              .join(', '),
          }
        : null,
    exceptions: open > 0 ? { count: open, tone: 'danger', label: `${open} open` } : null,
    delivery: null,
    charges:
      totals.missingEvidence > 0
        ? { count: totals.missingEvidence, tone: 'warning', label: `${totals.missingEvidence} missing evidence` }
        : null,
  }
}

export function jobAudit(state: DemoState, jobId: string) {
  return state.audit.filter((a) => a.jobId === jobId)
}
