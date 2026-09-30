/* ============================== WHO IS SIGNED IN, AND WHAT THEY MAY DO ============================== */
let CURRENT_USER = null; // { name, role }
function role(){ return CURRENT_USER ? CURRENT_USER.role : null; }
function can(moduleName){
  if(!moduleName) return true;
  if(!CURRENT_USER) return false;
  const idx = MODULES.indexOf(moduleName);
  return !!(PERM[CURRENT_USER.role] && idx>-1 && PERM[CURRENT_USER.role][idx]);
}
function isManagerLike(){ return ['Manager','Admin'].includes(role()); }
function isFinance(){ return role()==='Finance'; }
function isCrew(){ return role()==='Warehouse Crew'; }
function isDispatcher(){ return role()==='Dispatcher'; }
function canSeeFunds(){ return can('Charges & Billing'); }
function canManageFunds(){ return isManagerLike(); }
function canMoveStage(){ return ['Dispatcher','Manager','Admin'].includes(role()); }
function canApproveDocs(){ return ['Dispatcher','Manager','Admin'].includes(role()); }
function canUploadDocs(){ return ['Dispatcher','Warehouse Crew','Manager','Admin'].includes(role()); }
function canApproveExceptions(){ return isManagerLike(); }
function canRaiseException(){ return ['Dispatcher','Warehouse Crew','Manager','Admin'].includes(role()); }
function canConfirmDelivery(){ return can('Delivery & POD'); }
function canCompleteTask(t){ return ['Dispatcher','Manager','Admin'].includes(role()) || (isCrew() && t.owner===CURRENT_USER.name); }
function canReassign(){ return ['Dispatcher','Manager','Admin'].includes(role()); }
function actorLabel(){ return CURRENT_USER ? CURRENT_USER.name+' ('+CURRENT_USER.role+')' : 'System'; }
function userByName(n){ return USERS.find(u=>u.name===n); }
function roleOf(name){ const u = userByName(name); return u ? u.role : ''; }

/* Row-level scope. Dispatchers coordinate their own customers' jobs (they can open any job, but
   Home and Reports focus on theirs); Warehouse Crew only ever see jobs they have tasks on. */
function canSeeJob(j){
  if(!CURRENT_USER) return false;
  if(isCrew()) return j.tasks.some(t=>t.owner===CURRENT_USER.name);
  return true;
}
function myJobs(){
  if(isDispatcher()) return JOBS.filter(j=>coordinatorFor(j.customerId)===CURRENT_USER.name);
  if(isCrew()) return JOBS.filter(canSeeJob);
  return JOBS;
}
function log(j, action, detail, finance){ j.auditLog.push({ ts:nowStamp(), actor:actorLabel(), action, detail, finance:!!finance }); }
function visibleAudit(j){ return j.auditLog.filter(a=>!a.finance || canSeeFunds()); }

/* ============================== TASKS ==============================
   A task's status is worked out, not typed in: Done when completed; Overdue when its due date has
   passed; To do when the job has reached the point where it belongs; Upcoming otherwise. */
const TASK_TONE = { 'Done':'success', 'To do':'info', 'Upcoming':'neutral', 'Overdue':'danger' };
const TASK_ICON = { 'Done':'check', 'To do':'clock', 'Upcoming':'circle', 'Overdue':'alert' };
function taskStatus(j, t){
  if(t.done) return 'Done';
  const d = parseDMY(t.due);
  if(d && d < TODAY) return 'Overdue';
  if(t.flat==null || jobFlatIndex(j) >= t.flat) return 'To do';
  return 'Upcoming';
}
function openTasks(j){ return j.tasks.filter(t=>!t.done); }
function taskByName(j, name){ return j.tasks.find(t=>t.name===name); }

/* ============================== DOCUMENTS ============================== */
const DOC_TONE = {'Missing':'warning','Pending Review':'info','Approved':'success','Rejected':'danger'};
const DOC_ICON = {'Missing':'alert','Pending Review':'eye','Approved':'check','Rejected':'x'};
const DOC_LABEL = {'Missing':'Missing','Pending Review':'To review','Approved':'Approved','Rejected':'Rejected'};
/* Before Documentation starts, an empty document is simply not due yet, not a problem. */
function docsDue(j){ return j.statusIndex>=1; }
function docProblem(j, d){ return d.status==='Rejected' || (d.status==='Missing' && docsDue(j)); }

/* ============================== EXCEPTIONS ============================== */
const EX_TONE = {'Pending Approval':'danger','Approved':'success','Rejected':'neutral'};
const EX_ICON = {'Pending Approval':'alert','Approved':'check','Rejected':'x'};
const EX_LABEL = {'Pending Approval':'Awaiting review','Approved':'Approved, fix assigned','Rejected':'Rejected'};
function openException(j){ return j.exceptions.find(e=>e.status==='Pending Approval') || null; }
function isOnHold(j){ return !!openException(j); }
function customsHold(j){ return (j.customs && j.customs.hold && STATUS_STEPS[j.statusIndex]===CUSTOMS_PHASE) ? j.customs.hold : null; }
function correctiveOpen(j){ return j.tasks.filter(t=>t.corrective && !t.done); }

/* ============================== FEE CLOCKS ==============================
   Two countdowns decide real money: free storage at the port, and free detention on the shipping
   line's container once it leaves the port. Only one runs at a time. */
const FREE_WINDOW_DAYS = 7;
function deadlineInfo(j){
  const phase = STATUS_STEPS[j.statusIndex];
  const ret = j.tasks.find(t=>t.detention);
  const containerReturned = ret ? ret.done : false;
  const atPort = ['Arrived at Port', CUSTOMS_PHASE].includes(phase);
  const withTrucker = ['Out for Delivery','Delivered'].includes(phase) && !containerReturned;
  if(atPort && j.storageDeadline) return { type:'storage', label:'Free storage', who:'port', days:daysUntil(j.storageDeadline), deadline:j.storageDeadline };
  if(withTrucker && j.detentionDeadline) return { type:'detention', label:'Free detention', who:'shipping line', days:daysUntil(j.detentionDeadline), deadline:j.detentionDeadline };
  return null;
}
function clockTone(days){ return days==null ? 'neutral' : days<0 ? 'danger' : days<=2 ? 'warning' : 'neutral'; }
function clockText(info){
  if(!info || info.days==null) return '';
  if(info.days<0) return 'Fees running for '+Math.abs(info.days)+' day'+(Math.abs(info.days)===1?'':'s');
  if(info.days===0) return 'Last free day today';
  return info.days+' free day'+(info.days===1?'':'s')+' left';
}

/* ============================== MONEY ==============================
   A per-job notebook, not accounting. Reimbursable = paid for the client and billed back at cost.
   Service fee = Top1Movers' own income. Margin = service fees + markup − any cost we absorb. */
const GAP_HORIZON_DAYS = 7;
function money(n){ return '₱' + Number(n).toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function moneyShort(n){ const a = Math.abs(n); const s = a>=1e6 ? (a/1e6).toFixed(2).replace(/\.?0+$/,'')+'M' : a>=1e3 ? Math.round(a/1e3)+'K' : String(a); return (n<0?'−':'')+'₱'+s; }
function moneySigned(n){ return (n<0?'−':'')+money(Math.abs(n)); }
const sumOf = (list, fn)=>list.reduce((t,x)=>t+fn(x),0);
const isReimbursable = c => c.type!=='Service fee';
const isAbsorbed = c => !!(c.approval && c.approval.status==='Absorbed');
const isUnresolved = c => c.quoted===false && !c.approval;
function jobFunds(j){
  const received = sumOf(j.fundsReceived, f=>f.amount);
  const paidCosts = j.charges.filter(c=>isReimbursable(c) && c.paidDate && !isAbsorbed(c));
  const disbursed = sumOf(paidCosts, c=>c.amount);
  const balance = received - disbursed;
  const serviceFees = sumOf(j.charges.filter(c=>!isReimbursable(c) && !isAbsorbed(c)), c=>c.amount);
  const markup = sumOf(j.charges.filter(c=>isReimbursable(c) && !isAbsorbed(c)), c=>c.markup||0);
  const ourFees = serviceFees + markup;
  const settlement = balance - ourFees;
  const rows = [];
  j.fundsReceived.forEach(f=>rows.push({ kind:'in', date:f.date, d:parseDMY(f.date), label:f.method+(f.reference?' · '+f.reference:''), evidence:f.evidence, amount:f.amount, ref:f }));
  paidCosts.forEach(c=>rows.push({ kind:'out', date:c.paidDate, d:parseDMY(c.paidDate), label:c.desc, evidence:c.evidence, amount:c.amount, ref:c }));
  rows.sort((a,b)=>(a.d-b.d) || ((a.kind==='in'?0:1)-(b.kind==='in'?0:1)));
  let run = 0; rows.forEach(r=>{ run += r.kind==='in' ? r.amount : -r.amount; r.balance = run; });
  return { received, disbursed, balance, serviceFees, markup, ourFees, settlement, ledger:rows };
}
function awaitingClientDuty(j){ return STATUS_STEPS[j.statusIndex]===CUSTOMS_PHASE && !!j.customs && j.customs.paymentParty==='Client' && CUSTOMS_SUBSTAGES[j.customs.subIndex]==='Payment Pending'; }
function fundingGap(j){
  const f = jobFunds(j);
  const due = j.charges.filter(c=>isReimbursable(c) && !c.paidDate && !isAbsorbed(c) && c.dueDate && daysUntil(c.dueDate)!==null && daysUntil(c.dueDate)<=GAP_HORIZON_DAYS)
    .sort((a,b)=>parseDMY(a.dueDate)-parseDMY(b.dueDate));
  const need = sumOf(due, c=>c.amount);
  if(!due.length || need<=f.balance) return null;
  const cover = Math.max(0, f.balance), short = need - f.balance;
  const first = due[0], last = due[due.length-1];
  const text = (due.length===1 ? first.desc+' of '+money(need)+' is due '+shortDate(first.dueDate)+'.' : due.length+' payments totalling '+money(need)+' are due by '+shortDate(last.dueDate)+'.')+
    ' Client funds on hand cover '+money(cover)+', so we are short by '+money(short)+'.';
  const info = deadlineInfo(j);
  let storageText = '';
  if(info && info.type==='storage' && info.days!=null && info.days<=3){
    storageText = info.days<0 ? 'Free storage has already ended, so storage fees are building up.'
      : info.days===0 ? 'Free storage ends today; fees start tomorrow.'
      : 'Free storage ends in '+info.days+' day'+(info.days===1?'':'s')+', and the goods cannot leave until duties are paid.';
  }
  return { due, need, cover, short, text, storageText, first, funds:f };
}
const CHARGE_CATEGORIES = ['Freight','Duties & Taxes','Fees','Other'];
function categoryOf(c){ return CHARGE_CATEGORIES.includes(c.category) ? c.category : 'Other'; }
function quoteAmountForJob(j){
  if(j.quotationId && QUOTATIONS[j.quotationId]){ const q = QUOTATIONS[j.quotationId]; return q.versions[q.versions.length-1].total; }
  return Math.round((j.declaredValue||0)/6);
}
function jobCostMargin(j){
  const quoted = quoteAmountForJob(j);
  const billable = j.charges.filter(c=>!isAbsorbed(c));
  const reimbursable = sumOf(billable.filter(isReimbursable), c=>c.amount);
  const serviceFees = sumOf(billable.filter(c=>!isReimbursable(c)), c=>c.amount);
  const markup = sumOf(billable.filter(isReimbursable), c=>c.markup||0);
  const absorbedCost = sumOf(j.charges.filter(isAbsorbed), c=>c.amount);
  const actual = sumOf(j.charges, c=>c.amount);
  const billed = reimbursable + serviceFees + markup;
  const margin = serviceFees + markup - absorbedCost;
  const marginPct = billed ? (margin/billed*100) : 0;
  const byCategory = CHARGE_CATEGORIES.map(cat=>{ const amount = sumOf(j.charges.filter(c=>categoryOf(c)===cat), c=>c.amount); return { category:cat, amount, pct: actual ? amount/actual*100 : 0 }; });
  return { quoted, actual, reimbursable, serviceFees, markup, absorbedCost, billed, margin, marginPct, byCategory, hasQuotation: !!(j.quotationId && QUOTATIONS[j.quotationId]) };
}

/* ============================== BILLING CHECKLIST ============================== */
function billingChecklist(j){
  const open = openTasks(j);
  const unapproved = j.documents.filter(d=>d.status!=='Approved');
  const damage = j.delivery.confirmed && j.delivery.damage && !j.delivery.damageResolved;
  return [
    { key:'tasks', label:'All tasks done', sub: open.length ? open.length+' open: '+open.map(t=>t.name).join(', ') : null, ok: !open.length, tab:'tasks' },
    { key:'docs', label:'All documents approved', sub: unapproved.length ? unapproved.map(d=>d.name).join(', ') : null, ok: !unapproved.length, tab:'documents' },
    { key:'pod', label:'Delivery confirmed with proof, no unresolved damage', sub: !j.delivery.confirmed ? 'Not delivered yet' : damage ? 'Damage reported and not yet resolved' : null, ok: j.delivery.confirmed && !damage, tab:'delivery' },
    { key:'ex', label:'No open exceptions', ok: !openException(j), tab:'exceptions' },
    { key:'extra', label:'Extra charges decided (client approved or absorbed)', sub: j.charges.filter(isUnresolved).map(c=>c.desc+' '+money(c.amount)).join(', ')||null, ok: !j.charges.some(isUnresolved), tab:'money' },
    { key:'charges', label:'At least one charge recorded', ok: j.charges.length>0, tab:'money' }
  ];
}

/* ============================== HEALTH ==============================
   Two separate questions, two separate signals. WHERE is the job? Its stage, always neutral navy.
   IS IT OK? Its health: On track (green), Needs attention (amber), Blocked (red: it cannot move). */
function jobHealth(j){
  const s = j.statusIndex;
  if(s===8) return { tone:'neutral', label:'Closed', icon:'check', reasons:[] };
  const blocked = [], attention = [];
  const ex = openException(j); if(ex) blocked.push('Exception awaiting review: '+ex.category);
  const hold = customsHold(j); if(hold) blocked.push('Customs hold: '+hold.type);
  const overdue = j.tasks.filter(t=>taskStatus(j,t)==='Overdue'); if(overdue.length) attention.push(overdue.length+' overdue task'+(overdue.length>1?'s':''));
  const bad = j.documents.filter(d=>docProblem(j,d)); if(bad.length) attention.push(bad.length+' document'+(bad.length>1?'s':'')+' missing or rejected');
  const clock = deadlineInfo(j); if(clock && clock.days!=null && clock.days<=2) attention.push(clock.label+': '+clockText(clock).toLowerCase());
  if(canSeeFunds() && fundingGap(j)) attention.push('Short on client funds');
  if(canSeeFunds() && j.charges.some(isUnresolved)) attention.push('Extra charge needs a decision');
  if(j.delivery.confirmed && j.delivery.damage && !j.delivery.damageResolved) attention.push('Damage reported at delivery');
  if(blocked.length) return { tone:'danger', label:'Blocked', icon:'lock', reasons:blocked.concat(attention) };
  if(attention.length) return { tone:'warning', label:'Needs attention', icon:'alert', reasons:attention };
  if(s===7) return { tone:'brand', label:'With Finance', icon:'receipt', reasons:[] };
  return { tone:'success', label:'On track', icon:'check', reasons:[] };
}

/* ============================== THE NEXT-STEP ENGINE ==============================
   Every stage has a gate: the few things that must be true before a job can leave it. The job page
   shows the gate as a checklist, puts the fix next to every unmet line, and offers exactly one
   primary action. This replaces "pick the next status from a list where everything else is
   disabled": the rule is visible, so nobody has to know it in advance. */
function act(label, js, icon){ return { label, js, icon:icon||null }; }
function taskGateItem(j, name, sub){
  const t = taskByName(j, name);
  if(!t) return null;
  const st = taskStatus(j,t);
  return { label:'Task: '+name, sub: t.done ? 'Done by '+(t.doneBy||t.owner) : (sub || (t.owner+' · due '+shortDate(t.due)+(st==='Overdue'?' (overdue)':'')+(t.requiresEvidence?' · needs proof':''))),
    met:t.done, overdue: st==='Overdue', short: (t.via==='delivery'?'Confirm delivery with proof':name)+(st==='Overdue'?' (overdue)':''),
    act: t.done ? null : (t.via==='delivery' ? (canConfirmDelivery() ? act('Confirm delivery',"openConfirmDelivery('"+j.id+"')",'truck') : null)
      : canCompleteTask(t) ? act('Complete task',"openCompleteTask('"+j.id+"','"+t.id+"')",'check') : null) };
}
function docGateItems(j){
  const items = [];
  const ok = j.documents.filter(d=>d.status==='Approved');
  if(ok.length) items.push({ label: ok.length===j.documents.length ? 'All '+ok.length+' documents approved' : ok.length+' of '+j.documents.length+' documents approved', met:true, sub: ok.length===j.documents.length ? null : ok.map(d=>d.name).join(', '), act:null });
  j.documents.filter(d=>d.status!=='Approved').forEach(d=>{
    let a = null, sub = '';
    if(d.status==='Missing'){ sub = 'Missing. Nobody has uploaded it yet.'; if(canUploadDocs()) a = act('Upload',"openUploadDoc('"+j.id+"','"+d.id+"')",'upload'); }
    else if(d.status==='Rejected'){ sub = 'Rejected: '+d.rejectReason; if(canUploadDocs()) a = act('Replace',"openUploadDoc('"+j.id+"','"+d.id+"')",'upload'); }
    else { sub = 'Uploaded (v'+d.version+'), waiting for someone to check it.'; if(canApproveDocs()) a = act('Review',"openReviewDoc('"+j.id+"','"+d.id+"')",'eye'); }
    items.push({ label:d.name, sub, met:false, act:a, short:(d.status==='Missing'?'Upload ':d.status==='Rejected'?'Replace rejected ':'Review ')+d.name });
  });
  return items;
}
function stageGate(j){
  const s = j.statusIndex, id = j.id;
  const move = (label, icon)=>act(label, "advanceStage('"+id+"')", icon||'arrow-right');
  const corrective = correctiveOpen(j).map(t=>({ short:'Fix: '+t.name, label:'Fix: '+t.name, sub:t.owner+' · due '+shortDate(t.due)+' (from an approved exception)', met:false, act: canCompleteTask(t) ? act('Complete task',"openCompleteTask('"+id+"','"+t.id+"')",'check') : null }));
  if(s===0) return { to:STATUS_STEPS[1], items:[{ label:'Vessel and voyage booked', met:!!j.vessel, act:null }].concat(corrective),
    advance:move('Start documentation'), why:'The next stage is collecting and checking the five shipping documents.' };
  if(s===1) return { to:STATUS_STEPS[2], items:docGateItems(j).concat([taskGateItem(j,'Verify shipment documents complete')]).concat(corrective).filter(Boolean),
    advance:move('Confirm vessel sailed','ship'), why:'Customs will reject an entry built on wrong paperwork, so documents are settled before the goods sail.' };
  if(s===2) return { to:STATUS_STEPS[3], items:corrective,
    advance:move('Confirm arrival at port','anchor'), why:'Arrival starts the free storage clock at the port. ETA '+(j.eta||'to be confirmed')+'.' };
  if(s===3) return { to:STATUS_STEPS[4], items:corrective,
    advance:move('Start customs clearance','shield'), why:'Free storage '+(j.storageDeadline?'ends '+shortDate(j.storageDeadline):'is running')+'. Clearing customs quickly is what stops port fees.' };
  if(s===4){
    const sub = j.customs ? j.customs.subIndex : 0, cur = CUSTOMS_SUBSTAGES[sub], nxt = CUSTOMS_SUBSTAGES[sub+1];
    let items = [];
    if(cur==='Lodging Pending') items.push(taskGateItem(j,'Lodge customs entry'));
    if(cur==='Payment Pending'){
      if(j.customs.paymentParty==='Client') items.push({ label:'Client has released the duty payment', sub:'Chase '+custById(j.customerId).contact.name+' at '+custById(j.customerId).name+'.', met:false, act: canMoveStage() ? act('Client has paid',"openConfirmClientPaid('"+id+"')",'check') : null, waitingClient:true, short:'Waiting on the client to pay duties' });
      const gap = fundingGap(j);
      if(gap) items.push({ label:'Enough client funds to pay the duty', sub:'Short by '+money(gap.short)+'. '+(canSeeFunds()?'':'A Manager records the deposit.'), met:false, act: canManageFunds() ? act('Add funds received',"openAddFunds('"+id+"')",'wallet') : null, short:'Client funds short by '+money(gap.short) });
      else if(canSeeFunds() && j.charges.some(c=>c.dueDate && !c.paidDate)) items.push({ label:'Enough client funds to pay the duty', met:true, act:null });
      items.push(taskGateItem(j,'Pay duties and assessment'));
    }
    if(cur==='Release Pending') items.push(taskGateItem(j,'Secure delivery order'));
    if(cur==='Released') items.push(taskGateItem(j,'Book delivery truck'));
    items = items.concat(corrective).filter(Boolean);
    if(cur==='Released') return { to:STATUS_STEPS[5], items, advance:move('Send out for delivery','truck'), customs:true, why:'Customs has released the goods. Once a truck is booked the container can leave the port.' };
    const js = nxt==='Payment Pending' ? "openAdvanceCustoms('"+id+"')" : "advanceCustoms('"+id+"')";
    const whyC = { 'Lodging Pending':'The customs entry (the official declaration) has to be filed first.', 'Lodged':'Customs has the entry and will work out the duties.', 'Assessment Pending':'Once customs states the duty amount, it has to be paid.',
      'Payment Pending':'Customs releases nothing until duties are paid.', 'Payment Completed':'Paid. Next, customs processes the release.', 'Release Pending':'The shipping line issues a delivery order so the trucker can collect the container.' }[cur];
    return { to:'Customs: '+nxt, items, advance:act('Mark as '+nxt, js, 'arrow-right'), customs:true, why:whyC };
  }
  if(s===5) return { to:STATUS_STEPS[6], items:[taskGateItem(j,'Deliver to consignee','Receiver name and proof of delivery (photo or signed paper)')].concat(corrective).filter(Boolean),
    advance:null, why:'Delivered can only be set by confirming the delivery with proof. That proof is what makes the job billable.' };
  if(s===6){
    const items = billingChecklist(j).map(c=>{
      let a = null;
      if(!c.ok){
        if(c.key==='tasks'){ const t = openTasks(j)[0]; if(t && canCompleteTask(t)) a = act('Complete '+t.name.toLowerCase(),"openCompleteTask('"+id+"','"+t.id+"')",'check'); }
        else if(c.key==='extra' && canManageFunds()){ const ch = j.charges.find(isUnresolved); a = act('Decide',"openDecideCharge('"+id+"','"+ch.id+"')",'receipt'); }
        else if(c.key==='charges' && canManageFunds()) a = act('Add charge',"openAddCharge('"+id+"')",'plus');
        else if(c.key==='pod' && isManagerLike() && j.delivery.damage) a = act('Resolve damage',"openResolveDamage('"+id+"')",'check');
        else a = act('Open', "goTab('"+id+"','"+c.tab+"')", 'arrow-right');
      }
      return { label:c.label, sub:c.sub, met:c.ok, act:a };
    });
    const left = items.filter(x=>!x.met).length;
    return { to:STATUS_STEPS[7], short: left ? plural(left,'check')+' left before Finance' : null, items, advance: act('Mark ready for Finance',"markBillingReady('"+id+"')",'receipt'), managerOnly:true,
      why:'Finance receives one clean, checked job instead of chasing people for receipts.' };
  }
  if(s===7) return { to:STATUS_STEPS[8], items:[{ label:'Billing Summary handed to Finance', met:true, act:null }], advance:act('Close job',"advanceStage('"+id+"')",'check'), managerOnly:true,
    why:'Closing freezes the record. Everything stays in the history.' };
  return null;
}
function nextStep(j){
  const id = j.id, s = j.statusIndex;
  if(s===8) return { tone:'done', icon:'check', eyebrow:'Complete', title:'This job is closed', text:'Every stage, document, delivery proof and peso is on record. Nothing left to do.', items:[], primary:null, tab:'history', short:'Closed' };
  const ex = openException(j);
  if(ex){
    const mgr = canApproveExceptions();
    return { tone:'blocked', icon:'lock', eyebrow:'Blocked · exception', title:ex.category+': waiting for a manager’s decision',
      text:ex.reason+' The job is frozen until a Manager or Admin reviews it and names a fix.',
      items:[{ short:'Exception awaiting a manager', label:'Exception reviewed by a Manager or Admin', sub:'Raised by '+ex.raisedBy+' on '+shortDate(ex.date)+' · impact '+ex.impact, met:false, blocked:true, act: mgr ? act('Review',"openReviewException('"+id+"','"+ex.id+"')",'eye') : null }],
      primary: mgr ? act('Review exception',"openReviewException('"+id+"','"+ex.id+"')",'eye') : null,
      who: mgr ? null : 'Waiting on a Manager or Admin. Grace Tan has it on her Home page.', tab:'exceptions', short:'Exception: awaiting manager' };
  }
  const hold = customsHold(j);
  if(hold){
    const mgr = isManagerLike();
    return { tone:'blocked', icon:'lock', eyebrow:'Blocked · customs hold', title:'Customs: '+hold.type,
      text:hold.note+' Lane '+j.customs.lane+': '+LANE_MEANING[j.customs.lane]+' Customs steps are frozen until the hold is cleared.',
      items:[{ label:'Hold cleared by a Manager or Admin', sub:'Placed '+(hold.on?shortDate(hold.on):'')+(hold.by?' by '+hold.by:''), met:false, blocked:true, act: mgr ? act('Clear hold',"clearCustomsHold('"+id+"')",'check') : null }],
      primary: mgr ? act('Clear hold',"clearCustomsHold('"+id+"')",'check') : null,
      who: mgr ? 'Clear it only once customs has finished the inspection.' : 'Waiting on customs, then a Manager clears the hold.', tab:'tasks', short:'Customs hold' };
  }
  const g = stageGate(j);
  const unmet = g.items.filter(i=>!i.met);
  const waitingClient = unmet.some(i=>i.waitingClient);
  const mayAdvance = g.managerOnly ? isManagerLike() : canMoveStage();
  const firstAct = unmet.map(i=>i.act).find(Boolean) || null;
  const tabFor = ()=>{ if(s===1) return 'documents'; if(s===5) return 'delivery'; if(s===6||s===7) return canSeeFunds()?'money':'tasks'; return 'tasks'; };
  if(!unmet.length){
    if(s===5) return null; // unreachable: delivery item is never met before delivery moves the stage
    return { tone:'ready', icon:g.advance.icon||'arrow-right', eyebrow:'Next step', title:g.advance.label, text:'Everything needed to reach '+g.to+' is done. '+(g.why||''),
      items:s===0?[]:g.items, gateTitle:'Ready to leave '+(g.customs?'customs step '+CUSTOMS_SUBSTAGES[j.customs.subIndex]:STATUS_STEPS[s]),
      primary: mayAdvance ? g.advance : null,
      who: mayAdvance ? null : 'Waiting on '+(g.managerOnly?'a Manager or Admin':coordinatorFor(j.customerId)+' (Dispatcher)')+' to move it on.', tab:tabFor(), short:g.advance.label };
  }
  const n = unmet.length;
  return { tone: waitingClient ? 'waiting' : (firstAct ? 'ready' : 'waiting'), icon: waitingClient ? 'clock' : 'flag',
    eyebrow: waitingClient ? 'Waiting on the client' : 'To reach '+g.to,
    title: waitingClient ? 'Client to release the duty payment' : n+' thing'+(n>1?'s':'')+' left before '+g.to,
    text: g.why||'', items:g.items, gateTitle:'What must be true first',
    primary: firstAct, locked: g.advance ? g.advance.label : null,
    who: firstAct ? null : 'Waiting on '+(s===5?'the delivery crew ('+crewFor(j)+')':coordinatorFor(j.customerId)+' (Dispatcher)')+'.',
    tab:tabFor(), short: g.short || unmet[0].short || unmet[0].label };
}
