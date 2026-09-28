import type { User } from '../data'

/** Avatar + name. Shows "Unassigned" when there is no user. */
export function Owner({ user }: { user?: User }) {
  if (!user) return <span className="ds-owner">Unassigned</span>
  return (
    <span className="ds-owner">
      <span className="ds-avatar ds-avatar--sm" aria-hidden="true">
        {user.initials}
      </span>
      {user.name}
    </span>
  )
}
