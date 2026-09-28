import logo from '@t1m/design-system/assets/top1movers-logo.png'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { CURRENT_USER, pendingApprovals, tasksForUser, useStore } from '../data'
import { Button, cx, Dialog, Icon, type IconName } from '../ui'
import { useTheme, type ThemePref } from './theme'

interface NavItemProps {
  to: string
  icon: IconName
  label: string
  count?: number
  /** Only an actionable count (My tasks) gets the navy chip. */
  alert?: boolean
}

function NavItem({ to, icon, label, count, alert }: NavItemProps) {
  return (
    <NavLink to={to} className="ds-nav__item" title={count ? `${label}, ${count}` : label}>
      <Icon name={icon} />
      <span data-text={label}>{label}</span>
      {count ? <em className={cx('ds-nav__count', alert && 'ds-nav__count--alert')}>{count}</em> : null}
    </NavLink>
  )
}

const THEMES: Array<{ value: ThemePref; label: string; icon: IconName }> = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'monitor' },
]

export function AppShell() {
  const { state, actions } = useStore()
  const [theme, setTheme] = useTheme()
  const [confirmReset, setConfirmReset] = useState(false)
  const [notice, setNotice] = useState('')

  const myOpenTasks = tasksForUser(state, CURRENT_USER.id).length
  const approvals = pendingApprovals(state).length
  const themeIndex = THEMES.findIndex((t) => t.value === theme)
  const nextTheme = THEMES[(themeIndex + 1) % THEMES.length]

  function resetDemo() {
    actions.resetDemo()
    setConfirmReset(false)
    setNotice('Demo data restored to the starting sample.')
  }

  return (
    <div className="ds-shell">
      <aside className="ds-sidebar">
        <div className="ds-sidebar__brand">
          <img src={logo} alt="Top1Movers" />
        </div>
        <nav className="ds-nav" aria-label="Main">
          <NavItem to="/jobs" icon="box" label="Shipment jobs" />
          <NavItem to="/my-tasks" icon="tasks" label="My tasks" count={myOpenTasks} alert />
          <NavItem to="/approvals" icon="shield" label="Approvals" count={approvals} />
          <div className="ds-nav__group">Settings</div>
          <NavItem to="/settings/milestone-templates" icon="flag" label="Milestone templates" />
          <NavItem to="/settings/document-checklists" icon="file" label="Document checklists" />
        </nav>
      </aside>

      <header className="ds-topbar">
        <span className="ds-pill" title="Everything in this portal is sample data for a proposal mockup.">
          <Icon name="info" />
          Mock data · illustrative
        </span>
        <div className="app-row app-topbar-actions">
          <fieldset className="ds-seg" aria-label="Theme">
            {THEMES.map((t) => (
              <label key={t.value}>
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => setTheme(t.value)}
                />
                {t.label}
              </label>
            ))}
          </fieldset>
          <Button
            variant="ghost"
            size="sm"
            icon={THEMES[themeIndex]?.icon ?? 'sun'}
            iconOnly
            className="app-theme-cycle"
            onClick={() => setTheme(nextTheme.value)}
          >
            {`Theme: ${THEMES[themeIndex]?.label ?? 'Light'}. Switch to ${nextTheme.label}`}
          </Button>
          <Button variant="ghost" size="sm" icon="history" onClick={() => setConfirmReset(true)}>
            <span className="app-hide-sm">Reset demo data</span>
          </Button>
          <span className="ds-avatar" title={`Signed in as ${CURRENT_USER.name} (sample user)`} aria-label={`Signed in as ${CURRENT_USER.name}`} role="img">
            {CURRENT_USER.initials}
          </span>
        </div>
        <span className="ds-vh" role="status">
          {notice}
        </span>
      </header>

      <main className="ds-content app-main">
        <Outlet />
      </main>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={resetDemo}>
              Reset demo data
            </Button>
          </>
        }
      >
        <p className="app-prose">
          Every change made in this session (tasks, documents, exceptions, deliveries, and charges) goes back to the
          starting sample. Your theme choice is kept.
        </p>
      </Dialog>
    </div>
  )
}
