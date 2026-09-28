import { useId, useMemo, useState } from 'react'
import './charges.css'
import {
  billingChecklist,
  chargesTotals,
  formatDate,
  formatDateTime,
  formatPHP,
  getUser,
  jobCharges,
  jobDocuments,
  plural,
  useStore,
  type BillingCheckItem,
  type Charge,
  type ChargeKind,
  type Job,
  type JobTab,
} from '../../data'
import {
  Alert,
  BILLING_STATE_META,
  Button,
  Checklist,
  cx,
  DataTable,
  Dialog,
  EmptyState,
  Icon,
  LinkButton,
  Panel,
  StatusPill,
  type Column,
} from '../../ui'
import { ChargeDrawer } from './ChargeDrawer'
import { RowMenu } from './RowMenu'

const FIX_TAB_LABELS: Record<JobTab, string> = {
  tasks: 'Tasks',
  documents: 'Documents',
  exceptions: 'Exceptions',
  delivery: 'Delivery & POD',
  charges: 'Charges & billing',
}

const KIND_LABEL: Record<ChargeKind, string> = { charge: 'Charge', expense: 'Expense' }

type Segment = 'all' | ChargeKind

function KindPill({ kind }: { kind: ChargeKind }) {
  return <span className={cx('charges-kind', kind === 'charge' && 'charges-kind--charge')}>{KIND_LABEL[kind]}</span>
}

function EvidenceCell({ charge }: { charge: Charge }) {
  if (charge.evidence.length === 0) {
    return <StatusPill tone="warning" icon="alert">Missing evidence</StatusPill>
  }
  return (
    <span className="charges-evidence">
      <Icon name="paperclip" />
      {plural(charge.evidence.length, 'file')}
    </span>
  )
}

function ChecklistAction({ item, jobId, state }: { item: BillingCheckItem; jobId: string; state: ReturnType<typeof useStore>['state'] }) {
  if (item.state === 'pass' || item.fixTab === 'charges') return null
  if (item.fixTab === 'documents') {
    const failingDoc = jobDocuments(state, jobId).find((d) => d.required && (d.status === 'missing' || d.status === 'rejected'))
    if (failingDoc) {
      return (
        <LinkButton variant="ghost" size="sm" to={`/jobs/${jobId}/documents?doc=${failingDoc.id}`}>
          Fix in Documents
        </LinkButton>
      )
    }
  }
  return (
    <LinkButton variant="ghost" size="sm" to={`/jobs/${jobId}/${item.fixTab}`}>
      Fix in {FIX_TAB_LABELS[item.fixTab]}
    </LinkButton>
  )
}

export function ChargesTab({ job }: { job: Job }) {
  const { state, actions } = useStore()
  const segmentName = useId()
  const [segment, setSegment] = useState<Segment>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null)
  const [removingCharge, setRemovingCharge] = useState<Charge | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [confirmReadyOpen, setConfirmReadyOpen] = useState(false)
  const [markingReady, setMarkingReady] = useState(false)
  const [readyError, setReadyError] = useState<string | null>(null)

  const locked = job.billingState === 'ready_for_finance'
  const rows = jobCharges(state, job.id)
  const totals = chargesTotals(state, job.id)
  const checklist = billingChecklist(state, job.id)
  const passing = checklist.items.filter((i) => i.state === 'pass').length

  const filtered = useMemo(() => (segment === 'all' ? rows : rows.filter((c) => c.kind === segment)), [rows, segment])

  function openAdd() {
    setEditingCharge(null)
    setDrawerOpen(true)
  }

  function openEdit(charge: Charge) {
    setEditingCharge(charge)
    setDrawerOpen(true)
  }

  function confirmRemove() {
    if (!removingCharge) return
    const result = actions.removeCharge(removingCharge.id)
    if (!result.ok) {
      setRemoveError(result.error)
      return
    }
    setRemovingCharge(null)
    setRemoveError(null)
  }

  function handleMarkReady() {
    setMarkingReady(true)
    const result = actions.markReadyForFinance(job.id)
    setMarkingReady(false)
    if (!result.ok) {
      setReadyError(result.error)
      return
    }
    setReadyError(null)
    setConfirmReadyOpen(false)
  }

  const columns: Column<Charge>[] = [
    { key: 'kind', header: 'Kind', render: (c) => <KindPill kind={c.kind} /> },
    { key: 'category', header: 'Category', render: (c) => c.category },
    { key: 'description', header: 'Description', primary: true, render: (c) => c.description },
    { key: 'amount', header: 'Amount', num: true, render: (c) => formatPHP(c.amountPHP) },
    { key: 'evidence', header: 'Evidence', render: (c) => <EvidenceCell charge={c} /> },
    {
      key: 'added',
      header: 'Added',
      render: (c) => (
        <span className="charges-added">
          <span className="charges-added__by">{getUser(state, c.addedBy)?.name ?? 'Sample user'}</span>
          <span className="charges-added__at">{formatDate(c.addedAt)}</span>
        </span>
      ),
    },
  ]

  if (!locked) {
    columns.push({
      key: 'actions',
      header: <span className="ds-vh">Actions</span>,
      className: 'ds-actions-col',
      render: (c) => (
        <RowMenu
          label={`Actions for ${c.description}`}
          actions={[
            { label: 'Edit', icon: 'edit', onSelect: () => openEdit(c) },
            { label: 'Attach evidence', icon: 'paperclip', onSelect: () => openEdit(c) },
            { label: 'Remove', icon: 'trash', tone: 'danger', onSelect: () => setRemovingCharge(c) },
          ]}
        />
      ),
    })
  }

  return (
    <div className="charges-layout">
      <div className="charges-layout__main">
        <Panel
          title="Charges and expenses"
          flush
          actions={
            !locked && (
              <fieldset className="ds-seg" aria-label="Filter by kind">
                <label>
                  <input
                    type="radio"
                    name={segmentName}
                    checked={segment === 'all'}
                    onChange={() => setSegment('all')}
                  />
                  All
                </label>
                <label>
                  <input
                    type="radio"
                    name={segmentName}
                    checked={segment === 'charge'}
                    onChange={() => setSegment('charge')}
                  />
                  Charges
                </label>
                <label>
                  <input
                    type="radio"
                    name={segmentName}
                    checked={segment === 'expense'}
                    onChange={() => setSegment('expense')}
                  />
                  Expenses
                </label>
              </fieldset>
            )
          }
        >
          <DataTable
            caption="Charges and expenses"
            columns={columns}
            rows={filtered}
            rowKey={(c) => c.id}
            onRowClick={locked ? undefined : openEdit}
            empty={
              <EmptyState
                icon="receipt"
                title={rows.length === 0 ? 'No charges or expenses yet' : 'Nothing in this filter'}
                action={
                  !locked &&
                  rows.length === 0 && (
                    <Button variant="secondary" icon="plus" onClick={openAdd}>
                      Add charge
                    </Button>
                  )
                }
              >
                {rows.length === 0
                  ? 'Record what this job billed the customer and what Top1Movers spent.'
                  : 'Try a different filter.'}
              </EmptyState>
            }
          />
          {rows.length > 0 && (
            <dl className="charges-totals">
              <div className="charges-totals__item">
                <dt>Total charges</dt>
                <dd>{formatPHP(totals.charges)}</dd>
              </div>
              <div className="charges-totals__item">
                <dt>Total expenses</dt>
                <dd>{formatPHP(totals.expenses)}</dd>
              </div>
              <div className="charges-totals__item">
                <dt>Gross margin</dt>
                <dd data-tone={totals.margin < 0 ? 'danger' : 'success'}>{formatPHP(totals.margin)}</dd>
              </div>
            </dl>
          )}
          {locked && (
            <div className="charges-locked">
              <Icon name="shield" />
              Charges are locked. This job is with Finance.
            </div>
          )}
          {!locked && rows.length > 0 && (
            <div className="charges-footer-actions">
              <Button variant="secondary" icon="plus" onClick={openAdd}>
                Add charge
              </Button>
            </div>
          )}
        </Panel>
      </div>

      <div className="charges-layout__side">
        <Panel title="Billing readiness">
          {locked ? (
            <div className="charges-ready">
              <Icon name="check" />
              <StatusPill meta={BILLING_STATE_META.ready_for_finance} />
              <p className="ds-muted">
                Handed to Finance on {formatDateTime(job.readyAt)} by {getUser(state, job.readyBy)?.name ?? 'a sample user'}.
              </p>
            </div>
          ) : (
            <p className="charges-progress">
              {passing} of {checklist.items.length} checks passed
            </p>
          )}
          <Checklist
            label="Billing readiness checklist"
            items={checklist.items.map((item) => ({
              id: item.id,
              state: item.state,
              label: item.label,
              detail: item.detail,
              action: <ChecklistAction item={item} jobId={job.id} state={state} />,
            }))}
          />
          {!locked && (
            <>
              <Button
                variant="primary"
                disabled={!checklist.canMarkReady}
                onClick={() => setConfirmReadyOpen(true)}
              >
                Mark ready for Finance
              </Button>
              {!checklist.canMarkReady && (
                <p className="ds-muted">
                  {checklist.items.length - passing === 0
                    ? 'All checks pass.'
                    : plural(checklist.items.length - passing, 'check') + ' still need attention above.'}
                </p>
              )}
            </>
          )}
        </Panel>
      </div>

      {drawerOpen && (
        <ChargeDrawer
          key={editingCharge?.id ?? 'new'}
          job={job}
          charge={editingCharge}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <Dialog
        open={!!removingCharge}
        onClose={() => {
          setRemovingCharge(null)
          setRemoveError(null)
        }}
        title="Remove this line?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRemovingCharge(null)
                setRemoveError(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Remove
            </Button>
          </>
        }
      >
        {removeError && (
          <Alert tone="danger" title="Couldn't remove" live>
            {removeError}
          </Alert>
        )}
        <p>
          Remove {removingCharge?.description} ({removingCharge && formatPHP(removingCharge.amountPHP)}) from this job?
          This cannot be undone.
        </p>
      </Dialog>

      <Dialog
        open={confirmReadyOpen}
        onClose={() => {
          setConfirmReadyOpen(false)
          setReadyError(null)
        }}
        title="Hand over to Finance?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmReadyOpen(false)
                setReadyError(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" loading={markingReady} onClick={handleMarkReady}>
              Mark ready for Finance
            </Button>
          </>
        }
      >
        <p>
          Hand over {job.id} to Finance? Charges and expenses will be locked and can no longer be edited from this tab.
        </p>
        {readyError && (
          <Alert tone="danger" title="Not ready yet" live>
            {readyError}
          </Alert>
        )}
      </Dialog>
    </div>
  )
}
