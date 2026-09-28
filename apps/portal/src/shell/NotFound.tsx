import { EmptyState, LinkButton, Panel } from '../ui'

export function NotFound() {
  return (
    <Panel>
      <EmptyState
        headingLevel={2}
        icon="search"
        title="Page not found"
        action={
          <LinkButton to="/jobs" variant="primary" icon="box">
            Go to shipment jobs
          </LinkButton>
        }
      >
        This address does not match any page in the portal mockup.
      </EmptyState>
    </Panel>
  )
}
