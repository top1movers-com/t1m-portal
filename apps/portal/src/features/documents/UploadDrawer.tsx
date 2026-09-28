import { useState } from 'react'
import { currentVersion, useStore, type DocumentRecord, type FileRef } from '../../data'
import { Alert, Drawer, FileDrop } from '../../ui'

export function UploadDrawer({ doc, onClose }: { doc: DocumentRecord | undefined; onClose: () => void }) {
  const { actions } = useStore()
  const [error, setError] = useState<string | undefined>()

  const open = !!doc
  const isReplace = doc?.status === 'rejected'
  const rejection = doc ? currentVersion(doc)?.rejectReason : undefined
  const nextVersion = doc ? doc.versions.length + 1 : 1

  function upload(files: FileRef[]) {
    if (!doc || files.length === 0) return
    const result = actions.uploadDocument(doc.id, files[0])
    if (result.ok) {
      setError(undefined)
      onClose()
    } else {
      setError(result.error)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} eyebrow={isReplace ? 'Replace document' : 'Upload document'} title={doc?.docType ?? ''}>
      {doc && (
        <div className="app-stack">
          {error && (
            <Alert tone="danger" title="Couldn't upload that" live>
              {error}
            </Alert>
          )}
          {isReplace && rejection && (
            <Alert tone="warning" title="Addressing a rejection">
              This version was rejected: {rejection}. Uploading a new file becomes version {nextVersion} and goes back to review.
            </Alert>
          )}
          {!isReplace && (
            <p className="ds-muted">
              {doc.required ? 'Required document.' : 'Optional document.'} Uploading a file sends it to review as version {nextVersion}.
            </p>
          )}
          <FileDrop
            title={isReplace ? 'Drop a replacement file or click to upload' : 'Drop a file or click to upload'}
            hint="PDF, image, or scanned document"
            onUpload={upload}
            sampleFileName={`${doc.docType}.pdf`}
          />
        </div>
      )}
    </Drawer>
  )
}
