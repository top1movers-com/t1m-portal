import { useState } from 'react'
import { newId, useStore, type MilestoneTemplate, type TemplateMilestone, type TemplateTask } from '../../data'
import { Alert, Button, Field, Icon, Input, Panel, StatusPill } from '../../ui'

function MilestoneEditor({
  milestone,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
}: {
  milestone: TemplateMilestone
  index: number
  count: number
  onChange: (patch: Partial<TemplateMilestone>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onAddTask: () => void
  onUpdateTask: (taskIndex: number, patch: Partial<TemplateTask>) => void
  onRemoveTask: (taskIndex: number) => void
}) {
  const locked = !!milestone.role

  return (
    <div className="tasks-milestone">
      <div className="tasks-milestone__head">
        <span className="tasks-milestone__order" aria-hidden="true">
          {index + 1}
        </span>
        <Field label="Milestone name" className="tasks-milestone__name">
          <Input value={milestone.name} onChange={(event) => onChange({ name: event.target.value })} />
        </Field>
        <Field label="SLA (days)" className="tasks-milestone__sla">
          <Input
            type="number"
            min={0}
            step={1}
            compact
            value={milestone.slaDays}
            onChange={(event) => onChange({ slaDays: Number(event.target.value) })}
          />
        </Field>
        <Field label="Evidence required" group className="tasks-milestone__switch">
          <label className="ds-switch">
            <input
              type="checkbox"
              checked={milestone.evidenceRequired}
              onChange={(event) => onChange({ evidenceRequired: event.target.checked })}
            />
            <span className="ds-switch__track" />
          </label>
        </Field>
        <div className="app-row app-row--tight tasks-milestone__actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="arrow-up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            Move milestone up
          </Button>
          <Button variant="ghost" size="sm" iconOnly icon="arrow-down" disabled={index === count - 1} onClick={() => onMove(1)}>
            Move milestone down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="trash"
            disabled={locked}
            onClick={onRemove}
          >
            Remove milestone
          </Button>
        </div>
      </div>

      {locked && (
        <p className="tasks-milestone__note">
          <Icon name="info" />
          System-linked: completed automatically by the {milestone.role === 'delivery' ? 'Delivery' : 'Proof of delivery'} module.
          Cannot be removed.
        </p>
      )}

      <div className="tasks-tasks">
        <span className="ds-label">Default tasks</span>
        {milestone.defaultTasks.length === 0 && <p className="ds-muted tasks-note">No default tasks yet.</p>}
        {milestone.defaultTasks.map((task, i) => (
          <div className="tasks-task-row" key={i}>
            <Input
              className="tasks-task-row__title"
              value={task.title}
              onChange={(event) => onUpdateTask(i, { title: event.target.value })}
              aria-label={`Task ${i + 1} title`}
            />
            <label className="ds-switch">
              <input
                type="checkbox"
                checked={task.evidenceRequired}
                onChange={(event) => onUpdateTask(i, { evidenceRequired: event.target.checked })}
              />
              <span className="ds-switch__track" />
              Evidence
            </label>
            <Button variant="ghost" size="sm" iconOnly icon="trash" onClick={() => onRemoveTask(i)}>
              Remove task {i + 1}
            </Button>
          </div>
        ))}
        <div>
          <Button variant="ghost" size="sm" icon="plus" onClick={onAddTask}>
            Add default task
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TemplateEditor({ template }: { template: MilestoneTemplate }) {
  const { actions } = useStore()
  const [draft, setDraft] = useState<MilestoneTemplate>(() => structuredClone(template))
  const [source, setSource] = useState(template)
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  if (template !== source) {
    setSource(template)
    setDraft(structuredClone(template))
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(template)

  function updateMilestone(id: string, patch: Partial<TemplateMilestone>) {
    setDraft((d) => ({ ...d, milestones: d.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }

  function moveMilestone(id: string, dir: -1 | 1) {
    setDraft((d) => {
      const idx = d.milestones.findIndex((m) => m.id === id)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= d.milestones.length) return d
      const next = [...d.milestones]
      const [moved] = next.splice(idx, 1)
      next.splice(target, 0, moved)
      return { ...d, milestones: next }
    })
  }

  function removeMilestone(id: string) {
    setDraft((d) => ({ ...d, milestones: d.milestones.filter((m) => m.id !== id) }))
  }

  function addMilestone() {
    setDraft((d) => ({
      ...d,
      milestones: [
        ...d.milestones,
        { id: newId('ms'), name: 'New milestone', slaDays: 1, evidenceRequired: false, defaultTasks: [] },
      ],
    }))
  }

  function updateTask(milestoneId: string, index: number, patch: Partial<TemplateTask>) {
    setDraft((d) => ({
      ...d,
      milestones: d.milestones.map((m) =>
        m.id === milestoneId ? { ...m, defaultTasks: m.defaultTasks.map((t, i) => (i === index ? { ...t, ...patch } : t)) } : m,
      ),
    }))
  }

  function addTask(milestoneId: string) {
    setDraft((d) => ({
      ...d,
      milestones: d.milestones.map((m) =>
        m.id === milestoneId ? { ...m, defaultTasks: [...m.defaultTasks, { title: 'New task', evidenceRequired: false }] } : m,
      ),
    }))
  }

  function removeTask(milestoneId: string, index: number) {
    setDraft((d) => ({
      ...d,
      milestones: d.milestones.map((m) =>
        m.id === milestoneId ? { ...m, defaultTasks: m.defaultTasks.filter((_, i) => i !== index) } : m,
      ),
    }))
  }

  function discard() {
    setDraft(structuredClone(template))
    setError(undefined)
  }

  function save() {
    setSaving(true)
    const result = actions.updateMilestoneTemplate(draft)
    setSaving(false)
    if (!result.ok) setError(result.error)
    else setError(undefined)
  }

  return (
    <Panel
      title={draft.name}
      actions={
        <div className="app-row">
          {dirty && (
            <StatusPill tone="warning" icon="alert">
              Unsaved changes
            </StatusPill>
          )}
          <Button variant="ghost" onClick={discard} disabled={!dirty}>
            Discard changes
          </Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={!dirty}>
            Save template
          </Button>
        </div>
      }
    >
      <div className="app-stack">
        <Alert tone="info" title="Applies to new jobs">
          Changes here apply to jobs created from now on. Jobs already in progress keep their existing milestones.
        </Alert>
        {error && (
          <Alert tone="danger" title="Couldn't save template" live>
            {error}
          </Alert>
        )}
        <Field label="Template name">
          <Input value={draft.name} onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))} />
        </Field>

        <div className="tasks-milestones">
          {draft.milestones.map((milestone, index) => (
            <MilestoneEditor
              key={milestone.id}
              milestone={milestone}
              index={index}
              count={draft.milestones.length}
              onChange={(patch) => updateMilestone(milestone.id, patch)}
              onMove={(dir) => moveMilestone(milestone.id, dir)}
              onRemove={() => removeMilestone(milestone.id)}
              onAddTask={() => addTask(milestone.id)}
              onUpdateTask={(taskIndex, patch) => updateTask(milestone.id, taskIndex, patch)}
              onRemoveTask={(taskIndex) => removeTask(milestone.id, taskIndex)}
            />
          ))}
        </div>

        <div>
          <Button variant="secondary" icon="plus" onClick={addMilestone}>
            Add milestone
          </Button>
        </div>
      </div>
    </Panel>
  )
}
