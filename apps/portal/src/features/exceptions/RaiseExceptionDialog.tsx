import { useState } from 'react'
import {
  currentMilestone,
  EXCEPTION_CATEGORIES,
  jobMilestones,
  useStore,
  type ExceptionCategory,
  type FileRef,
  type Job,
  type Severity,
} from '../../data'
import {
  Alert,
  Button,
  type Choice,
  ChoiceGroup,
  Dialog,
  Field,
  FileDrop,
  FileList,
  Input,
  SEVERITY_META,
  Select,
  Textarea,
} from '../../ui'

const EVIDENCE_REQUIRED_CATEGORIES: ExceptionCategory[] = ['Damage', 'Shortage']

const SEVERITY_CHOICES: Choice<Severity>[] = [
  { value: 'low', title: SEVERITY_META.low.label, icon: SEVERITY_META.low.icon },
  { value: 'medium', title: SEVERITY_META.medium.label, icon: SEVERITY_META.medium.icon, tone: 'warning' },
  { value: 'high', title: SEVERITY_META.high.label, icon: SEVERITY_META.high.icon, tone: 'danger' },
]

export interface RaiseExceptionDialogProps {
  job: Job
  open: boolean
  onClose: () => void
  defaultStageId?: string
  defaultCategory?: ExceptionCategory
  onRaised: (exceptionId: string) => void
}

interface FormErrors {
  reason?: string
  impact?: string
  evidence?: string
}

export function RaiseExceptionDialog({ job, open, onClose, defaultStageId, defaultCategory, onRaised }: RaiseExceptionDialogProps) {
  const { state, actions } = useStore()
  const milestones = jobMilestones(state, job.id)

  const [stageId, setStageId] = useState('')
  const [category, setCategory] = useState<ExceptionCategory>('Damage')
  const [reason, setReason] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [costPHP, setCostPHP] = useState('')
  const [delayDays, setDelayDays] = useState('')
  const [impactDescription, setImpactDescription] = useState('')
  const [evidence, setEvidence] = useState<FileRef[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string>()

  /* Resets the form to fresh defaults each time the dialog transitions to open. Adjusting
     state during render (rather than in an effect) avoids a stale-then-fresh double render;
     the dialog stays mounted across open/close so its close animation plays. */
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStageId(defaultStageId ?? currentMilestone(state, job.id)?.id ?? jobMilestones(state, job.id)[0]?.id ?? '')
      setCategory(defaultCategory ?? 'Damage')
      setReason('')
      setSeverity('medium')
      setCostPHP('')
      setDelayDays('')
      setImpactDescription('')
      setEvidence([])
      setErrors({})
      setSubmitError(undefined)
    }
  }

  const evidenceRequired = EVIDENCE_REQUIRED_CATEGORIES.includes(category)

  function handleSubmit() {
    const nextErrors: FormErrors = {}
    if (!reason.trim()) nextErrors.reason = 'Describe what happened.'
    if (!impactDescription.trim()) nextErrors.impact = 'Describe the impact on the shipment.'
    if (evidenceRequired && evidence.length === 0)
      nextErrors.evidence = `Attach at least one file as evidence for a ${category.toLowerCase()} exception.`
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = actions.raiseException({
      jobId: job.id,
      stageMilestoneId: stageId,
      category,
      reason,
      impact: {
        severity,
        costPHP: costPHP ? Number(costPHP) : undefined,
        delayDays: delayDays ? Number(delayDays) : undefined,
        description: impactDescription,
      },
      evidence,
    })
    if (!result.ok) {
      setSubmitError(result.error)
      return
    }
    onRaised(result.value)
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg" title="Raise an exception" onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Raise exception
          </Button>
        </>
      }
    >
      <div className="app-stack">
        {submitError && <Alert tone="danger" title="Could not raise this exception" live>{submitError}</Alert>}
        <Field label="Stage" id="exc-stage">
          <Select
            id="exc-stage"
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            options={milestones.map((m) => ({ value: m.id, label: m.name }))}
          />
        </Field>
        <Field label="Category" id="exc-category">
          <Select
            id="exc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExceptionCategory)}
            options={EXCEPTION_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field label="Reason" id="exc-reason" error={errors.reason} hint="What happened.">
          <Textarea id="exc-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </Field>
        <Field label="Severity" id="exc-severity" group>
          <ChoiceGroup label="Severity" value={severity} onChange={setSeverity} options={SEVERITY_CHOICES} />
        </Field>
        <div className="app-row">
          <Field label="Cost impact" id="exc-cost" optional className="app-grow">
            <Input
              id="exc-cost"
              type="number"
              min={0}
              step={0.01}
              affixStart="PHP"
              value={costPHP}
              onChange={(e) => setCostPHP(e.target.value)}
            />
          </Field>
          <Field label="Delay" id="exc-delay" optional className="app-grow">
            <Input
              id="exc-delay"
              type="number"
              min={0}
              step={1}
              affixEnd="days"
              value={delayDays}
              onChange={(e) => setDelayDays(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Impact description" id="exc-impact" error={errors.impact} hint="Effect on the shipment, e.g. delayed customs release by 3 days.">
          <Textarea id="exc-impact" value={impactDescription} onChange={(e) => setImpactDescription(e.target.value)} rows={2} />
        </Field>
        <Field
          label="Evidence"
          id="exc-evidence"
          error={errors.evidence}
          optional={!evidenceRequired}
          hint={!evidenceRequired ? 'Photos, forms, or other supporting files.' : undefined}
        >
          <FileDrop id="exc-evidence" multiple onUpload={(files) => setEvidence((list) => [...list, ...files])} invalid={!!errors.evidence} />
          <FileList files={evidence} onRemove={(id) => setEvidence((list) => list.filter((f) => f.id !== id))} label="Evidence" />
        </Field>
      </div>
    </Dialog>
  )
}
