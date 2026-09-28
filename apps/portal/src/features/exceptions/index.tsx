import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  correctiveTasks,
  daysFromToday,
  formatDate,
  formatPHP,
  getException,
  getJob,
  getMilestone,
  isExceptionOpen,
  jobExceptions,
  pendingApprovals,
  userName,
  useStore,
  type DecisionOutcome,
  type DemoState,
  type ExceptionCategory,
  type ExceptionRecord,
  type Job,
} from '../../data'
import {
  Alert,
  Button,
  type Column,
  DataTable,
  Dialog,
  EmptyState,
  EXCEPTION_STATUS_META,
  Field,
  PageHead,
  Panel,
  SEVERITY_META,
  StatusPill,
  Textarea,
} from '../../ui'
import { CorrectiveTaskDrawer } from './CorrectiveTaskDrawer'
import { ExceptionDrawer } from './ExceptionDrawer'
import { ExceptionSummary } from './ExceptionSummary'
import './exceptions.css'
import { RaiseExceptionDialog } from './RaiseExceptionDialog'

function correctiveProgress(state: DemoState, exception: ExceptionRecord): string {
  const tasks = correctiveTasks(state, exception)
  if (tasks.length === 0) return 'None'
  const done = tasks.filter((t) => t.status === 'done').length
  return `${done} / ${tasks.length}`
}

export function ExceptionsTab({ job }: { job: Job }) {
  const { state } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [manualRaiseOpen, setManualRaiseOpen] = useState(false)
  const [manualRaiseDefaults, setManualRaiseDefaults] = useState<{ stageId?: string; category?: ExceptionCategory }>({})
  const [correctiveFor, setCorrectiveFor] = useState<{ exceptionId: string; milestoneId?: string } | null>(null)

  const selectedId = searchParams.get('exception') ?? undefined
  const selected = selectedId ? getException(state, selectedId) : undefined

  /* Deep link (?raise=1&stage=&category=) opens the dialog; the params themselves are the
     source of truth while present, so this is derived from render, not synced into state. */
  const raiseFromUrl = searchParams.get('raise') === '1'
  const raiseOpen = manualRaiseOpen || raiseFromUrl
  const raiseDefaults = raiseFromUrl
    ? {
        stageId: searchParams.get('stage') ?? undefined,
        category: (searchParams.get('category') as ExceptionCategory | null) ?? undefined,
      }
    : manualRaiseDefaults

  function clearRaiseParams() {
    if (!raiseFromUrl) return
    const next = new URLSearchParams(searchParams)
    next.delete('raise')
    next.delete('stage')
    next.delete('category')
    setSearchParams(next, { replace: true })
  }

  function closeRaiseDialog() {
    setManualRaiseOpen(false)
    clearRaiseParams()
  }

  function openException(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('exception', id)
    setSearchParams(next)
  }

  function closeExceptionDrawer() {
    const next = new URLSearchParams(searchParams)
    next.delete('exception')
    setSearchParams(next, { replace: true })
  }

  const exceptions = [...jobExceptions(state, job.id)].sort((a, b) => {
    const openDiff = Number(isExceptionOpen(b)) - Number(isExceptionOpen(a))
    return openDiff !== 0 ? openDiff : b.raisedAt.localeCompare(a.raisedAt)
  })

  const columns: Column<ExceptionRecord>[] = [
    { key: 'id', header: 'ID', primary: true, mono: true, render: (e) => e.id },
    { key: 'category', header: 'Category', render: (e) => e.category },
    { key: 'stage', header: 'Stage', render: (e) => getMilestone(state, e.stageMilestoneId)?.name ?? '—' },
    { key: 'severity', header: 'Severity', render: (e) => <StatusPill meta={SEVERITY_META[e.impact.severity]} /> },
    { key: 'status', header: 'Status', render: (e) => <StatusPill meta={EXCEPTION_STATUS_META[e.status]} /> },
    {
      key: 'raised',
      header: 'Raised',
      render: (e) => (
        <span className="exc-table-cell--stack">
          <span>{userName(state, e.raisedBy)}</span>
          <span className="ds-muted">{formatDate(e.raisedAt)}</span>
        </span>
      ),
    },
    { key: 'corrective', header: 'Corrective tasks', render: (e) => correctiveProgress(state, e) },
  ]

  return (
    <>
      <Panel
        title="Exceptions"
        actions={
          <Button
            variant="primary"
            icon="flag"
            onClick={() => {
              setManualRaiseDefaults({})
              setManualRaiseOpen(true)
            }}
          >
            Raise exception
          </Button>
        }
        flush
      >
        <DataTable
          caption="Exceptions on this job"
          columns={columns}
          rows={exceptions}
          rowKey={(e) => e.id}
          onRowClick={(e) => openException(e.id)}
          selectedKey={selectedId}
          empty={
            <EmptyState icon="flag" title="No exceptions raised on this job">
              Raise an exception to flag damage, delay, documentation, or another issue that needs a manager's decision.
            </EmptyState>
          }
        />
      </Panel>

      <RaiseExceptionDialog
        job={job}
        open={raiseOpen}
        onClose={closeRaiseDialog}
        defaultStageId={raiseDefaults.stageId}
        defaultCategory={raiseDefaults.category}
        onRaised={(id) => {
          closeRaiseDialog()
          openException(id)
        }}
      />

      {selected && (
        <ExceptionDrawer
          key={selected.id}
          job={job}
          exception={selected}
          onClose={closeExceptionDrawer}
          onAssignCorrective={(milestoneId) => setCorrectiveFor({ exceptionId: selected.id, milestoneId })}
        />
      )}

      {correctiveFor && (
        <CorrectiveTaskDrawer
          key={correctiveFor.exceptionId}
          job={job}
          exceptionId={correctiveFor.exceptionId}
          defaultMilestoneId={correctiveFor.milestoneId}
          open
          onClose={() => setCorrectiveFor(null)}
        />
      )}
    </>
  )
}

function ApprovalDetail({
  exception,
  onAssignCorrective,
}: {
  exception: ExceptionRecord
  onAssignCorrective: () => void
}) {
  const { state, actions } = useStore()
  const job = getJob(state, exception.jobId)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string>()
  const [decisionError, setDecisionError] = useState<string>()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [justDecided, setJustDecided] = useState<DecisionOutcome | null>(null)

  function decide(outcome: DecisionOutcome) {
    if (!comment.trim()) {
      setCommentError('Add a comment explaining your decision.')
      return
    }
    const result = actions.decideException(exception.id, outcome, comment)
    if (!result.ok) {
      setDecisionError(result.error)
      return
    }
    setDecisionError(undefined)
    setCommentError(undefined)
    setRejectOpen(false)
    setJustDecided(outcome)
  }

  if (!job) return null

  return (
    <div className="app-stack app-stack--lg">
      <div>
        <span className="ds-label">Job</span>
        <p>
          <Link to={`/jobs/${job.id}`} className="ds-mono">
            {job.id}
          </Link>{' '}
          · {job.customer}
        </p>
      </div>

      <ExceptionSummary exception={exception} />

      {exception.status === 'pending_approval' ? (
        <div className="exc-decision">
          {decisionError && (
            <Alert tone="danger" title="Could not record this decision" live>
              {decisionError}
            </Alert>
          )}
          <Field label="Decision comment" id="approval-comment" error={commentError} hint="Explain your decision; the raiser will see this.">
            <Textarea
              id="approval-comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                if (commentError) setCommentError(undefined)
              }}
              rows={3}
            />
          </Field>
          <div className="app-row">
            <Button variant="secondary" icon="x" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
            <Button variant="primary" icon="check" onClick={() => decide('approved')}>
              Approve
            </Button>
          </div>
          <Dialog
            open={rejectOpen}
            onClose={() => setRejectOpen(false)}
            title="Reject this exception?"
            footer={
              <>
                <Button variant="ghost" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => decide('rejected')} disabled={!comment.trim()}>
                  Reject exception
                </Button>
              </>
            }
          >
            <div className="app-stack">
              {decisionError && (
                <Alert tone="danger" title="Could not record this decision" live>
                  {decisionError}
                </Alert>
              )}
              <p>
                {exception.id} will be marked rejected. The raiser will see your comment:
                <br />
                <em>{comment || '(no comment yet — add one before rejecting)'}</em>
              </p>
            </div>
          </Dialog>
        </div>
      ) : (
        <Alert tone={exception.status === 'rejected' ? 'danger' : 'success'} title={EXCEPTION_STATUS_META[exception.status].label}>
          {exception.decision && `${exception.decision.comment} — ${userName(state, exception.decision.by)}`}
        </Alert>
      )}

      {justDecided === 'approved' && (
        <Alert tone="info" title="Assign a corrective task now?">
          <div className="exc-corrective-prompt">
            <span>Give someone a task to resolve this exception.</span>
            <Button variant="secondary" icon="plus" onClick={onAssignCorrective}>
              Assign corrective task
            </Button>
          </div>
        </Alert>
      )}
    </div>
  )
}

export function ApprovalsPage() {
  const { state } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [correctiveFor, setCorrectiveFor] = useState<string | null>(null)

  const queue = pendingApprovals(state)
  const decided = [...state.exceptions]
    .filter((e) => e.status === 'approved' || e.status === 'rejected' || e.status === 'closed')
    .sort((a, b) => (b.decision?.at ?? '').localeCompare(a.decision?.at ?? ''))
    .slice(0, 10)

  const selectedId = searchParams.get('exception') ?? undefined
  const selected = selectedId ? getException(state, selectedId) : undefined

  function select(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('exception', id)
    setSearchParams(next)
  }

  function back() {
    const next = new URLSearchParams(searchParams)
    next.delete('exception')
    setSearchParams(next, { replace: true })
  }

  const queueColumns: Column<ExceptionRecord>[] = [
    { key: 'id', header: 'ID', primary: true, mono: true, render: (e) => e.id },
    {
      key: 'job',
      header: 'Job',
      render: (e) => (
        <Link to={`/jobs/${e.jobId}`} className="ds-mono">
          {e.jobId}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (e) => getJob(state, e.jobId)?.customer ?? '—' },
    { key: 'category', header: 'Category', render: (e) => e.category },
    { key: 'severity', header: 'Severity', render: (e) => <StatusPill meta={SEVERITY_META[e.impact.severity]} /> },
    {
      key: 'impact',
      header: 'Impact',
      render: (e) => (
        <span className="exc-table-cell--stack">
          {e.impact.costPHP !== undefined && <span>{formatPHP(e.impact.costPHP)}</span>}
          {e.impact.delayDays !== undefined && <span className="ds-muted">{e.impact.delayDays} days</span>}
          {e.impact.costPHP === undefined && e.impact.delayDays === undefined && <span className="ds-muted">—</span>}
        </span>
      ),
    },
    { key: 'raisedBy', header: 'Raised by', render: (e) => userName(state, e.raisedBy) },
    { key: 'age', header: 'Age', num: true, render: (e) => `${daysFromToday(e.raisedAt) * -1}d` },
  ]

  const decidedColumns: Column<ExceptionRecord>[] = [
    { key: 'id', header: 'ID', primary: true, mono: true, render: (e) => e.id },
    { key: 'job', header: 'Job', render: (e) => e.jobId },
    { key: 'status', header: 'Outcome', render: (e) => <StatusPill meta={EXCEPTION_STATUS_META[e.status]} /> },
    { key: 'decidedAt', header: 'Decided', render: (e) => formatDate(e.decision?.at) },
  ]

  return (
    <div className="app-stack app-stack--lg">
      <PageHead title="Approvals" meta="Exceptions waiting for a manager's decision" />
      <div className="exc-approvals" data-selected={!!selected}>
        <div className="exc-approvals__queue app-stack">
          <Panel title="Pending approval" flush>
            <DataTable
              caption="Exceptions pending approval"
              columns={queueColumns}
              rows={queue}
              rowKey={(e) => e.id}
              onRowClick={(e) => select(e.id)}
              selectedKey={selectedId}
              empty={
                <EmptyState icon="shield" title="Nothing awaiting approval">
                  All raised exceptions have been decided.
                </EmptyState>
              }
            />
          </Panel>
          <Panel title="Recently decided" flush>
            <DataTable
              caption="Recently decided exceptions"
              columns={decidedColumns}
              rows={decided}
              rowKey={(e) => e.id}
              onRowClick={(e) => select(e.id)}
              selectedKey={selectedId}
              empty={<EmptyState icon="history" title="No decisions yet" />}
            />
          </Panel>
        </div>
        <div className="exc-approvals__detail">
          <Panel
            title={selected ? <span className="ds-mono">{selected.id}</span> : 'Select an exception'}
            actions={
              selected && (
                <Button className="exc-approvals__back" variant="ghost" icon="chevron-left" onClick={back}>
                  Back to queue
                </Button>
              )
            }
          >
            {selected ? (
              <ApprovalDetail key={selected.id} exception={selected} onAssignCorrective={() => setCorrectiveFor(selected.id)} />
            ) : (
              <EmptyState icon="shield" title="No exception selected">
                Pick a row from the queue to review it.
              </EmptyState>
            )}
          </Panel>
        </div>
      </div>

      {selected && correctiveFor === selected.id && (
        <CorrectiveTaskDrawer
          key={selected.id}
          job={getJob(state, selected.jobId)!}
          exceptionId={selected.id}
          defaultMilestoneId={selected.stageMilestoneId}
          open
          onClose={() => setCorrectiveFor(null)}
        />
      )}
    </div>
  )
}
