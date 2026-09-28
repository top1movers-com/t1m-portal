import { useState } from 'react'
import {
  CHARGE_CATEGORIES,
  useStore,
  type Charge,
  type ChargeCategory,
  type ChargeKind,
  type FileRef,
  type Job,
} from '../../data'
import { Alert, Button, ChoiceGroup, Drawer, Field, FileDrop, FileList, Input, Select } from '../../ui'

const CATEGORY_OPTIONS = CHARGE_CATEGORIES.map((c) => ({ value: c, label: c }))

export function ChargeDrawer({
  job,
  charge,
  open,
  onClose,
}: {
  job: Job
  charge: Charge | null
  open: boolean
  onClose: () => void
}) {
  const { actions } = useStore()
  const [kind, setKind] = useState<ChargeKind>(charge?.kind ?? 'charge')
  const [category, setCategory] = useState<ChargeCategory>(charge?.category ?? CHARGE_CATEGORIES[0])
  const [description, setDescription] = useState(charge?.description ?? '')
  const [amount, setAmount] = useState(charge ? String(charge.amountPHP) : '')
  const [evidence, setEvidence] = useState<FileRef[]>(charge?.evidence ?? [])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function reset() {
    setKind('charge')
    setCategory(CHARGE_CATEGORIES[0])
    setDescription('')
    setAmount('')
    setEvidence([])
    setError(null)
    setSaving(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit() {
    setError(null)
    const amountPHP = Number(amount)
    setSaving(true)
    const result = charge
      ? actions.updateCharge(charge.id, { kind, category, description, amountPHP })
      : actions.addCharge({ jobId: job.id, kind, category, description, amountPHP, evidence })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    handleClose()
  }

  function handleUpload(files: FileRef[]) {
    if (charge) {
      const added: FileRef[] = []
      for (const file of files) {
        const result = actions.attachChargeEvidence(charge.id, file)
        if (!result.ok) {
          setError(result.error)
          break
        }
        added.push(file)
      }
      if (added.length > 0) setEvidence((list) => [...list, ...added])
    } else {
      setEvidence((list) => [...list, ...files])
    }
  }

  function handleRemoveEvidence(fileId: string) {
    if (charge) {
      const result = actions.removeChargeEvidence(charge.id, fileId)
      if (!result.ok) {
        setError(result.error)
        return
      }
    }
    setEvidence((list) => list.filter((f) => f.id !== fileId))
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      eyebrow={charge ? (charge.kind === 'charge' ? 'Charge' : 'Expense') : 'New line'}
      title={charge ? charge.description : 'Add charge or expense'}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {charge ? 'Save changes' : 'Add line'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert tone="danger" title="Couldn't save" live>
          {error}
        </Alert>
      )}
      <Field label="Kind" group>
        <ChoiceGroup
          label="Kind"
          value={kind}
          onChange={setKind}
          options={[
            {
              value: 'charge',
              title: 'Charge',
              description: 'Billable to the customer',
              icon: 'receipt',
            },
            {
              value: 'expense',
              title: 'Expense',
              description: 'A cost Top1Movers paid',
              icon: 'box',
            },
          ]}
        />
      </Field>
      <Field label="Category">
        <Select
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as ChargeCategory)}
        />
      </Field>
      <Field label="Description">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Trucking to Cebu warehouse" />
      </Field>
      <Field label="Amount">
        <Input
          affixStart="PHP"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Supporting evidence" optional hint="Receipts, invoices, or other proof for this line.">
        <FileDrop compact multiple onUpload={handleUpload} sampleFileName={`${kind === 'charge' ? 'invoice' : 'receipt'}.pdf`} />
      </Field>
      <FileList files={evidence} onRemove={handleRemoveEvidence} label="Attached evidence" />
    </Drawer>
  )
}
