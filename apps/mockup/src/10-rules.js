/* ============================== WHO IS SIGNED IN, AND WHAT THEY MAY DO ==============================
   A user can hold several roles; they get the best level any of their roles has for an action.
   "A" levels apply only to records the person is assigned to. */
let CURRENT_USER = null; // a USERS entry
const me = () => CURRENT_USER ? CURRENT_USER.name : null;
function myRoles(){ return CURRENT_USER ? CURRENT_USER.roles : []; }
function hasRole(r){ return myRoles().includes(r); }
function rolesText(u){ return (u||CURRENT_USER).roles.join(' · '); }
function levelsFor(action){ return myRoles().map(r=>(PERM[action]||{})[r]||'').filter(Boolean); }
function isMine(rec){ const n = me(); return !!rec && [rec.staff, rec.ops, rec.sales].some(l=>(l||[]).includes(n)); }
/* Can I DO this action (on this record)? */
function can(action, rec){
  if(hasRole('Admin')) return true;
  const lv = levelsFor(action);
  if(lv.includes('Y')) return true;
  if(lv.includes('A')) return rec ? isMine(rec) : true;
  return false;
}
/* Can I SEE what this action covers (on this record)? */
function canView(action, rec){
  if(hasRole('Admin')) return true;
  const lv = levelsFor(action);
  if(lv.includes('Y') || lv.includes('V')) return true;
  if(rec && (lv.includes('A') || lv.includes('VA')) && isMine(rec)) return true;
  if(rec && lv.includes('VL') && rec.jobId){ const j = jobById(rec.jobId); if(j && isMine(j)) return true; }
  if(!rec && lv.some(l=>['A','VA','VL'].includes(l))) return true;
  return false;
}
function actorLabel(){ return CURRENT_USER ? CURRENT_USER.name+' ('+CURRENT_USER.roles[0]+')' : 'System'; }
function userByName(n){ return USERS.find(u=>u.name===n); }
function usersWithRole(r){ return USERS.filter(u=>u.active && u.roles.includes(r)); }
function logTo(rec, action, detail, ref){ rec.log.push({ ts:nowStamp(), actor:actorLabel(), action, detail, ref:ref||null }); }

/* ============================== NOTIFICATIONS (in-app bell; email at implementation) ============================== */
function notify(to, text, link){ NOTIFS.unshift({ id:nextId('notif'), ts:nowStamp(), to:{ roles:to.roles||[], users:to.users||[] }, text, link:link||null, readBy:[] }); }
function myNotifs(){ return CURRENT_USER ? NOTIFS.filter(n=>n.to.users.includes(me()) || n.to.roles.some(hasRole)) : []; }
function unreadCount(){ return myNotifs().filter(n=>!n.readBy.includes(me())).length; }

/* ============================== INQUIRY + QUOTATION ==============================
   Version statuses: For approval · Returned · Approved · Sent · Accepted · Renegotiated · Rejected · Expired.
   One timeline per inquiry; every version that did not go through keeps its reason. */
function latestV(i){ return i.versions[i.versions.length-1] || null; }
function sentExpired(v){ return !!v && v.status==='Sent' && daysUntil(v.validUntil)<0; }
const REVISE_LABEL = { Returned:'Returned by manager', Renegotiated:'Client renegotiating', Rejected:'Client rejected', Expired:'Quote expired' };
function inqStatus(i){
  if(i.closed==='lost') return { key:'lost', label:'Lost', tone:'neutral', icon:'x' };
  if(i.jobId) return { key:'converted', label:'Converted to job', tone:'neutral', icon:'check' };
  if(i.closed==='won') return { key:'won', label:'Won · ready for job', tone:'success', icon:'check' };
  const v = latestV(i);
  if(!v) return { key:'preparing', label:'Preparing quote', tone:'info', icon:'quote' };
  if(v.status==='For approval') return { key:'approval', label:'For approval', tone:'warning', icon:'clock' };
  if(v.status==='Sent') return sentExpired(v) ? { key:'expired', label:'Quote expired', tone:'warning', icon:'alert' } : { key:'awaiting', label:'Awaiting client', tone:'info', icon:'clock' };
  if(v.status==='Accepted') return { key:'accepted', label:'Accepted · awaiting manager', tone:'success', icon:'check' };
  return { key:'revise', label:'Revision needed', sub:REVISE_LABEL[v.status], tone:'warning', icon:'refresh' };
}
const OPEN_INQ = ['preparing','approval','revise','awaiting','expired','accepted','won'];
function awaitingDays(i){ const v = latestV(i); return v && v.status==='Sent' && v.sent ? daysBetween(v.sent.on, todayDMY()) : null; }
function amountText(v){ return v ? (v.currency==='USD'?'US$':'₱')+Number(v.amount).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'; }
function toPHP(v){ return v ? (v.currency==='USD' ? v.amount*USD_PHP : v.amount) : 0; }
function acceptedVersion(i){ return i.versions.slice().reverse().find(v=>v.status==='Accepted') || null; }

/* ---------- The request: fields follow the services ----------
   cargo · route (From/To) · port (customs without freight) · pickup / delivery addresses (trucking) ·
   ctype (cargo type) · wh (warehousing volume + period) · lto (vehicle + transaction) · deliv (delivery instructions). */
const LTO_TYPES = ['New registration','Renewal','Transfer of ownership','Export clearance'];
function truckEnds(services, scope, direction, legs){
  const has = s=>services.includes(s);
  if(!has('trucking')) return { pick:false, del:false };
  if(!has('freight') && !has('customs')) return { pick:true, del:true };
  if(scope==='International') return direction==='Import' ? { pick:false, del:true } : { pick:true, del:false };
  const L = legs && legs.length ? legs : ['pickup','delivery'];
  return { pick:L.includes('pickup'), del:L.includes('delivery') };
}
function reqVisible(services, scope, direction, legs){
  const has = s=>services.includes(s), v = new Set(), t = truckEnds(services, scope, direction, legs);
  if(['freight','customs','trucking','warehousing'].some(has)) v.add('cargo');
  if(has('freight')) v.add('route');
  if(has('customs') && !has('freight')) v.add('port');
  if(t.pick) v.add('pickup');
  if(t.del){ v.add('delivery'); v.add('deliv'); }
  if(['freight','customs','trucking'].some(has)) v.add('ctype');
  if(has('warehousing')) v.add('wh');
  if(has('lto')) v.add('lto');
  return v;
}
function reqWhat(x){ const r = x.request || {}; return r.commodity || (r.vehicle ? r.vehicle+(r.ltoType?' · '+r.ltoType:'') : '') || servicesText(x.services); }
function reqFrom(r){ return r.origin || r.pickupAddress || ''; }
function reqTo(r){ return r.destination || r.deliveryAddress || r.port || ''; }
function routeText(from, to){ return from || to ? (from||'—')+' → '+(to||'—') : ''; }

/* ============================== JOBS ============================== */
function buildMilestones(services, scope, direction, cargoType, truckLegs){
  return buildPlan(services, scope, direction, cargoType, truckLegs).map(m=>Object.assign({ done:false, date:null, by:null, remark:null, file:null, due:null }, m));
}
function buildDocs(services, scope, direction){
  const out = [];
  SERVICE_ORDER.filter(s=>services.includes(s)).forEach(svc=>(DOC_TEMPLATES[docTemplateKey(svc, scope, direction)]||[]).forEach(name=>{
    if(out.some(d=>d.name===name)) return; // a document shared by two services is collected once
    out.push({ id:nextId('doc'), svc, name, status:'Pending', file:null, by:null, on:null, versions:[], review:null });
  }));
  return out;
}
/* Link each document to its step (see DOC_RULES). Called once the job's milestones exist. */
function linkDocs(ms, docs){
  docs.forEach(d=>{ const r = (DOC_RULES[d.name]||[]).find(([step])=>ms.some(m=>m.svc===d.svc && m.name===step));
    if(r){ d.step = r[0]; d.kind = r[1]; } else { d.step = null; d.kind = null; } });
  return docs;
}
function stepDocs(j, m, kind){ return j.docs.filter(d=>d.step===m.name && d.svc===m.svc && (!kind || d.kind===kind)); }
/* Task-based access: Operations only work the services they were assigned on the job. Managers can work any. */
function opsFor(j, svc){ return (j.opsByService && j.opsByService[svc]) || j.ops; }
function canWork(j, svc){ return can('job.update', j) && (hasRole('Manager') || hasRole('Admin') || !svc || opsFor(j, svc).includes(me())); }
/* Some steps can only be ticked once the matching fund request has been approved and released. */
const FUND_STEPS = { 'Duties paid':{ purpose:'Duties & taxes', what:'duties' }, 'Port charges paid':{ purpose:'Port charges (arrastre, wharfage, storage)', what:'port charges' },
  'D/O released':{ purpose:'Shipping line local charges', what:'shipping line charges' },
  'Fees paid':{ purpose:'LTO fees', what:'LTO fees' } };
function fundGate(j, m){
  const rule = FUND_STEPS[m.name]; if(!rule) return null;
  if(j.waivers && j.waivers[m.name]) return null; // recorded as paid another way (client pays, vendor bills later)
  const fs = (j.funds||[]).filter(f=>f.purpose===rule.purpose);
  if(fs.some(f=>['Released','Liquidated','Verified'].includes(f.status))) return null;
  const open = fs.find(f=>['For approval','Approved','Returned'].includes(f.status)) || null;
  const ref = open ? open.id+' · '+money(open.amount)+' · ' : '';
  const sub = !fs.length ? 'Request a “'+rule.purpose.split(' (')[0]+'” fund request first' : !open ? 'Request funds for the '+rule.what : ref+(open.status==='For approval' ? 'Waiting for the manager to approve it' : open.status==='Approved' ? 'Approved. Waiting for Accounting to release it' : 'Returned by the manager. Edit and resubmit');
  const badge = !open ? null : open.status==='For approval' ? { text:'Submitted · awaiting approval', tone:'info', icon:'clock' } : open.status==='Approved' ? { text:'Approved · awaiting release', tone:'success', icon:'check' } : { text:'Returned', tone:'warning', icon:'refresh' };
  return { label:'Funds for '+rule.what+' released', sub, fund:open, none:!open, badge, purpose:rule.purpose, what:rule.what, step:m.name };
}
function missingNeeds(j, m){ return stepDocs(j, m, 'needs').filter(d=>d.status!=='Received'); }
function nextMsIndex(j){ return j.ms.findIndex(m=>!m.done); }
function currentMs(j){ const k = nextMsIndex(j); return k<0 ? null : j.ms[k]; }
/* Consecutive steps with the same phase form one row of the progress map. */
function phasesOf(steps){ const out = []; steps.forEach(m=>{ const last = out[out.length-1]; if(last && last.phase===m.phase) last.ms.push(m); else out.push({ phase:m.phase, svc:m.svc, ms:[m] }); }); return out; }
function jobTracks(j){ return phasesOf(j.ms); }
function stageText(j){
  if(j.status==='Completed') return 'Completed';
  if(j.status==='For closing') return 'For closing';
  const m = currentMs(j);
  return m ? m.phase+' · '+m.name : 'All milestones done';
}
function openIssue(j){ return j.issues.find(excHeld) || null; }
function msByFlag(j, flag){ return j.ms.find(m=>m[flag]) || null; }
function laneOf(j){ const m = msByFlag(j,'lane'); return m && m.done ? m.laneValue : null; }
function pendingDocs(j){ return j.docs.filter(d=>d.status!=='Received'); }

/* ---------- Free-time counter (display only) ----------
   PORT clock: Arrived → Gate pass (storage + demurrage). CONTAINER clock (FCL): Gate pass → Empty returned (detention). */
function isIntlImport(x){ return x.scope==='International' && x.direction==='Import'; }
function clockApplies(j){ return isIntlImport(j) && (j.services.includes('freight') || j.services.includes('customs')); }
function clockInfo(start, free, end){
  if(!start) return { state:'not-started' };
  if(free==null) return { state:'no-free-days', start };
  const used = end ? daysBetween(start, end) : daysBetween(start, todayDMY());
  const left = free - used;
  return { state: end ? 'stopped' : 'running', start, end, free, left, over: Math.max(0, -left), lastFree:addDaysDMY(free, start) };
}
function jobClocks(j){
  if(!clockApplies(j)) return [];
  const f = j.free || {};
  const arr = msByFlag(j,'arrival'), out = msByFlag(j,'cargoOut') || msByFlag(j,'doRelease'), ret = msByFlag(j,'emptyReturned');
  const arrival = arr ? (arr.done ? arr.date : null) : (f.arrival || null);
  const cargoOut = out && out.done ? out.date : null;
  const clocks = [Object.assign({ type:'port', label:'Port free time', risk:'storage + demurrage', ends: out ? out.name : 'Gate pass' }, clockInfo(arrival, f.portDays, cargoOut))];
  if(j.cargoType==='FCL' && ret) clocks.push(Object.assign({ type:'container', label:'Container free time', risk:'detention', ends:'Empty returned' }, clockInfo(cargoOut, f.containerDays, ret && ret.done ? ret.date : null)));
  return clocks;
}
function clockTone(c){ if(!c || c.left==null) return 'neutral'; if(c.state==='stopped') return c.over ? 'danger' : 'success'; return c.left<=0 ? 'danger' : c.left<=3 ? 'warning' : 'success'; }
function clockText(c){
  if(!c) return '';
  if(c.state==='not-started') return 'Starts at '+(c.type==='port'?'arrival':'gate pass');
  if(c.state==='no-free-days') return 'Free days not set';
  if(c.state==='stopped') return c.over ? 'Stopped · '+plural(c.over,'day')+' over' : 'Stopped within free time';
  if(c.left<0) return 'Overdue by '+plural(-c.left,'day');
  if(c.left===0) return 'Last free day today';
  return plural(c.left,'day')+' left';
}
function worstClock(j){ const r = jobClocks(j).filter(c=>c.state==='running'); return r.sort((a,b)=>a.left-b.left)[0] || null; }

function jobHealth(j){
  if(j.status==='Completed') return { tone:'neutral', label:'Completed', icon:'check' };
  if(openIssue(j)) return { tone:'danger', label:'On hold', icon:'lock' };
  if(j.issues.some(excActionLate) || jobOverdue(j)) return { tone:'warning', label:'Needs attention', icon:'alert' };
  const c = worstClock(j);
  if(c && c.left<=3) return { tone:'warning', label:'Needs attention', icon:'alert' };
  if(j.funds.some(f=>f.status==='Released' && daysBetween(f.release.on, todayDMY())>SETTINGS.unliquidatedDays)) return { tone:'warning', label:'Needs attention', icon:'alert' };
  if(j.status==='For closing') return { tone:'brand', label:'For closing', icon:'flag' };
  return { tone:'success', label:'On track', icon:'check' };
}
function closingGate(j){
  const msLeft = j.ms.filter(m=>!m.done).length, docs = pendingDocs(j), unres = unresolvedExc(j), cashOut = j.funds.filter(f=>f.status==='Released');
  return [
    { key:'ms', label:'All milestones done', ok:!msLeft, sub: msLeft ? plural(msLeft,'milestone')+' left' : null },
    { key:'docs', label:'All required documents received', ok:!docs.length, sub: docs.length ? docs.map(d=>d.name+(d.status==='Rejected'?' (rejected)':'')).join(', ') : null },
    { key:'funds', label:'Receipts submitted for all released funds', ok:!cashOut.length, sub: cashOut.length ? cashOut.map(f=>f.id+' '+money(f.amount)).join(', ') : null },
    { key:'issue', label:'All exceptions resolved', ok:!unres.length, sub: unres.length ? unres.map(x=>x.category+' ('+EXC_LABEL[x.status].toLowerCase()+')').join(', ') : null }
  ];
}

/* ============================== MONEY ==============================
   Fund request: For approval → (Returned) → Approved → Released → Liquidated → Verified.
   Those are the stored status keys; people see the friendly names in FR_LABEL (Awaiting approval, Sent back,
   Approved, Receipts due, Receipts submitted, Closed). Every liquidated amount is a job cost (pass-through). */
const FR_TONE = { 'For approval':'warning', Returned:'warning', Approved:'info', Released:'info', Liquidated:'brand', Verified:'success' };
const FR_ICON = { 'For approval':'clock', Returned:'refresh', Approved:'check', Released:'receipt', Liquidated:'receipt', Verified:'check' };
const FR_LABEL = { 'For approval':'Awaiting approval', Returned:'Sent back', Approved:'Approved', Released:'Receipts due', Liquidated:'Receipts submitted', Verified:'Closed' };
const FR_HOW = { cash:'Staff gets the money', vendor:'Accounting pays the vendor' };
const frDirect = f => f.how==='vendor';
const frDaysOut = f => f.release ? daysBetween(f.release.on, todayDMY()) : 0;
const frLate = f => f.status==='Released' && frDaysOut(f)>SETTINGS.unliquidatedDays;
const frLabel = f => frLate(f) ? 'Receipts overdue' : FR_LABEL[f.status];
const frTone = f => frLate(f) ? 'danger' : FR_TONE[f.status];
const frIcon = f => frLate(f) ? 'alert' : FR_ICON[f.status];
/* Who the request is waiting on right now. */
function frWaiting(f){ return { 'For approval':'Manager', Returned:f.by, Approved:'Accounting', Released:f.by, Liquidated:'Accounting' }[f.status] || ''; }
function money(n){ return '₱'+Number(n||0).toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2}); }
const sumOf = (list, fn)=>list.reduce((t,x)=>t+(fn(x)||0),0);
