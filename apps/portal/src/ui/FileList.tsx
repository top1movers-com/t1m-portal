import { formatBytes, formatDateTime, type FileRef } from '../data'
import { Icon } from './Icon'

function isImageFile(name: string): boolean {
  return /\.(jpe?g|png|heic|webp)$/i.test(name)
}

export interface FileListProps {
  files: FileRef[]
  /** Shows a remove button per file. */
  onRemove?: (fileId: string) => void
  /** Replaces the default "size · date" meta line. */
  describe?: (file: FileRef) => string
  label?: string
}

export function FileList({ files, onRemove, describe, label }: FileListProps) {
  if (files.length === 0) return null
  return (
    <ul className="ds-files" aria-label={label}>
      {files.map((file) => (
        <li className="ds-file" key={file.id}>
          <span className="ds-file__icon">
            <Icon name={isImageFile(file.name) ? 'camera' : 'file'} />
          </span>
          <div className="ds-file__body">
            <span className="ds-file__name" title={file.name}>
              {file.name}
            </span>
            <span className="ds-file__meta">
              {describe ? describe(file) : `${formatBytes(file.size)} · ${formatDateTime(file.uploadedAt)}`}
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              className="ds-file__remove ds-btn ds-btn--ghost ds-btn--icon"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(file.id)}
            >
              <Icon name="x" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
