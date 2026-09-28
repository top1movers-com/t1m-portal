export type ISODate = string
export type ISODateTime = string

export type Role = 'dispatcher' | 'field' | 'manager' | 'finance'

export interface User {
  id: string
  name: string
  role: Role
  initials: string
}

export const ROLE_LABELS: Record<Role, string> = {
  dispatcher: 'Dispatcher',
  field: 'Field crew',
  manager: 'Operations manager',
  finance: 'Finance',
}

export type ServiceType = 'sea-fcl-import' | 'air-export' | 'domestic-delivery'

export const SERVICE_TYPES: ServiceType[] = ['sea-fcl-import', 'air-export', 'domestic-delivery']

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  'sea-fcl-import': 'Sea freight import (FCL)',
  'air-export': 'Air freight export',
  'domestic-delivery': 'Domestic delivery',
}

export const REFERENCE_NO_LABELS: Record<ServiceType, string> = {
  'sea-fcl-import': 'BL no.',
  'air-export': 'AWB no.',
  'domestic-delivery': 'Waybill no.',
}

export interface FileRef {
  id: string
  name: string
  size: number
  uploadedAt: ISODateTime
  uploadedBy: string
}

/** Marks the milestones that the Delivery module completes automatically. */
export type MilestoneRole = 'delivery' | 'pod'

export interface TemplateTask {
  title: string
  evidenceRequired: boolean
}

export interface TemplateMilestone {
  id: string
  name: string
  /** Days after the previous milestone's due date (or the job start for the first). */
  slaDays: number
  evidenceRequired: boolean
  role?: MilestoneRole
  defaultTasks: TemplateTask[]
}

export interface MilestoneTemplate {
  id: string
  serviceType: ServiceType
  name: string
  milestones: TemplateMilestone[]
}

export type JobStatus =
  | 'booked'
  | 'in_transit'
  | 'at_port'
  | 'customs'
  | 'out_for_delivery'
  | 'delivered'
  | 'closed'

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  booked: 'Booked',
  in_transit: 'In transit',
  at_port: 'At port',
  customs: 'In customs',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  closed: 'Closed',
}

export type BillingState = 'not_ready' | 'ready_for_finance'

export interface Job {
  id: string
  customer: string
  consignee: string
  serviceType: ServiceType
  origin: string
  destination: string
  containerNo?: string
  /** BL, AWB, or waybill number depending on service type (see REFERENCE_NO_LABELS). */
  blNo?: string
  eta: ISODate
  ownerId: string
  status: JobStatus
  billingState: BillingState
  readyAt?: ISODateTime
  readyBy?: string
}

export interface Milestone {
  id: string
  jobId: string
  templateMilestoneId: string
  name: string
  order: number
  dueDate: ISODate
  completedAt?: ISODateTime
  role?: MilestoneRole
}

export type MilestoneState = 'done' | 'current' | 'overdue' | 'upcoming'

export type TaskStatus = 'open' | 'done'
export type TaskBucket = 'pending' | 'due' | 'overdue' | 'done'

export interface Task {
  id: string
  jobId: string
  milestoneId: string
  title: string
  ownerId?: string
  dueDate?: ISODate
  status: TaskStatus
  evidenceRequired: boolean
  evidence: FileRef[]
  completionNote?: string
  completedAt?: ISODateTime
  completedBy?: string
  source: 'template' | 'corrective'
  exceptionId?: string
}

export interface DocRequirement {
  id: string
  serviceType: ServiceType
  docType: string
  required: boolean
  description: string
}

export type DocStatus = 'missing' | 'pending_review' | 'approved' | 'rejected'

export interface DocVersion {
  version: number
  file: FileRef
  status: Exclude<DocStatus, 'missing'>
  reviewedBy?: string
  reviewedAt?: ISODateTime
  rejectReason?: string
}

export interface DocumentRecord {
  id: string
  jobId: string
  docType: string
  required: boolean
  status: DocStatus
  /** Oldest first; the last entry is the current version. */
  versions: DocVersion[]
}

export type ExceptionCategory = 'Damage' | 'Delay' | 'Documentation' | 'Shortage' | 'Customs hold' | 'Other'

export const EXCEPTION_CATEGORIES: ExceptionCategory[] = [
  'Damage',
  'Delay',
  'Documentation',
  'Shortage',
  'Customs hold',
  'Other',
]

export type Severity = 'low' | 'medium' | 'high'
export type ExceptionStatus = 'pending_approval' | 'approved' | 'rejected' | 'closed'
export type DecisionOutcome = 'approved' | 'rejected'

export interface ExceptionImpact {
  severity: Severity
  costPHP?: number
  delayDays?: number
  description: string
}

export interface ExceptionDecision {
  by: string
  at: ISODateTime
  outcome: DecisionOutcome
  comment: string
}

export interface ExceptionLogEntry {
  at: ISODateTime
  by: string
  action: string
  note?: string
}

export interface ExceptionRecord {
  id: string
  jobId: string
  stageMilestoneId: string
  category: ExceptionCategory
  reason: string
  impact: ExceptionImpact
  evidence: FileRef[]
  status: ExceptionStatus
  raisedBy: string
  raisedAt: ISODateTime
  decision?: ExceptionDecision
  correctiveTaskIds: string[]
  log: ExceptionLogEntry[]
}

export type DeliveryStatus = 'scheduled' | 'delivered'
export type DeliveryOutcome = 'complete' | 'damaged' | 'incomplete'
export type PodStatus = 'pending_review' | 'approved' | 'rejected'

export interface Pod {
  file: FileRef
  status: PodStatus
  reviewedBy?: string
  reviewedAt?: ISODateTime
  rejectReason?: string
}

export interface Delivery {
  jobId: string
  status: DeliveryStatus
  scheduledFor: ISODate
  outcome?: DeliveryOutcome
  receiverName?: string
  deliveredAt?: ISODateTime
  expectedQty: number
  /** Unit for the quantities, e.g. "cartons". */
  qtyUnit: string
  deliveredQty?: number
  damageNotes?: string
  affectedItems?: string
  photos: FileRef[]
  pod?: Pod
  exceptionId?: string
}

export type ChargeKind = 'charge' | 'expense'

export const CHARGE_CATEGORIES = [
  'Freight',
  'Brokerage',
  'Trucking',
  'Port and terminal',
  'Duties and taxes',
  'Warehousing',
  'Documentation',
  'Toll and fuel',
  'Labor',
  'Other',
] as const

export type ChargeCategory = (typeof CHARGE_CATEGORIES)[number]

export interface Charge {
  id: string
  jobId: string
  /** "charge" is billed to the customer; "expense" is a cost Top1Movers paid. */
  kind: ChargeKind
  category: ChargeCategory
  description: string
  amountPHP: number
  evidence: FileRef[]
  addedBy: string
  addedAt: ISODateTime
}

export interface AuditEntry {
  id: string
  at: ISODateTime
  by: string
  jobId?: string
  action: string
  detail?: string
}

export interface DemoState {
  users: User[]
  templates: MilestoneTemplate[]
  docRequirements: DocRequirement[]
  jobs: Job[]
  milestones: Milestone[]
  tasks: Task[]
  documents: DocumentRecord[]
  exceptions: ExceptionRecord[]
  deliveries: Delivery[]
  charges: Charge[]
  /** Newest first. */
  audit: AuditEntry[]
}

export const JOB_TABS = ['tasks', 'documents', 'exceptions', 'delivery', 'charges'] as const
export type JobTab = (typeof JOB_TABS)[number]

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string }

export interface RaiseExceptionInput {
  jobId: string
  stageMilestoneId: string
  category: ExceptionCategory
  reason: string
  impact: ExceptionImpact
  evidence: FileRef[]
}

export interface CorrectiveTaskInput {
  title: string
  ownerId: string
  dueDate: ISODate
  milestoneId: string
  evidenceRequired?: boolean
}

export interface ConfirmDeliveryInput {
  outcome: DeliveryOutcome
  receiverName: string
  deliveredAt?: ISODateTime
  deliveredQty: number
  damageNotes?: string
  affectedItems?: string
  photos: FileRef[]
}

export interface ChargeInput {
  jobId: string
  kind: ChargeKind
  category: ChargeCategory
  description: string
  amountPHP: number
  evidence?: FileRef[]
}

export type ChargePatch = Partial<Pick<Charge, 'kind' | 'category' | 'description' | 'amountPHP'>>

export type BillingCheckId =
  | 'delivery_confirmed'
  | 'pod_approved'
  | 'documents_approved'
  | 'no_open_exceptions'
  | 'tasks_complete'
  | 'evidence_complete'
  | 'charges_recorded'

export type CheckState = 'pass' | 'fail' | 'pending'

export interface BillingCheckItem {
  id: BillingCheckId
  label: string
  detail: string
  state: CheckState
  fixTab: JobTab
}

export interface BillingChecklist {
  items: BillingCheckItem[]
  canMarkReady: boolean
}
