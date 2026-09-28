import { useEffect, useRef } from 'react'

/**
 * Drives a native <dialog> from an `open` prop: showModal() on open (focus trap, Esc, inert page),
 * close() on close, and focus returns to whatever opened it.
 * Returns [dialogRef, handleClose]; pass handleClose to the dialog's onClose.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    return () => {
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
    }
  }, [])

  function handleClose() {
    returnFocusRef.current?.focus()
    returnFocusRef.current = null
    if (open) onClose()
  }

  return [dialogRef, handleClose] as const
}
