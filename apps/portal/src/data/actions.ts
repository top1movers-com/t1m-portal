import { formatDate, nowISO } from './clock'
import { newId } from './files'
import { formatPHP } from './format'
import { createSeed } from './seed'
import { billingChecklist, getJob, jobMilestones, userName } from './selectors'
import type {
  Charge,
  ChargeInput,
  ChargePatch,
  ConfirmDeliveryInput,
  CorrectiveTaskInput,
  DecisionOutcome,
  Delivery,
  DemoState,
  DocRequirement,
  DocumentRecord,
  ExceptionRecord,
  FileRef,
  ISODate,
  Milestone,
  MilestoneRole,
  MilestoneTemplate,
  RaiseExceptionInput,
  Result,
  ServiceType,
  Task,
} from './types'
import { CURRENT_USER } from './users'

function ok(): { ok: true; value: undefined }
function ok<T>(value: T): { ok: true; value: T }
function ok(value?: unknown) {
  return { ok: true, value }
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function replaceById<T extends { id: string }>(list: T[], id: string, update: (item: T) => T): T[] {
  return list.map((item) => (item.id === id ? update(item) : item))
}

function nextExceptionId(state: DemoState): string {
  const max = state.exceptions.reduce((n, e) => Math.max(n, Number(e.id.match(/(\d+)$/)?.[1] ?? 0)), 0)
  return `EXC-${nowISO().slice(0, 4)}-${String(max + 1).padStart(4, '0')}`
}

function roleMilestone(state: DemoState, jobId: string, role: MilestoneRole): Milestone | undefined {
  return jobMilestones(state, jobId).find((m) => m.role === role)
}

const LOCKED = 'This job is already with Finance, so its charges are locked.'

export interface ScheduleDeliveryInput {
  scheduledFor: ISODate
  expectedQty: number
  qtyUnit: string
}

/**
 * Every mutation the demo supports. Each validates against the latest state, returns a Result,
 * and appends an audit entry. The signed-in user (CURRENT_USER) is the actor for every action.
 */
export function createActions(get: () => DemoState, commit: (next: DemoState) => void) {
  const me = CURRENT_USER.id

  function withAudit(state: DemoState, jobId: string | undefined, action: string, detail?: string): DemoState {
    return { ...state, audit: [{ id: newId('aud'), at: nowISO(), by: me, jobId, action, detail }, ...state.audit] }
  }

  function findTask(id: string): Task | undefined {
    return get().tasks.find((t) => t.id === id)
  }

  function findDoc(id: string): DocumentRecord | undefined {
    return get().documents.find((d) => d.id === id)
  }

  function findException(id: string): ExceptionRecord | undefined {
    return get().exceptions.find((e) => e.id === id)
  }

  function findDelivery(jobId: string): Delivery | undefined {
    return get().deliveries.find((d) => d.jobId === jobId)
  }

  function updateDelivery(state: DemoState, jobId: string, update: (d: Delivery) => Delivery): DemoState {
    return { ...state, deliveries: state.deliveries.map((d) => (d.jobId === jobId ? update(d) : d)) }
  }

  function chargeGuard(chargeId: string): Result<Charge> {
    const charge = get().charges.find((c) => c.id === chargeId)
    if (!charge) return fail('Charge not found.')
    if (getJob(get(), charge.jobId)?.billingState === 'ready_for_finance') return fail(LOCKED)
    return ok(charge)
  }

  function validateChargeFields(fields: ChargePatch): string | null {
    if (fields.description !== undefined && !fields.description.trim()) return 'Add a description.'
    if (fields.amountPHP !== undefined && !(Number.isFinite(fields.amountPHP) && fields.amountPHP > 0))
      return 'Enter an amount greater than zero.'
    return null
  }

  function buildException(state: DemoState, input: RaiseExceptionInput): ExceptionRecord {
    const at = nowISO()
    return {
      id: nextExceptionId(state),
      jobId: input.jobId,
      stageMilestoneId: input.stageMilestoneId,
      category: input.category,
      reason: input.reason.trim(),
      impact: { ...input.impact, description: input.impact.description.trim() },
      evidence: input.evidence,
      status: 'pending_approval',
      raisedBy: me,
      raisedAt: at,
      correctiveTaskIds: [],
      log: [{ at, by: me, action: 'Raised' }],
    }
  }

  return {
    /* ---------- Tasks ---------- */

    assignTask(taskId: string, ownerId: string, dueDate: ISODate): Result {
      const task = findTask(taskId)
      if (!task) return fail('Task not found.')
      if (!get().users.some((u) => u.id === ownerId)) return fail('Choose an owner.')
      if (!dueDate) return fail('Choose a due date.')
      const state = get()
      commit(
        withAudit(
          { ...state, tasks: replaceById(state.tasks, taskId, (t) => ({ ...t, ownerId, dueDate })) },
          task.jobId,
          'Assigned task',
          `${task.title} to ${userName(state, ownerId)}, due ${formatDate(dueDate)}`,
        ),
      )
      return ok()
    },

    completeTask(taskId: string, evidence: FileRef[] = [], note?: string): Result {
      const task = findTask(taskId)
      if (!task) return fail('Task not found.')
      if (task.status === 'done') return fail('This task is already complete.')
      const allEvidence = [...task.evidence, ...evidence]
      if (task.evidenceRequired && allEvidence.length === 0)
        return fail('This task needs evidence. Attach at least one file before completing it.')
      const at = nowISO()
      const state = get()
      const tasks = replaceById(state.tasks, taskId, (t) => ({
        ...t,
        status: 'done' as const,
        ownerId: t.ownerId ?? me,
        evidence: allEvidence,
        completionNote: note?.trim() || undefined,
        completedAt: at,
        completedBy: me,
      }))
      const milestone = state.milestones.find((m) => m.id === task.milestoneId)
      const milestoneDone =
        milestone && !milestone.role && !milestone.completedAt &&
        tasks.filter((t) => t.milestoneId === milestone.id).every((t) => t.status === 'done')
      const milestones = milestoneDone
        ? replaceById(state.milestones, milestone.id, (m) => ({ ...m, completedAt: at }))
        : state.milestones
      commit(withAudit({ ...state, tasks, milestones }, task.jobId, 'Completed task', task.title))
      return ok()
    },

    reopenTask(taskId: string): Result {
      const task = findTask(taskId)
      if (!task) return fail('Task not found.')
      if (task.status === 'open') return fail('This task is already open.')
      const state = get()
      const tasks = replaceById(state.tasks, taskId, (t) => ({
        ...t,
        status: 'open' as const,
        completedAt: undefined,
        completedBy: undefined,
        completionNote: undefined,
      }))
      const milestones = state.milestones.map((m) =>
        m.id === task.milestoneId && !m.role ? { ...m, completedAt: undefined } : m,
      )
      commit(withAudit({ ...state, tasks, milestones }, task.jobId, 'Reopened task', task.title))
      return ok()
    },

    /* ---------- Settings ---------- */

    /** Changes apply to jobs created from now on; existing jobs keep their milestones. */
    updateMilestoneTemplate(template: MilestoneTemplate): Result {
      if (!template.name.trim()) return fail('Give the template a name.')
      if (template.milestones.length === 0) return fail('Add at least one milestone.')
      if (template.milestones.some((m) => !m.name.trim())) return fail('Every milestone needs a name.')
      if (template.milestones.some((m) => !Number.isInteger(m.slaDays) || m.slaDays < 0))
        return fail('SLA days must be a whole number of 0 or more.')
      if (template.milestones.some((m) => m.defaultTasks.some((t) => !t.title.trim())))
        return fail('Every default task needs a title.')
      const state = get()
      const exists = state.templates.some((t) => t.id === template.id)
      const templates = exists
        ? replaceById(state.templates, template.id, () => template)
        : [...state.templates, template]
      commit(withAudit({ ...state, templates }, undefined, 'Updated milestone template', template.name))
      return ok()
    },

    /** Replaces the checklist for a service type and applies it to that type's jobs not yet with Finance. */
    updateDocRequirements(serviceType: ServiceType, reqs: DocRequirement[]): Result {
      const names = reqs.map((r) => r.docType.trim().toLowerCase())
      if (names.some((n) => !n)) return fail('Every document needs a name.')
      if (new Set(names).size !== names.length) return fail('Each document type can appear only once.')
      const state = get()
      const cleaned = reqs.map((r) => ({ ...r, serviceType, docType: r.docType.trim() }))
      const docRequirements = [...state.docRequirements.filter((r) => r.serviceType !== serviceType), ...cleaned]
      const openJobs = state.jobs.filter((j) => j.serviceType === serviceType && j.billingState === 'not_ready')
      let documents = state.documents
      for (const job of openJobs) {
        for (const req of cleaned) {
          const existing = documents.find((d) => d.jobId === job.id && d.docType === req.docType)
          if (existing) {
            documents = replaceById(documents, existing.id, (d) => ({ ...d, required: req.required }))
          } else {
            documents = [
              ...documents,
              { id: newId('doc'), jobId: job.id, docType: req.docType, required: req.required, status: 'missing', versions: [] },
            ]
          }
        }
      }
      commit(
        withAudit({ ...state, docRequirements, documents }, undefined, 'Updated document checklist', serviceType),
      )
      return ok()
    },

    /* ---------- Documents ---------- */

    uploadDocument(docId: string, file: FileRef): Result {
      const doc = findDoc(docId)
      if (!doc) return fail('Document not found.')
      if (doc.status === 'approved') return fail('This document is already approved.')
      const version = doc.versions.length + 1
      const state = get()
      commit(
        withAudit(
          {
            ...state,
            documents: replaceById(state.documents, docId, (d) => ({
              ...d,
              status: 'pending_review' as const,
              versions: [...d.versions, { version, file, status: 'pending_review' as const }],
            })),
          },
          doc.jobId,
          'Uploaded document',
          `${doc.docType}, version ${version}`,
        ),
      )
      return ok()
    },

    approveDocument(docId: string): Result {
      const doc = findDoc(docId)
      if (!doc) return fail('Document not found.')
      if (doc.status !== 'pending_review') return fail('Only documents awaiting review can be approved.')
      const at = nowISO()
      const state = get()
      commit(
        withAudit(
          {
            ...state,
            documents: replaceById(state.documents, docId, (d) => ({
              ...d,
              status: 'approved' as const,
              versions: d.versions.map((v, i) =>
                i === d.versions.length - 1 ? { ...v, status: 'approved' as const, reviewedBy: me, reviewedAt: at } : v,
              ),
            })),
          },
          doc.jobId,
          'Approved document',
          `${doc.docType}, version ${doc.versions.length}`,
        ),
      )
      return ok()
    },

    rejectDocument(docId: string, reason: string): Result {
      const doc = findDoc(docId)
      if (!doc) return fail('Document not found.')
      if (doc.status !== 'pending_review') return fail('Only documents awaiting review can be rejected.')
      if (!reason.trim()) return fail('Give a reason so the uploader knows what to fix.')
      const at = nowISO()
      const state = get()
      commit(
        withAudit(
          {
            ...state,
            documents: replaceById(state.documents, docId, (d) => ({
              ...d,
              status: 'rejected' as const,
              versions: d.versions.map((v, i) =>
                i === d.versions.length - 1
                  ? { ...v, status: 'rejected' as const, reviewedBy: me, reviewedAt: at, rejectReason: reason.trim() }
                  : v,
              ),
            })),
          },
          doc.jobId,
          'Rejected document',
          `${doc.docType}, version ${doc.versions.length}: ${reason.trim()}`,
        ),
      )
      return ok()
    },

    /* ---------- Exceptions ---------- */

    raiseException(input: RaiseExceptionInput): Result<string> {
      const state = get()
      if (!getJob(state, input.jobId)) return fail('Job not found.')
      if (!state.milestones.some((m) => m.id === input.stageMilestoneId && m.jobId === input.jobId))
        return fail('Choose the stage where this happened.')
      if (!input.reason.trim()) return fail('Describe what happened.')
      const exception = buildException(state, input)
      commit(
        withAudit(
          { ...state, exceptions: [...state.exceptions, exception] },
          input.jobId,
          'Raised exception',
          `${exception.id} ${exception.category}`,
        ),
      )
      return ok(exception.id)
    },

    decideException(exceptionId: string, outcome: DecisionOutcome, comment: string): Result {
      const ex = findException(exceptionId)
      if (!ex) return fail('Exception not found.')
      if (ex.status !== 'pending_approval') return fail('This exception has already been decided.')
      if (outcome === 'rejected' && !comment.trim()) return fail('Add a comment explaining the rejection.')
      const at = nowISO()
      const state = get()
      const note = comment.trim() || undefined
      commit(
        withAudit(
          {
            ...state,
            exceptions: replaceById(state.exceptions, exceptionId, (e) => ({
              ...e,
              status: outcome,
              decision: { by: me, at, outcome, comment: comment.trim() },
              log: [...e.log, { at, by: me, action: outcome === 'approved' ? 'Approved' : 'Rejected', note }],
            })),
          },
          ex.jobId,
          outcome === 'approved' ? 'Approved exception' : 'Rejected exception',
          exceptionId,
        ),
      )
      return ok()
    },

    createCorrectiveTask(exceptionId: string, input: CorrectiveTaskInput): Result<string> {
      const ex = findException(exceptionId)
      if (!ex) return fail('Exception not found.')
      if (ex.status === 'closed') return fail('This exception is closed.')
      if (!input.title.trim()) return fail('Give the task a title.')
      const state = get()
      if (!state.users.some((u) => u.id === input.ownerId)) return fail('Choose an owner.')
      if (!input.dueDate) return fail('Choose a due date.')
      if (!state.milestones.some((m) => m.id === input.milestoneId && m.jobId === ex.jobId))
        return fail('Choose the milestone this task belongs to.')
      const at = nowISO()
      const task: Task = {
        id: newId('tsk'),
        jobId: ex.jobId,
        milestoneId: input.milestoneId,
        title: input.title.trim(),
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        status: 'open',
        evidenceRequired: input.evidenceRequired ?? false,
        evidence: [],
        source: 'corrective',
        exceptionId,
      }
      commit(
        withAudit(
          {
            ...state,
            tasks: [...state.tasks, task],
            exceptions: replaceById(state.exceptions, exceptionId, (e) => ({
              ...e,
              correctiveTaskIds: [...e.correctiveTaskIds, task.id],
              log: [...e.log, { at, by: me, action: 'Corrective task created', note: task.title }],
            })),
          },
          ex.jobId,
          'Created corrective task',
          `${task.title} (${exceptionId})`,
        ),
      )
      return ok(task.id)
    },

    closeException(exceptionId: string, note?: string): Result {
      const ex = findException(exceptionId)
      if (!ex) return fail('Exception not found.')
      if (ex.status === 'closed') return fail('This exception is already closed.')
      if (ex.status === 'pending_approval') return fail('Approve or reject the exception before closing it.')
      const state = get()
      const openCorrective = state.tasks.filter((t) => ex.correctiveTaskIds.includes(t.id) && t.status === 'open')
      if (openCorrective.length > 0)
        return fail(
          `Complete ${openCorrective.length === 1 ? 'the open corrective task' : `${openCorrective.length} open corrective tasks`} first.`,
        )
      const at = nowISO()
      commit(
        withAudit(
          {
            ...state,
            exceptions: replaceById(state.exceptions, exceptionId, (e) => ({
              ...e,
              status: 'closed' as const,
              log: [...e.log, { at, by: me, action: 'Closed', note: note?.trim() || undefined }],
            })),
          },
          ex.jobId,
          'Closed exception',
          exceptionId,
        ),
      )
      return ok()
    },

    /* ---------- Delivery ---------- */

    scheduleDelivery(jobId: string, input: ScheduleDeliveryInput): Result {
      const state = get()
      if (!getJob(state, jobId)) return fail('Job not found.')
      if (findDelivery(jobId)?.status === 'delivered') return fail('This job is already delivered.')
      if (!input.scheduledFor) return fail('Choose a delivery date.')
      if (!(Number.isInteger(input.expectedQty) && input.expectedQty > 0)) return fail('Enter the expected quantity.')
      if (!input.qtyUnit.trim()) return fail('Enter a unit, for example cartons.')
      const existing = findDelivery(jobId)
      const delivery: Delivery = {
        ...(existing ?? { jobId, photos: [] }),
        status: 'scheduled',
        scheduledFor: input.scheduledFor,
        expectedQty: input.expectedQty,
        qtyUnit: input.qtyUnit.trim(),
      }
      const deliveries = existing
        ? state.deliveries.map((d) => (d.jobId === jobId ? delivery : d))
        : [...state.deliveries, delivery]
      commit(withAudit({ ...state, deliveries }, jobId, 'Scheduled delivery', formatDate(input.scheduledFor)))
      return ok()
    },

    /**
     * Records the delivery, completes the "Delivered" milestone, and marks the job delivered.
     * A damaged or incomplete outcome raises an exception automatically; its id is returned.
     */
    confirmDelivery(jobId: string, input: ConfirmDeliveryInput): Result<string | undefined> {
      const delivery = findDelivery(jobId)
      if (!delivery) return fail('Schedule the delivery first.')
      if (delivery.status === 'delivered') return fail('Delivery is already confirmed.')
      if (!input.receiverName.trim()) return fail("Enter the receiver's name.")
      if (!(Number.isInteger(input.deliveredQty) && input.deliveredQty >= 0)) return fail('Enter the delivered quantity.')
      if (input.outcome !== 'complete' && !input.damageNotes?.trim())
        return fail(input.outcome === 'damaged' ? 'Describe the damage.' : 'Describe what is missing.')
      if (input.outcome === 'damaged' && input.photos.length === 0) return fail('Add at least one photo of the damage.')
      if (input.outcome === 'incomplete' && input.deliveredQty >= delivery.expectedQty)
        return fail(`For an incomplete delivery, enter fewer than ${delivery.expectedQty} ${delivery.qtyUnit}.`)

      let state = get()
      const deliveredAt = input.deliveredAt ?? nowISO()
      const deliveryMilestone = roleMilestone(state, jobId, 'delivery')
      let exceptionId: string | undefined

      if (input.outcome !== 'complete') {
        const stage = deliveryMilestone ?? jobMilestones(state, jobId).find((m) => !m.completedAt)
        if (stage) {
          const exception = buildException(state, {
            jobId,
            stageMilestoneId: stage.id,
            category: input.outcome === 'damaged' ? 'Damage' : 'Shortage',
            reason: input.damageNotes ?? '',
            impact: {
              severity: input.outcome === 'damaged' ? 'high' : 'medium',
              description: [
                `${input.deliveredQty} of ${delivery.expectedQty} ${delivery.qtyUnit} delivered.`,
                input.affectedItems?.trim() ? `Affected: ${input.affectedItems.trim()}.` : '',
              ]
                .filter(Boolean)
                .join(' '),
            },
            evidence: input.photos,
          })
          exception.log[0].note = 'Raised from the delivery confirmation.'
          exceptionId = exception.id
          state = withAudit(
            { ...state, exceptions: [...state.exceptions, exception] },
            jobId,
            'Raised exception',
            `${exception.id} ${exception.category}`,
          )
        }
      }

      state = updateDelivery(state, jobId, (d) => ({
        ...d,
        status: 'delivered',
        outcome: input.outcome,
        receiverName: input.receiverName.trim(),
        deliveredAt,
        deliveredQty: input.deliveredQty,
        damageNotes: input.damageNotes?.trim() || undefined,
        affectedItems: input.affectedItems?.trim() || undefined,
        photos: [...d.photos, ...input.photos],
        exceptionId: exceptionId ?? d.exceptionId,
      }))
      state = {
        ...state,
        jobs: replaceById(state.jobs, jobId, (j) => ({ ...j, status: 'delivered' as const })),
        milestones: deliveryMilestone
          ? replaceById(state.milestones, deliveryMilestone.id, (m) => ({ ...m, completedAt: deliveredAt }))
          : state.milestones,
      }
      commit(
        withAudit(
          state,
          jobId,
          'Confirmed delivery',
          `${input.outcome[0].toUpperCase()}${input.outcome.slice(1)}, ${input.deliveredQty} of ${delivery.expectedQty} ${delivery.qtyUnit}`,
        ),
      )
      return ok(exceptionId)
    },

    uploadPod(jobId: string, file: FileRef): Result {
      const delivery = findDelivery(jobId)
      if (!delivery || delivery.status !== 'delivered') return fail('Confirm the delivery before uploading the POD.')
      if (delivery.pod?.status === 'approved') return fail('The POD is already approved.')
      const state = get()
      commit(
        withAudit(
          updateDelivery(state, jobId, (d) => ({ ...d, pod: { file, status: 'pending_review' } })),
          jobId,
          'Uploaded POD',
          file.name,
        ),
      )
      return ok()
    },

    reviewPod(jobId: string, approve: boolean, reason?: string): Result {
      const delivery = findDelivery(jobId)
      if (!delivery?.pod || delivery.pod.status !== 'pending_review') return fail('There is no POD awaiting review.')
      if (!approve && !reason?.trim()) return fail('Give a reason so the field team knows what to fix.')
      const at = nowISO()
      let state = updateDelivery(get(), jobId, (d) => ({
        ...d,
        pod: d.pod && {
          ...d.pod,
          status: approve ? 'approved' : 'rejected',
          reviewedBy: me,
          reviewedAt: at,
          rejectReason: approve ? undefined : reason?.trim(),
        },
      }))
      const podMilestone = roleMilestone(state, jobId, 'pod')
      if (approve && podMilestone && !podMilestone.completedAt) {
        state = { ...state, milestones: replaceById(state.milestones, podMilestone.id, (m) => ({ ...m, completedAt: at })) }
      }
      commit(withAudit(state, jobId, approve ? 'Approved POD' : 'Rejected POD', approve ? undefined : reason?.trim()))
      return ok()
    },

    /* ---------- Charges ---------- */

    addCharge(input: ChargeInput): Result<string> {
      const state = get()
      const job = getJob(state, input.jobId)
      if (!job) return fail('Job not found.')
      if (job.billingState === 'ready_for_finance') return fail(LOCKED)
      const invalid = validateChargeFields(input)
      if (invalid) return fail(invalid)
      const charge: Charge = {
        id: newId('chg'),
        jobId: input.jobId,
        kind: input.kind,
        category: input.category,
        description: input.description.trim(),
        amountPHP: input.amountPHP,
        evidence: input.evidence ?? [],
        addedBy: me,
        addedAt: nowISO(),
      }
      commit(
        withAudit(
          { ...state, charges: [...state.charges, charge] },
          input.jobId,
          input.kind === 'charge' ? 'Added charge' : 'Added expense',
          `${charge.description}, ${formatPHP(charge.amountPHP)}`,
        ),
      )
      return ok(charge.id)
    },

    updateCharge(chargeId: string, patch: ChargePatch): Result {
      const guard = chargeGuard(chargeId)
      if (!guard.ok) return guard
      const invalid = validateChargeFields(patch)
      if (invalid) return fail(invalid)
      const state = get()
      const next = { ...guard.value, ...patch, description: (patch.description ?? guard.value.description).trim() }
      commit(
        withAudit(
          { ...state, charges: replaceById(state.charges, chargeId, () => next) },
          next.jobId,
          next.kind === 'charge' ? 'Updated charge' : 'Updated expense',
          `${next.description}, ${formatPHP(next.amountPHP)}`,
        ),
      )
      return ok()
    },

    removeCharge(chargeId: string): Result {
      const guard = chargeGuard(chargeId)
      if (!guard.ok) return guard
      const state = get()
      const charge = guard.value
      commit(
        withAudit(
          { ...state, charges: state.charges.filter((c) => c.id !== chargeId) },
          charge.jobId,
          charge.kind === 'charge' ? 'Removed charge' : 'Removed expense',
          `${charge.description}, ${formatPHP(charge.amountPHP)}`,
        ),
      )
      return ok()
    },

    attachChargeEvidence(chargeId: string, file: FileRef): Result {
      const guard = chargeGuard(chargeId)
      if (!guard.ok) return guard
      const state = get()
      commit(
        withAudit(
          { ...state, charges: replaceById(state.charges, chargeId, (c) => ({ ...c, evidence: [...c.evidence, file] })) },
          guard.value.jobId,
          'Attached evidence',
          `${file.name} to ${guard.value.description}`,
        ),
      )
      return ok()
    },

    removeChargeEvidence(chargeId: string, fileId: string): Result {
      const guard = chargeGuard(chargeId)
      if (!guard.ok) return guard
      const state = get()
      const removed = guard.value.evidence.find((f) => f.id === fileId)
      if (!removed) return fail('File not found.')
      commit(
        withAudit(
          {
            ...state,
            charges: replaceById(state.charges, chargeId, (c) => ({ ...c, evidence: c.evidence.filter((f) => f.id !== fileId) })),
          },
          guard.value.jobId,
          'Removed evidence',
          `${removed.name} from ${guard.value.description}`,
        ),
      )
      return ok()
    },

    /* ---------- Billing readiness ---------- */

    markReadyForFinance(jobId: string): Result {
      const state = get()
      const job = getJob(state, jobId)
      if (!job) return fail('Job not found.')
      if (job.billingState === 'ready_for_finance') return fail('This job is already with Finance.')
      const checklist = billingChecklist(state, jobId)
      if (!checklist.canMarkReady) {
        const open = checklist.items.filter((i) => i.state !== 'pass').map((i) => i.label.toLowerCase())
        return fail(`Not ready yet: ${open.join('; ')}.`)
      }
      const at = nowISO()
      commit(
        withAudit(
          {
            ...state,
            jobs: replaceById(state.jobs, jobId, (j) => ({
              ...j,
              billingState: 'ready_for_finance' as const,
              readyAt: at,
              readyBy: me,
            })),
          },
          jobId,
          'Marked ready for Finance',
        ),
      )
      return ok()
    },

    /* ---------- Demo ---------- */

    resetDemo(): void {
      commit(createSeed())
    },
  }
}

export type StoreActions = ReturnType<typeof createActions>
