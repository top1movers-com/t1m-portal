import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react'
import { formatBytes, makeMockFile, newId, type FileRef } from '../data'
import { Button } from './Button'
import { cx } from './cx'
import { useFieldControl } from './field-context'
import { Icon } from './Icon'

const STEP_MS = 100
const STEP_PERCENT = 10

interface Upload {
  key: string
  file: FileRef
  progress: number
}

export interface FileDropProps {
  /** Called once per file when its simulated upload finishes. Nothing is actually uploaded. */
  onUpload: (files: FileRef[]) => void
  multiple?: boolean
  accept?: string
  compact?: boolean
  title?: string
  hint?: string
  invalid?: boolean
  disabled?: boolean
  /** Adds a "Use sample file" button that simulates uploading a file with this name (handy in demos). */
  sampleFileName?: string
  id?: string
}

/**
 * Dropzone with a simulated ~1s upload per file (ds-progress), then hands back mock file metadata.
 * Show the resulting files with <FileList>.
 */
export function FileDrop({
  onUpload,
  multiple,
  accept,
  compact,
  title,
  hint,
  invalid,
  disabled,
  sampleFileName,
  id,
}: FileDropProps) {
  const { attrs, invalid: fieldInvalid } = useFieldControl({ id })
  const [uploads, setUploads] = useState<Upload[]>([])
  const [dragging, setDragging] = useState(false)
  const timers = useRef(new Map<string, number>())
  const onUploadRef = useRef(onUpload)

  useEffect(() => {
    onUploadRef.current = onUpload
  })

  useEffect(() => {
    const active = timers.current
    return () => active.forEach((timer) => window.clearInterval(timer))
  }, [])

  function start(file: FileRef) {
    const key = newId('upload')
    let progress = 0
    setUploads((list) => [...list, { key, file, progress }])
    const timer = window.setInterval(() => {
      progress += STEP_PERCENT
      if (progress < 100) {
        setUploads((list) => list.map((u) => (u.key === key ? { ...u, progress } : u)))
        return
      }
      window.clearInterval(timer)
      timers.current.delete(key)
      setUploads((list) => list.filter((u) => u.key !== key))
      onUploadRef.current([makeMockFile(file.name, { size: file.size })])
    }, STEP_MS)
    timers.current.set(key, timer)
  }

  function cancel(key: string) {
    window.clearInterval(timers.current.get(key))
    timers.current.delete(key)
    setUploads((list) => list.filter((u) => u.key !== key))
  }

  function addFiles(files: File[]) {
    const picked = multiple ? files : files.slice(0, 1)
    picked.forEach((f) => start(makeMockFile(f.name, { size: f.size })))
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    if (!disabled) addFiles(Array.from(event.dataTransfer.files))
  }

  const busy = !multiple && uploads.length > 0

  return (
    <div className="app-stack app-stack--sm">
      <label
        className={cx('ds-dropzone', compact && 'ds-dropzone--compact', (invalid || fieldInvalid) && 'ds-dropzone--invalid')}
        data-state={dragging ? 'dragover' : undefined}
        onDragOver={(event) => {
          event.preventDefault()
          if (!dragging) setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={onDrop}
      >
        <input
          type="file"
          className="ds-vh"
          {...attrs}
          multiple={multiple}
          accept={accept}
          disabled={disabled || busy}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
        <span className="ds-dropzone__icon">
          <Icon name={compact ? 'paperclip' : 'upload'} />
        </span>
        <span className="ds-dropzone__title">
          {title ?? (compact ? 'Attach a file' : multiple ? 'Drop files or click to upload' : 'Drop a file or click to upload')}
        </span>
        {hint && !compact && <span className="ds-dropzone__hint">{hint}</span>}
      </label>
      {sampleFileName && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            icon="paperclip"
            disabled={disabled || busy}
            onClick={() => start(makeMockFile(sampleFileName))}
          >
            Use sample file
          </Button>
        </div>
      )}
      {uploads.length > 0 && (
        <ul className="ds-files" aria-live="polite">
          {uploads.map((u) => (
            <li className="ds-file" key={u.key}>
              <span className="ds-file__icon">
                <Icon name="file" />
              </span>
              <div className="ds-file__body">
                <span className="ds-file__name">{u.file.name}</span>
                <span className="ds-file__meta">
                  {formatBytes(u.file.size)} · Uploading, {u.progress}%
                </span>
                <div
                  className="ds-progress"
                  role="progressbar"
                  aria-label={`Uploading ${u.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={u.progress}
                >
                  <div className="ds-progress__bar" style={{ '--progress': `${u.progress}%` } as CSSProperties} />
                </div>
              </div>
              <button
                type="button"
                className="ds-file__remove ds-btn ds-btn--ghost ds-btn--icon"
                aria-label={`Cancel upload of ${u.file.name}`}
                onClick={() => cancel(u.key)}
              >
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
