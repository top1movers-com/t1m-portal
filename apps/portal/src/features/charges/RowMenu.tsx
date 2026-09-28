import { useEffect, useRef, useState } from 'react'
import { Button, Icon, type IconName } from '../../ui'

export interface RowMenuAction {
  label: string
  icon: IconName
  onSelect: () => void
  tone?: 'danger'
}

export function RowMenu({ label, actions }: { label: string; actions: RowMenuAction[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="charges-row-menu" ref={ref}>
      <Button
        variant="ghost"
        iconOnly
        icon="more"
        className="ds-row-action"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </Button>
      <ul className="ds-menu" role="menu" aria-label={label} data-open={open || undefined}>
        {actions.map((action) => (
          <li key={action.label} role="none">
            <button
              type="button"
              role="menuitem"
              className="ds-option"
              data-tone={action.tone}
              onClick={() => {
                setOpen(false)
                action.onSelect()
              }}
            >
              <Icon name={action.icon} />
              <span className="ds-option__text">{action.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
