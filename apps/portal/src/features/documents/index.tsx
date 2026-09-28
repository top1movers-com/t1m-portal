import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  docFlags,
  formatDate,
  getDocument,
  jobDocuments,
  newId,
  plural,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  useStore,
  userName,
  type DocRequirement,
  type DocumentRecord,
  type Job,
  type ServiceType,
} from '../../data'
import { Alert, Button, DOC_STATUS_META, EmptyState, Field, Icon, Input, PageHead, Panel, StatusPill } from '../../ui'
import { DocumentDrawer } from './DocumentDrawer'
import { UploadDrawer } from './UploadDrawer'
import './documents.css'

const RANK: Record<DocumentRecord['status'], number> = { rejected: 0, missing: 0, pending_review: 1, approved: 2 }
const ACTION_LABEL: Record<DocumentRecord['status'], string> = {
  missing: 'Upload',
  rejected: 'Replace',
  pending_review: 'Review',
  approved: 'View',
}
const ACTION_ICON: Record<DocumentRecord['status'], 'upload' | 'clock' | 'search'> = {
  missing: 'upload',
  rejected: 'upload',
  pending_review: 'clock',
  approved: 'search',
}

function docMeta(state: ReturnType<typeof useStore>['state'], doc: DocumentRecord): string {
  const current = doc.versions[doc.versions.length - 1]
  if (doc.status === 'missing') return doc.required ? 'Required · not yet uploaded' : 'Optional · not yet uploaded'
  if (doc.status === 'rejected' && current) return `Rejected: ${current.rejectReason ?? 'No reason given'}`
  if (current) return `v${current.version} · uploaded ${formatDate(current.file.uploadedAt)} by ${userName(state, current.file.uploadedBy)}`
  return doc.required ? 'Required' : 'Optional'
}

export function DocumentsTab({ job }: { job: Job }) {
  const { state } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'action'>('all')
  const [uploadDoc, setUploadDoc] = useState<DocumentRecord | undefined>()

  const flags = docFlags(state, job.id)
  const docs = [...jobDocuments(state, job.id)].sort((a, b) => RANK[a.status] - RANK[b.status])
  const filtered = filter === 'action' ? docs.filter((d) => d.status === 'missing' || d.status === 'rejected') : docs

  const docId = searchParams.get('doc')
  const selectedDoc = docId ? getDocument(state, docId) : undefined

  function openDoc(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('doc', id)
    setSearchParams(next, { replace: true })
  }
  function closeDoc() {
    const next = new URLSearchParams(searchParams)
    next.delete('doc')
    setSearchParams(next, { replace: true })
  }

  function rowAction(doc: DocumentRecord) {
    if (doc.status === 'missing' || doc.status === 'rejected') setUploadDoc(doc)
    else openDoc(doc.id)
  }

  const issues = flags.missing + flags.rejected
  const needsAction = docs.filter((d) => d.status === 'missing' || d.status === 'rejected').length

  return (
    <div className="app-stack">
      {issues > 0 && (
        <Alert tone={flags.rejected > 0 ? 'danger' : 'warning'} title="Documents need action">
          {[flags.missing && plural(flags.missing, 'required document') + ' missing', flags.rejected && plural(flags.rejected, 'document') + ' rejected']
            .filter(Boolean)
            .join(', ')}
          . Upload or replace them before billing.
        </Alert>
      )}

      <div className="ds-stats">
        <div className="ds-stat">
          <span className="ds-label">Approved</span>
          <div className="ds-stat__value">{flags.approved}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Pending review</span>
          <div className="ds-stat__value">{flags.pending}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Missing</span>
          <div className={flags.missing ? 'ds-stat__value ds-stat__value--danger' : 'ds-stat__value'}>{flags.missing}</div>
        </div>
        <div className="ds-stat">
          <span className="ds-label">Rejected</span>
          <div className={flags.rejected ? 'ds-stat__value ds-stat__value--danger' : 'ds-stat__value'}>{flags.rejected}</div>
        </div>
      </div>

      <Panel
        title="Document checklist"
        flush
        actions={
          <fieldset className="ds-seg" aria-label="Filter documents">
            <label>
              <input type="radio" name="doc-filter" value="all" checked={filter === 'all'} onChange={() => setFilter('all')} />
              All
            </label>
            <label>
              <input type="radio" name="doc-filter" value="action" checked={filter === 'action'} onChange={() => setFilter('action')} />
              Needs action{needsAction > 0 ? ` (${needsAction})` : ''}
            </label>
          </fieldset>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon="check" title="Nothing needs action">
            Every document on this checklist has been uploaded and reviewed.
          </EmptyState>
        ) : (
          filtered.map((doc) => (
            <div className="ds-doc" key={doc.id}>
              <span className="ds-doc__icon">
                <Icon name="file" />
              </span>
              {doc.status === 'missing' ? (
                <div>
                  <div className="ds-doc__name">
                    {doc.docType}
                    {!doc.required && <span className="ds-opt">optional</span>}
                  </div>
                  <div className="ds-doc__meta">{docMeta(state, doc)}</div>
                </div>
              ) : (
                <button type="button" className="docs-namebtn" onClick={() => openDoc(doc.id)}>
                  <div className="ds-doc__name">
                    {doc.docType}
                    {!doc.required && <span className="ds-opt">optional</span>}
                  </div>
                  <div className="ds-doc__meta">{docMeta(state, doc)}</div>
                </button>
              )}
              <StatusPill meta={DOC_STATUS_META[doc.status]} />
              <Button variant={doc.status === 'missing' || doc.status === 'rejected' ? 'secondary' : 'ghost'} size="sm" icon={ACTION_ICON[doc.status]} onClick={() => rowAction(doc)}>
                {ACTION_LABEL[doc.status]}
              </Button>
            </div>
          ))
        )}
      </Panel>

      <DocumentDrawer key={selectedDoc?.id ?? 'none'} doc={selectedDoc} onClose={closeDoc} onReplace={(doc) => { closeDoc(); setUploadDoc(doc) }} />
      <UploadDrawer key={uploadDoc?.id ?? 'none'} doc={uploadDoc} onClose={() => setUploadDoc(undefined)} />
    </div>
  )
}

function emptyRequirement(serviceType: ServiceType): DocRequirement {
  return { id: newId('req'), serviceType, docType: '', required: true, description: '' }
}

export function DocumentChecklistsPage() {
  const { state, actions } = useStore()
  const [serviceType, setServiceType] = useState<ServiceType>(SERVICE_TYPES[0])
  const [draftSource, setDraftSource] = useState(state.docRequirements)
  const [draft, setDraft] = useState<DocRequirement[]>(() => state.docRequirements.filter((r) => r.serviceType === serviceType))
  const [error, setError] = useState<string | undefined>()
  const [saved, setSaved] = useState(false)

  if (state.docRequirements !== draftSource) {
    setDraftSource(state.docRequirements)
    setDraft(state.docRequirements.filter((r) => r.serviceType === serviceType))
    setError(undefined)
    setSaved(false)
  }

  const original = state.docRequirements.filter((r) => r.serviceType === serviceType)
  const dirty = JSON.stringify(draft) !== JSON.stringify(original)

  function selectType(type: ServiceType) {
    setServiceType(type)
    setDraft(state.docRequirements.filter((r) => r.serviceType === type))
    setError(undefined)
    setSaved(false)
  }

  function update(id: string, patch: Partial<DocRequirement>) {
    setDraft((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setSaved(false)
  }

  function addRow() {
    setDraft((rows) => [...rows, emptyRequirement(serviceType)])
    setSaved(false)
  }

  function removeRow(id: string) {
    setDraft((rows) => rows.filter((r) => r.id !== id))
    setSaved(false)
  }

  function discard() {
    setDraft(original)
    setError(undefined)
    setSaved(false)
  }

  function save() {
    const result = actions.updateDocRequirements(serviceType, draft)
    if (result.ok) {
      setError(undefined)
      setSaved(true)
    } else {
      setError(result.error)
      setSaved(false)
    }
  }

  return (
    <div className="app-stack app-stack--lg">
      <PageHead
        title="Document checklists"
        crumbs={[{ label: 'Settings' }, { label: 'Document checklists' }]}
        meta="Choose a service type, then set which documents new jobs must collect."
      />
      <fieldset className="ds-seg" aria-label="Service type">
        {SERVICE_TYPES.map((type) => (
          <label key={type}>
            <input
              type="radio"
              name="checklist-service-type"
              value={type}
              checked={serviceType === type}
              onChange={() => selectType(type)}
            />
            {SERVICE_TYPE_LABELS[type]}
          </label>
        ))}
      </fieldset>

      {error && (
        <Alert tone="danger" title="Couldn't save the checklist" live>
          {error}
        </Alert>
      )}
      {saved && !dirty && (
        <Alert tone="success" title="Checklist saved" live>
          Changes apply to new {SERVICE_TYPE_LABELS[serviceType]} jobs. Existing open jobs of this service type were updated too; jobs already
          with Finance keep their original checklist.
        </Alert>
      )}

      <Panel
        title="Required documents"
        actions={
          <Button variant="secondary" size="sm" icon="plus" onClick={addRow}>
            Add requirement
          </Button>
        }
      >
        {draft.length === 0 ? (
          <EmptyState icon="file" title="No requirements yet">
            Add the documents this service type must collect.
          </EmptyState>
        ) : (
          <div className="app-stack">
            {draft.map((req, i) => (
              <div className="app-row app-nowrap docs-reqrow" key={req.id}>
                <Field label="Document type" className="app-grow" id={`doctype-${req.id}`}>
                  <Input value={req.docType} onChange={(e) => update(req.id, { docType: e.target.value })} placeholder="e.g. Bill of Lading" />
                </Field>
                <Field label="Description" className="app-grow" id={`docdesc-${req.id}`}>
                  <Input value={req.description} onChange={(e) => update(req.id, { description: e.target.value })} placeholder="What it proves" />
                </Field>
                <Field label="Required" group>
                  <label className="ds-switch">
                    <input
                      type="checkbox"
                      checked={req.required}
                      onChange={(e) => update(req.id, { required: e.target.checked })}
                      aria-label={`${req.docType || 'This document'} is required`}
                    />
                    <span className="ds-switch__track" />
                  </label>
                </Field>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  iconOnly
                  className="docs-reqrow__remove"
                  onClick={() => removeRow(req.id)}
                  title={`Remove ${req.docType || 'requirement'}`}
                >
                  Remove {req.docType || 'requirement'}
                </Button>
                <span className="ds-vh">Row {i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="app-row app-row--end">
        {dirty && (
          <Button variant="ghost" onClick={discard}>
            Discard changes
          </Button>
        )}
        <Button variant="primary" icon="check" onClick={save} disabled={!dirty}>
          Save checklist
        </Button>
      </div>
      {dirty && <p className="ds-muted">Unsaved changes. Changes apply to new jobs (and open jobs of this service type) once saved.</p>}
    </div>
  )
}
