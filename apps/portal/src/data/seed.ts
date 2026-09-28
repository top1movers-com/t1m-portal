/*
 * Mock demo data. Every name, ID, and amount here is illustrative, not a real customer or shipment.
 * The demo "today" is DEMO_TODAY (Sep 29, 2026); dates below are set relative to it.
 */
import { makeMockFile } from './files'
import type {
  AuditEntry,
  Charge,
  Delivery,
  DemoState,
  DocRequirement,
  DocumentRecord,
  DocVersion,
  ExceptionRecord,
  FileRef,
  Job,
  Milestone,
  MilestoneTemplate,
  Task,
} from './types'
import { USERS } from './users'

const at = (date: string, time = '10:00') => `${date}T${time}:00+08:00`
const file = (name: string, by: string, when: string) => makeMockFile(name, { by, at: when })

/* ---------- Settings: milestone templates ---------- */

const TEMPLATES: MilestoneTemplate[] = [
  {
    id: 'tpl-sea-fcl-import',
    serviceType: 'sea-fcl-import',
    name: 'Sea freight import (FCL), standard',
    milestones: [
      {
        id: 'sea-booking',
        name: 'Booking confirmed',
        slaDays: 2,
        evidenceRequired: true,
        defaultTasks: [
          { title: 'Confirm booking with shipping line', evidenceRequired: true },
          { title: 'Send pre-alert to consignee', evidenceRequired: false },
        ],
      },
      {
        id: 'sea-departed',
        name: 'Vessel departed',
        slaDays: 6,
        evidenceRequired: false,
        defaultTasks: [{ title: 'Obtain copy of bill of lading', evidenceRequired: true }],
      },
      {
        id: 'sea-arrived',
        name: 'Arrived at port',
        slaDays: 12,
        evidenceRequired: false,
        defaultTasks: [
          { title: 'Review arrival notice', evidenceRequired: false },
          { title: 'Pay port and terminal charges', evidenceRequired: true },
        ],
      },
      {
        id: 'sea-customs',
        name: 'Customs cleared',
        slaDays: 1,
        evidenceRequired: true,
        defaultTasks: [
          { title: 'Lodge import entry with customs', evidenceRequired: true },
          { title: 'Pay duties and taxes', evidenceRequired: true },
        ],
      },
      {
        id: 'sea-released',
        name: 'Released from port',
        slaDays: 3,
        evidenceRequired: false,
        defaultTasks: [
          { title: 'Secure gate pass', evidenceRequired: true },
          { title: 'Book trucking to consignee', evidenceRequired: false },
        ],
      },
      {
        id: 'sea-delivered',
        name: 'Delivered',
        slaDays: 2,
        evidenceRequired: true,
        role: 'delivery',
        defaultTasks: [{ title: 'Confirm delivery appointment with consignee', evidenceRequired: false }],
      },
      {
        id: 'sea-pod',
        name: 'POD received',
        slaDays: 2,
        evidenceRequired: true,
        role: 'pod',
        defaultTasks: [{ title: 'Collect signed proof of delivery', evidenceRequired: true }],
      },
    ],
  },
  {
    id: 'tpl-air-export',
    serviceType: 'air-export',
    name: 'Air freight export, standard',
    milestones: [
      {
        id: 'air-booking',
        name: 'Booking confirmed',
        slaDays: 1,
        evidenceRequired: false,
        defaultTasks: [
          { title: 'Confirm space with airline', evidenceRequired: false },
          { title: 'Collect commercial invoice and packing list from shipper', evidenceRequired: false },
        ],
      },
      {
        id: 'air-received',
        name: 'Cargo received at warehouse',
        slaDays: 2,
        evidenceRequired: true,
        defaultTasks: [
          { title: 'Pick up cargo from shipper', evidenceRequired: true },
          { title: 'Weigh and measure cargo', evidenceRequired: false },
        ],
      },
      {
        id: 'air-declared',
        name: 'Export declaration lodged',
        slaDays: 1,
        evidenceRequired: true,
        defaultTasks: [{ title: 'Lodge export declaration', evidenceRequired: true }],
      },
      {
        id: 'air-tendered',
        name: 'Tendered to airline',
        slaDays: 1,
        evidenceRequired: true,
        defaultTasks: [{ title: 'Tender cargo to airline', evidenceRequired: true }],
      },
      {
        id: 'air-departed',
        name: 'Flight departed',
        slaDays: 1,
        evidenceRequired: false,
        defaultTasks: [{ title: 'Confirm flight departure', evidenceRequired: false }],
      },
      {
        id: 'air-delivered',
        name: 'Delivered',
        slaDays: 3,
        evidenceRequired: true,
        role: 'delivery',
        defaultTasks: [{ title: 'Coordinate delivery with destination agent', evidenceRequired: false }],
      },
      {
        id: 'air-pod',
        name: 'POD received',
        slaDays: 2,
        evidenceRequired: true,
        role: 'pod',
        defaultTasks: [{ title: 'Collect signed proof of delivery', evidenceRequired: true }],
      },
    ],
  },
  {
    id: 'tpl-domestic-delivery',
    serviceType: 'domestic-delivery',
    name: 'Domestic delivery, standard',
    milestones: [
      {
        id: 'dom-order',
        name: 'Order confirmed',
        slaDays: 1,
        evidenceRequired: false,
        defaultTasks: [{ title: 'Confirm pickup schedule with customer', evidenceRequired: false }],
      },
      {
        id: 'dom-truck',
        name: 'Truck assigned',
        slaDays: 1,
        evidenceRequired: false,
        defaultTasks: [{ title: 'Assign truck and driver', evidenceRequired: false }],
      },
      {
        id: 'dom-loaded',
        name: 'Cargo loaded',
        slaDays: 1,
        evidenceRequired: true,
        defaultTasks: [
          { title: 'Photograph loaded cargo', evidenceRequired: true },
          { title: 'Get shipper sign-off on load list', evidenceRequired: true },
        ],
      },
      {
        id: 'dom-transit',
        name: 'In transit',
        slaDays: 1,
        evidenceRequired: false,
        defaultTasks: [{ title: 'Confirm departure from origin', evidenceRequired: false }],
      },
      {
        id: 'dom-delivered',
        name: 'Delivered',
        slaDays: 1,
        evidenceRequired: true,
        role: 'delivery',
        defaultTasks: [{ title: 'Confirm delivery with receiver', evidenceRequired: false }],
      },
      {
        id: 'dom-pod',
        name: 'POD received',
        slaDays: 2,
        evidenceRequired: true,
        role: 'pod',
        defaultTasks: [{ title: 'Review signed POD and file delivery receipt', evidenceRequired: false }],
      },
    ],
  },
]

/* ---------- Settings: document checklists ---------- */

const DOC_REQUIREMENTS: DocRequirement[] = [
  { id: 'req-sea-bl', serviceType: 'sea-fcl-import', docType: 'Bill of lading', required: true, description: 'Carrier-issued BL, original or telex release.' },
  { id: 'req-sea-ci', serviceType: 'sea-fcl-import', docType: 'Commercial invoice', required: true, description: 'Signed by the shipper; totals must match the packing list.' },
  { id: 'req-sea-pl', serviceType: 'sea-fcl-import', docType: 'Packing list', required: true, description: 'Carton count, weights, and marks per container.' },
  { id: 'req-sea-permit', serviceType: 'sea-fcl-import', docType: 'Import permit', required: true, description: 'Regulatory permit for controlled goods.' },
  { id: 'req-sea-entry', serviceType: 'sea-fcl-import', docType: 'Import entry', required: true, description: 'Lodged customs entry with assessment notice.' },
  { id: 'req-sea-coo', serviceType: 'sea-fcl-import', docType: 'Certificate of origin', required: false, description: 'Only needed to claim a preferential tariff.' },
  { id: 'req-air-awb', serviceType: 'air-export', docType: 'Air waybill', required: true, description: 'House or master AWB issued at tender.' },
  { id: 'req-air-ci', serviceType: 'air-export', docType: 'Commercial invoice', required: true, description: 'Signed by the shipper.' },
  { id: 'req-air-pl', serviceType: 'air-export', docType: 'Packing list', required: true, description: 'Pieces, weights, and dimensions.' },
  { id: 'req-air-ed', serviceType: 'air-export', docType: 'Export declaration', required: true, description: 'Lodged export declaration with approval.' },
  { id: 'req-air-sli', serviceType: 'air-export', docType: "Shipper's letter of instruction", required: false, description: 'Handling instructions from the shipper.' },
  { id: 'req-dom-do', serviceType: 'domestic-delivery', docType: 'Delivery order', required: true, description: 'Customer release instruction for the cargo.' },
  { id: 'req-dom-wb', serviceType: 'domestic-delivery', docType: 'Trucking waybill', required: true, description: 'Signed by the shipper at pickup.' },
  { id: 'req-dom-ll', serviceType: 'domestic-delivery', docType: 'Load list', required: false, description: 'Itemized list signed by the shipper.' },
]

/* ---------- Builders ---------- */

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** [dueDate, completedDate?] per template milestone, in order. */
type MilestonePlan = Array<[string, string?]>

function planJob(job: Job, plan: MilestonePlan): { milestones: Milestone[]; tasks: Task[] } {
  const template = TEMPLATES.find((t) => t.serviceType === job.serviceType)!
  const short = job.id.slice(-5)
  const milestones: Milestone[] = []
  const tasks: Task[] = []
  template.milestones.forEach((tm, i) => {
    const [dueDate, doneDate] = plan[i]
    const milestone: Milestone = {
      id: `ms-${short}-${i + 1}`,
      jobId: job.id,
      templateMilestoneId: tm.id,
      name: tm.name,
      order: i + 1,
      dueDate,
      completedAt: doneDate ? at(doneDate, '16:00') : undefined,
      role: tm.role,
    }
    milestones.push(milestone)
    tm.defaultTasks.forEach((tt, j) => {
      const done = !!doneDate
      const completedAt = doneDate ? at(doneDate, '15:30') : undefined
      tasks.push({
        id: `tsk-${short}-${i + 1}${String.fromCharCode(97 + j)}`,
        jobId: job.id,
        milestoneId: milestone.id,
        title: tt.title,
        ownerId: done ? job.ownerId : undefined,
        dueDate,
        status: done ? 'done' : 'open',
        evidenceRequired: tt.evidenceRequired,
        evidence:
          done && tt.evidenceRequired && completedAt ? [file(`${short}_${slug(tt.title)}.pdf`, job.ownerId, completedAt)] : [],
        completedAt,
        completedBy: done ? job.ownerId : undefined,
        source: 'template',
      })
    })
  })
  return { milestones, tasks }
}

function patchTask(tasks: Task[], id: string, patch: Partial<Task>) {
  const index = tasks.findIndex((t) => t.id === id)
  if (index < 0) throw new Error(`Seed task ${id} not found`)
  tasks[index] = { ...tasks[index], ...patch }
}

interface VersionSeed {
  name: string
  by: string
  on: string
  status: DocVersion['status']
  reviewer?: string
  reviewedOn?: string
  reason?: string
}

function buildDocuments(job: Job, seeds: Record<string, VersionSeed[]>): DocumentRecord[] {
  return DOC_REQUIREMENTS.filter((r) => r.serviceType === job.serviceType).map((req) => {
    const versions: DocVersion[] = (seeds[req.docType] ?? []).map((v, i) => ({
      version: i + 1,
      file: file(v.name, v.by, at(v.on, '09:40')),
      status: v.status,
      reviewedBy: v.reviewer,
      reviewedAt: v.reviewedOn ? at(v.reviewedOn, '14:10') : undefined,
      rejectReason: v.reason,
    }))
    return {
      id: `doc-${job.id.slice(-5)}-${req.id.replace(/^req-[a-z]+-/, '')}`,
      jobId: job.id,
      docType: req.docType,
      required: req.required,
      status: versions.length ? versions[versions.length - 1].status : 'missing',
      versions,
    }
  })
}

const approved = (name: string, by: string, on: string, reviewer = 'u-dispatch', reviewedOn = on): VersionSeed => ({
  name,
  by,
  on,
  status: 'approved',
  reviewer,
  reviewedOn,
})

/* ---------- Jobs ---------- */

function buildJobs() {
  const jobs: Job[] = [
    {
      id: 'TMW-2026-00412',
      customer: 'Sample Trading Co.',
      consignee: 'Sample Trading Co., Pasig warehouse',
      serviceType: 'sea-fcl-import',
      origin: 'Yantian, CN',
      destination: 'Manila, PH',
      containerNo: 'SMPU 412087-3',
      blNo: 'SMPLYTN0412MNL',
      eta: '2026-09-26',
      ownerId: 'u-dispatch',
      status: 'at_port',
      billingState: 'not_ready',
    },
    {
      id: 'TMW-2026-00418',
      customer: 'Demo Logistics Corp.',
      consignee: 'Demo Retail Hub, Batangas',
      serviceType: 'domestic-delivery',
      origin: 'Valenzuela, Metro Manila',
      destination: 'Batangas City',
      blNo: 'WB-2026-18842',
      eta: '2026-09-27',
      ownerId: 'u-coord',
      status: 'delivered',
      billingState: 'not_ready',
    },
    {
      id: 'TMW-2026-00397',
      customer: 'Example Hardware Supply',
      consignee: 'Demo Imports Pte. Ltd., Singapore',
      serviceType: 'air-export',
      origin: 'Manila (MNL)',
      destination: 'Singapore (SIN)',
      blNo: '000-40397215',
      eta: '2026-09-18',
      ownerId: 'u-dispatch',
      status: 'delivered',
      billingState: 'not_ready',
    },
    {
      id: 'TMW-2026-00388',
      customer: 'Sample Foods Inc.',
      consignee: 'Sample Foods Inc., Mandaue plant',
      serviceType: 'sea-fcl-import',
      origin: 'Busan, KR',
      destination: 'Cebu, PH',
      containerNo: 'DEMU 388104-2',
      blNo: 'SMPLBUS0388CEB',
      eta: '2026-09-10',
      ownerId: 'u-coord',
      status: 'delivered',
      billingState: 'ready_for_finance',
      readyAt: at('2026-09-25', '10:30'),
      readyBy: 'u-coord',
    },
    {
      id: 'TMW-2026-00421',
      customer: 'Demo Electronics Mfg.',
      consignee: 'Sample Components KK, Chiba',
      serviceType: 'air-export',
      origin: 'Clark (CRK)',
      destination: 'Tokyo Narita (NRT)',
      eta: '2026-10-08',
      ownerId: 'u-dispatch',
      status: 'booked',
      billingState: 'not_ready',
    },
  ]
  const [j412, j418, j397, j388, j421] = jobs

  const p412 = planJob(j412, [
    ['2026-09-08', '2026-09-07'],
    ['2026-09-14', '2026-09-13'],
    ['2026-09-26', '2026-09-26'],
    ['2026-09-27'],
    ['2026-09-30'],
    ['2026-10-02'],
    ['2026-10-04'],
  ])
  patchTask(p412.tasks, 'tsk-00412-4a', { ownerId: 'u-dispatch', dueDate: '2026-09-26' })
  patchTask(p412.tasks, 'tsk-00412-4b', { ownerId: 'u-dispatch', dueDate: '2026-09-27' })
  patchTask(p412.tasks, 'tsk-00412-5a', { ownerId: 'u-dispatch', dueDate: '2026-09-30' })
  patchTask(p412.tasks, 'tsk-00412-5b', { ownerId: 'u-coord', dueDate: '2026-10-03' })
  p412.tasks.push({
    id: 'tsk-00412-c1',
    jobId: j412.id,
    milestoneId: 'ms-00412-4',
    title: 'Obtain corrected commercial invoice from shipper',
    ownerId: 'u-dispatch',
    dueDate: '2026-10-02',
    status: 'open',
    evidenceRequired: true,
    evidence: [],
    source: 'corrective',
    exceptionId: 'EXC-2026-0029',
  })

  const p418 = planJob(j418, [
    ['2026-09-22', '2026-09-22'],
    ['2026-09-23', '2026-09-23'],
    ['2026-09-25', '2026-09-25'],
    ['2026-09-26', '2026-09-26'],
    ['2026-09-27', '2026-09-27'],
    ['2026-09-30'],
  ])
  patchTask(p418.tasks, 'tsk-00418-6a', { ownerId: 'u-dispatch' })

  const p397 = planJob(j397, [
    ['2026-09-10', '2026-09-09'],
    ['2026-09-12', '2026-09-12'],
    ['2026-09-13', '2026-09-13'],
    ['2026-09-14', '2026-09-14'],
    ['2026-09-15', '2026-09-15'],
    ['2026-09-18', '2026-09-18'],
    ['2026-09-21', '2026-09-20'],
  ])

  const p388 = planJob(j388, [
    ['2026-08-25', '2026-08-24'],
    ['2026-08-30', '2026-08-29'],
    ['2026-09-10', '2026-09-10'],
    ['2026-09-12', '2026-09-12'],
    ['2026-09-15', '2026-09-14'],
    ['2026-09-17', '2026-09-17'],
    ['2026-09-19', '2026-09-19'],
  ])

  const p421 = planJob(j421, [
    ['2026-09-30'],
    ['2026-10-02'],
    ['2026-10-03'],
    ['2026-10-04'],
    ['2026-10-05'],
    ['2026-10-08'],
    ['2026-10-10'],
  ])
  patchTask(p421.tasks, 'tsk-00421-1a', { ownerId: 'u-dispatch' })
  patchTask(p421.tasks, 'tsk-00421-1b', { ownerId: 'u-dispatch', dueDate: '2026-10-02' })
  patchTask(p421.tasks, 'tsk-00421-2a', { ownerId: 'u-field' })

  const plans = [p412, p418, p397, p388, p421]

  const documents: DocumentRecord[] = [
    ...buildDocuments(j412, {
      'Bill of lading': [approved('SMPLYTN0412MNL_bill-of-lading.pdf', 'u-coord', '2026-09-14')],
      'Commercial invoice': [
        {
          name: 'Commercial-invoice_SMPL-INV-2291.pdf',
          by: 'u-coord',
          on: '2026-09-20',
          status: 'rejected',
          reviewer: 'u-dispatch',
          reviewedOn: '2026-09-24',
          reason: 'Carton count (240) does not match the packing list (250). Request a corrected invoice from the shipper.',
        },
      ],
      'Packing list': [approved('Packing-list_SMPL-PL-2291.pdf', 'u-coord', '2026-09-20', 'u-dispatch', '2026-09-24')],
      'Import entry': [{ name: 'Import-entry_draft.pdf', by: 'u-dispatch', on: '2026-09-28', status: 'pending_review' }],
    }),
    ...buildDocuments(j418, {
      'Delivery order': [approved('DO-00418.pdf', 'u-coord', '2026-09-22')],
      'Trucking waybill': [approved('WB-2026-18842.pdf', 'u-driver', '2026-09-25', 'u-coord')],
      'Load list': [approved('Load-list_00418.pdf', 'u-driver', '2026-09-25', 'u-coord')],
    }),
    ...buildDocuments(j397, {
      'Air waybill': [approved('AWB_000-40397215.pdf', 'u-dispatch', '2026-09-14', 'u-manager')],
      'Commercial invoice': [approved('Commercial-invoice_EXH-0397.pdf', 'u-dispatch', '2026-09-10', 'u-manager', '2026-09-11')],
      'Packing list': [approved('Packing-list_EXH-0397.pdf', 'u-dispatch', '2026-09-10', 'u-manager', '2026-09-11')],
      'Export declaration': [approved('Export-declaration_0397.pdf', 'u-dispatch', '2026-09-13', 'u-manager')],
      "Shipper's letter of instruction": [approved('SLI_0397.pdf', 'u-dispatch', '2026-09-10', 'u-manager', '2026-09-11')],
    }),
    ...buildDocuments(j388, {
      'Bill of lading': [approved('SMPLBUS0388CEB_bill-of-lading.pdf', 'u-coord', '2026-08-30')],
      'Commercial invoice': [
        {
          name: 'Commercial-invoice_SF-1182.pdf',
          by: 'u-coord',
          on: '2026-08-28',
          status: 'rejected',
          reviewer: 'u-dispatch',
          reviewedOn: '2026-08-29',
          reason: 'Unsigned copy. Ask the shipper for the signed invoice.',
        },
        approved('Commercial-invoice_SF-1182_signed.pdf', 'u-coord', '2026-08-31', 'u-dispatch', '2026-09-01'),
      ],
      'Packing list': [approved('Packing-list_SF-1182.pdf', 'u-coord', '2026-08-28', 'u-dispatch', '2026-08-29')],
      'Import permit': [approved('Import-permit_SF-0388.pdf', 'u-coord', '2026-09-02', 'u-manager', '2026-09-03')],
      'Import entry': [approved('Import-entry_0388.pdf', 'u-coord', '2026-09-11', 'u-dispatch', '2026-09-12')],
      'Certificate of origin': [approved('Certificate-of-origin_KR-0388.pdf', 'u-coord', '2026-09-02', 'u-dispatch', '2026-09-03')],
    }),
    ...buildDocuments(j421, {}),
  ]

  const damagePhotos: FileRef[] = [1, 2, 3].map((n) =>
    file(`Damage_pallet-3_photo-${n}.jpg`, 'u-driver', at('2026-09-27', '15:4' + n)),
  )

  const exceptions: ExceptionRecord[] = [
    {
      id: 'EXC-2026-0024',
      jobId: j388.id,
      stageMilestoneId: 'ms-00388-2',
      category: 'Delay',
      reason: 'Carrier rolled the container to the next sailing.',
      impact: { severity: 'low', delayDays: 4, description: 'ETA moved from Sep 6 to Sep 10. Customer informed.' },
      evidence: [file('Carrier-rollover-notice.pdf', 'u-coord', at('2026-08-27', '09:15'))],
      status: 'closed',
      raisedBy: 'u-coord',
      raisedAt: at('2026-08-27', '09:20'),
      decision: {
        by: 'u-manager',
        at: at('2026-08-27', '13:05'),
        outcome: 'approved',
        comment: 'Approved. Inform the customer of the new ETA.',
      },
      correctiveTaskIds: [],
      log: [
        { at: at('2026-08-27', '09:20'), by: 'u-coord', action: 'Raised' },
        { at: at('2026-08-27', '13:05'), by: 'u-manager', action: 'Approved', note: 'Inform the customer of the new ETA.' },
        { at: at('2026-09-10', '11:00'), by: 'u-coord', action: 'Closed', note: 'Vessel arrived Sep 10.' },
      ],
    },
    {
      id: 'EXC-2026-0029',
      jobId: j412.id,
      stageMilestoneId: 'ms-00412-4',
      category: 'Customs hold',
      reason: 'Customs placed the entry on hold over a quantity mismatch between the commercial invoice and packing list.',
      impact: {
        severity: 'medium',
        costPHP: 4500,
        delayDays: 3,
        description: 'Storage accrues until a corrected invoice is lodged. Delivery moves out about 3 days.',
      },
      evidence: [file('Customs-hold-notice_0412.pdf', 'u-coord', at('2026-09-25', '11:10'))],
      status: 'approved',
      raisedBy: 'u-coord',
      raisedAt: at('2026-09-25', '11:20'),
      decision: {
        by: 'u-manager',
        at: at('2026-09-25', '15:02'),
        outcome: 'approved',
        comment: 'Approved. Get a corrected invoice from the shipper; we absorb up to 3 days of storage.',
      },
      correctiveTaskIds: ['tsk-00412-c1'],
      log: [
        { at: at('2026-09-25', '11:20'), by: 'u-coord', action: 'Raised' },
        { at: at('2026-09-25', '15:02'), by: 'u-manager', action: 'Approved', note: 'We absorb up to 3 days of storage.' },
        { at: at('2026-09-25', '15:10'), by: 'u-manager', action: 'Corrective task created', note: 'Obtain corrected commercial invoice from shipper' },
      ],
    },
    {
      id: 'EXC-2026-0031',
      jobId: j418.id,
      stageMilestoneId: 'ms-00418-5',
      category: 'Damage',
      reason: 'Six cartons on pallet 3 were crushed in transit. The receiver noted the damage on the delivery receipt.',
      impact: {
        severity: 'high',
        costPHP: 18600,
        delayDays: 0,
        description: 'Glassware in 6 cartons is broken. A replacement run and a customer credit are likely.',
      },
      evidence: damagePhotos,
      status: 'pending_approval',
      raisedBy: 'u-driver',
      raisedAt: at('2026-09-27', '16:05'),
      correctiveTaskIds: [],
      log: [{ at: at('2026-09-27', '16:05'), by: 'u-driver', action: 'Raised', note: 'Raised from the delivery confirmation.' }],
    },
  ]

  const deliveries: Delivery[] = [
    { jobId: j412.id, status: 'scheduled', scheduledFor: '2026-10-02', expectedQty: 250, qtyUnit: 'cartons', photos: [] },
    {
      jobId: j418.id,
      status: 'delivered',
      scheduledFor: '2026-09-27',
      outcome: 'damaged',
      receiverName: 'Sample Receiver (warehouse lead)',
      deliveredAt: at('2026-09-27', '15:40'),
      expectedQty: 120,
      qtyUnit: 'cartons',
      deliveredQty: 120,
      damageNotes: 'Six cartons on pallet 3 crushed; glassware inside broken. Receiver signed with remarks.',
      affectedItems: 'Pallet 3, cartons 41 to 46',
      photos: damagePhotos,
      pod: { file: file('POD_TMW-2026-00418_signed.jpg', 'u-driver', at('2026-09-27', '15:52')), status: 'pending_review' },
      exceptionId: 'EXC-2026-0031',
    },
    {
      jobId: j397.id,
      status: 'delivered',
      scheduledFor: '2026-09-18',
      outcome: 'complete',
      receiverName: 'Demo Imports receiving desk',
      deliveredAt: at('2026-09-18', '11:15'),
      expectedQty: 18,
      qtyUnit: 'crates',
      deliveredQty: 18,
      photos: [file('Delivered-crates_0397.jpg', 'u-dispatch', at('2026-09-18', '11:20'))],
      pod: {
        file: file('POD_TMW-2026-00397_signed.pdf', 'u-dispatch', at('2026-09-19', '09:00')),
        status: 'approved',
        reviewedBy: 'u-dispatch',
        reviewedAt: at('2026-09-20', '10:00'),
      },
    },
    {
      jobId: j388.id,
      status: 'delivered',
      scheduledFor: '2026-09-17',
      outcome: 'complete',
      receiverName: 'Sample Foods receiving bay 2',
      deliveredAt: at('2026-09-17', '14:05'),
      expectedQty: 1,
      qtyUnit: 'container',
      deliveredQty: 1,
      photos: [file('Container-at-dock_0388.jpg', 'u-field', at('2026-09-17', '14:10'))],
      pod: {
        file: file('POD_TMW-2026-00388_signed.pdf', 'u-field', at('2026-09-18', '08:30')),
        status: 'approved',
        reviewedBy: 'u-coord',
        reviewedAt: at('2026-09-19', '09:45'),
      },
    },
  ]

  const charge = (
    id: string,
    jobId: string,
    kind: Charge['kind'],
    category: Charge['category'],
    description: string,
    amountPHP: number,
    evidenceName: string | null,
    by: string,
    on: string,
  ): Charge => ({
    id,
    jobId,
    kind,
    category,
    description,
    amountPHP,
    evidence: evidenceName ? [file(evidenceName, by, at(on, '13:00'))] : [],
    addedBy: by,
    addedAt: at(on, '12:45'),
  })

  const charges: Charge[] = [
    charge('chg-00412-1', j412.id, 'charge', 'Freight', "Ocean freight, Yantian to Manila, 1 x 40' HC", 86500, 'Invoice_SMPL-0412-FRT.pdf', 'u-dispatch', '2026-09-14'),
    charge('chg-00412-2', j412.id, 'expense', 'Port and terminal', 'Arrastre and wharfage', 12340, 'OR_port-charges_0412.pdf', 'u-dispatch', '2026-09-26'),
    charge('chg-00412-3', j412.id, 'expense', 'Warehousing', 'Container storage during customs hold', 4500, null, 'u-coord', '2026-09-28'),
    charge('chg-00418-1', j418.id, 'charge', 'Trucking', 'Trucking, Valenzuela to Batangas, 10-wheeler wing van', 24000, 'Invoice_DLC-00418.pdf', 'u-coord', '2026-09-27'),
    charge('chg-00418-2', j418.id, 'expense', 'Toll and fuel', 'Expressway tolls and fuel', 3850, null, 'u-driver', '2026-09-27'),
    charge('chg-00418-3', j418.id, 'expense', 'Labor', 'Unloading helpers (2)', 1200, null, 'u-driver', '2026-09-27'),
    charge('chg-00397-1', j397.id, 'charge', 'Freight', 'Air freight MNL to SIN, chargeable weight 412 kg', 58200, 'Invoice_EXH-0397-AF.pdf', 'u-dispatch', '2026-09-15'),
    charge('chg-00397-2', j397.id, 'charge', 'Documentation', 'Export documentation fee', 1500, 'Invoice_EXH-0397-DOC.pdf', 'u-dispatch', '2026-09-15'),
    charge('chg-00397-3', j397.id, 'expense', 'Brokerage', 'Export brokerage and declaration', 6500, 'OR_brokerage_0397.pdf', 'u-dispatch', '2026-09-13'),
    charge('chg-00397-4', j397.id, 'expense', 'Warehousing', 'Warehouse handling and palletizing', 2150, null, 'u-dispatch', '2026-09-12'),
    charge('chg-00388-1', j388.id, 'charge', 'Freight', 'Ocean freight, Busan to Cebu, 1 x 20ft', 72400, 'Invoice_SF-0388-FRT.pdf', 'u-coord', '2026-09-10'),
    charge('chg-00388-2', j388.id, 'charge', 'Brokerage', 'Import brokerage', 8500, 'Invoice_SF-0388-BRK.pdf', 'u-coord', '2026-09-12'),
    charge('chg-00388-3', j388.id, 'expense', 'Duties and taxes', 'Import duties and VAT', 31250, 'OR_duties_0388.pdf', 'u-coord', '2026-09-12'),
    charge('chg-00388-4', j388.id, 'expense', 'Trucking', 'Port to Mandaue plant trucking', 9800, 'OR_trucking_0388.pdf', 'u-coord', '2026-09-17'),
  ]

  const audit: AuditEntry[] = [
    { id: 'aud-seed-9', at: at('2026-09-28', '09:40'), by: 'u-dispatch', jobId: j412.id, action: 'Uploaded document', detail: 'Import entry, version 1' },
    { id: 'aud-seed-8', at: at('2026-09-27', '16:05'), by: 'u-driver', jobId: j418.id, action: 'Raised exception', detail: 'EXC-2026-0031 Damage' },
    { id: 'aud-seed-7', at: at('2026-09-27', '15:52'), by: 'u-driver', jobId: j418.id, action: 'Uploaded POD' },
    { id: 'aud-seed-6', at: at('2026-09-27', '15:40'), by: 'u-driver', jobId: j418.id, action: 'Confirmed delivery', detail: 'Damaged, 120 of 120 cartons' },
    { id: 'aud-seed-5', at: at('2026-09-25', '15:10'), by: 'u-manager', jobId: j412.id, action: 'Created corrective task', detail: 'Obtain corrected commercial invoice from shipper' },
    { id: 'aud-seed-4', at: at('2026-09-25', '15:02'), by: 'u-manager', jobId: j412.id, action: 'Approved exception', detail: 'EXC-2026-0029' },
    { id: 'aud-seed-3', at: at('2026-09-25', '11:20'), by: 'u-coord', jobId: j412.id, action: 'Raised exception', detail: 'EXC-2026-0029 Customs hold' },
    { id: 'aud-seed-2', at: at('2026-09-25', '10:30'), by: 'u-coord', jobId: j388.id, action: 'Marked ready for Finance' },
    { id: 'aud-seed-1', at: at('2026-09-24', '14:10'), by: 'u-dispatch', jobId: j412.id, action: 'Rejected document', detail: 'Commercial invoice, version 1' },
  ]

  return {
    jobs,
    milestones: plans.flatMap((p) => p.milestones),
    tasks: plans.flatMap((p) => p.tasks),
    documents,
    exceptions,
    deliveries,
    charges,
    audit,
  }
}

/** Returns a fresh copy of the demo data. Called on load and by "Reset demo data". */
export function createSeed(): DemoState {
  return {
    users: USERS.map((u) => ({ ...u })),
    templates: structuredClone(TEMPLATES),
    docRequirements: DOC_REQUIREMENTS.map((r) => ({ ...r })),
    ...buildJobs(),
  }
}
