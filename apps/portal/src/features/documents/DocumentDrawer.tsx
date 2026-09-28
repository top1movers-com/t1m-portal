import { useState } from 'react'
import {
  currentVersion,
  formatBytes,
  formatDate,
  formatDateTime,
  useStore,
  userName,
  type DemoState,
  type DocumentRecord,
  type DocVersion,
} from '../../data'
import { Alert, Button, DOC_STATUS_META, Drawer, Icon, StatusPill, Timeline, type TimelineItem, type TimelineState } from '../../ui'
import { RejectDialog } from './RejectDialog'

const VERSION_STATE: Record<DocVersion['status'], TimelineState> = {
  approved: 'done',
  rejected: 'rejected',
  pending_review: 'current',
}

function versionTitle(v: DocVersion, isCurrent: boolean) {
  const label =
    v.status === 'approved'
      ? 'Approved'
      : v.status === 'rejected'
        ? `Rejected: ${v.rejectReason ?? 'No reason given'}`
        : 'Awaiting review'
  return `v${v.version} · ${label}${isCurrent ? ' (current)' : ''}`
}

function versionMeta(state: DemoState, v: DocVersion) {
  const uploaded = `Uploaded ${formatDate(v.file.uploadedAt)} by ${userName(state, v.file.uploadedBy)}`
  if (v.status === 'approved' && v.reviewedBy) return `${uploaded} · approved ${formatDate(v.reviewedAt)} by ${userName(state, v.reviewedBy)}`
  if (v.status === 'rejected' && v.reviewedBy) return `${uploaded} · rejected ${formatDate(v.reviewedAt)} by ${userName(state, v.reviewedBy)}`
  return uploaded
}

export function DocumentDrawer({
  doc,
  onClose,
  onReplace,
}: {
  doc: DocumentRecord | undefined
  onClose: () => void
  onReplace: (doc: DocumentRecord) => void
}) {
  const { state, actions } = useStore()
  const [error, setError] = useState<string | undefined>()
  const [rejectOpen, setRejectOpen] = useState(false)

  const open = !!doc
  const current = doc ? currentVersion(doc) : undefined
  const items: TimelineItem[] = doc
    ? [...doc.versions]
        .reverse()
        .map((v) => ({
          id: `v${v.version}`,
          state: VERSION_STATE[v.status],
          title: versionTitle(v, v.version === doc.versions.length),
          meta: versionMeta(state, v),
        }))
    : []

  function approve() {
    if (!doc) return
    const result = actions.approveDocument(doc.id)
    if (!result.ok) setError(result.error)
  }

  function reject(reason: string): string | undefined {
    if (!doc) return 'Document not found.'
    const result = actions.rejectDocument(doc.id, reason)
    if (result.ok) {
      setRejectOpen(false)
      setError(undefined)
      return undefined
    }
    return result.error
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        eyebrow="Document"
        title={doc?.docType ?? ''}
        footer={
          doc?.status === 'pending_review' ? (
            <>
              <Button variant="secondary" icon="x" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
              <Button variant="primary" icon="check" onClick={approve}>
                Approve
              </Button>
            </>
          ) : undefined
        }
      >
        {doc && (
          <div className="app-stack">
            {error && (
              <Alert tone="danger" title="Couldn't complete that" live>
                {error}
              </Alert>
            )}

            <div className="docs-preview">
              <Icon name="file" />
              {current ? (
                <>
                  <strong>{current.file.name}</strong>
                  <span>{formatBytes(current.file.size)} · Preview not available in mockup</span>
                </>
              ) : (
                <span>Required · not yet uploaded</span>
              )}
            </div>

            <dl className="ds-kv">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusPill meta={DOC_STATUS_META[doc.status]} />
                </dd>
              </div>
              <div>
                <dt>Requirement</dt>
                <dd>{doc.required ? 'Required' : 'Optional'}</dd>
              </div>
              <div>
                <dt>Current version</dt>
                <dd>{current ? `v${current.version}` : '—'}</dd>
              </div>
              <div>
                <dt>Uploaded</dt>
                <dd>{current ? formatDateTime(current.file.uploadedAt) : '—'}</dd>
              </div>
            </dl>

            {items.length > 0 && <Timeline items={items} label="Version history" compact />}

            {doc.status === 'rejected' && current && (
              <Button variant="secondary" icon="upload" onClick={() => onReplace(doc)}>
                Replace this document
              </Button>
            )}
          </div>
        )}
      </Drawer>
      {doc && <RejectDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={reject} docType={doc.docType} />}
    </>
  )
}
