import { useId, type FormEvent, type ReactNode } from 'react'
import { Icon } from './Icon'
import { useModalDialog } from './useModalDialog'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Small caps label above the title, e.g. "Task" or "Exception". */
  eyebrow?: ReactNode
  children: ReactNode
  footer?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

/** Right-side panel for record detail and quick edit. Built on a native modal <dialog>. */
export function Drawer({ open, onClose, title, eyebrow, children, footer, onSubmit }: DrawerProps) {
  const titleId = useId()
  const [dialogRef, handleClose] = useModalDialog(open, onClose)
  const inner = (
    <>
      <div className="ds-panel__body app-drawer__body">{children}</div>
      {footer && <div className="app-drawer__footer">{footer}</div>}
    </>
  )
  return (
    <dialog ref={dialogRef} className="ds-drawer" aria-labelledby={titleId} onClose={handleClose}>
      {open && (
        <>
          <div className="ds-panel__head">
            <div>
              {eyebrow && <span className="ds-label">{eyebrow}</span>}
              <h2 className="app-drawer__title" id={titleId}>
                {title}
              </h2>
            </div>
            <button type="button" className="ds-btn ds-btn--ghost ds-btn--icon" aria-label="Close" onClick={onClose}>
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
