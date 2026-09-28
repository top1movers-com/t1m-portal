import { useId, type FormEvent, type ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import { useModalDialog } from './useModalDialog'

export interface DialogProps {
  open: boolean
  /** Called for Esc, the close button, and any other dismissal. Set `open` to false here. */
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Buttons, right-aligned. Put the one primary action last. */
  footer?: ReactNode
  size?: 'lg'
  /** Wraps body and footer in a form so a submit button in the footer submits it. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

/**
 * Modal for a decision the user must make before continuing (complete with evidence, reject with a reason).
 * Prefer <Drawer> for record detail and quick edits. Content mounts only while open, so form state resets.
 */
export function Dialog({ open, onClose, title, children, footer, size, onSubmit }: DialogProps) {
  const titleId = useId()
  const [dialogRef, handleClose] = useModalDialog(open, onClose)
  const inner = (
    <>
      <div className="ds-dialog__body">{children}</div>
      {footer && <div className="ds-dialog__footer">{footer}</div>}
    </>
  )
  return (
    <dialog
      ref={dialogRef}
      className={cx('ds-dialog', size === 'lg' && 'ds-dialog--lg')}
      aria-labelledby={titleId}
      onClose={handleClose}
    >
      {open && (
        <>
          <div className="ds-dialog__header">
            <h2 className="ds-dialog__title" id={titleId}>
              {title}
            </h2>
            <button type="button" className="ds-dialog__close ds-btn ds-btn--ghost ds-btn--icon" aria-label="Close" onClick={onClose}>
              <Icon name="x" />
            </button>
          </div>
          {onSubmit ? (
            <form
              className="app-dialog-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                onSubmit(event)
              }}
            >
              {inner}
            </form>
          ) : (
            inner
          )}
        </>
      )}
    </dialog>
  )
}
