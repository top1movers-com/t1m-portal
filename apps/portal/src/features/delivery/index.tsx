import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  formatDate,
  formatDateTime,
  getException,
  jobDelivery,
  nowISO,
  useStore,
  type ConfirmDeliveryInput,
  type Delivery,
  type DeliveryOutcome,
  type FileRef,
  type Job,
} from '../../data'
import {
  Alert,
  Button,
  ChoiceGroup,
  DELIVERY_OUTCOME_META,
  DELIVERY_STATUS_META,
  Dialog,
  EmptyState,
  EXCEPTION_STATUS_META,
  Field,
  FileDrop,
  FileList,
  Input,
  Panel,
  POD_STATUS_META,
  StatusPill,
  Textarea,
} from '../../ui'
import './delivery.css'

function toDateTimeLocal(iso: string): string {
  return iso.slice(0, 16)
}

function toISODateTime(local: string): string {
  return `${local}:00+08:00`
}

function ScheduleDeliveryPanel({ job }: { job: Job }) {
  const { actions } = useStore()
  const [scheduledFor, setScheduledFor] = useState(job.eta)
  const [expectedQty, setExpectedQty] = useState('1')
  const [qtyUnit, setQtyUnit] = useState('cartons')
  const [error, setError] = useState<string>()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = actions.scheduleDelivery(job.id, {
      scheduledFor,
      expectedQty: Number(expectedQty),
      qtyUnit,
    })
    setError(result.ok ? undefined : result.error)
  }

  return (
    <Panel title="Delivery">
      <div className="app-stack">
        <EmptyState icon="truck" title="No delivery scheduled yet">
          Schedule the delivery to start tracking confirmation and proof of delivery for this job.
        </EmptyState>
        <form className="delivery-fields" onSubmit={handleSubmit} noValidate>
          <Field label="Scheduled date">
            <Input type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} required />
          </Field>
          <Field label="Expected quantity">
            <Input
              type="number"
              min={1}
              value={expectedQty}
              onChange={(e) => setExpectedQty(e.target.value)}
              required
            />
          </Field>
          <Field label="Unit">
            <Input value={qtyUnit} onChange={(e) => setQtyUnit(e.target.value)} placeholder="cartons" required />
          </Field>
          <div className="app-row app-row--end delivery-form-actions delivery-sticky-actions">
            <Button type="submit" variant="primary" icon="calendar">
              Schedule delivery
            </Button>
          </div>
        </form>
        {error && (
          <Alert tone="danger" title="Couldn't schedule delivery" live>
            {error}
          </Alert>
        )}
      </div>
    </Panel>
  )
}

function DeliveryConfirmForm({
  job,
  delivery,
  onConfirmed,
}: {
  job: Job
  delivery: Delivery
  onConfirmed: (exceptionId?: string) => void
}) {
  const { actions } = useStore()
  const [outcome, setOutcome] = useState<DeliveryOutcome>()
  const [receiverName, setReceiverName] = useState('')
  const [deliveredAtLocal, setDeliveredAtLocal] = useState(() => toDateTimeLocal(nowISO()))
  const [deliveredQty, setDeliveredQty] = useState('')
  const [damageNotes, setDamageNotes] = useState('')
  const [affectedItems, setAffectedItems] = useState('')
  const [photos, setPhotos] = useState<FileRef[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isVariant = outcome === 'damaged' || outcome === 'incomplete'

  function selectOutcome(next: DeliveryOutcome) {
    setOutcome(next)
    if (next === 'complete') setDeliveredQty(String(delivery.expectedQty))
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!outcome) errs.outcome = 'Choose a delivery outcome.'
    if (!receiverName.trim()) errs.receiverName = "Enter the receiver's name."
    const qty = Number(deliveredQty)
    if (deliveredQty.trim() === '' || !Number.isInteger(qty) || qty < 0) errs.deliveredQty = 'Enter the delivered quantity.'
    if (outcome && outcome !== 'complete') {
      if (!damageNotes.trim()) errs.damageNotes = outcome === 'damaged' ? 'Describe the damage.' : 'Describe what is missing.'
      if (outcome === 'damaged' && photos.length === 0) errs.photos = 'Add at least one photo of the damage.'
      if (outcome === 'incomplete' && Number.isInteger(qty) && qty >= delivery.expectedQty)
        errs.deliveredQty = `Enter fewer than ${delivery.expectedQty} ${delivery.qtyUnit}.`
    }
    return errs
  }

  function buildInput(): ConfirmDeliveryInput {
    return {
      outcome: outcome!,
      receiverName,
      deliveredAt: toISODateTime(deliveredAtLocal),
      deliveredQty: Number(deliveredQty),
      damageNotes: outcome !== 'complete' ? damageNotes : undefined,
      affectedItems: outcome !== 'complete' ? affectedItems : undefined,
      photos: outcome !== 'complete' ? photos : [],
    }
  }

  function doConfirm() {
    const result = actions.confirmDelivery(job.id, buildInput())
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    setConfirmOpen(false)
    onConfirmed(result.value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errs = validate()
    setErrors(errs)
    setFormError(undefined)
    if (Object.keys(errs).length > 0) return
    if (outcome === 'complete') doConfirm()
    else setConfirmOpen(true)
  }

  return (
    <Panel title="Delivery confirmation">
      <form className="app-stack" onSubmit={handleSubmit} noValidate>
        <Field label="Outcome" error={errors.outcome} group>
          <ChoiceGroup
            label="Delivery outcome"
            value={outcome}
            onChange={selectOutcome}
            options={[
              {
                value: 'complete',
                title: 'Complete',
                description: 'Delivered in full, no issues.',
                icon: DELIVERY_OUTCOME_META.complete.icon,
              },
              {
                value: 'damaged',
                title: 'Damaged',
                description: 'Some items arrived damaged.',
                icon: DELIVERY_OUTCOME_META.damaged.icon,
                tone: 'danger',
              },
              {
                value: 'incomplete',
                title: 'Incomplete',
                description: 'Fewer items than expected.',
                icon: DELIVERY_OUTCOME_META.incomplete.icon,
                tone: 'warning',
              },
            ]}
          />
        </Field>

        <div className="delivery-fields delivery-fields--wide">
          <Field label="Receiver name" error={errors.receiverName}>
            <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="e.g. J. Dela Cruz" />
          </Field>
          <Field label="Delivered date and time">
            <Input type="datetime-local" value={deliveredAtLocal} onChange={(e) => setDeliveredAtLocal(e.target.value)} />
          </Field>
          <Field label="Delivered quantity" error={errors.deliveredQty}>
            <Input
              type="number"
              min={0}
              value={deliveredQty}
              onChange={(e) => setDeliveredQty(e.target.value)}
              affixEnd={delivery.qtyUnit}
            />
          </Field>
        </div>

        {isVariant && (
          <div className="app-stack app-stack--sm">
            <Field label={outcome === 'damaged' ? 'Damage notes' : 'Shortage notes'} error={errors.damageNotes}>
              <Textarea rows={3} value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} placeholder="What happened, and to what." />
            </Field>
            <Field label="Affected items" optional hint='e.g. "3 of 40 cartons crushed, items 12-14"'>
              <Input value={affectedItems} onChange={(e) => setAffectedItems(e.target.value)} placeholder="3 of 40 cartons crushed, items 12-14" />
            </Field>
            <Field label="Photos" error={errors.photos} hint={outcome === 'damaged' ? 'At least one photo is required.' : undefined}>
              <FileDrop multiple accept="image/*" onUpload={(files) => setPhotos((p) => [...p, ...files])} sampleFileName="damage-photo.jpg" />
            </Field>
            {photos.length > 0 && <FileList files={photos} onRemove={(id) => setPhotos((p) => p.filter((f) => f.id !== id))} label="Photos" />}
            <Alert tone="warning" title="This will raise an exception">
              Confirming a {outcome} delivery raises an exception for a manager to review and approve.
            </Alert>
          </div>
        )}

        {formError && !confirmOpen && (
          <Alert tone="danger" title="Couldn't confirm delivery" live>
            {formError}
          </Alert>
        )}

        <div className="app-row app-row--end delivery-sticky-actions">
          <Button type="submit" variant="primary" icon="check">
            Confirm delivery
          </Button>
        </div>
      </form>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Confirm delivery as ${outcome ? DELIVERY_OUTCOME_META[outcome].label : ''}?`}
        onSubmit={doConfirm}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon="alert">
              Confirm delivery
            </Button>
          </>
        }
      >
        <div className="app-stack app-stack--sm">
          <Alert tone="warning" title="This raises an exception">
            Confirming will raise a {outcome === 'damaged' ? 'Damage' : 'Shortage'} exception for {job.id} and send it for manager
            approval.
          </Alert>
          <dl className="ds-kv">
            <div>
              <dt>Receiver</dt>
              <dd>{receiverName || '—'}</dd>
            </div>
            <div>
              <dt>Delivered qty</dt>
              <dd>
                {deliveredQty || '0'} of {delivery.expectedQty} {delivery.qtyUnit}
              </dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{damageNotes || '—'}</dd>
            </div>
          </dl>
          {formError && (
            <Alert tone="danger" title="Couldn't confirm delivery" live>
              {formError}
            </Alert>
          )}
        </div>
      </Dialog>
    </Panel>
  )
}

function DeliveredSummary({ job, delivery }: { job: Job; delivery: Delivery }) {
  const { state } = useStore()
  const outcome = delivery.outcome ?? 'complete'
  const shortfall = (delivery.deliveredQty ?? 0) < delivery.expectedQty
  const exception = delivery.exceptionId ? getException(state, delivery.exceptionId) : undefined

  return (
    <Panel title="Delivery confirmation">
      <div className="app-stack">
        <dl className="ds-kv app-kv">
          <div>
            <dt>Outcome</dt>
            <dd>
              <StatusPill meta={DELIVERY_OUTCOME_META[outcome]} />
            </dd>
          </div>
          <div>
            <dt>Receiver</dt>
            <dd>{delivery.receiverName}</dd>
          </div>
          <div>
            <dt>Delivered at</dt>
            <dd>{formatDateTime(delivery.deliveredAt)}</dd>
          </div>
          <div>
            <dt>Quantity delivered</dt>
            <dd className={shortfall ? 'delivery-shortfall' : undefined}>
              {delivery.deliveredQty} of {delivery.expectedQty} {delivery.qtyUnit}
            </dd>
          </div>
          {delivery.affectedItems && (
            <div>
              <dt>Affected items</dt>
              <dd>{delivery.affectedItems}</dd>
            </div>
          )}
        </dl>

        {shortfall && (
          <Alert tone="warning" title="Delivered short">
            {delivery.expectedQty - (delivery.deliveredQty ?? 0)} {delivery.qtyUnit} short of the expected {delivery.expectedQty}{' '}
            {delivery.qtyUnit}.
          </Alert>
        )}

        {delivery.damageNotes && (
          <div>
            <span className="ds-label">{outcome === 'damaged' ? 'Damage notes' : 'Shortage notes'}</span>
            <p className="app-prose">{delivery.damageNotes}</p>
          </div>
        )}

        {delivery.photos.length > 0 && <FileList files={delivery.photos} label="Delivery photos" />}

        {exception && (
          <div className="app-row">
            <span className="ds-label">Linked exception</span>
            <Link to={`/jobs/${job.id}/exceptions?exception=${exception.id}`} className="app-row-link">
              <StatusPill meta={EXCEPTION_STATUS_META[exception.status]}>
                {exception.id} · {EXCEPTION_STATUS_META[exception.status].label}
              </StatusPill>
            </Link>
          </div>
        )}
      </div>
    </Panel>
  )
}

function PodSection({ job, delivery }: { job: Job; delivery: Delivery }) {
  const { actions } = useStore()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()
  const [rejectError, setRejectError] = useState<string>()
  const pod = delivery.pod

  function upload(files: FileRef[]) {
    const result = actions.uploadPod(job.id, files[0])
    setError(result.ok ? undefined : result.error)
  }

  function approve() {
    const result = actions.reviewPod(job.id, true)
    setError(result.ok ? undefined : result.error)
  }

  function reject() {
    if (!reason.trim()) return
    const result = actions.reviewPod(job.id, false, reason)
    if (!result.ok) {
      setRejectError(result.error)
      return
    }
    setError(undefined)
    setRejectError(undefined)
    setRejectOpen(false)
    setReason('')
  }

  function closeReject() {
    setRejectOpen(false)
    setRejectError(undefined)
    setReason('')
  }

  return (
    <Panel
      title="Proof of delivery"
      actions={
        pod?.status === 'pending_review' ? (
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
            <Button variant="primary" icon="check" onClick={approve}>
              Approve POD
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="app-stack">
        {error && (
          <Alert tone="danger" title="Couldn't update proof of delivery" live>
            {error}
          </Alert>
        )}

        {!pod && (
          <>
            <EmptyState icon="upload" title="No proof of delivery yet">
              Upload the signed proof of delivery to move this job toward billing readiness.
            </EmptyState>
            <Field label="Upload signed proof of delivery">
              <FileDrop onUpload={upload} accept="image/*,.pdf" sampleFileName="pod-signed.pdf" />
            </Field>
          </>
        )}

        {pod && (
          <div className="app-stack app-stack--sm">
            <div>
              <StatusPill meta={POD_STATUS_META[pod.status]} />
            </div>
            <FileList files={[pod.file]} label="Proof of delivery" />
            {pod.status === 'rejected' && (
              <>
                <Alert tone="danger" title="POD rejected">
                  {pod.rejectReason}
                </Alert>
                <Field label="Replace with a new proof of delivery">
                  <FileDrop onUpload={upload} accept="image/*,.pdf" sampleFileName="pod-signed-v2.pdf" />
                </Field>
              </>
            )}
            {pod.status === 'approved' && (
              <p className="app-prose">
                Approved {formatDateTime(pod.reviewedAt)}. <Link to={`/jobs/${job.id}/charges`}>See billing readiness</Link>.
              </p>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={rejectOpen}
        onClose={closeReject}
        title="Reject proof of delivery"
        onSubmit={reject}
        footer={
          <>
            <Button variant="ghost" onClick={closeReject}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!reason.trim()}>
              Reject POD
            </Button>
          </>
        }
      >
        {rejectError && (
          <Alert tone="danger" title="Couldn't reject" live>
            {rejectError}
          </Alert>
        )}
        <Field label="Reason" hint="The field team will see this and can re-upload.">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>
    </Panel>
  )
}

export function DeliveryTab({ job }: { job: Job }) {
  const { state } = useStore()
  const delivery = jobDelivery(state, job.id)
  const [justConfirmed, setJustConfirmed] = useState<string>()

  if (!delivery) return <ScheduleDeliveryPanel job={job} />

  if (delivery.status === 'scheduled') {
    return (
      <div className="app-stack app-stack--lg">
        <Panel title="Delivery" actions={<StatusPill meta={DELIVERY_STATUS_META.scheduled} />}>
          <dl className="ds-kv app-kv">
            <div>
              <dt>Scheduled for</dt>
              <dd>{formatDate(delivery.scheduledFor)}</dd>
            </div>
            <div>
              <dt>Consignee</dt>
              <dd>{job.consignee}</dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>{job.destination}</dd>
            </div>
            <div>
              <dt>Expected quantity</dt>
              <dd>
                {delivery.expectedQty} {delivery.qtyUnit}
              </dd>
            </div>
          </dl>
        </Panel>
        <DeliveryConfirmForm job={job} delivery={delivery} onConfirmed={(exceptionId) => setJustConfirmed(exceptionId)} />
      </div>
    )
  }

  return (
    <div className="app-stack app-stack--lg">
      {justConfirmed && (
        <Alert tone="success" title="Delivery confirmed" live>
          An exception was raised for manager approval.{' '}
          <Link to={`/jobs/${job.id}/exceptions?exception=${justConfirmed}`}>View exception {justConfirmed}</Link>.
        </Alert>
      )}
      <DeliveredSummary job={job} delivery={delivery} />
      <PodSection job={job} delivery={delivery} />
    </div>
  )
}
