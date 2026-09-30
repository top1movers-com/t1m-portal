/* ============================== MOCK DATA ==============================
   Everything here is fictional. The portal's clock is frozen at Monday 28 Sep 2026 so that
   "overdue", "days left" and fee clocks read the same in every demo. */
const TODAY = new Date(2026, 8, 28);

/* Dates are stored as "28 Sep 2026" strings, the way staff write them. */
const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function parseDMY(str){
  const m = str && String(str).match(/(\d{1,2}) (\w{3}) (\d{4})/);
  return m && MONTHS[m[2]]!=null ? new Date(+m[3], MONTHS[m[2]], +m[1]) : null;
}
// <input type="date"> speaks YYYY-MM-DD; the app stores "05 Oct 2026".
function dmyToISO(str){ const d = parseDMY(str); return d ? d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') : ''; }
function isoToDMY(iso){ const m = String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3]+' '+Object.keys(MONTHS)[+m[2]-1]+' '+m[1] : ''; }
function daysUntil(str){ const d = parseDMY(str); return d ? Math.round((d - TODAY) / 86400000) : null; }
function todayDMY(){ return String(TODAY.getDate()).padStart(2,'0')+' '+Object.keys(MONTHS)[TODAY.getMonth()]+' '+TODAY.getFullYear(); }
function addDaysDMY(n){ const d = new Date(TODAY); d.setDate(d.getDate()+n); return String(d.getDate()).padStart(2,'0')+' '+Object.keys(MONTHS)[d.getMonth()]+' '+d.getFullYear(); }
function nowStamp(){ const d=new Date(); let h=d.getHours(); const ap=h>=12?'PM':'AM'; h=h%12||12; return todayDMY()+' '+h+':'+String(d.getMinutes()).padStart(2,'0')+' '+ap; }
function shortDate(str){ return String(str||'').replace(/ \d{4}$/,''); }

const CUSTOMERS = [
  { id:'CUST-01', name:'Sample Trading Co.', city:'Manila, PH', contact:{name:'Ana Reyes',email:'ana.reyes@sampletrading.example',phone:'+63 917 000 1234'},
    consignees:[{name:'Sample Trading Co. — Cebu Branch',address:'123 Osmeña Blvd, Cebu City, PH'}],
    deliveryAddresses:['Warehouse 4, Pier 15, Manila North Harbor, PH'],
    requirements:'Temperature-controlled container for perishable SKUs.', instructions:'Call the receiving dock 30 minutes before arrival, Mon–Fri 8AM–5PM only.' },
  { id:'CUST-02', name:'Golden Harvest Exports Inc.', city:'Batangas, PH', contact:{name:'Marco Villanueva',email:'marco.v@goldenharvest.example',phone:'+63 917 000 5678'},
    consignees:[{name:'Golden Harvest — Davao Depot',address:'Km 12 Diversion Rd, Davao City, PH'}],
    deliveryAddresses:['Bldg 7, Batangas Container Terminal, PH'],
    requirements:'Documentation must match Bureau of Customs HS codes exactly.', instructions:'Provide 48-hour pickup notice.' },
  { id:'CUST-03', name:'Pacific Rim Logistics Partners', city:'Subic, PH', contact:{name:'Liza Fernandez',email:'liza.f@pacificrimlp.example',phone:'+63 917 000 9012'},
    consignees:[{name:'Pacific Rim — Iloilo Cross-dock',address:'Sto Niño Wharf, Iloilo City, PH'}],
    deliveryAddresses:['Subic Bay Freeport Zone, Bldg 22, PH'],
    requirements:'Dry van only, no reefer.', instructions:'Consignee requires 1-hour delivery window confirmation by SMS.' },
  { id:'CUST-04', name:'BlueWave Distribution Corp.', city:'Cavite, PH', contact:{name:'Ramon Cruz',email:'ramon.cruz@bluewavedist.example',phone:'+63 917 000 3456'},
    consignees:[{name:'BlueWave — Laguna Hub',address:'LTI Compound, Biñan, Laguna, PH'}],
    deliveryAddresses:['PEZA Zone 3, Cavite, PH'],
    requirements:'Fragile goods — stacking limit 2 pallets high.', instructions:'No weekend deliveries.' },
  { id:'CUST-05', name:'Meridian Import Export Ltd.', city:'Manila, PH', contact:{name:'Gloria Tan',email:'gloria.tan@meridianie.example',phone:'+63 917 000 7890'},
    consignees:[{name:'Meridian — Pasig Distribution',address:'Ortigas Ave Ext, Pasig City, PH'}],
    deliveryAddresses:['Manila South Harbor, Berth 6, PH'],
    requirements:'Insurance certificate required for all shipments over ₱2,000,000.', instructions:'Deliver with 2-person unloading crew.' }
];
const custById = id => CUSTOMERS.find(c=>c.id===id);

/* Which dispatcher owns each customer's account. The dispatcher is the job's coordinator. */
const DISPATCHER_FOR_CUSTOMER = { 'CUST-01':'Ana Cruz', 'CUST-02':'Ana Cruz', 'CUST-03':'Ana Cruz', 'CUST-04':'Cathy Lim', 'CUST-05':'Ana Cruz' };
function coordinatorFor(customerId){ return DISPATCHER_FOR_CUSTOMER[customerId] || 'Ana Cruz'; }

/* An inquiry needs these before it can become a job. Anything empty is "missing information":
   you can still price the request, but you cannot run a shipment without it. */
const CONTAINER_TYPES = ['20ft dry','40ft dry','40ft high cube','40ft reefer','LCL (shared container)'];
const INQUIRY_REQUIRED = [
  { key:'containerType', label:'Container type' },
  { key:'pickupDate', label:'Requested pickup date' },
  { key:'deliveryAddress', label:'Consignee delivery address' }
];
let INQUIRIES = [
  { id:'INQ-2026-0041', customerId:'CUST-01', dateReceived:'10 Sep 2026', assignedTo:'Ana Cruz', cargo:'Canned goods, 2 containers', origin:'Shanghai, CN', portOfEntry:'Manila, PH', destination:'Cebu, PH',
    containerType:'20ft dry', pickupDate:'15 Sep 2026', deliveryAddress:'123 Osmeña Blvd, Cebu City, PH', status:'Converted', quotationId:'QT-2026-0041' },
  { id:'INQ-2026-0042', customerId:'CUST-02', dateReceived:'15 Sep 2026', assignedTo:'Ana Cruz', cargo:'Frozen goods, 1 reefer', origin:'Ningbo, CN', portOfEntry:'Batangas, PH', destination:'Davao, PH',
    containerType:'40ft reefer', pickupDate:'02 Oct 2026', deliveryAddress:'', status:'Quoted', quotationId:'QT-2026-0042' },
  { id:'INQ-2026-0043', customerId:'CUST-03', dateReceived:'22 Sep 2026', assignedTo:'Ana Cruz', cargo:'Electronics, palletized', origin:'Busan, KR', portOfEntry:'Subic, PH', destination:'Iloilo, PH',
    containerType:'', pickupDate:'', deliveryAddress:'Sto Niño Wharf, Iloilo City, PH', status:'New', quotationId:null },
  { id:'INQ-2026-0044', customerId:'CUST-04', dateReceived:'18 Sep 2026', assignedTo:'Cathy Lim', cargo:'Glassware, palletized', origin:'Ningbo, CN', portOfEntry:'Cavite, PH', destination:'Laguna, PH',
    containerType:'40ft dry', pickupDate:'25 Sep 2026', deliveryAddress:'LTI Compound, Biñan, Laguna, PH', status:'Declined', quotationId:null, declineReason:'Customer chose another forwarder on price.' }
];
function inquiryMissing(i){ return INQUIRY_REQUIRED.filter(f=>!String(i[f.key]||'').trim()).map(f=>f.label); }

let QUOTATIONS = {
  'QT-2026-0041': { id:'QT-2026-0041', inquiryId:'INQ-2026-0041',
    versions:[
      { v:1, date:'11 Sep 2026', total:186000, terms:'Net 30, FOB Manila', notes:'Initial quote based on standard dry container rate.' },
      { v:2, date:'12 Sep 2026', total:174500, terms:'Net 30, FOB Manila', notes:'Adjusted freight rate after customer requested 2 containers instead of 1.' },
      { v:3, date:'13 Sep 2026', total:174500, terms:'Net 45, FOB Manila', notes:'Payment terms revised to Net 45 per customer request.' }
    ],
    conforme:{ approvedBy:'Ana Reyes', date:'14 Sep 2026', method:'Signed conforme (PDF)', file:'conforme-QT-2026-0041-v3.pdf', version:3 } },
  'QT-2026-0042': { id:'QT-2026-0042', inquiryId:'INQ-2026-0042',
    versions:[ { v:1, date:'16 Sep 2026', total:245000, terms:'Net 30, FOB Batangas', notes:'Reefer container rate, temperature-controlled.' } ],
    conforme:null }
};

const OWNERS = ['Ana Cruz','Ben Santos','Cathy Lim','Rico Domingo'];

/* ---------- The workflow ----------
   Nine stages a shipment job moves through, in order. Customs Clearance has seven inner steps of
   its own; the main track stays scannable and shows customs progress as a small inner meter. */
const STATUS_STEPS = ['Booked','Documentation','Sailed','Arrived at Port','Customs Clearance','Out for Delivery','Delivered','Billing Ready','Closed'];
const STAGE_HINT = [
  'Booking confirmed with the shipping line.',
  'Collecting and checking the five shipping documents.',
  'The vessel has left the origin port.',
  'The container is at the Philippine port. Free storage days are running.',
  'Lodging the entry, paying duties and getting the goods released.',
  'Released and on a truck to the consignee.',
  'Received with proof of delivery. The empty container must go back.',
  'Money checked and handed to Finance.',
  'Nothing left to do.'
];
const PHASES = [
  { label:'Pre-shipment', stages:[0,1] },
  { label:'On the water', stages:[2] },
  { label:'Port & customs', stages:[3,4] },
  { label:'Delivery', stages:[5,6] },
  { label:'Finance', stages:[7,8] }
];
const CUSTOMS_PHASE = 'Customs Clearance';
const CUSTOMS_SUBSTAGES = ['Lodging Pending','Lodged','Assessment Pending','Payment Pending','Payment Completed','Release Pending','Released'];
const LANE_TONE = { 'Green':'success','Yellow':'warning','Red':'danger' };
const LANE_MEANING = { 'Green':'Light check: documents only, fastest release.', 'Yellow':'Document review by customs before release.', 'Red':'Physical inspection of the container. Takes longest.' };
const PRIORITY_TONE = { 'Low':'neutral','Normal':'neutral','High':'warning','Urgent':'danger' };
const SHIPPING_LINES = ['Maersk','MSC','CMA CGM','COSCO Shipping','Evergreen Marine','ONE (Ocean Network Express)'];

const FLAT_SEQUENCE = [];
STATUS_STEPS.forEach(phase=>{
  if(phase===CUSTOMS_PHASE) CUSTOMS_SUBSTAGES.forEach(sub=>FLAT_SEQUENCE.push({phase,sub}));
  else FLAT_SEQUENCE.push({phase,sub:null});
});
function flatIndexOf(phase, sub){ return FLAT_SEQUENCE.findIndex(f=>f.phase===phase && f.sub===(sub||null)); }
function jobFlatIndex(j){
  const phase = STATUS_STEPS[j.statusIndex];
  const sub = phase===CUSTOMS_PHASE && j.customs ? CUSTOMS_SUBSTAGES[j.customs.subIndex] : null;
  return flatIndexOf(phase, sub);
}

function crewFor(j){ const n = parseInt(String(j.id||'').replace(/\D/g,'').slice(-3), 10) || 0; return n%2 ? 'Ben Santos' : 'Rico Domingo'; }

/* The standard import task list. Each task belongs to the point in the workflow where it
   becomes today's work; some need proof (a file) before they can be marked done. */
const TASK_MILESTONES = [
  { name:'Verify shipment documents complete', evidence:true, atPhase:'Documentation' },
  { name:'Lodge customs entry', evidence:true, atPhase:CUSTOMS_PHASE, atSub:'Lodging Pending' },
  { name:'Pay duties and assessment', evidence:true, atPhase:CUSTOMS_PHASE, atSub:'Payment Pending', money:true },
  { name:'Secure delivery order', evidence:false, atPhase:CUSTOMS_PHASE, atSub:'Release Pending' },
  { name:'Book delivery truck', evidence:false, atPhase:CUSTOMS_PHASE, atSub:'Released' },
  { name:'Deliver to consignee', evidence:true, crew:true, atPhase:'Out for Delivery', via:'delivery' },
  { name:'Return empty container', evidence:false, crew:true, atPhase:'Delivered', detention:true }
];
const DOC_TEMPLATE = ['Commercial Invoice','Packing List','Bill of Lading','Certificate of Origin','Import Permit'];

function defaultTasks(j){
  const jobFlat = jobFlatIndex(j);
  return TASK_MILESTONES.map((t,i)=>{
    const flat = flatIndexOf(t.atPhase, t.atSub||null);
    const done = jobFlat > flat;
    const owner = t.crew ? crewFor(j) : coordinatorFor(j.customerId);
    return {
      id:'T'+(i+1), name:t.name, owner, flat,
      due: done ? null : (jobFlat===flat ? '30 Sep 2026' : '0'+(3+i)+' Oct 2026'),
      done, requiresEvidence:t.evidence, detention:!!t.detention, via:t.via||null, money:!!t.money,
      evidenceFile: done && t.evidence ? t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-evidence.pdf' : null,
      note:null, doneBy: done ? owner : null, doneOn: done ? '2026-09-'+String(10+i).padStart(2,'0') : null
    };
  });
}
function defaultDocuments(statusIndex){
  return DOC_TEMPLATE.map((name,i)=>({
    id:'D'+(i+1), name, version: statusIndex>0 ? 1 : 0,
    status: statusIndex>1 ? 'Approved' : (statusIndex>0 ? 'Pending Review' : 'Missing'),
    rejectReason:null, file: statusIndex>0 ? name.toLowerCase().replace(/ /g,'-')+'-v1.pdf' : null
  }));
}
function job(o){
  const j = Object.assign({
    exceptions:[], delivery:{confirmed:false}, charges:[], fundsReceived:[],
    customs:null, priority:'Normal', importExportFlag:'Import',
    storageDeadline:null, detentionDeadline:null,
    auditLog:[{ ts:'—', actor:'System', action:'Job created', detail:'Converted from inquiry/quotation. No re-keying.' }]
  }, o);
  if(!o.tasks) j.tasks = defaultTasks(j);
  if(!o.documents) j.documents = defaultDocuments(j.statusIndex);
  return j;
}
function releasedCustoms(lane){ return { subIndex:CUSTOMS_SUBSTAGES.indexOf('Released'), lane:lane||'Green', hold:null, paymentParty:null }; }

let JOBS = [
  job({ id:'SJ-2026-00101', customerId:'CUST-01', commodity:'Canned goods', origin:'Shanghai, CN', portOfEntry:'Manila, PH', destination:'Cebu, PH',
    containerNo:'TMWU-330218-4', blNo:'BL-2026-04471', consignee:'Sample Trading Co. — Cebu Branch', ownership:'Direct',
    shippingLine:'Maersk', vessel:'Maersk Shenzhen', voyage:'118E', declaredValue:1850000,
    eta:'20 Sep 2026', statusIndex:7, quotationId:'QT-2026-0041', billingReadyDays:1,
    customs:releasedCustoms('Green'),
    delivery:{ confirmed:true, date:'20 Sep 2026', receiver:'A. Reyes (Cebu Branch)', damage:false, podFile:'POD-SJ-2026-00101.pdf' },
    /* Matches apps/mockup/assets/sample-invoice-SJ-2026-00101.pdf, which is pre-built; keep in sync by hand. */
    charges:[ {id:'C1',desc:'Ocean freight',category:'Freight',amount:132000,evidence:'freight-invoice.pdf',type:'Reimbursable',quoted:true,paidDate:'14 Sep 2026',dueDate:null}, {id:'C2',desc:'Customs duty',category:'Duties & Taxes',amount:18400,evidence:'boc-receipt.pdf',type:'Reimbursable',quoted:true,paidDate:'17 Sep 2026',dueDate:null}, {id:'C3',desc:'Documentation fee',category:'Fees',amount:3500,evidence:'docfee-receipt.pdf',type:'Service fee',quoted:true,paidDate:null,dueDate:null} ],
    fundsReceived:[ {id:'F1',date:'10 Sep 2026',amount:135000,method:'Bank transfer',reference:'BT-778120',evidence:'deposit-slip-1.pdf'}, {id:'F2',date:'16 Sep 2026',amount:5000,method:'Bank transfer',reference:'BT-778392',evidence:'deposit-slip-2.pdf'} ],
    auditLog:[
      { ts:'13 Sep 2026 4:02 PM', actor:'Ana Cruz (Dispatcher)', action:'Client approval recorded', detail:'QT-2026-0041 v3 approved by Ana Reyes.' },
      { ts:'13 Sep 2026 4:10 PM', actor:'Ana Cruz (Dispatcher)', action:'Job created', detail:'Converted from INQ-2026-0041 / QT-2026-0041. No re-keying.' },
      { ts:'27 Sep 2026 5:10 PM', actor:'Grace Tan (Manager)', action:'Ready for Finance', detail:'Billing checklist complete. Handed to Finance.' }
    ] }),
  job({ id:'SJ-2026-00095', customerId:'CUST-02', commodity:'Frozen goods (reefer)', origin:'Ningbo, CN', portOfEntry:'Batangas, PH', destination:'Davao, PH',
    containerNo:'TMWU-118845-1', blNo:'BL-2026-04412', consignee:'Golden Harvest — Davao Depot', ownership:'Agent',
    shippingLine:'COSCO Shipping', vessel:'COSCO Fortune', voyage:'112W', declaredValue:920000, priority:'High',
    eta:'08 Oct 2026', statusIndex:1,
    documents:[
      { id:'D1', name:'Commercial Invoice', version:1, status:'Approved', rejectReason:null, file:'commercial-invoice-v1.pdf' },
      { id:'D2', name:'Packing List', version:1, status:'Approved', rejectReason:null, file:'packing-list-v1.pdf' },
      { id:'D3', name:'Bill of Lading', version:1, status:'Pending Review', rejectReason:null, file:'bill-of-lading-v1.pdf' },
      { id:'D4', name:'Certificate of Origin', version:2, status:'Rejected', rejectReason:'Signature block expired. Reissue with the current authorized signatory.', file:'certificate-of-origin-v2.pdf' },
      { id:'D5', name:'Import Permit', version:0, status:'Missing', rejectReason:null, file:null }
    ] }),
  job({ id:'SJ-2026-00088', customerId:'CUST-03', commodity:'Electronics (palletized)', origin:'Busan, KR', portOfEntry:'Subic, PH', destination:'Iloilo, PH',
    containerNo:'TMWU-552091-7', blNo:'BL-2026-04380', consignee:'Pacific Rim — Iloilo Cross-dock', ownership:'Direct',
    shippingLine:'ONE (Ocean Network Express)', vessel:'ONE Busan', voyage:'078N', declaredValue:640000,
    eta:'05 Oct 2026', statusIndex:2, storageDeadline:'10 Oct 2026' }),
  job({ id:'SJ-2026-00082', customerId:'CUST-04', commodity:'Glassware (palletized)', origin:'Ningbo, CN', portOfEntry:'Cavite, PH', destination:'Laguna, PH',
    containerNo:'TMWU-771002-9', blNo:'BL-2026-04355', consignee:'BlueWave — Laguna Hub', ownership:'Direct',
    shippingLine:'Maersk', vessel:'Maersk Ningbo', voyage:'203S', declaredValue:410000, priority:'High',
    eta:'22 Sep 2026', statusIndex:3, storageDeadline:'26 Sep 2026',
    tasks:(()=>{ const t=defaultTasks({id:'SJ-2026-00082', customerId:'CUST-04', statusIndex:3}); const k=t.findIndex(x=>x.name==='Lodge customs entry'); t[k]={...t[k], due:'24 Sep 2026'}; return t; })() }),
  job({ id:'SJ-2026-00077', customerId:'CUST-05', commodity:'Insured goods', origin:'Shanghai, CN', portOfEntry:'Manila, PH', destination:'Pasig, PH',
    containerNo:'TMWU-990117-2', blNo:'BL-2026-04301', consignee:'Meridian — Pasig Distribution', ownership:'Direct',
    shippingLine:'CMA CGM', vessel:'CMA CGM Shanghai', voyage:'091W', declaredValue:2650000,
    eta:'28 Sep 2026', statusIndex:5, detentionDeadline:'03 Oct 2026',
    customs:releasedCustoms('Green') }),
  job({ id:'SJ-2026-00130', customerId:'CUST-01', commodity:'Canned goods', origin:'Shanghai, CN', portOfEntry:'Manila, PH', destination:'Cebu, PH',
    containerNo:'TMWU-330301-8', blNo:'BL-2026-04599', consignee:'Sample Trading Co. — Cebu Branch', ownership:'Direct',
    shippingLine:'CMA CGM', vessel:'CMA CGM Shanghai', voyage:'094W', declaredValue:1980000, priority:'Urgent',
    eta:'24 Sep 2026', statusIndex:4, storageDeadline:'01 Oct 2026',
    customs:{ subIndex:CUSTOMS_SUBSTAGES.indexOf('Lodged'), lane:'Red', hold:{ type:'Under Inspection', note:'BOC flagged the shipment for physical examination at the container yard.', by:'Grace Tan', on:'26 Sep 2026' }, paymentParty:null } }),
  job({ id:'SJ-2026-00070', customerId:'CUST-01', commodity:'Canned goods', origin:'Shanghai, CN', portOfEntry:'Manila, PH', destination:'Cebu, PH',
    containerNo:'TMWU-330099-3', blNo:'BL-2026-04205', consignee:'Sample Trading Co. — Cebu Branch', ownership:'Direct',
    shippingLine:'Maersk', vessel:'Maersk Shenzhen', voyage:'115E', declaredValue:1720000,
    eta:'25 Sep 2026', statusIndex:6, detentionDeadline:'30 Sep 2026',
    customs:releasedCustoms('Green'),
    delivery:{ confirmed:true, date:'25 Sep 2026', receiver:'J. Manalo (Warehouse Supervisor)', damage:false, podFile:'POD-SJ-2026-00070.pdf' },
    charges:[ {id:'C1',desc:'Ocean freight',category:'Freight',amount:120000,evidence:'freight-invoice.pdf',type:'Reimbursable',quoted:true,paidDate:'15 Sep 2026',dueDate:null},
      {id:'C2',desc:'Customs duty',category:'Duties & Taxes',amount:16500,evidence:'boc-receipt.pdf',type:'Reimbursable',quoted:true,paidDate:'20 Sep 2026',dueDate:null},
      {id:'C3',desc:'Port handling fee',category:'Fees',amount:2400,evidence:null,type:'Reimbursable',quoted:true,paidDate:'24 Sep 2026',dueDate:null},
      {id:'C4',desc:'Extra storage fee',category:'Fees',amount:6800,evidence:'storage-receipt.pdf',type:'Reimbursable',quoted:false,paidDate:'27 Sep 2026',dueDate:null},
      {id:'C5',desc:'Documentation fee',category:'Fees',amount:3500,evidence:'docfee-receipt.pdf',type:'Service fee',quoted:true,paidDate:null,dueDate:null} ],
    fundsReceived:[ {id:'F1',date:'10 Sep 2026',amount:160000,method:'Bank transfer',reference:'BT-771554',evidence:'deposit-slip.pdf'} ] }),
  job({ id:'SJ-2026-00065', customerId:'CUST-02', commodity:'Frozen goods (reefer)', origin:'Ningbo, CN', portOfEntry:'Batangas, PH', destination:'Davao, PH',
    containerNo:'TMWU-118820-5', blNo:'BL-2026-04188', consignee:'Golden Harvest — Davao Depot', ownership:'Agent',
    shippingLine:'COSCO Shipping', vessel:'COSCO Ningbo', voyage:'109W', declaredValue:880000, priority:'High',
    eta:'23 Sep 2026', statusIndex:4, storageDeadline:'29 Sep 2026',
    customs:{ subIndex:CUSTOMS_SUBSTAGES.indexOf('Payment Pending'), lane:'Yellow', hold:null, paymentParty:'Client' },
    exceptions:[{ id:'EX1', stage:'Customs Clearance', category:'Documentation Discrepancy', reason:'HS code on the commercial invoice does not match the Bill of Lading.', impact:'High', impactNote:'Up to 3-day clearance delay', raisedBy:'Ben Santos (Warehouse Crew)', date:'26 Sep 2026', status:'Pending Approval', evidence:'discrepancy-photo.jpg', correctiveTaskId:null }] }),
  job({ id:'SJ-2026-00120', customerId:'CUST-02', commodity:'Frozen goods (reefer)', origin:'Ningbo, CN', portOfEntry:'Batangas, PH', destination:'Davao, PH',
    containerNo:'TMWU-118899-2', blNo:'BL-2026-04520', consignee:'Golden Harvest — Davao Depot', ownership:'Agent',
    shippingLine:'COSCO Shipping', vessel:'COSCO Harmony', voyage:'121W', declaredValue:760000,
    eta:'25 Sep 2026', statusIndex:4, storageDeadline:'30 Sep 2026',
    customs:{ subIndex:CUSTOMS_SUBSTAGES.indexOf('Payment Pending'), lane:'Green', hold:null, paymentParty:'Top1Movers' },
    charges:[ {id:'C1',desc:'Ocean freight',category:'Freight',amount:96000,evidence:'freight-invoice.pdf',type:'Reimbursable',quoted:true,paidDate:'20 Sep 2026',dueDate:null},
      {id:'C2',desc:'Customs duty',category:'Duties & Taxes',amount:18400,evidence:'boc-assessment.pdf',type:'Reimbursable',quoted:true,paidDate:null,dueDate:'30 Sep 2026'} ],
    fundsReceived:[ {id:'F1',date:'18 Sep 2026',amount:106000,method:'Bank transfer',reference:'BT-780043',evidence:'deposit-slip.pdf'} ] }),
  job({ id:'SJ-2026-00060', customerId:'CUST-03', commodity:'Electronics (palletized)', origin:'Busan, KR', portOfEntry:'Subic, PH', destination:'Iloilo, PH',
    containerNo:'TMWU-552040-2', blNo:'BL-2026-04099', consignee:'Pacific Rim — Iloilo Cross-dock', ownership:'Direct',
    shippingLine:'ONE (Ocean Network Express)', vessel:'ONE Busan', voyage:'074N', declaredValue:610000,
    eta:'20 Sep 2026', statusIndex:7, billingReadyDays:6,
    customs:releasedCustoms('Green'),
    delivery:{ confirmed:true, date:'20 Sep 2026', receiver:'R. Aquino (Site Lead)', damage:false, podFile:'POD-SJ-2026-00060.pdf' },
    charges:[ {id:'C1',desc:'Ocean freight',category:'Freight',amount:132000,markup:5000,evidence:'freight-invoice.pdf',type:'Reimbursable',quoted:true,paidDate:'12 Sep 2026',dueDate:null}, {id:'C2',desc:'Customs duty',category:'Duties & Taxes',amount:18400,evidence:'boc-receipt.pdf',type:'Reimbursable',quoted:true,paidDate:'15 Sep 2026',dueDate:null}, {id:'C3',desc:'Documentation fee',category:'Fees',amount:3500,evidence:'docfee-receipt.pdf',type:'Service fee',quoted:true,paidDate:null,dueDate:null} ],
    fundsReceived:[ {id:'F1',date:'08 Sep 2026',amount:100000,method:'Bank transfer',reference:'BT-768801',evidence:'deposit-slip-1.pdf'}, {id:'F2',date:'11 Sep 2026',amount:75000,method:'Bank transfer',reference:'BT-769015',evidence:'deposit-slip-2.pdf'} ] }),
  job({ id:'SJ-2026-00050', customerId:'CUST-04', commodity:'Glassware (palletized)', origin:'Ningbo, CN', portOfEntry:'Cavite, PH', destination:'Laguna, PH',
    containerNo:'TMWU-771050-1', blNo:'BL-2026-03950', consignee:'BlueWave — Laguna Hub', ownership:'Direct',
    shippingLine:'Maersk', vessel:'Maersk Ningbo', voyage:'198S', declaredValue:395000, priority:'Low',
    eta:'10 Sep 2026', statusIndex:8,
    customs:releasedCustoms('Green'),
    delivery:{ confirmed:true, date:'10 Sep 2026', receiver:'F. Domingo (Receiving)', damage:false, podFile:'POD-SJ-2026-00050.pdf' },
    charges:[ {id:'C1',desc:'Ocean freight',category:'Freight',amount:98000,evidence:'freight-invoice.pdf',type:'Reimbursable',quoted:true,paidDate:'02 Sep 2026',dueDate:null}, {id:'C2',desc:'Storage fee',category:'Fees',amount:4200,evidence:'storage-receipt.pdf',type:'Reimbursable',quoted:true,paidDate:'05 Sep 2026',dueDate:null}, {id:'C3',desc:'Documentation fee',category:'Fees',amount:2500,evidence:'docfee-receipt.pdf',type:'Service fee',quoted:true,paidDate:null,dueDate:null} ],
    fundsReceived:[ {id:'F1',date:'30 Aug 2026',amount:100000,method:'Bank transfer',reference:'BT-761220',evidence:'deposit-slip-1.pdf'}, {id:'F2',date:'04 Sep 2026',amount:4700,method:'Bank transfer',reference:'BT-762377',evidence:'deposit-slip-2.pdf'} ] }),
  job({ id:'SJ-2026-00110', customerId:'CUST-05', commodity:'Insured goods', origin:'Shanghai, CN', portOfEntry:'Manila, PH', destination:'Pasig, PH',
    containerNo:'TMWU-990201-6', blNo:'BL-2026-04502', consignee:'Meridian — Pasig Distribution', ownership:'Direct',
    shippingLine:'CMA CGM', vessel:'CMA CGM Shanghai', voyage:'095W', declaredValue:2100000,
    eta:'12 Oct 2026', statusIndex:0 })
];
const jobById = id => JOBS.find(j=>j.id===id);

/* A believable dated history for every seed job, so the audit trail and its date filter have
   something real to show. */
(function seedHistory(){
  const CREATED = { '00095':18, '00088':16, '00082':12, '00077':10, '00130':14, '00070':5, '00065':13, '00120':14, '00060':2, '00050':-6, '00110':27 };
  const END = { '00060':22, '00050':15, '00070':25 };
  const day = n => n>0 ? (String(n).padStart(2,'0')+' Sep 2026') : (String(31+n).padStart(2,'0')+' Aug 2026');
  const times = ['9:05 AM','10:20 AM','11:45 AM','1:30 PM','2:15 PM','3:40 PM','4:10 PM','9:50 AM'];
  JOBS.forEach(j=>{
    const key = j.id.slice(-5), d0 = CREATED[key];
    if(d0!=null && j.auditLog.length===1 && j.auditLog[0].ts==='—'){
      const who = coordinatorFor(j.customerId)+' (Dispatcher)';
      const end = END[key] || 27;
      const log = [{ ts:day(d0)+' '+times[0], actor:who, action:'Job created', detail:'Converted from inquiry/quotation. No re-keying.' }];
      for(let k=1;k<=j.statusIndex;k++){
        const dd = Math.max(d0, Math.round(d0 + k*(end-d0)/Math.max(1,j.statusIndex)));
        const label = STATUS_STEPS[k];
        log.push(label==='Billing Ready'
          ? { ts:day(dd)+' '+times[k%8], actor:'Grace Tan (Manager)', action:'Ready for Finance', detail:'Billing checklist complete. Handed to Finance.' }
          : label==='Closed'
          ? { ts:day(dd)+' '+times[k%8], actor:'Grace Tan (Manager)', action:'Job closed', detail:'Finance confirmed the handoff.' }
          : { ts:day(dd)+' '+times[k%8], actor:who, action:'Stage changed', detail:'Moved to '+label+'.' });
      }
      j.auditLog = log;
    }
    if(j.customs && j.customs.hold) j.auditLog.push({ ts:'26 Sep 2026 10:40 AM', actor:'Grace Tan (Manager)', action:'Customs hold placed', detail:j.customs.hold.type+': '+j.customs.hold.note });
    j.exceptions.forEach(e=>j.auditLog.push({ ts:e.date+' 8:55 AM', actor:e.raisedBy, action:'Exception raised', detail:e.category+': '+e.reason }));
    j.fundsReceived.forEach(fr=>j.auditLog.push({ ts:fr.date+' 3:00 PM', actor:'Grace Tan (Manager)', action:'Funds received', detail:'₱'+fr.amount.toLocaleString('en-PH')+' by '+fr.method.toLowerCase()+(fr.reference?' (ref '+fr.reference+')':'')+'.', finance:true }));
    j.auditLog = j.auditLog.map((a,i)=>({a,i})).sort((x,y)=>((parseDMY(x.a.ts)||0)-(parseDMY(y.a.ts)||0)) || (x.i-y.i)).map(o=>o.a);
  });
})();

let USERS = [
  { id:'U1', name:'Ana Cruz', dept:'Manila Ops', role:'Dispatcher', active:true },
  { id:'U2', name:'Ben Santos', dept:'Warehouse', role:'Warehouse Crew', active:true },
  { id:'U3', name:'Cathy Lim', dept:'Manila Ops', role:'Dispatcher', active:true },
  { id:'U4', name:'Rico Domingo', dept:'Warehouse', role:'Warehouse Crew', active:true },
  { id:'U5', name:'Grace Tan', dept:'Management', role:'Manager', active:true },
  { id:'U6', name:'Paolo Reyes', dept:'Finance', role:'Finance', active:true },
  { id:'U7', name:'Mark Villar', dept:'Management', role:'Admin', active:true }
];
const ROLES = ['Dispatcher','Warehouse Crew','Manager','Admin','Finance'];
const ROLE_BLURB = {
  'Dispatcher':'Runs customer work: inquiries, quotes, jobs, documents and tasks. No money.',
  'Warehouse Crew':'Field work on a phone: own tasks, deliveries with proof.',
  'Manager':'Decisions: exceptions, customs holds, client money, handoff to Finance.',
  'Admin':'Everything a Manager does, plus people and access.',
  'Finance':'Read-only: billing-ready jobs, money and the Billing Summary.'
};
const MODULES = ['Customer Mgmt','Inquiry & Quotation','Shipment Job','Milestones & Tasks','Document Mgmt','Exceptions & Approval','Delivery & POD','Charges & Billing','User & Role Mgmt','Dashboard & Reports','Audit Trail'];
/* Permission matrix (illustrative until agreed with the client). Rows gate what is RENDERED,
   not just what is disabled: a role never sees a menu it cannot use. */
const PERM = {
  'Dispatcher':      [1,1,1,1,1,1,0,0,0,1,0],
  'Warehouse Crew':  [0,0,1,1,1,1,1,0,0,0,0],
  'Manager':         [1,1,1,1,1,1,1,1,0,1,1],
  'Admin':           [1,1,1,1,1,1,1,1,1,1,1],
  'Finance':         [0,0,1,0,0,0,0,1,0,1,1]
};
const PERM_NOTE = {
  'Dispatcher':{ 'Dashboard & Reports':'Own customers', 'Document Mgmt':'Upload, approve, reject', 'Exceptions & Approval':'Raise only' },
  'Warehouse Crew':{ 'Shipment Job':'Assigned jobs only', 'Milestones & Tasks':'Own tasks', 'Document Mgmt':'Upload only', 'Exceptions & Approval':'Raise only' },
  'Finance':{ 'Shipment Job':'Read only', 'Charges & Billing':'Read only', 'Dashboard & Reports':'Finance view' }
};
const EXCEPTION_CATEGORIES = ['Documentation Discrepancy','Customs Hold','Valuation Dispute','Damage','Delay','Consignee Not Ready'];
