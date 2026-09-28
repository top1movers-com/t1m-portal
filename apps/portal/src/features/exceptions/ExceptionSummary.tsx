import {
  formatDateTime,
  formatPHP,
  getMilestone,
  userName,
  useStore,
  type ExceptionRecord,
} from '../../data'
import { EXCEPTION_STATUS_META, FileList, SEVERITY_META, StatusPill } from '../../ui'

export function ExceptionSummary({ exception }: { exception: ExceptionRecord }) {
  const { state } = useStore()
  const stage = getMilestone(state, exception.stageMilestoneId)
  return (
    <div className="app-stack">
      <dl className="ds-kv app-kv">
        <div>
          <dt>Category</dt>
          <dd>{exception.category}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{stage?.name ?? '—'}</dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>
            <StatusPill meta={SEVERITY_META[exception.impact.severity]} />
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusPill meta={EXCEPTION_STATUS_META[exception.status]} />
          </dd>
        </div>
        <div>
          <dt>Raised by</dt>
          <dd>{userName(state, exception.raisedBy)}</dd>
        </div>
        <div>
          <dt>Raised at</dt>
          <dd>{formatDateTime(exception.raisedAt)}</dd>
        </div>
        {exception.impact.costPHP !== undefined && (
          <div>
            <dt>Cost impact</dt>
            <dd>{formatPHP(exception.impact.costPHP)}</dd>
          </div>
        )}
        {exception.impact.delayDays !== undefined && (
          <div>
            <dt>Delay</dt>
            <dd>{exception.impact.delayDays} days</dd>
          </div>
        )}
      </dl>
      <div>
        <span className="ds-label">Reason</span>
        <p className="app-prose">{exception.reason}</p>
      </div>
      <div>
        <span className="ds-label">Impact</span>
        <p className="app-prose">{exception.impact.description}</p>
      </div>
      <div>
        <span className="ds-label">Evidence</span>
        {exception.evidence.length > 0 ? (
          <FileList files={exception.evidence} label="Evidence" />
        ) : (
          <p className="ds-muted">No evidence attached.</p>
        )}
      </div>
    </div>
  )
}
