import { useState } from 'react'
import {
  DEMO_TODAY,
  getException,
  jobMilestones,
  USERS,
  useStore,
  type ExceptionCategory,
  type Job,
} from '../../data'
import { Alert, Button, Drawer, Field, Input, Select } from '../../ui'

const TITLE_SUGGESTIONS: Record<ExceptionCategory, string> = {
  Damage: 'Arrange re-delivery of damaged cartons',
  Delay: 'Coordinate a revised delivery schedule',
  Documentation: 'Obtain corrected documentation',
  Shortage: 'Investigate and replace missing items',
  'Customs hold': 'Follow up with the customs broker',
  Other: 'Resolve the exception',
}

export interface CorrectiveTaskDrawerProps {
  job: Job
  exceptionId: string
  defaultMilestoneId?: string
  open: boolean
  onClose: () => void
  onCreated?: (taskId: string) => void
}

interface FormErrors {
  title?: string
  owner?: string
  dueDate?: string
  milestone?: string
}

/**
 * Mounted only while the caller wants it open (see ExceptionsTab / ApprovalsPage), so a fresh
 * mount is enough to reset the form each time — no effect needed.
 */
export function CorrectiveTaskDrawer({ job, exceptionId, defaultMilestoneId, open, onClose, onCreated }: CorrectiveTaskDrawerProps) {
  const { state, actions } = useStore()
  const exception = getException(state, exceptionId)
  const milestones = jobMilestones(state, job.id)

  const [title, setTitle] = useState(() => (exception ? TITLE_SUGGESTIONS[exception.category] : ''))
  const [ownerId, setOwnerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [milestoneId, setMilestoneId] = useState(defaultMilestoneId ?? exception?.stageMilestoneId ?? '')
  const [evidenceRequired, setEvidenceRequired] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string>()

  if (!exception) return null

  function handleSubmit() {
    const nextErrors: FormErrors = {}
    if (!title.trim()) nextErrors.title = 'Give the task a title.'
    if (!ownerId) nextErrors.owner = 'Choose an owner.'
    if (!dueDate) nextErrors.dueDate = 'Choose a due date.'
    else if (dueDate < DEMO_TODAY) nextErrors.dueDate = 'The due date cannot be before today.'
    if (!milestoneId) nextErrors.milestone = 'Choose the milestone this task belongs to.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = actions.createCorrectiveTask(exceptionId, {
      title,
      ownerId,
      dueDate,
      milestoneId,
      evidenceRequired,
    })
    if (!result.ok) {
      setSubmitError(result.error)
      return
    }
    onCreated?.(result.value)
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Corrective task"
      title={`For ${exceptionId}`}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create task
          </Button>
        </>
      }
    >
      <div className="app-stack">
        {submitError && (
          <Alert tone="danger" title="Could not create this task" live>
            {submitError}
          </Alert>
        )}
        <Field label="Title" id="corr-title" error={errors.title}>
          <Input id="corr-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Owner" id="corr-owner" error={errors.owner}>
          <Select
            id="corr-owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Choose an owner"
            options={USERS.map((u) => ({ value: u.id, label: u.name }))}
          />
        </Field>
        <Field label="Due date" id="corr-due" error={errors.dueDate}>
          <Input id="corr-due" type="date" min={DEMO_TODAY} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Milestone" id="corr-milestone" error={errors.milestone}>
          <Select
            id="corr-milestone"
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            options={milestones.map((m) => ({ value: m.id, label: m.name }))}
          />
        </Field>
        <label className="ds-switch">
          <input
            type="checkbox"
            role="switch"
            checked={evidenceRequired}
            onChange={(e) => setEvidenceRequired(e.target.checked)}
          />
          <span className="ds-switch__track" />
          Evidence required to complete this task
        </label>
      </div>
    </Drawer>
  )
}
