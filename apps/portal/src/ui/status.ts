import type {
  BillingState,
  DeliveryOutcome,
  DeliveryStatus,
  DocStatus,
  ExceptionStatus,
  JobStatus,
  MilestoneState,
  PodStatus,
  Severity,
  TaskBucket,
} from '../data'
import type { IconName } from './Icon'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand'

/** Status is always color + icon + word. Pass one of these to <StatusPill meta={...} />. */
export interface StatusMeta {
  tone: Tone
  icon: IconName
  label: string
}

export const JOB_STATUS_META: Record<JobStatus, StatusMeta> = {
  booked: { tone: 'neutral', icon: 'calendar', label: 'Booked' },
  in_transit: { tone: 'info', icon: 'truck', label: 'In transit' },
  at_port: { tone: 'info', icon: 'pin', label: 'At port' },
  customs: { tone: 'info', icon: 'shield', label: 'In customs' },
  out_for_delivery: { tone: 'info', icon: 'truck', label: 'Out for delivery' },
  delivered: { tone: 'success', icon: 'check', label: 'Delivered' },
  closed: { tone: 'neutral', icon: 'check', label: 'Closed' },
}

export const TASK_BUCKET_META: Record<TaskBucket, StatusMeta> = {
  pending: { tone: 'neutral', icon: 'clock', label: 'Pending' },
  due: { tone: 'warning', icon: 'clock', label: 'Due soon' },
  overdue: { tone: 'danger', icon: 'alert', label: 'Overdue' },
  done: { tone: 'success', icon: 'check', label: 'Done' },
}

export const MILESTONE_STATE_META: Record<MilestoneState, StatusMeta> = {
  done: { tone: 'success', icon: 'check', label: 'Done' },
  current: { tone: 'info', icon: 'arrow-right', label: 'In progress' },
  overdue: { tone: 'danger', icon: 'alert', label: 'Overdue' },
  upcoming: { tone: 'neutral', icon: 'clock', label: 'Upcoming' },
}

export const DOC_STATUS_META: Record<DocStatus, StatusMeta> = {
  missing: { tone: 'warning', icon: 'file', label: 'Missing' },
  pending_review: { tone: 'info', icon: 'clock', label: 'Awaiting review' },
  approved: { tone: 'success', icon: 'check', label: 'Approved' },
  rejected: { tone: 'danger', icon: 'x', label: 'Rejected' },
}

export const EXCEPTION_STATUS_META: Record<ExceptionStatus, StatusMeta> = {
  pending_approval: { tone: 'warning', icon: 'clock', label: 'Pending approval' },
  approved: { tone: 'info', icon: 'check', label: 'Approved, in progress' },
  rejected: { tone: 'danger', icon: 'x', label: 'Rejected' },
  closed: { tone: 'neutral', icon: 'check', label: 'Closed' },
}

export const SEVERITY_META: Record<Severity, StatusMeta> = {
  low: { tone: 'neutral', icon: 'info', label: 'Low impact' },
  medium: { tone: 'warning', icon: 'alert', label: 'Medium impact' },
  high: { tone: 'danger', icon: 'alert', label: 'High impact' },
}

export const DELIVERY_STATUS_META: Record<DeliveryStatus, StatusMeta> = {
  scheduled: { tone: 'info', icon: 'calendar', label: 'Scheduled' },
  delivered: { tone: 'success', icon: 'check', label: 'Delivered' },
}

export const DELIVERY_OUTCOME_META: Record<DeliveryOutcome, StatusMeta> = {
  complete: { tone: 'success', icon: 'check', label: 'Complete' },
  damaged: { tone: 'danger', icon: 'alert', label: 'Damaged' },
  incomplete: { tone: 'warning', icon: 'box', label: 'Incomplete' },
}

export const POD_STATUS_META: Record<PodStatus, StatusMeta> = {
  pending_review: { tone: 'info', icon: 'clock', label: 'POD awaiting review' },
  approved: { tone: 'success', icon: 'check', label: 'POD approved' },
  rejected: { tone: 'danger', icon: 'x', label: 'POD rejected' },
}

export const BILLING_STATE_META: Record<BillingState, StatusMeta> = {
  not_ready: { tone: 'neutral', icon: 'receipt', label: 'Not ready for billing' },
  ready_for_finance: { tone: 'brand', icon: 'check', label: 'Ready for Finance' },
}
