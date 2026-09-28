import { useEffect, useRef, useState } from 'react'
import { getMilestone, useStore, type FileRef } from '../../data'
import { Alert, Button, Dialog, Field, FileDrop, FileList, Textarea } from '../../ui'

export interface CompleteTaskDialogProps {
  taskId: string | null
  onClose: () => void
}

/** Reusable "Complete task" dialog: evidence, completion note, evidence-required gating. */
export function CompleteTaskDialog({ taskId, onClose }: CompleteTaskDialogProps) {
  const { state, actions } = useStore()
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : undefined
  const milestone = task ? getMilestone(state, task.milestoneId) : undefined

  const [files, setFiles] = useState<FileRef[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const timerRef = useRef<number | undefined>(undefined)

  const [resetFor, setResetFor] = useState(task?.id)
  if (task?.id !== resetFor) {
    setResetFor(task?.id)
    setFiles([])
    setNote('')
    setLoading(false)
    setError(undefined)
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function handleSubmit() {
    if (!task) return
    setLoading(true)
    timerRef.current = window.setTimeout(() => {
      const result = actions.completeTask(task.id, files, note)
      setLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onClose()
    }, 400)
  }

  const evidenceCount = (task?.evidence.length ?? 0) + files.length
  const needsEvidence = !!task && task.evidenceRequired && evidenceCount === 0

  return (
    <Dialog
      open={!!task}
      onClose={onClose}
      title="Complete task"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={needsEvidence}>
            Complete task
          </Button>
        </>
      }
    >
      {task && (
        <div className="app-stack">
          <p className="ds-muted tasks-note">
            {task.title} · {milestone?.name ?? 'this milestone'}
          </p>
          <Field
            label="Evidence"
            optional={!task.evidenceRequired}
            hint={
              task.evidenceRequired
                ? 'This task requires at least one file before it can be completed.'
                : 'Attach supporting files if useful.'
            }
          >
            <FileDrop
              multiple
              onUpload={(uploaded) => setFiles((prev) => [...prev, ...uploaded])}
              sampleFileName={`evidence-${task.id}.pdf`}
            />
          </Field>
          <FileList files={files} onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))} label="Attached evidence" />
          <Field label="Completion note" optional>
            <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What was done" />
          </Field>
          {error && (
            <Alert tone="danger" title="Couldn't complete task" live>
              {error}
            </Alert>
          )}
        </div>
      )}
    </Dialog>
  )
}
