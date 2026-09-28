import { useState } from 'react'
import { Button, Dialog, Field, Textarea } from '../../ui'

const QUICK_REASONS = [
  'Illegible scan',
  'Amounts do not match packing list',
  'Wrong document type',
  'Missing signature/stamp',
]

export function RejectDialog({
  open,
  onClose,
  onSubmit,
  docType,
}: {
  open: boolean
  onClose: () => void
  /** Returns an error message to show inline, or undefined on success. */
  onSubmit: (reason: string) => string | undefined
  docType: string
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | undefined>()

  function handleClose() {
    setReason('')
    setError(undefined)
    onClose()
  }

  function submit() {
    if (!reason.trim()) {
      setError('Give a reason so the uploader knows what to fix.')
      return
    }
    const result = onSubmit(reason)
    if (result) {
      setError(result)
      return
    }
    setReason('')
    setError(undefined)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Reject ${docType}`}
      onSubmit={submit}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" icon="x" type="submit">
            Reject document
          </Button>
        </>
      }
    >
      <div className="app-stack">
        <div className="app-row app-row--tight">
          {QUICK_REASONS.map((r) => (
            <Button key={r} variant="secondary" size="sm" onClick={() => setReason(r)}>
              {r}
            </Button>
          ))}
        </div>
        <Field label="Reason for rejection" error={error} hint="The uploader sees this reason.">
          <Textarea
            rows={4}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              if (error) setError(undefined)
            }}
          />
        </Field>
      </div>
    </Dialog>
  )
}
