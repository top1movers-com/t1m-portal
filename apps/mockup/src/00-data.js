/* ============================== DATA ==============================
   Only the demo USERS are seeded. Customers, inquiries, jobs and money start EMPTY and live in
   memory for this browser session: everything created while testing disappears on refresh.
   Requirements: docs/requirements/01–05. */
/* Finance scope: Accounting's part ends when the SOA is sent. No Finance dashboard, no payment tracking.
   Set to false to bring all of that back. Ledger: docs/requirements/finance-scope-removal-ledger.md */
const FINANCE_SOA_ONLY = true;
/* Accounting is limited to: take receipts or quotations, approve fund release, review liquidations. No billing, SOA, payments or profit in this portal (integrated later).
   Set to false to bring billing back. Ledger: docs/requirements/finance-scope-removal-ledger.md */
const ACCOUNTING_BASIC = true;
const TODAY = (()=>{ const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();

/* Dates are stored as "05 Oct 2026" strings, the way staff write them. */
const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function parseDMY(str){
  const m = str && String(str).match(/(\d{1,2}) (\w{3}) (\d{4})/);
  return m && MONTHS[m[2]]!=null ? new Date(+m[3], MONTHS[m[2]], +m[1]) : null;
}
function fmtDMY(d){ return String(d.getDate()).padStart(2,'0')+' '+Object.keys(MONTHS)[d.getMonth()]+' '+d.getFullYear(); }
function dmyToISO(str){ const d = parseDMY(str); return d ? d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') : ''; }
function isoToDMY(iso){ const m = String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3]+' '+Object.keys(MONTHS)[+m[2]-1]+' '+m[1] : ''; }
function daysUntil(str){ const d = parseDMY(str); return d ? Math.round((d - TODAY) / 86400000) : null; }
function daysBetween(a, b){ const x = parseDMY(a), y = parseDMY(b); return x && y ? Math.round((y - x) / 86400000) : null; }
function todayDMY(){ return fmtDMY(TODAY); }
function addDaysDMY(n, from){ const d = new Date(from ? parseDMY(from) : TODAY); d.setDate(d.getDate()+n); return fmtDMY(d); }
function nowStamp(){ const d = new Date(); let h = d.getHours(); const ap = h>=12?'PM':'AM'; h = h%12||12; return todayDMY()+' '+h+':'+String(d.getMinutes()).padStart(2,'0')+' '+ap; }
function shortDate(str){ return String(str||'').replace(/ \d{4}$/,''); }
function todayLong(){ return TODAY.toLocaleDateString('en-PH', { weekday:'long', day:'numeric', month:'long', year:'numeric' }); }

/* ============================== SERVICES ==============================
   Picked (any combination) when the Manager creates an inquiry. Scope and direction decide which
   ones make sense: Domestic has no customs or accreditation; Export has no importer accreditation. */
const SCOPES = ['Domestic','International'];
const DIRECTIONS = ['Import','Export'];
const SERVICE_ORDER = ['accreditation','freight','customs','trucking','warehousing','lto'];
const SERVICES = {
  accreditation:{ label:'Importer Accreditation', short:'Accreditation', icon:'shield' },
  freight:{ label:'Freight Forwarding', short:'Freight', icon:'ship' },
  customs:{ label:'Customs Clearance', short:'Customs', icon:'file' },
  trucking:{ label:'Trucking / Delivery', short:'Trucking', icon:'truck' },
  warehousing:{ label:'Warehousing & Distribution', short:'Warehousing', icon:'building' },
  lto:{ label:'LTO Transaction', short:'LTO', icon:'book' }
};
function serviceAllowed(key, scope, direction){
  if(scope==='Domestic') return !['customs','accreditation'].includes(key);
  if(direction==='Export') return key!=='accreditation';
  return true;
}
function serviceBlockReason(key, scope, direction){
  if(scope==='Domestic' && ['customs','accreditation'].includes(key)) return 'Not used for domestic shipments';
  if(direction==='Export' && key==='accreditation') return 'Importers only';
  return '';
}
const TRUCK_TYPES = ['Wing van','Closed van','Refrigerated van','4-wheeler','6-wheeler','10-wheeler','Flatbed','Boom truck','Tractor head with trailer'];
const CARGO_TYPES = ['FCL','LCL','RoRo','Air','Bulk','Breakbulk','Land (truck)'];
const CARGO_TYPE_SHORT = { 'FCL':'Full container load', 'LCL':'Shared container', 'RoRo':'Drive-on vehicles', 'Air':'By plane', 'Bulk':'Loose goods in the hold', 'Breakbulk':'Oversized, piece by piece', 'Land (truck)':'Road only' };
const CARGO_TYPE_INFO = {
  'FCL':'Full container load: one shipper fills a whole container. Adds the empty-container steps and, on imports with delivery, the container free-time clock.',
  'LCL':'Less than container load: the cargo shares a container with other shippers and is deconsolidated at the destination port.',
  'RoRo':'Roll-on/roll-off: vehicles and wheeled cargo are driven onto the vessel, not put in containers.',
  'Air':'Air freight: the cargo travels by plane on an air waybill.',
  'Bulk':'Loose, unpackaged goods such as grain, coal or liquids, loaded straight into the ship’s hold.',
  'Breakbulk':'Oversized or heavy goods that do not fit a container, loaded piece by piece.',
  'Land (truck)':'Moved by road only, with no sea or air leg.'
};
const CHANNELS = ['Email','Viber','WhatsApp','Phone call','Text message','Walk-in'];
const CURRENCIES = ['PHP','USD'];
const USD_PHP = 56; /* mock rate, used only to compare quoted vs billed in reports */

/* ============================== THE JOB PLAN (progress map) ==============================
   A job is ONE ordered list of steps, grouped into phases, built from scope + direction + services.
   The order follows how the work really happens:
     Import:   accreditation → shipping in → customs → delivery → warehousing → LTO
     Export:   LTO clearance → warehousing → booking → pickup to port → export customs → shipping out
     Domestic: booking → pickup → sea/land freight → delivery → warehousing → LTO
   Trucking is a delivery leg on imports and a pickup leg on exports; on domestic freight the inquiry
   says which legs Top1Movers covers (pickup, delivery or both). Steps are typical PH practice.
   Flags: proof = needs a file · lane = records the BOC lane · arrival / cargoOut / doRelease /
   emptyReturned = start or stop the free-time clocks. */
const STEP_HINT = {
  'Requirements complete':'Every document the agency asks for is in hand.',
  'Filed with BOC':'Application submitted to the Bureau of Customs.',
  'Under evaluation':'BOC is reviewing the application.',
  'Approved':'Accreditation granted. Attach the approval from the BOC. The client can now import.',
  'Booked with shipping line':'Space confirmed with the carrier. Record the shipping line.',
  'Departed origin port':'The vessel or flight has left the origin port.',
  'Arrived at port':'The cargo is at the Philippine port. Port free time starts.',
  'Cargo arrived at port':'The cargo (shipped by someone else) is at the port. Port free time starts.',
  'D/O released':'Local charges paid; the shipping line issued the Delivery Order so the cargo can be collected.',
  'Entry lodged':'The import entry is filed with BOC.',
  'Lane assigned':'BOC picked the lane: Green (no check), Yellow (document review) or Red (physical inspection).',
  'Duties paid':'Duties and taxes paid. Attach the payment receipt.',
  'BOC released':'Customs released the cargo.',
  'Port charges paid':'Arrastre, wharfage and any storage paid to the port.',
  'Gate pass':'The cargo is cleared to leave the port. Port free time stops.',
  'Truck scheduled':'Truck, driver and date booked. Record the driver and the truck details.',
  'Picked up at port':'The truck collected the cargo at the port.',
  'Picked up at shipper':'The truck collected the cargo from the shipper.',
  'Picked up':'The truck has the cargo.',
  'Delivered':'The cargo reached the delivery address. Attach the signed proof of delivery.',
  'Delivered to warehouse':'The cargo reached the Top1Movers warehouse. Attach the signed proof of delivery.',
  'Delivered to origin port':'The cargo is at the port of departure.',
  'Empty container returned':'The empty container is back with the shipping line. Attach the interchange or return receipt. Container free time stops.',
  'Received at warehouse':'The cargo is checked in at the warehouse.',
  'Stored':'Put away; storage billing runs from here.',
  'Release requested':'The client asked for the goods to go out.',
  'Dispatched':'The goods left the warehouse.',
  'Empty container released':'The shipping line released an empty container for loading.',
  'Empty container picked up':'The truck collected the empty container for loading.',
  'Cargo loaded at shipper':'The goods are packed into the container at the shipper.',
  'Cargo loaded':'The goods are packed and ready to go to the port.',
  'Delivered to port (gate-in)':'The cargo entered the port terminal.',
  'Gate-in at port':'The cargo entered the port terminal.',
  'Export declaration lodged':'Export declaration filed with BOC.',
  'Inspection / permits (if any)':'Any inspection or export permit needed for this cargo is done.',
  'Cleared for export':'BOC cleared the cargo to leave the country.',
  'Loaded on vessel':'The cargo is on board.',
  'Departed':'The vessel or flight has left.',
  'BL released to client':'The Bill of Lading is issued and given to the client.',
  'Booked':'Space confirmed with the shipping line.',
  'Loaded at origin port':'The cargo is on board at the port of departure.',
  'Arrived at destination port':'The cargo reached the destination port.',
  'Released at destination port':'The cargo is released at the destination port for pickup.',
  'Released to consignee':'The consignee collected the cargo at the destination port.',
  'Filed at LTO':'Papers submitted to the Land Transportation Office.',
  'Fees paid':'LTO fees paid.',
  'OR/CR released':'Official Receipt and Certificate of Registration (and plates) released.',
  'Clearance released':'The LTO clearance is released.',
  'Handed to client':'Documents handed over to the client.'
};
function buildPlan(services, scope, direction, cargoType, truckLegs){
  const has = s=>services.includes(s), fcl = cargoType==='FCL', out = [];
  const add = (svc, phase, names)=>names.forEach(n=>{ if(!n) return; const [name, flags] = Array.isArray(n) ? n : [n, {}]; out.push(Object.assign({ svc, phase, name }, flags)); });
  const simpleTrip = ['Truck scheduled','Picked up',['Delivered',{proof:true}]];
  const warehousing = ()=>{ if(has('warehousing')) add('warehousing','Warehousing',['Received at warehouse','Stored','Release requested','Dispatched']); };
  if(scope==='International' && direction==='Import'){
    if(has('accreditation')) add('accreditation','Importer accreditation',['Requirements complete','Filed with BOC','Under evaluation',['Approved',{proof:true}]]);
    if(has('freight')) add('freight','Shipping to the Philippines',['Booked with shipping line','Departed origin port',['Arrived at port',{arrival:true}],['D/O released',{doRelease:true}]]);
    if(has('customs')) add('customs','Customs clearance',[!has('freight') && ['Cargo arrived at port',{arrival:true}],'Entry lodged',['Lane assigned',{lane:true}],['Duties paid',{proof:true}],'BOC released','Port charges paid',['Gate pass',{cargoOut:true}]]);
    if(has('trucking')){
      if(has('freight') || has('customs')) add('trucking', has('warehousing') ? 'Trucking to the warehouse' : 'Delivery to the consignee',['Truck scheduled','Picked up at port', [has('warehousing') ? 'Delivered to warehouse' : 'Delivered',{proof:true}], fcl && ['Empty container returned',{emptyReturned:true,proof:true}]]);
      else add('trucking','Trucking',simpleTrip);
    }
    warehousing();
    if(has('lto')) add('lto','LTO registration',['Requirements complete','Filed at LTO','Fees paid','OR/CR released','Handed to client']);
  } else if(scope==='International'){
    if(has('lto')) add('lto','LTO clearance',['Requirements complete','Filed at LTO','Fees paid','Clearance released']);
    warehousing();
    if(has('freight')) add('freight','Booking',['Booked with shipping line', fcl && 'Empty container released']);
    if(has('trucking')){
      if(has('freight') || has('customs')) add('trucking','Pickup to the port',['Truck scheduled', fcl && 'Empty container picked up','Cargo loaded at shipper','Delivered to port (gate-in)']);
      else add('trucking','Trucking',simpleTrip);
    } else if(has('freight')) add('freight','Cargo to the port',['Cargo loaded','Gate-in at port']);
    if(has('customs')) add('customs','Export customs',['Export declaration lodged','Inspection / permits (if any)','Cleared for export']);
    if(has('freight')) add('freight','Shipping out',['Loaded on vessel','Departed','BL released to client']);
  } else {
    const legs = truckLegs && truckLegs.length ? truckLegs : ['pickup','delivery'];
    if(has('freight')){
      add('freight','Booking',['Booked']);
      if(has('trucking') && legs.includes('pickup')) add('trucking','Pickup from the shipper',['Truck scheduled','Picked up at shipper','Delivered to origin port']);
      add('freight','Sea / land freight',['Loaded at origin port','Departed','Arrived at destination port', has('trucking') && legs.includes('delivery') ? 'Released at destination port' : 'Released to consignee']);
      if(has('trucking') && legs.includes('delivery')) add('trucking','Delivery to the consignee',['Truck scheduled','Picked up at port',['Delivered',{proof:true}]]);
    } else if(has('trucking')) add('trucking','Trucking',simpleTrip);
    warehousing();
    if(has('lto')) add('lto','LTO registration',['Requirements complete','Filed at LTO','Fees paid','OR/CR released','Handed to client']);
  }
  return out;
}
/* Domestic freight + trucking: which legs Top1Movers covers. */
function needsTruckLegs(services, scope){ return scope==='Domestic' && services.includes('freight') && services.includes('trucking'); }
/* Document checklist per service. Editable in Settings (applies to new jobs). */
let DOC_TEMPLATES = {
  'freight:Import':['Bill of Lading / AWB','Arrival Notice','Delivery Order'],
  'freight:Export':['Booking Confirmation','Shipping Instructions','Bill of Lading'],
  'freight:Domestic':['Booking Confirmation','Domestic Bill of Lading'],
  'customs:Import':['Commercial Invoice','Packing List','Bill of Lading / AWB','Import Entry','Gate Pass'],
  'customs:Export':['Commercial Invoice','Packing List','Export Declaration'],
  'trucking':['Delivery Receipt / POD'],
  'warehousing':['Warehouse Receipt','Release Order'],
  'accreditation':['SEC / DTI Registration','BIR Certificate of Registration','Accreditation Application'],
  'lto':['Vehicle Release Documents','CTPL Insurance','OR/CR Copy']
};
/* Each document belongs to the step where it is really needed or produced.
   needs    = the step cannot be ticked until the document is received (real-world dependency).
   produces = the step creates the document; it is uploaded in that step's "Mark done" drawer.
   First matching step on the job (same service) wins. Documents with no match (or added by Ops)
   are only needed before closing. */
const DOC_RULES = {
  'Bill of Lading / AWB':[['Departed origin port','produces'],['Entry lodged','needs'],['Export declaration lodged','needs']],
  'Arrival Notice':[['Arrived at port','produces']],
  'Delivery Order':[['D/O released','produces']],
  'Commercial Invoice':[['Entry lodged','needs'],['Export declaration lodged','needs']],
  'Packing List':[['Entry lodged','needs'],['Export declaration lodged','needs']],
  'Import Entry':[['Entry lodged','produces']],
  'Gate Pass':[['Gate pass','produces']],
  'Booking Confirmation':[['Booked with shipping line','produces'],['Booked','produces']],
  'Shipping Instructions':[['Loaded on vessel','needs']],
  'Bill of Lading':[['BL released to client','produces']],
  'Domestic Bill of Lading':[['Loaded at origin port','produces']],
  'Export Declaration':[['Export declaration lodged','produces']],
  'Delivery Receipt / POD':[['Delivered','produces'],['Delivered to warehouse','produces']],
  'Warehouse Receipt':[['Received at warehouse','produces']],
  'Release Order':[['Release requested','produces']],
  'SEC / DTI Registration':[['Requirements complete','needs']],
  'BIR Certificate of Registration':[['Requirements complete','needs']],
  'Accreditation Application':[['Filed with BOC','produces']],
  'Vehicle Release Documents':[['Requirements complete','needs']],
  'CTPL Insurance':[['Requirements complete','needs']],
  'OR/CR Copy':[['OR/CR released','produces']]
};
function docTemplateKey(svc, scope, direction){
  if(svc==='freight') return 'freight:'+(scope==='Domestic'?'Domestic':direction);
  if(svc==='customs') return 'customs:'+direction;
  return svc;
}
const DOC_TEMPLATE_LABEL = { 'freight:Import':'Freight · International import', 'freight:Export':'Freight · International export', 'freight:Domestic':'Freight · Domestic',
  'customs:Import':'Customs · Import', 'customs:Export':'Customs · Export', trucking:'Trucking / Delivery', warehousing:'Warehousing & Distribution', accreditation:'Importer Accreditation', lto:'LTO Transaction' };

/* ============================== REASONS (dropdown + free text) ============================== */
const MANAGER_RETURN_REASONS = ['Pricing error','Missing charge','Wrong details','Other'];
const CLIENT_REASONS = ['Price too high','Transit time','Chose competitor','Shipment cancelled','No response','Other'];
const LANES = ['Green','Yellow','Red'];
const LANE_TONE = { Green:'success', Yellow:'warning', Red:'danger' };
const LANE_MEANING = { Green:'Released with no inspection (fastest).', Yellow:'BOC reviews the documents.', Red:'Physical inspection of the cargo (slowest).' };
const PAY_MODES = ['Cash','Check','Bank transfer'];

/* ============================== SETTINGS (Admin + Manager) ============================== */
const SETTINGS = { quoteValidityDays:15, awaitingClientDays:5, reminderEveryDays:2, unliquidatedDays:5, portFreeDays:5, containerFreeDays:7, paymentTermsDays:30 };

/* ============================== ROLES & PERMISSIONS ==============================
   Levels: Y = can do · A = assigned records only · V = view only · VA = view assigned · VL = view linked. */
const ROLES = ['Admin','Manager','Sales','Operations','Accounting'];
const ROLE_BLURB = {
  Admin:'Users, permissions and settings. Sees dashboards.',
  Manager:'Creates customers and inquiries, assigns staff, approves quotes, money and billing.',
  Sales:'Uploads quotations, sends them and records the client’s answer.',
  Operations:'Runs jobs: milestones, documents, issues, fund requests and liquidation.',
  Accounting: ACCOUNTING_BASIC ? 'Takes receipts and quotations, approves fund release and reviews liquidations.' : FINANCE_SOA_ONLY ? 'Releases funds, verifies liquidation, uploads the SOA and sends it to the client.' : 'Releases funds, verifies liquidation, bills the client and records payments.'
};
const PERM_GROUPS = [
  { group:'Administration', items:[
    ['users.manage','Add, edit roles, deactivate users', { Admin:'Y' }],
    ['perms.edit','Edit permission matrix', { Admin:'Y' }],
    ['settings.edit','System settings (tracks, checklists, defaults)', { Admin:'Y', Manager:'Y' }],
    ['audit.view','View audit log', { Admin:'Y', Manager:'Y' }] ]},
  { group:'Customers & Inquiry/Quotation', items:[
    ['customer.edit','Create/edit customer (others view)', { Manager:'Y', Sales:'V', Operations:'V', Accounting:'V' }],
    ['inquiry.create','Create inquiry, set scope/services, assign staff', { Manager:'Y' }],
    ['inquiry.view','View inquiries', { Manager:'Y', Sales:'V', Operations:'VL' }],
    ['quote.submit','Upload quote + submit for approval', { Manager:'Y', Sales:'A' }],
    ['quote.approve','Approve / return quote', { Manager:'Y' }],
    ['quote.send','Mark sent, record client outcome + proof', { Manager:'Y', Sales:'A' }],
    ['inquiry.close','Acknowledge acceptance / close inquiry', { Manager:'Y' }] ]},
  { group:'Job', items:[
    ['job.convert','Convert to job, assign Ops', { Manager:'Y' }],
    ['job.view','View job', { Manager:'Y', Operations:'A', Accounting:'V' }],
    ['job.update','Update milestones, upload documents', { Manager:'Y', Operations:'A' }],
    ['job.issue','Flag / resolve issue', { Manager:'Y', Operations:'A' }],
    ['job.freeDays','Set free days', { Manager:'Y', Operations:'A' }],
    ['job.submitClose','Submit job for closing', { Manager:'Y', Operations:'A' }],
    ['job.complete','Confirm job completed', { Manager:'Y' }] ]},
  { group:'Money', items:[
    ['fund.request','Create fund request', { Manager:'Y', Operations:'A' }],
    ['fund.approve','Approve / return fund request', { Manager:'Y' }],
    ['fund.release', ACCOUNTING_BASIC ? 'Approve fund release' : 'Release funds', { Accounting:'Y' }],
    ['fund.liquidate','Liquidate (upload receipts)', { Manager:'Y', Operations:'A' }],
    ['fund.verify', ACCOUNTING_BASIC ? 'Review liquidation' : 'Verify liquidation', { Accounting:'Y' }],
    ['money.view','See fund requests, costs, vendor bills', { Manager:'Y', Operations:'A', Accounting:'Y' }],
    ['bill.submit','Upload SOA + submit for approval', { Accounting:'Y' }],
    ['bill.approve','Approve / return billing', { Manager:'Y' }],
    ['bill.send', FINANCE_SOA_ONLY ? 'Send the SOA to the client' : 'Send billing, record payments', { Accounting:'Y' }],
    ['bill.view','See billing and payments', { Manager:'Y', Accounting:'Y' }],
    ['vendor.record', ACCOUNTING_BASIC ? 'Record receipts and quotations' : 'Record vendor bills', { Accounting:'Y' }],
    ['profit.view','View job profit', { Manager:'Y' }] ]},
  { group:'Reports', items:[
    ['dash.view', ACCOUNTING_BASIC ? 'View dashboards / analytics' : 'View dashboards / analytics / job profit', { Admin:'Y', Manager:'Y' }],
    ['mywork.view','“My Work” home page (to-do lists)', { Sales:'Y', Operations:'Y', Accounting:'Y' }] ]}
];
if(ACCOUNTING_BASIC) PERM_GROUPS.forEach(g=>{ g.items = g.items.filter(r=>!/^(bill|profit)\./.test(r[0])); });
/* The live matrix. DEFAULT keeps the original level so a re-ticked box restores it. */
const PERM = {}, PERM_DEFAULT = {}, PERM_LABEL = {};
PERM_GROUPS.forEach(g=>g.items.forEach(([key,label,lv])=>{ PERM_LABEL[key] = label; PERM_DEFAULT[key] = {}; PERM[key] = {}; ROLES.forEach(r=>{ PERM_DEFAULT[key][r] = lv[r]||''; PERM[key][r] = lv[r]||''; }); }));

/* ============================== DEMO USERS ==============================
   Many people so the demo feels real. Two founders hold several roles. Names are illustrative. */
let USERS = [];
(function seedUsers(){
  const list = [
    ['Mark Villar','Management',['Admin','Manager']],
    ['Grace Tan','Management',['Manager','Accounting']],
    ['Jun Robles','IT',['Admin']],
    ['Lorna Bautista','Management',['Manager']],
    ['Ana Cruz','Sales',['Sales']], ['Cathy Lim','Sales',['Sales']], ['Paolo Santiago','Sales',['Sales']],
    ['Mia Navarro','Sales',['Sales']], ['Dennis Ocampo','Sales',['Sales']], ['Rhea Mendoza','Sales',['Sales']],
    ['Ben Santos','Operations',['Operations']], ['Rico Domingo','Operations',['Operations']], ['Jessa Aquino','Operations',['Operations']],
    ['Noel Garcia','Operations',['Operations']], ['Karen Flores','Operations',['Operations']],
    ['Arnel Torres','Operations',['Operations']], ['Mike Salazar','Operations',['Operations']],
    ['Liza Ramos','Operations',['Operations']], ['Edwin Castro','Operations',['Operations']],
    ['Paolo Reyes','Accounting',['Accounting']], ['Joy Dizon','Accounting',['Accounting']], ['Carlo Pascual','Accounting',['Accounting']],
    ['Tess Villanueva','Sales',['Sales']], ['Ramon Lopez','Operations',['Operations']]
  ];
  USERS = list.map(([name, dept, roles], i)=>({ id:'U'+(i+1), name, dept, roles, active:true }));
})();
function emailForUser(name){ return name.toLowerCase().replace(/[^a-z ]/g,'').trim().split(' ').join('.')+'@top1movers.example'; }

/* ============================== SESSION STORES (start empty) ============================== */
let CUSTOMERS = [];
let INQUIRIES = [];
let JOBS = [];
let NOTIFS = [];        // { id, ts, to:{roles:[], users:[]}, text, link, readBy:[] }
let ADMIN_LOG = [];     // user / permission / settings events for the audit log
let INTAKE = [];        // "report an inquiry to the manager" notes from staff
const SEQ = { cust:0, inq:0, job:0, fr:0, vb:0, pay:0, issue:0, doc:0, notif:0, intake:0 };
const YEAR = TODAY.getFullYear();
function nextId(kind){
  SEQ[kind]++;
  if(kind==='cust') return 'CUST-'+String(SEQ.cust).padStart(3,'0');
  if(kind==='inq') return 'INQ-'+YEAR+'-'+String(SEQ.inq).padStart(4,'0');
  if(kind==='job') return 'SJ-'+YEAR+'-'+String(SEQ.job).padStart(5,'0');
  return kind.toUpperCase()+'-'+SEQ[kind];
}
const custById = id => CUSTOMERS.find(c=>c.id===id);
const inqById = id => INQUIRIES.find(i=>i.id===id);
const jobById = id => JOBS.find(j=>j.id===id);
function quoteNo(inq){ return inq.id.replace('INQ','QT'); }
/* Non-guessable public tracking code (the client tracking page accepts only this). */
function newTrackingCode(){
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', p = ()=>Array.from({length:4},()=>A[Math.floor(Math.random()*A.length)]).join('');
  let c; do { c = 'T1M-'+p()+'-'+p(); } while(JOBS.some(j=>j.trackingCode===c));
  return c;
}
