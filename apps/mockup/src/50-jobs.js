/* ============================== JOBS (Stage 2) ==============================
   A closed (won) inquiry becomes a job when the Manager converts it and assigns Operations. The
   progress map is one milestone track per selected service, chained in order. Ops ticks the next
   milestone (date, optional remark/file; "Duties paid" needs proof), uploads documents, flags issues.
   When everything is done Ops submits for closing; the Manager confirms; Accounting can then bill. */
function act(label, js, icon){ return { label, js, icon:icon||null }; }
function gateItemHtml(it){
  const ic = it.met ? 'check' : it.blocked ? 'lock' : 'circle';
  return '<li class="ds-gate__item"'+(it.met?' data-met':'')+(it.blocked?' data-blocked':'')+(it.hint?' title="'+esc(it.hint)+'"':'')+'>'+icon(ic)+
    '<div class="ds-gate__label">'+esc(it.label)+(it.sub?'<small'+(it.overdue?' class="ds-overdue"':'')+'>'+esc(it.sub)+'</small>':'')+'</div>'+
    ((it.badge||it.act)?'<span class="ds-row ds-row--tight">'+(it.badge?pill(it.badge.text, it.badge.tone, it.badge.icon, 'ds-pill--sm'):'')+(it.act?'<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="'+it.act.js+'">'+(it.act.icon?icon(it.act.icon):'')+esc(it.act.label)+'</button>':'')+'</span>':'<span></span>')+'</li>';
}
const HISTORY_ICON = { 'Inquiry created':'plus', 'Inquiry updated':'users', 'Quote submitted':'upload', 'Quote approved':'check', 'Quote returned':'refresh', 'Quote sent':'arrow-right', 'Quote expired':'clock',
  'Client accepted':'check', 'Client rejected':'x', 'Client renegotiating':'refresh', 'Inquiry closed (won)':'check', 'Inquiry closed (lost)':'x', 'Converted to job':'box', 'Job created':'box',
  'Milestone done':'check', 'Document uploaded':'upload', 'Document added':'plus', 'Issue flagged':'flag', 'Issue resolved':'check', 'Free days set':'clock', 'References updated':'file',
  'Submitted for closing':'flag', 'Sent back to Ops':'refresh', 'Job completed':'check', 'Fund request':'wallet', 'Fund request approved':'check', 'Fund request returned':'refresh',
  'Customer created':'building', 'Customer updated':'building', 'Signed in':'user', 'Signed out':'log-out', 'Charge added':'receipt', 'Charge removed':'x', 'Ready for Finance':'arrow-right', 'Received by Finance':'check', 'Due date changed':'calendar', 'Reminder emailed':'bell', 'Escalation emailed':'bell', 'Exception raised':'flag', 'Exception approved':'check', 'Exception sent back':'refresh', 'Exception resolved':'check', 'Document accepted':'check', 'Document rejected':'x', 'Funds released':'arrow-out', 'Liquidated':'receipt', 'Liquidation verified':'check', 'Receipts submitted':'receipt', 'Receipts confirmed':'check', 'Receipts sent back':'refresh', 'Paid another way':'info', 'Vendor bill recorded':'receipt', 'Billing submitted':'upload', 'Billing approved':'check',
  'Billing returned':'refresh', 'Billing sent':'arrow-right', 'Payment recorded':'arrow-in' };
function historyList(entries){
  if(!entries.length) return '<p class="ds-muted ds-small">Nothing yet.</p>';
  return '<ul class="ds-activity">'+entries.map(a=>'<li><span class="ds-activity__icon">'+icon(HISTORY_ICON[a.action]||'clock')+'</span><div><strong>'+esc(a.action)+'</strong> · '+esc(a.detail)+'<time>'+esc(a.ts)+' · '+esc(a.actor)+'</time></div></li>').join('')+'</ul>';
}
function phaseLabel(p, k){ return '<div class="ds-label" style="margin:var(--t1m-space-3) 0 var(--t1m-space-1)">'+icon(SERVICES[p.svc].icon)+' '+(k+1)+' · '+esc(p.phase)+'</div>'; }
/* The plan before a job exists (on the inquiry and in Settings). */
function progressPreview(services, scope, direction, cargoType, truckLegs, left){
  const ph = phasesOf(buildPlan(services, scope, direction, cargoType||'FCL', truckLegs));
  if(!ph.length) return '<p class="ds-muted ds-small">Pick services to see the plan.</p>';
  return ph.map((p,k)=>phaseLabel(p,k)+'<ol class="ds-track ds-track--compact'+(left?' ds-track--left':'')+'">'+p.ms.map(m=>'<li class="ds-track__step" title="'+esc(STEP_HINT[m.name]||'')+'">'+esc(m.name)+'</li>').join('')+'</ol>').join('')+
    (cargoType ? '' : '<p class="ds-muted ds-xs" style="margin-top:var(--t1m-space-2)">Shown for FCL. Other cargo types skip the container steps.</p>');
}
function pickPhase(jobId, k){
  STATE.mapPhase = STATE.mapPhase || {}; STATE.mapPhase[jobId] = k;
  const el = document.getElementById('progress-map-body'); if(el) el.innerHTML = progressMapHtml(jobById(jobId));
}
function progressMapHtml(j){
  const cur = currentMs(j), held = !!openIssue(j), tracks = jobTracks(j);
  if(!tracks.length) return '';
  const ci = cur ? Math.max(0, tracks.findIndex(t=>t.ms.includes(cur))) : tracks.length-1;
  const picked = STATE.mapPhase && STATE.mapPhase[j.id], vi = picked!=null && tracks[picked] ? picked : ci;
  const overview = '<div class="ds-label" style="margin:var(--t1m-space-3) 0 var(--t1m-space-1)">All phases</div><div class="ds-track ds-track--compact ds-track--left ds-track--phases" role="group" aria-label="All phases">'+tracks.map((t,k)=>{
    const d = t.ms.filter(m=>m.done).length, state = d===t.ms.length ? 'done' : k===ci ? (held?'blocked':jobOverdue(j)?'overdue':'current') : '';
    return '<div class="ds-track__step" data-state="'+state+'"'+(k===vi?' data-selected':'')+' role="button" tabindex="0" aria-label="Show '+esc(t.phase)+' steps" onclick="pickPhase(\''+j.id+'\','+k+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){ event.preventDefault(); pickPhase(\''+j.id+'\','+k+'); }">'+esc((k+1)+' · '+t.phase)+'<span class="ds-track__date">'+d+' of '+t.ms.length+' done</span></div>';
  }).join('')+'</div>';
  const t = tracks[vi];
  const detail = '<div class="ds-label" style="margin:var(--t1m-space-5) 0 var(--t1m-space-1)">'+(vi===ci?'Current phase':'Reviewing phase · click another phase above to switch')+'</div>'+phaseLabel(t, vi)+'<ol class="ds-track ds-track--compact ds-track--left" aria-label="'+esc(t.phase)+'">'+t.ms.map(m=>{
    const state = m.done ? 'done' : m===cur ? (held?'blocked':jobOverdue(j)?'overdue':'current') : '';
    return '<li class="ds-track__step" data-state="'+state+'"'+(m.done&&m.laneValue?' data-lane="'+esc(m.laneValue)+'"':'')+' title="'+esc(STEP_HINT[m.name]||'')+'">'+esc(m.name)+(m.laneValue?' · '+esc(m.laneValue):'')+'<span class="ds-track__date">'+(m.done?esc(shortDate(m.date)):'')+'</span></li>';
  }).join('')+'</ol>';
  return overview+detail;
}

/* ---------- Convert to job (Manager) ---------- */
function openConvert(inqId){
  const i = inqById(inqId), v = acceptedVersion(i), c = custById(i.customerId);
  if(!can('job.convert')) return denied('Only a Manager converts inquiries to jobs.');
  if(i.jobId){ go('#/jobs/'+i.jobId); return; }
  const ops = USERS.filter(u=>u.active && u.roles.includes('Operations')).map(u=>({ value:u.name, label:u.name, sub:u.dept }));
  const imp = isIntlImport(i) && (i.services.includes('freight') || i.services.includes('customs'));
  const f = (k,val)=>'<dt>'+esc(k)+'</dt><dd>'+esc(val)+'</dd>';
  openDrawer({ title:'Convert to job', sub:'From <span class="ds-mono">'+i.id+'</span> · accepted v'+v.v,
    body:'<form class="ds-stack--sm" id="convert-form" novalidate onsubmit="event.preventDefault(); convertToJob(\''+inqId+'\', this)">'+
      '<dl class="ds-facts">'+f('Customer',c.name)+f('Scope',scopeText(i))+f('Request',reqWhat(i))+(routeText(reqFrom(i.request), reqTo(i.request))?f('Route',routeText(reqFrom(i.request), reqTo(i.request))):'')+(needsTruckLegs(i.services, i.scope)?f('Trucking covers', (i.truckLegs||['pickup','delivery']).map(l=>l==='pickup'?'Pickup':'Delivery').join(' + ')):'')+(i.request.deliveryInstructions?f('Delivery instructions',i.request.deliveryInstructions):'')+f('Accepted quote','v'+v.v+' · '+amountText(v))+f('Sales (viewers)',i.staff.join(', '))+'</dl>'+
      '<div class="ds-label" style="margin-top:var(--t1m-space-2)">Assign Operations per service</div>'+
      SERVICE_ORDER.filter(k=>i.services.includes(k)).map(k=>'<div class="ds-field"><span class="ds-field__label">'+esc(SERVICES[k].label)+' <span class="ds-opt">one or more</span></span>'+multiDropdown('cv-ops-'+k,'ops_'+k, ops, [], 'Select operations staff', 'bottom')+errorSlot('ops_'+k)+'</div>').join('')+
      (['freight','customs','trucking'].some(s=>i.services.includes(s))
        ? '<div class="ds-field"><label for="cv-cargo">Cargo type</label>'+selectWrap('<select class="ds-select" id="cv-cargo" name="cargoType" onchange="document.getElementById(\'cv-cargo-info\').textContent = CARGO_TYPE_INFO[this.value]">'+CARGO_TYPES.map(t=>'<option value="'+esc(t)+'"'+(t===(i.request.cargoType||'FCL')?' selected':'')+'>'+esc(t+' · '+CARGO_TYPE_SHORT[t])+'</option>').join('')+'</select>')+'<p class="ds-field__hint" id="cv-cargo-info">'+esc(CARGO_TYPE_INFO[i.request.cargoType||'FCL'])+'</p></div>'
        : '<input type="hidden" name="cargoType" value="">')+
      '</form>',
    foot: drawerFoot('Create job','convert-form',{icon:'box'}) });
}
/* Builds the job from an accepted inquiry. Used by the Convert drawer and by the sample-data loader. */
function createJob(i, v, opsByService, cargoType){
  const ops = [].concat(...Object.values(opsByService)).filter((n,k,a)=>a.indexOf(n)===k);
  const j = { id:nextId('job'), inquiryId:i.id, quoteV:v.v, customerId:i.customerId, scope:i.scope, direction:i.direction, services:i.services.slice(), cargoType,
    commodity:reqWhat(i), origin:reqFrom(i.request), destination:reqTo(i.request), request:Object.assign({}, i.request), deliveryInstructions:i.request.deliveryInstructions||'',
    refs:{ booking:'', bl:'', containers:'' }, ops, opsByService, sales:i.staff.slice(), createdBy:me(), createdOn:todayDMY(),
    ms:buildMilestones(i.services, i.scope, i.direction, cargoType, i.truckLegs), truckLegs:i.truckLegs||null, docs:null, issues:[],
    free:null, status:'Active', funds:[], vendorBills:[], charges:[], handover:null, trackingCode:newTrackingCode(), log:[] };
  j.docs = linkDocs(j.ms, buildDocs(i.services, i.scope, i.direction));
  if(clockApplies(j)) j.free = { portDays:SETTINGS.portFreeDays, containerDays:SETTINGS.containerFreeDays, arrival:null };
  if(j.ms[0]) j.ms[0].due = addDaysDMY(stepDays(j.ms[0]));
  JOBS.push(j); i.jobId = j.id;
  logTo(i, 'Converted to job', j.id+' created. Operations: '+ops.join(', ')+'.');
  logTo(j, 'Job created', 'From '+i.id+' (accepted v'+v.v+', '+amountText(v)+'). Operations: '+ops.join(', ')+'. Tracking code '+j.trackingCode+'.');
  notify({ users:ops }, 'You were assigned to job '+j.id+' ('+custById(j.customerId).name+').', '#/jobs/'+j.id);
  notify({ roles:['Accounting'] }, 'New job '+j.id+' ('+custById(j.customerId).name+'). Fund requests and billing will come through it.', '#/jobs/'+j.id);
  return j;
}
function convertToJob(inqId, form){
  const i = inqById(inqId), v = acceptedVersion(i), fd = new FormData(form);
  const opsByService = {}; let bad = false;
  SERVICE_ORDER.filter(k=>i.services.includes(k)).forEach(k=>{ opsByService[k] = fd.getAll('ops_'+k); if(fieldError(form,'ops_'+k, opsByService[k].length?'':'Assign at least one person for '+SERVICES[k].label+'.')) bad = true; });
  if(bad) return;
  const j = createJob(i, v, opsByService, String(fd.get('cargoType')));
  closeDrawer(); STATE.justNext = j.id; showToast('Job '+j.id+' created.', 'success', 'box'); go('#/jobs/'+j.id);
}

/* ---------- Jobs list ---------- */
const JOB_FILTERS = [
  ['active','Active', j=>j.status!=='Completed'],
  ['attention','Needs attention', j=>jobHealth(j).tone==='warning'],
  ['overdue','Overdue', j=>!!jobOverdue(j)],
  ['hold','On hold', j=>!!openIssue(j) && j.status!=='Completed'],
  ['closing','For closing', j=>j.status==='For closing'],
  ['completed','Completed', j=>j.status==='Completed'],
  ['all','All', ()=>true]
];
function renderJobsList(){
  const base = JOBS.filter(j=>canView('job.view', j));
  const f = JOB_FILTERS.find(x=>x[0]===STATE.jobFilter) || JOB_FILTERS[0];
  const q = STATE.jobQuery.trim().toLowerCase();
  const rows = base.filter(j=>f[2](j) && (!STATE.jobService || j.services.includes(STATE.jobService)) &&
    (!q || [j.id, j.inquiryId, custById(j.customerId).name, j.refs.bl, j.refs.containers, j.trackingCode].some(x=>String(x||'').toLowerCase().includes(q)))).slice().reverse();
  const chip = ([k,l,fn])=>'<button class="ds-chip'+(k==='hold'?' ds-chip--danger':k==='attention'?' ds-chip--warning':'')+'" aria-pressed="'+(STATE.jobFilter===k)+'" onclick="STATE.jobFilter=\''+k+'\'; render()">'+l+'<span class="ds-chip__count">'+base.filter(fn).length+'</span></button>';
  const bills = canView('money.view');
  const body = rows.map(j=>{
    const c = custById(j.customerId), clk = worstClock(j);
    return '<tr data-href onclick="go(\'#/jobs/'+j.id+'\')"><td data-label="Job"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(c.name)+(routeText(j.origin, j.destination)?' · '+esc(routeText(j.origin, j.destination)):'')+'</span></span></td>'+
      '<td data-label="Services" style="white-space:normal">'+esc(servicesText(j.services))+'<div class="ds-muted ds-xs">'+esc(scopeText(j)+' · '+j.cargoType)+'</div></td>'+
      '<td data-label="Current step">'+stagePill(j)+'</td><td data-label="Health">'+healthPill(j)+'</td>'+
      '<td data-label="Free time">'+(clk?'<span class="'+(clockTone(clk)==='danger'?'ds-overdue':'ds-small')+'">'+icon('clock')+' '+esc(clockText(clk))+'</span>':'<span class="ds-muted3">—</span>')+'</td>'+
      '<td data-label="Next due">'+(()=>{ const di = j.status==='Active' ? dueInfo(currentMs(j)) : null; return di ? '<span class="'+(di.late?'ds-overdue':'ds-small')+'">'+(di.late?icon('alert')+' ':'')+esc(di.text)+'</span>' : '<span class="ds-muted3">—</span>'; })()+'</td>'+
      (bills?'<td data-label="Billing">'+(readinessApplies(j)?readinessPill(j, true):'<span class="ds-muted3">—</span>')+'</td>':'')+'</tr>';
  }).join('');
  return '<div class="ds-page-head"><div><h1>Jobs</h1><p class="ds-page-head__sub">'+(hasRole('Operations')&&!hasRole('Manager')?'Jobs you are assigned to. ':'')+'Where each job is, whether it is OK, and how much free time is left.</p></div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-stack--sm"><div class="ds-chips ds-chips--scroll">'+JOB_FILTERS.map(chip).join('')+'</div>'+
      '<div class="ds-row" style="flex-wrap:wrap"><div class="ds-search" style="flex:1;min-width:220px;max-width:420px">'+icon('search')+'<input class="ds-input" id="job-search" placeholder="Job, inquiry, customer, BL, container or tracking code" value="'+esc(STATE.jobQuery)+'" oninput="STATE.jobQuery=this.value; render()"></div>'+
      '<div style="width:220px">'+selectWrap('<select class="ds-select" id="job-svc" aria-label="Service" onchange="STATE.jobService=this.value; render()"><option value="">All services</option>'+options(SERVICE_ORDER.map(k=>({value:k,label:SERVICES[k].label})), STATE.jobService)+'</select>')+'</div>'+
      '<span class="ds-muted ds-small" style="margin-left:auto">'+plural(rows.length,'job')+'</span></div></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="jobs-table"><thead><tr><th>Job</th><th>Services</th><th>Current step</th><th>Health</th><th>Free time</th><th>Next due</th>'+(bills?'<th>Billing</th>':'')+'</tr></thead><tbody>'+
      (body || '<tr><td colspan="7">'+(base.length ? emptyState('search','No jobs match','Clear the search or pick another group.') : emptyState('box','No jobs yet','A job is created when a Manager converts a won inquiry.'))+'</td></tr>')+'</tbody></table></div></section>';
}

/* ---------- Job page ---------- */
function jobNext(j){
  const id = j.id, mgrs = usersWithRole('Manager').map(u=>u.name);
  if(j.status==='Completed'){
    const view = canView('money.view', j);
    return { tone:'done', icon:'check', eyebrow:'Completed', title:'Job completed',
      text:'Confirmed by '+j.completed.by+' on '+j.completed.on+'.'+(view ? ' Billing: '+readinessStatus(j).label+'.' : ''), items:[],
      primary: view ? act('Open billing',"goTab('"+id+"','billing')",'receipt') : null };
  }
  if(j.status==='For closing'){
    const mine = can('job.complete');
    return { tone: mine?'ready':'waiting', icon:'flag', eyebrow: mine?'Needs your confirmation':'Waiting on a manager', title:'Confirm the job is completed',
      text:'Submitted by '+j.submitted.by+' on '+j.submitted.on+'. Confirming marks the job as completed.',
      items:closingGate(j).map(g=>({ label:g.label, sub:g.sub, met:g.ok })), gateTitle:'Closing checklist',
      primary: mine ? act('Confirm completed',"openConfirmComplete('"+id+"')",'check') : null,
      secondary: mine ? act('Send back to Ops',"openSendBack('"+id+"')",'refresh') : null, who: mine ? null : waitingOn(mgrs,'Manager') };
  }
  const iss = openIssue(j);
  if(iss){
    const mgr = can('exc.approve'), mine = can('job.issue', j), back = iss.status==='Returned';
    return { tone:'blocked', icon:'lock', eyebrow:'On hold · exception '+(back?'sent back':'waiting for approval'), title:iss.category, text:iss.reason+' (raised by '+iss.by+' on '+iss.on+'). Milestones are frozen until a Manager approves how it will be handled.',
      items:[{ label:'A Manager approves the exception', sub: back ? 'Sent back: '+iss.review.comment : 'Impact: '+iss.impact, met:false, blocked:true, act: back ? (mine ? act('Edit & resubmit',"openFlagException('"+id+"','"+iss.id+"')",'refresh') : null) : (mgr ? act('Review',"openReviewException('"+id+"','"+iss.id+"')",'eye') : null) }],
      primary: back ? (mine ? act('Edit and resubmit',"openFlagException('"+id+"','"+iss.id+"')",'refresh') : null) : (mgr ? act('Review exception',"openReviewException('"+id+"','"+iss.id+"')",'eye') : null),
      who: back ? (mine ? null : 'Waiting on '+j.ops.join(', ')+' (Operations).') : (mgr ? null : waitingOn(mgrs,'Manager')) };
  }
  const k = nextMsIndex(j), mine = k>=0 ? canWork(j, j.ms[k].svc) : can('job.update', j);
  if(k>=0){
    const m = j.ms[k], phases = jobTracks(j), pk = phases.findIndex(p=>p.ms.includes(m)), track = phases[pk].ms;
    const items = track.map(x=>({ label:x.name+(x.proof?' (proof needed)':''), hint:STEP_HINT[x.name], sub: x.done ? shortDate(x.date)+' · '+x.by+(x.laneValue?' · lane '+x.laneValue:'') : null, met:x.done,
      act: x===m && mine && !missingNeeds(j, m).length && !fundGate(j, m) ? act('Mark done',"openMilestone('"+id+"',"+k+")",'check') : null }));
    const needs = stepDocs(j, m, 'needs'), missing = missingNeeds(j, m), makes = stepDocs(j, m, 'produces');
    const docItems = needs.map(d=>({ label:'Needed first: '+d.name, sub: d.status==='Received' ? 'Received · '+d.file : 'Required before “'+m.name+'” can be ticked', met:d.status==='Received', act: d.status!=='Received' && mine ? act('Upload',"openUploadDoc('"+id+"','"+d.id+"')",'upload') : null }));
    const fg = fundGate(j, m);
    const fgAct = fg ? (fg.fund && fg.fund.status==='Returned' ? act('Edit & resubmit',"openFundRequest('"+id+"','"+fg.fund.id+"')",'refresh') : fg.none ? act('Request funds',"openFundRequest('"+id+"',null,'"+fg.purpose+"')",'wallet') : act('Open funds',"goTab('"+id+"','money')",'wallet')) : null;
    if(fg) docItems.unshift({ label:fg.label, sub:fg.sub, badge:fg.badge, met:false, act: mine ? fgAct : null });
    const firstMissing = missing[0];
    return { tone: mine?'ready':'waiting', icon:SERVICES[m.svc].icon, eyebrow:'Phase '+(pk+1)+' of '+phases.length+' · '+m.phase+' · step '+(track.indexOf(m)+1)+' of '+track.length, title:'Next: '+m.name,
      text:(STEP_HINT[m.name]||'')+(m.proof?' Needs a file attached.':'')+(missing.length?' First, upload: '+missing.map(d=>d.name).join(', ')+'.':'')+(fg?' Funds for the '+fg.what+' must be released first.':''),
      items:docItems.concat(items), gateTitle:m.phase, bodyHtml:overdueAlert(j, m)+actionsAlert(j),
      primary: !mine ? null : firstMissing ? act('Upload '+firstMissing.name,"openUploadDoc('"+id+"','"+firstMissing.id+"')",'upload') : fg ? fgAct : act('Mark “'+m.name+'” done',"openMilestone('"+id+"',"+k+")",'check'),
      secondary: mine && fg && fg.none ? act('Paid another way',"openWaiveGate('"+id+"','"+m.name+"')",'info') : null,
      who: mine ? null : 'Waiting on '+opsFor(j, m.svc).join(', ')+' ('+SERVICES[m.svc].label+').' };
  }
  const gate = closingGate(j), ok = gate.every(g=>g.ok), mineClose = can('job.submitClose', j);
  return { tone:'ready', icon:'flag', eyebrow:'All milestones done', title: ok ? 'Submit for closing' : 'Finish the closing checklist',
    text:'A manager confirms the job is completed.',
    items:gate.map(g=>({ label:g.label, sub:g.sub, met:g.ok, act: g.ok ? null : g.key==='docs' ? act('Open documents',"goTab('"+id+"','documents')",'file') : g.key==='issue' ? act('Open exceptions',"goTab('"+id+"','issues')",'flag') : g.key==='funds' ? act('Open funds',"goTab('"+id+"','money')",'wallet') : null })), gateTitle:'Closing checklist',
    primary: ok && mineClose ? act('Submit for closing',"submitForClosing('"+id+"')",'flag') : null,
    who: mineClose ? null : 'Waiting on '+j.ops.join(', ')+' (Operations).' };
}
function clocksPanel(j){
  const cl = jobClocks(j);
  if(!cl.length) return '';
  const rows = cl.map(c=>{
    const tone = clockTone(c);
    const pct = c.free ? Math.max(0, Math.min(100, (c.left!=null?c.left:c.free)/c.free*100)) : 0;
    const num = c.left==null ? '—' : c.state==='stopped' ? (c.over||0) : Math.abs(c.left);
    const small = c.left==null ? clockText(c) : c.state==='stopped' ? (c.over?'days over':'stopped in time') : c.left<0 ? 'days overdue' : 'free day'+(c.left===1?'':'s')+' left';
    return '<div class="ds-clock'+(tone==='warning'||tone==='danger'?' ds-clock--'+tone:'')+'"><div class="ds-clock__row"><span class="ds-strong ds-small">'+esc(c.label)+'</span><span class="ds-muted ds-xs">'+esc(c.risk)+'</span></div>'+
      '<div class="ds-clock__row"><span class="ds-clock__days">'+num+'<small>'+esc(small)+'</small></span></div>'+
      (c.left!=null?'<span class="ds-bar-track"><span class="ds-bar-fill ds-bar-fill--'+(tone==='neutral'?'success':tone)+'" style="width:'+(c.left<0?100:pct)+'%"></span></span>':'')+
      '<p class="ds-muted ds-xs">'+[c.start?'Started '+esc(c.start):'', c.start&&c.free!=null?plural(c.free,'free day')+' · last free day '+esc(c.lastFree):'', c.end?'stopped '+esc(c.end):'stops at '+esc(c.ends)].filter(Boolean).join(' · ')+'</p></div>';
  }).join('');
  return '<section class="ds-panel ds-panel--elevated" id="free-time"><div class="ds-panel__head"><h3>'+icon('clock')+'Free time</h3>'+(can('job.freeDays', j)&&j.status!=='Completed'?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openFreeDays(\''+j.id+'\')">Set free days</button>':'')+'</div><div class="ds-panel__body ds-stack--sm">'+rows+'</div></section>';
}
function jobSupportDocsPanel(j){
  const i = inqById(j.inquiryId); if(!i) return '';
  const v = i.versions.find(x=>x.v===j.quoteV);
  const docs = [].concat(i.request.attachment ? [{ name:i.request.attachment, meta:'Supporting document' }] : [], v ? [{ name:v.file, meta:'Accepted quotation v'+v.v }] : [], j.ms.filter(m=>m.file).map(m=>({ name:m.file, meta:m.name+' · attachment' })));
  if(!docs.length) return '';
  return '<section class="ds-panel ds-panel--elevated" id="job-docs"><div class="ds-panel__head"><h3>'+icon('file')+'Supporting documents</h3></div><div class="ds-panel__body ds-panel__body--flush ds-scroll-list">'+docs.map(d=>fileRow(d.name, d.meta)).join('')+'</div></section>';
}
/* Key facts always sit in the wide left column under the Next step panel, in two columns. */
function factsPanel(j){
  const c = custById(j.customerId), i = inqById(j.inquiryId), v = i ? i.versions.find(x=>x.v===j.quoteV) : null;
  const f = (k,val,wide)=>'<div class="ds-fact'+(wide?' ds-fact--wide':'')+'"><dt>'+esc(k)+'</dt><dd>'+val+'</dd></div>';
  return '<section class="ds-panel ds-panel--elevated" id="job-facts"><div class="ds-panel__head"><h3>'+icon('info')+'Key facts</h3></div><div class="ds-panel__body"><dl class="ds-facts ds-facts--cols">'+
    f('Customer', canView('customer.edit')?'<a class="ds-link" href="#/customers/'+c.id+'">'+esc(c.name)+'</a>':esc(c.name))+
    f('Inquiry', canView('inquiry.view', i)?'<a class="ds-link ds-mono" href="#/inquiries/'+j.inquiryId+'">'+esc(j.inquiryId)+'</a>':'<span class="ds-mono">'+esc(j.inquiryId)+'</span>')+
    (v && (canView('money.view', j) || hasRole('Sales')) ? f('Accepted quote', 'v'+v.v+' · '+amountText(v)) : '')+
    f('Request', esc(j.commodity+(j.cargoType?' · '+j.cargoType:'')))+
    ((j.ms.find(x=>x.shippingLine)||{}).shippingLine?f('Shipping line', esc(j.ms.find(x=>x.shippingLine).shippingLine)):'')+
    (j.deliveryInstructions?f('Delivery instructions', esc(j.deliveryInstructions)):'')+
    f('Operations', (j.opsByService ? SERVICE_ORDER.filter(k=>j.opsByService[k]).map(k=>'<div>'+esc(SERVICES[k].label)+': '+esc(j.opsByService[k].join(', '))+'</div>').join('') : esc(j.ops.join(', '))), true)+
    (j.refs.booking?f('Booking no.', '<span class="ds-mono">'+esc(j.refs.booking)+'</span>'):'')+
    f('Consignee', esc((((c.consignees||[]).find(x=>x.id===(j.request||{}).consigneeId))||{ name:'Same as the customer' }).name))+
    f(j.cargoType==='Air'?'AWB':'BL / AWB', j.refs.bl ? '<span class="ds-mono">'+esc(j.refs.bl)+'</span>' : '<span class="ds-muted3">Not entered yet</span>')+
    f('Container(s)', j.refs.containers ? '<span class="ds-mono">'+esc(j.refs.containers)+'</span>' : '<span class="ds-muted3">Not entered yet</span>')+
    f('Created', esc(j.createdBy+', '+j.createdOn))+
    f('Tracking code', '<span class="ds-mono">'+esc(j.trackingCode)+'</span> <a class="ds-link ds-xs" href="#/track/'+esc(j.trackingCode)+'" title="The page the client sees">'+icon('eye')+'Client view</a>', true)+
  '</dl>'+(can('job.update', j) && j.status!=='Completed' ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openRefs(\''+j.id+'\')">'+icon('file')+'Edit BL and container numbers</button>' : '')+'<p class="ds-muted ds-xs" style="margin-top:var(--t1m-space-2)">Give the client the tracking code. Job numbers alone do not open the tracking page.</p></div></section>';
}
const TAB_LABELS = { milestones:'Milestones', documents:'Documents', issues:'Exceptions', money:'Funds', billing:'Billing', history:'History' };
function jobTabs(j){ const t = ['milestones','documents','issues']; if(canView('money.view', j)) t.push('money'); if(canView('money.view', j)) t.push('billing'); t.push('history'); return t; }
function tabCount(j, t){
  if(t==='documents'){ const n = pendingDocs(j).length; return n ? '<span class="ds-tab__count ds-tab__count--warning">'+n+'</span>' : ''; }
  if(t==='issues'){ if(openIssue(j)) return '<span class="ds-tab__count ds-tab__count--danger">1</span>'; const n = j.issues.filter(x=>x.status!=='Resolved').length; return n ? '<span class="ds-tab__count ds-tab__count--warning">'+n+'</span>' : ''; }
  if(t==='billing'){ const k = readinessStatus(j).key; return (k==='ready' && can('ready.receive')) || (k==='complete' && can('ready.mark')) ? '<span class="ds-tab__count ds-tab__count--warning">1</span>' : ''; }
  if(t==='money'){ const n = moneyWaitingCount(j); return n ? '<span class="ds-tab__count ds-tab__count--warning">'+n+'</span>' : ''; }
  return '';
}
let JOB_MENU = '';
function renderJob(id, tab){
  const j = jobById(id);
  if(!j) return '<div class="ds-panel ds-panel--elevated">'+emptyState('search','Job not found','Jobs live only for this session. Refreshing the page clears them.','<a class="ds-btn ds-btn--secondary" href="#/jobs">All jobs</a>')+'</div>';
  if(!canView('job.view', j)) return accessDenied('Jobs', j.id+' is not assigned to you.');
  const c = custById(j.customerId), tabs = jobTabs(j), active = tabs.includes(tab) ? tab : 'milestones';
  const n = jobNext(j); if(STATE.justNext===j.id) n.enter = true;
  const body = { milestones:jobMilestonesTab, documents:jobDocumentsTab, issues:jobExceptionsTab, money:jobMoneyTab, billing:jobBillingTab, history:j=>historyList(j.log.slice().reverse()) }[active](j);
  const menu = [];
  if(can('job.issue', j) && j.status==='Active' && !openIssue(j)) menu.push('<button onclick="closePopover(); openFlagException(\''+id+'\')">'+icon('flag')+'Raise an exception</button>');
  if(can('job.freeDays', j) && clockApplies(j) && j.status!=='Completed') menu.push('<button onclick="closePopover(); openFreeDays(\''+id+'\')">'+icon('clock')+'Set free days</button>');
  if(can('job.update', j) && j.status!=='Completed') menu.push('<button onclick="closePopover(); openRefs(\''+id+'\')">'+icon('file')+'Shipment references</button>');
  if(can('fund.request', j) && j.status!=='Completed') menu.push('<button onclick="closePopover(); openFundRequest(\''+id+'\')">'+icon('wallet')+'New fund request</button>');
  menu.push('<button id="job-summary" onclick="closePopover(); downloadJobSummaryPdf(\''+id+'\')">'+icon('download')+'Generate summary report</button>');
  menu.push('<a href="#/track/'+esc(j.trackingCode)+'" onclick="closePopover()">'+icon('eye')+'Open the client tracking page</a>');
  JOB_MENU = menu.join('');
  return '<nav class="ds-crumbs"><a href="#/jobs">Jobs</a>'+icon('chevron-right')+'<span class="ds-mono">'+j.id+'</span></nav>'+
    '<header class="ds-jobhead"><div><h1>'+j.id+' '+healthPill(j)+'</h1>'+
      '<div class="ds-jobhead__line"><strong class="ds-strong">'+esc(c.name)+'</strong>'+(routeText(j.origin, j.destination)?'<span class="ds-routeline">'+esc(j.origin||'—')+icon('arrow-right')+esc(j.destination||'—')+'</span>':'')+'<span>'+esc(scopeText(j))+'</span><span>'+esc(servicesText(j.services))+'</span></div></div>'+
      '<div class="ds-jobhead__actions">'+stagePill(j)+'<button class="ds-btn ds-btn--secondary" id="job-more" onclick="event.stopPropagation(); openPopover(this, JOB_MENU)" aria-haspopup="true">'+icon('more')+'More</button></div></header>'+
    '<div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('flag')+'Progress map</h2><span class="ds-panel__hint">'+j.ms.filter(m=>m.done).length+' of '+j.ms.length+' milestones</span></div><div class="ds-panel__body" id="progress-map-body" style="padding-top:0">'+progressMapHtml(j)+'</div></section>'+
      '<div class="ds-split"><div class="ds-stack">'+nextPanelHtml(n)+factsPanel(j)+'</div><div class="ds-stack">'+clocksPanel(j)+deliveryPanel(j)+jobSupportDocsPanel(j)+'</div></div>'+
      '<section class="ds-panel ds-panel--elevated" id="job-tabs"><div class="ds-tabs" role="tablist">'+tabs.map(t=>'<button class="ds-tab" role="tab" aria-selected="'+(t===active)+'" onclick="go(\'#/jobs/'+id+'/'+t+'\')"><span class="ds-tab__label" data-text="'+TAB_LABELS[t]+'">'+TAB_LABELS[t]+'</span>'+tabCount(j,t)+'</button>').join('')+'</div>'+
        '<div class="ds-panel__body" id="tab-body">'+body+'</div></section>'+
    '</div>';
}

/* ---------- Milestones ---------- */
function jobMilestonesTab(j){
  const k = nextMsIndex(j), mine = can('job.update', j) && j.status==='Active' && !openIssue(j);
  const rows = j.ms.map((m,idx)=>{
    const st = m.done ? pill('Done','success','check','ds-pill--sm') : idx===k ? pill(openIssue(j)?'On hold':'Next', openIssue(j)?'danger':'info', openIssue(j)?'lock':'arrow-right','ds-pill--sm') : pill('Later','neutral','circle','ds-pill--sm');
    return '<tr><td data-label="Phase">'+esc(m.phase)+'</td><td data-label="Milestone" style="white-space:normal"><span class="ds-strong">'+esc(m.name)+'</span><div class="ds-muted ds-xs">'+esc((STEP_HINT[m.name]||'')+(m.proof?' Needs proof.':''))+'</div></td>'+
      '<td data-label="Status">'+st+'</td><td data-label="Due">'+dueCell(j, m, idx===k)+'</td><td data-label="Date">'+(m.done?esc(m.date):'—')+'</td><td data-label="By">'+(m.done?esc(m.by):'—')+'</td>'+
      '<td data-label="Remark" style="white-space:normal">'+esc([m.laneValue?'Lane '+m.laneValue:'', m.truck?m.truck.driver+' · '+m.truck.plate+' · '+m.truck.type:'', m.shippingLine?'Shipping line: '+m.shippingLine:'', m.delivery?'Received by '+m.delivery.receivedBy+' at '+fmtTime(m.delivery.time)+' · '+m.delivery.condition:'', m.remark||''].filter(Boolean).join(' · '))+(m.file?' <span class="ds-mono ds-xs">'+esc(m.file)+'</span>':'')+'</td>'+
      '</tr>';
  }).join('');
  return '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">Milestones are done in order from the Next step panel above. No approval per milestone.</p>'+
    '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack ds-table--compact"><thead><tr><th>Phase</th><th>Milestone</th><th>Status</th><th>Due</th><th>Date</th><th>By</th><th>Remark / file</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
/* The BL / AWB (and the containers it lists) are typed where the document arrives, not in a separate form.
   Sea and land cargo have a BL, air has an AWB, a land-only move has neither. FCL needs the container numbers; LCL travels in a
   shared container, so they are optional; the other cargo types have none. */
const BL_STEPS = ['Departed origin port','Cargo arrived at port','BL released to client','Loaded at origin port'];
function blNeeded(j, m){ return BL_STEPS.includes(m.name) && j.cargoType!=='Land (truck)'; }
function containersAsked(j){ return ['FCL','LCL'].includes(j.cargoType); }
function refsFieldsHtml(j){
  const doc = j.cargoType==='Air' ? 'AWB' : 'BL';
  return '<div class="ds-field"><label for="ms-bl">'+doc+' no.</label><input class="ds-input ds-mono" id="ms-bl" name="bl" value="'+esc(j.refs.bl||'')+'" placeholder="As printed on the '+doc+'" autocomplete="off">'+errorSlot('bl')+'</div>'+
    (containersAsked(j) ? '<div class="ds-field"><label for="ms-cont">Container no(s).'+(j.cargoType==='FCL'?'':' <span class="ds-opt">optional</span>')+'</label><input class="ds-input ds-mono" id="ms-cont" name="containers" value="'+esc(j.refs.containers||'')+'" placeholder="e.g. MSKU1234567, TGHU7654321" autocomplete="off">'+errorSlot('containers')+
      '<p class="ds-field__hint">'+(j.cargoType==='FCL' ? 'Copy them from the BL: it lists every container.' : 'Shared container: add its number only if the BL shows it.')+'</p></div>' : '');
}
function openMilestone(jobId, k){
  const j = jobById(jobId), m = j.ms[k];
  if(!canWork(j, m.svc)) return denied('Only the Operations staff assigned to '+SERVICES[m.svc].label+' (or a Manager) can update this step.');
  if(openIssue(j)) return denied('The job is on hold until a Manager approves the exception.');
  if(nextMsIndex(j)!==k) return denied('Milestones are done in order.');
  const missing = missingNeeds(j, m);
  if(missing.length) return denied('Upload first: '+missing.map(d=>d.name).join(', ')+'.');
  const fg = fundGate(j, m); if(fg) return denied('This step needs its funds released first, or choose “Paid another way”. '+fg.sub+'.');
  const makes = stepDocs(j, m, 'produces').filter(d=>d.status!=='Received');
  const sf = stepFund(j, m);
  const proofDoc = m.proof && !sf && makes.length===1 ? makes[0] : null;
  openDrawer({ title:'Mark “'+m.name+'” done', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(m.phase),
    body:'<form class="ds-stack--sm" id="ms-form" novalidate onsubmit="event.preventDefault(); saveMilestone(\''+jobId+'\','+k+', this)">'+
      (STEP_HINT[m.name]?'<p class="ds-small ds-muted">'+esc(STEP_HINT[m.name])+'</p>':'')+
      dateField('ms-date','date','Date', todayDMY())+
      (/^Booked/.test(m.name) ? '<div class="ds-field"><label for="ms-line">Shipping line</label><input class="ds-input" id="ms-line" name="shippingLine" placeholder="Name of the shipping line" autocomplete="off">'+errorSlot('shippingLine')+'</div><div class="ds-field"><label for="ms-booking">Booking no. <span class="ds-opt">optional</span></label><input class="ds-input ds-mono" id="ms-booking" name="bookingNo" value="'+esc(j.refs.booking||'')+'" placeholder="From the shipping line’s confirmation" autocomplete="off"></div>' : '')+
      (m.name==='Truck scheduled' ? '<div class="ds-field"><label for="ms-driver">Driver name</label><input class="ds-input" id="ms-driver" name="driver" placeholder="Full name of the driver">'+errorSlot('driver')+'</div><div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="ms-plate">Plate number</label><input class="ds-input ds-mono" id="ms-plate" name="plate" placeholder="e.g. ABC 1234">'+errorSlot('plate')+'</div><div class="ds-field"><label for="ms-ttype">Type of truck</label>'+selectWrap('<select class="ds-select" id="ms-ttype" name="truckType"><option value="">Select type</option>'+options(TRUCK_TYPES)+'</select>')+errorSlot('truckType')+'</div></div>' : '')+
      (m.lane ? '<div class="ds-field"><span class="ds-field__label">Lane assigned by BOC</span><div class="ds-stack--sm">'+LANES.map((l,x)=>'<label class="ds-check" style="align-items:flex-start"><input type="radio" name="lane" value="'+l+'"'+(x===0?' checked':'')+'> <span>'+pill(l, LANE_TONE[l], l==='Green'?'check':'alert','ds-pill--sm')+'<br><span class="ds-muted ds-xs">'+esc(LANE_MEANING[l])+'</span></span></label>').join('')+'</div></div>' : '')+
      makes.map(d=>'<div class="ds-field"><label>'+esc(d.name)+'</label>'+uploadHtml('doc_'+d.id)+errorSlot('file_'+d.id)+'</div>').join('')+
      (sf ? '<div class="ds-alert ds-alert--info">'+icon('receipt')+'<div><strong>This also submits the receipts for '+sf.id+'</strong>You upload the receipt once, here. Accounting then checks it.</div></div>'+(frDirect(sf)?'':moneyField('ms-paid','paid','Amount actually paid','PHP', sf.amount)) : '')+
      (blNeeded(j, m) ? refsFieldsHtml(j) : '')+
      (isDeliveryStep(m) ? deliveryFieldsHtml() : '')+
      (proofDoc ? '' : '<div class="ds-field"><label>'+(sf?'Official receipt':m.proof?'Proof':'Other attachment <span class="ds-opt">optional</span>')+'</label>'+uploadHtml('msFile', m.proof ? (m.name==='Duties paid'?'The duty payment receipt':m.name==='Approved'?'The BOC approval or accreditation certificate':m.name==='Empty container returned'?'The container return or interchange receipt':'Proof for this step') : 'Photo or document')+(m.proof||sf?errorSlot('file'):'')+'</div>')+
      '<div class="ds-field"><label for="ms-remark">Remark <span class="ds-opt">optional</span></label><textarea class="ds-textarea" id="ms-remark" name="remark" style="min-height:64px"></textarea></div></form>',
    foot: drawerFoot('Mark done','ms-form',{icon:'check'}) });
}
function saveMilestone(jobId, k, form){
  const j = jobById(jobId), m = j.ms[k], fd = new FormData(form), date = isoToDMY(fd.get('date'));
  const prev = j.ms.slice(0,k).reverse().find(x=>x.done);
  const bad = fieldError(form,'date', !date?'Pick the date.':daysUntil(date)>0?'The date cannot be in the future.':(prev && daysBetween(prev.date, date)<0)?'Earlier than the previous milestone ('+prev.date+').':'') |
    0;
  const makes = stepDocs(j, m, 'produces').filter(d=>d.status!=='Received');
  const sf = stepFund(j, m), paid = sf ? (frDirect(sf) ? sf.amount : Number(fd.get('paid'))) : 0;
  const proofDoc = m.proof && !sf && makes.length===1 ? makes[0] : null;
  const proofFile = proofDoc ? UPLOADS['doc_'+proofDoc.id] : UPLOADS.msFile;
  let missingDoc = 0;
  makes.forEach(d=>{ if(fieldError(form,'file_'+d.id, UPLOADS['doc_'+d.id] ? '' : 'Upload the '+d.name+' to continue.')) missingDoc = 1; });
  const trk = m.name==='Truck scheduled' ? { driver:String(fd.get('driver')||'').trim(), plate:String(fd.get('plate')||'').trim().toUpperCase(), type:String(fd.get('truckType')||'') } : null;
  const line = /^Booked/.test(m.name) ? String(fd.get('shippingLine')||'').trim() : null;
  const lineBad = line!==null ? fieldError(form,'shippingLine', line?'':'Enter the shipping line.') : 0;
  const truckBad = trk ? (fieldError(form,'driver', trk.driver?'':'Enter the driver’s name.') | fieldError(form,'plate', trk.plate?'':'Enter the plate number.') | fieldError(form,'truckType', trk.type?'':'Pick the type of truck.')) : 0;
  const paidBad = sf ? fieldError(form,'paid', paid>0?'':'Enter what was actually paid.') : 0;
  const dl = isDeliveryStep(m) ? { time:String(fd.get('time')||''), receivedBy:String(fd.get('receivedBy')||'').trim(), condition:String(fd.get('condition')||DELIVERY_CONDITIONS[0]), problem:String(fd.get('problem')||'').trim(), evidence:UPLOADS.deliveryEvidence||null } : null;
  const rf = blNeeded(j, m) ? { bl:String(fd.get('bl')||'').trim(), containers:String(fd.get('containers')||'').trim() } : null;
  const rfBad = rf ? fieldError(form,'bl', rf.bl?'':'Enter the '+(j.cargoType==='Air'?'AWB':'BL')+' number from the document.') | fieldError(form,'containers', j.cargoType==='FCL' && !rf.containers ? 'Enter the container number(s) shown on the BL.' : '') : 0;
  const dlBad = dl ? fieldError(form,'time', dl.time?'':'Enter the time it was delivered.') | fieldError(form,'receivedBy', dl.receivedBy?'':'Who signed for the cargo?') | fieldError(form,'problem', dl.condition!==DELIVERY_CONDITIONS[0] && !dl.problem ? 'Describe what happened.' : '') : 0;
  if(bad | missingDoc | truckBad | lineBad | paidBad | dlBad | rfBad | fieldError(form,'file', (m.proof||sf) && !proofDoc && !proofFile ? (sf?'Attach the official receipt.':'This step needs proof attached.') : '')) return;
  makes.forEach(d=>{ const f = UPLOADS['doc_'+d.id]; if(f){ Object.assign(d, { status:'Received', file:f, by:me(), on:date }); logTo(j, 'Document uploaded', d.name+' ('+f+') with “'+m.name+'”.'); } });
  if(sf) submitReceipts(j, sf, paid, proofFile, null, date);
  Object.assign(m, { done:true, date, by:me(), remark:String(fd.get('remark')||'').trim()||null, file:proofFile||UPLOADS.msFile||null, laneValue: m.lane ? String(fd.get('lane')) : null, truck:trk, shippingLine:line||null, delivery:dl });
  const nx = j.ms[k+1]; if(nx && !nx.due) nx.due = addDaysDMY(stepDays(nx), date);
  logTo(j, 'Milestone done', m.phase+' · '+m.name+(m.laneValue?' (lane '+m.laneValue+')':'')+(m.truck?' · '+m.truck.driver+', '+m.truck.plate+', '+m.truck.type:'')+(m.shippingLine?' · '+m.shippingLine:'')+' on '+date+(m.file?' · '+m.file:'')+'.');
  if(dl && dl.condition!==DELIVERY_CONDITIONS[0]) raiseException(j, { category: dl.condition==='Damaged' ? 'Cargo damage or loss' : 'Shortage or overage', reason:dl.condition+': '+dl.problem, impact:'Customer affected', evidence:dl.evidence, holds:false, stage:m.phase+' · '+m.name });
  if(rf){ j.refs = Object.assign({}, j.refs, rf); logTo(j, 'References updated', (j.cargoType==='Air'?'AWB ':'BL ')+rf.bl+(rf.containers?', containers '+rf.containers:'')+' (from “'+m.name+'”).'); }
  if(/^Booked/.test(m.name)){ const bk = String(fd.get('bookingNo')||'').trim(); if(bk){ j.refs = Object.assign({}, j.refs, { booking:bk }); logTo(j, 'References updated', 'Booking no. '+bk+'.'); } }
  if(dl) logTo(j, 'Milestone done', 'Delivery: received by '+dl.receivedBy+' at '+fmtTime(dl.time)+', '+dl.condition.toLowerCase()+'.');
  closeDrawer(); STATE.justNext = j.id; showToast(m.name+' done.'+(sf?' Receipts for '+sf.id+' sent to Accounting.':''), 'success', 'check'); render();
}

/* ---------- Documents ---------- */
const DOC_REJECT_REASONS = ['Unreadable or incomplete','Wrong document','Missing signature or stamp','Details do not match the shipment','Other'];
function docPill(d){
  if(d.status==='Rejected') return pill('Rejected','danger','x');
  if(d.status==='Received') return d.review && d.review.decision==='Accepted' ? pill('Accepted','success','check') : pill('Received','info','check');
  return pill('Pending','warning','alert');
}
function jobDocumentsTab(j){
  const got = j.docs.filter(d=>d.status==='Received').length, rejected = j.docs.filter(d=>d.status==='Rejected').length, toReview = j.docs.filter(d=>d.status==='Received' && !d.review).length;
  const mine = can('job.update', j) && j.status!=='Completed', reviewer = can('doc.review') && j.status!=='Completed';
  const order = d=>{ const k = j.ms.findIndex(m=>m.name===d.step && m.svc===d.svc); return k<0 ? 999 : k; };
  const rows = j.docs.slice().sort((a,b)=>order(a)-order(b)).map(d=>{
    const isGot = d.status==='Received', rej = d.status==='Rejected', reviewed = isGot && d.review && d.review.decision==='Accepted';
    const btns = (d.file ? '<a class="ds-btn ds-btn--ghost ds-btn--sm" href="dummy.pdf" target="_blank" rel="noopener">'+icon('eye')+'View</a>' : '')+
      (reviewer && isGot && !d.review ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="acceptDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('check')+'Accept</button><button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openRejectDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('x')+'Reject</button>' : '')+
      (mine && canWork(j, d.svc) && (d.status==='Pending' || rej) ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openUploadDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('upload')+(rej?'Upload new version':'Upload')+'</button>' : '')+
      (mine && reviewed && (hasRole('Manager') || hasRole('Admin')) ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openUploadDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('upload')+'Replace</button>' : '')+
      (d.versions.length ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openDocVersions(\''+j.id+'\',\''+d.id+'\')">History</button>' : '');
    const meta = (d.step ? (d.kind==='needs' ? 'Needed before “'+d.step+'”' : 'Comes with “'+d.step+'”') : 'Needed before closing')+' · '+(d.file ? (d.versions.length?'v'+(d.versions.length+1)+' · ':'')+d.file+' · '+d.by+', '+d.on : 'Not received yet')+
      (rej ? ' · Rejected by '+d.review.by+': '+d.review.reason : reviewed ? ' · Accepted by '+d.review.by : isGot ? ' · Not reviewed yet' : '');
    return '<div class="ds-doc" id="doc-'+d.id+'"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">'+esc(d.name)+'</div><div class="ds-doc__meta">'+esc(meta)+'</div></div>'+docPill(d)+'<span class="ds-row ds-row--tight">'+btns+'</span></div>';
  }).join('');
  return '<div class="ds-stack--sm"><div class="ds-row--between"><span><span class="ds-strong">'+got+' of '+j.docs.length+' received</span><span class="ds-muted ds-small"> · '+(rejected?rejected+' rejected · ':'')+(toReview?toReview+' to review · ':'')+'each belongs to the step where it is needed; all are needed before the job can close</span></span>'+
    (mine?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openAddDoc(\''+j.id+'\')">'+icon('plus')+'Add a document</button>':'')+'</div>'+
    '<span class="ds-bar-track" style="display:block;height:6px"><span class="ds-bar-fill ds-bar-fill--success" style="width:'+(j.docs.length?Math.round(got/j.docs.length*100):0)+'%"></span></span>'+
    '<div class="ds-panel" style="margin-top:var(--t1m-space-4)" id="doc-list">'+(rows||'<div class="ds-panel__body ds-muted">No documents on the checklist.</div>')+'</div></div>';
}
function openUploadDoc(jobId, docId){
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  if(!can('job.update', j)) return denied();
  if(d.status==='Received' && !hasRole('Manager') && !hasRole('Admin')) return denied('Only a Manager can replace a received document.');
  if(!canWork(j, d.svc)) return denied('Only the Operations staff assigned to '+SERVICES[d.svc].label+' (or a Manager) can upload this.');
  openDrawer({ title:(d.status==='Rejected'?'Upload a new version of ':d.status==='Received'?'Replace ':'Upload ')+d.name, sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="doc-form" novalidate onsubmit="event.preventDefault(); saveDoc(\''+jobId+'\',\''+docId+'\', this)">'+
      (d.status==='Rejected' ? '<div class="ds-alert ds-alert--warning">'+icon('x')+'<div><strong>Rejected by '+esc(d.review.by)+'</strong>'+esc(d.review.reason)+'</div></div>' : '')+
      '<div class="ds-field"><label>File</label>'+uploadHtml('docFile','PDF, image or scan')+errorSlot('file')+'</div></form>',
    foot: drawerFoot('Save document','doc-form',{icon:'upload'}) });
}
function saveDoc(jobId, docId, form){
  if(fieldError(form,'file', UPLOADS.docFile?'':'Choose a file first.')) return;
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  if(d.file) d.versions.push({ file:d.file, by:d.by, on:d.on, outcome: d.status==='Rejected' ? 'Rejected: '+d.review.reason : d.review ? 'Accepted' : 'Replaced' });
  Object.assign(d, { status:'Received', file:UPLOADS.docFile, by:me(), on:todayDMY(), review:null });
  logTo(j, 'Document uploaded', d.name+' ('+d.file+')'+(d.versions.length?' as version '+(d.versions.length+1):'')+'.');
  closeDrawer(); STATE.justNext = j.id; showToast(d.name+' received.', 'success', 'upload'); render();
}
function acceptDoc(jobId, docId){
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  if(!can('doc.review')) return denied('Only a Manager reviews documents.');
  d.review = { by:me(), on:todayDMY(), decision:'Accepted' };
  logTo(j, 'Document accepted', d.name+' ('+d.file+') accepted.');
  showToast(d.name+' accepted.', 'success', 'check'); render();
}
function openRejectDoc(jobId, docId){
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  if(!can('doc.review')) return denied('Only a Manager reviews documents.');
  openDrawer({ title:'Reject '+d.name, sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(d.file),
    body:'<form class="ds-stack--sm" id="rejdoc-form" novalidate onsubmit="event.preventDefault(); saveRejectDoc(\''+jobId+'\',\''+docId+'\', this)"><p class="ds-small ds-muted">Operations is told why and uploads a new version. The rejected file stays in the history.</p>'+reasonFields(DOC_REJECT_REASONS,'Why is it rejected?')+'</form>',
    foot: drawerFoot('Reject document','rejdoc-form',{icon:'x', danger:true}) });
}
function saveRejectDoc(jobId, docId, form){
  const fd = new FormData(form), type = String(fd.get('reasonType')||''), comment = String(fd.get('comment')||'').trim();
  if(fieldError(form,'reasonType', type?'':'Pick the closest reason.') | fieldError(form,'comment', comment?'':'Say what is wrong so it can be fixed.')) return;
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  d.status = 'Rejected'; d.review = { by:me(), on:todayDMY(), decision:'Rejected', reason:type+': '+comment };
  logTo(j, 'Document rejected', d.name+' ('+d.file+'): '+d.review.reason);
  notify({ users:opsFor(j, d.svc) }, d.name+' on '+j.id+' was rejected by '+me()+': '+d.review.reason+'. Upload a new version.', '#/jobs/'+j.id+'/documents');
  closeDrawer(); showToast(d.name+' rejected. Operations will upload a new version.', 'warning', 'x'); render();
}
function openDocVersions(jobId, docId){
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId), n = d.versions.length;
  const entries = [{ action:'v'+(n+1)+' (current)', detail:d.file+(d.status==='Rejected'?' · rejected: '+d.review.reason:d.review?' · accepted':' · not reviewed yet'), ts:d.on, actor:d.by }].concat(d.versions.slice().reverse().map((v,i)=>({ action:'v'+(n-i), detail:v.file+' · '+v.outcome, ts:v.on, actor:v.by })));
  openDrawer({ title:d.name+': versions', sub:'<span class="ds-mono">'+j.id+'</span>', body:'<div class="ds-stack--sm">'+historyList(entries)+'</div>', foot:'<button type="button" class="ds-btn ds-btn--primary" onclick="closeDrawer()">Close</button>' });
}
function openAddDoc(jobId){
  const j = jobById(jobId);
  openDrawer({ title:'Add a document to the checklist', sub:'<span class="ds-mono">'+j.id+'</span> · e.g. an import permit for regulated goods',
    body:'<form class="ds-stack--sm" id="adddoc-form" novalidate onsubmit="event.preventDefault(); saveAddDoc(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="ad-name">Document</label><input class="ds-input" id="ad-name" name="name" placeholder="e.g. FDA Import Permit">'+errorSlot('name')+'</div>'+
      '<div class="ds-field"><label for="ad-svc">For</label>'+selectWrap('<select class="ds-select" id="ad-svc" name="svc">'+options(j.services.map(s=>({value:s,label:SERVICES[s].label})))+'</select>')+'</div></form>',
    foot: drawerFoot('Add to checklist','adddoc-form',{icon:'plus'}) });
}
function saveAddDoc(jobId, form){
  const fd = new FormData(form), name = String(fd.get('name')||'').trim();
  if(fieldError(form,'name', name?'':'Name the document.')) return;
  const j = jobById(jobId);
  j.docs.push({ id:nextId('doc'), svc:String(fd.get('svc')), name, status:'Pending', file:null, by:null, on:null, step:null, kind:null, versions:[], review:null });
  logTo(j, 'Document added', name+' added to the checklist.');
  closeDrawer(); showToast(name+' added.', 'success', 'plus'); render();
}

/* The corrective actions still open on this job, shown above the next step. */
function actionsAlert(j){
  const list = openActions(j); if(!list.length) return '';
  return list.map(x=>'<div class="ds-alert ds-alert--'+(excActionLate(x)?'danger':'info')+'">'+icon(excActionLate(x)?'alert':'flag')+'<div><strong>Corrective action '+(excActionLate(x)?'overdue by '+plural(-daysUntil(x.action.due),'day'):'due '+esc(x.action.due))+': '+esc(x.action.text)+'</strong>Owner: '+esc(x.action.owner)+' · '+esc(x.category)+'</div></div>').join('');
}

/* ---------- Free days and references ---------- */
function openFreeDays(jobId){
  const j = jobById(jobId), f = j.free || {}, needArrival = !msByFlag(j,'arrival');
  if(!can('job.freeDays', j)) return denied();
  openDrawer({ title:'Set free days', sub:'<span class="ds-mono">'+j.id+'</span> · from the arrival notice or the shipping line',
    body:'<form class="ds-stack--sm" id="free-form" novalidate onsubmit="event.preventDefault(); saveFreeDays(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="fr-port">Port free days</label><input class="ds-input" id="fr-port" name="portDays" type="number" min="0" value="'+(f.portDays??SETTINGS.portFreeDays)+'"><p class="ds-field__hint">Counts from arrival until the gate pass (storage + demurrage).</p></div>'+
      (j.cargoType==='FCL'?'<div class="ds-field"><label for="fr-cont">Container free days</label><input class="ds-input" id="fr-cont" name="containerDays" type="number" min="0" value="'+(f.containerDays??SETTINGS.containerFreeDays)+'"><p class="ds-field__hint">Counts from the gate pass until the empty container is returned (detention).</p></div>':'')+
      (needArrival?dateField('fr-arr','arrival','Arrival date (no freight milestone on this job)', f.arrival, true):'')+'</form>',
    foot: drawerFoot('Save','free-form',{icon:'clock'}) });
}
function saveFreeDays(jobId, form){
  const j = jobById(jobId), fd = new FormData(form);
  j.free = Object.assign(j.free||{}, { portDays:Math.max(0, parseInt(fd.get('portDays'),10)||0) });
  if(fd.get('containerDays')!==null) j.free.containerDays = Math.max(0, parseInt(fd.get('containerDays'),10)||0);
  if(fd.get('arrival')!==null) j.free.arrival = isoToDMY(fd.get('arrival')) || null;
  logTo(j, 'Free days set', 'Port '+j.free.portDays+(j.free.containerDays!=null&&j.cargoType==='FCL'?', container '+j.free.containerDays:'')+(j.free.arrival?', arrival '+j.free.arrival:'')+'.');
  closeDrawer(); showToast('Free days saved.', 'success', 'clock'); render();
}
function openRefs(jobId){
  const j = jobById(jobId);
  openDrawer({ title:'Shipment references', sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="refs-form" onsubmit="event.preventDefault(); saveRefs(\''+jobId+'\', this)">'+
      '<p class="ds-small ds-muted">These are normally entered at the step where the document arrives. Use this to correct them.</p>'+
      '<div class="ds-field"><label for="rf-booking">Booking no. <span class="ds-opt">optional</span></label><input class="ds-input ds-mono" id="rf-booking" name="booking" value="'+esc(j.refs.booking||'')+'"></div>'+
      '<div class="ds-field"><label for="rf-bl">BL / AWB no. <span class="ds-opt">optional</span></label><input class="ds-input ds-mono" id="rf-bl" name="bl" value="'+esc(j.refs.bl)+'"></div>'+
      '<div class="ds-field"><label for="rf-cont">Container no(s). <span class="ds-opt">optional</span></label><input class="ds-input ds-mono" id="rf-cont" name="containers" value="'+esc(j.refs.containers)+'" placeholder="Comma separated"></div></form>',
    foot: drawerFoot('Save','refs-form',{icon:'check'}) });
}
function saveRefs(jobId, form){
  const j = jobById(jobId), fd = new FormData(form);
  if(!can('job.update', j)) return denied();
  j.refs = { booking:String(fd.get('booking')||'').trim(), bl:String(fd.get('bl')||'').trim(), containers:String(fd.get('containers')||'').trim() };
  logTo(j, 'References updated', 'BL '+(j.refs.bl||'—')+', containers '+(j.refs.containers||'—')+'.');
  closeDrawer(); showToast('References saved.', 'success', 'check'); render();
}

/* ---------- Closing ---------- */
function submitForClosing(jobId){
  const j = jobById(jobId);
  if(!can('job.submitClose', j)) return denied();
  if(!closingGate(j).every(g=>g.ok)) return denied('Finish the closing checklist first.');
  j.status = 'For closing'; j.submitted = { by:me(), on:todayDMY() };
  logTo(j, 'Submitted for closing', 'All milestones and documents done.');
  notify({ roles:['Manager'] }, 'Job '+j.id+' was submitted for closing by '+me()+'.', '#/jobs/'+j.id);
  STATE.justNext = j.id; showToast('Submitted. A manager will confirm it.', 'success', 'flag'); render();
}
function openConfirmComplete(jobId){
  const j = jobById(jobId);
  if(!can('job.complete')) return denied('Only a Manager confirms completion.');
  const unverified = j.funds.filter(f=>f.status!=='Verified').length, cashOut = j.funds.filter(f=>f.status==='Released');
  openDrawer({ title:'Confirm job completed', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<div class="ds-stack--sm"><ul class="ds-gate">'+closingGate(j).map(g=>gateItemHtml({ label:g.label, sub:g.sub, met:g.ok })).join('')+'</ul>'+
      (cashOut.length?'<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Receipts are still due for '+cashOut.map(f=>f.id).join(', ')+'</strong>Money was released but the receipts are not in. Ask '+esc([...new Set(cashOut.map(f=>f.by))].join(', '))+' to submit them first.</div></div>':
        unverified?'<div class="ds-alert ds-alert--info">'+icon('wallet')+'<div><strong>'+plural(unverified,'fund request')+' still open</strong>That does not stop completion. They stay on the Funds page until Accounting closes them.</div></div>':'')+
      '<p class="ds-small">Completing marks the job as done.</p></div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button>'+(cashOut.length?'<a class="ds-btn ds-btn--secondary" href="#/jobs/'+jobId+'/money" onclick="closeDrawer()">'+icon('wallet')+'Open funds</a>':'')+'<button type="button" class="ds-btn ds-btn--primary" id="confirm-complete" onclick="confirmComplete(\''+jobId+'\')">'+icon('check')+'Confirm completed</button>' });
}
function confirmComplete(jobId){
  const j = jobById(jobId);
  if(j.funds.some(f=>f.status==='Released')) return denied('Receipts are still due for released funds. Ask Operations to submit them first.');
  if(needConfirm('Confirm job completed?', 'The job is marked as completed.', 'Confirm completed', "confirmComplete('"+jobId+"')")) return;
  j.status = 'Completed'; j.completed = { by:me(), on:todayDMY() };
  logTo(j, 'Job completed', 'Confirmed by '+me()+'.');
  notify({ users:j.ops.concat(j.sales) }, 'Job '+j.id+' was confirmed completed.', '#/jobs/'+j.id);
  closeDrawer(); STATE.justNext = j.id; showToast(j.id+' completed.', 'success', 'check'); render();
}
function openSendBack(jobId){
  const j = jobById(jobId);
  openDrawer({ title:'Send back to Operations', sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="back-form" novalidate onsubmit="event.preventDefault(); saveSendBack(\''+jobId+'\', this)"><div class="ds-field"><label for="bk-note">What still needs doing?</label><textarea class="ds-textarea" id="bk-note" name="note"></textarea>'+errorSlot('note')+'</div></form>',
    foot: drawerFoot('Send back','back-form',{icon:'refresh'}) });
}
function saveSendBack(jobId, form){
  const note = String(new FormData(form).get('note')||'').trim();
  if(fieldError(form,'note', note?'':'Say what still needs doing.')) return;
  const j = jobById(jobId); j.status = 'Active'; j.submitted = null;
  logTo(j, 'Sent back to Ops', note);
  notify({ users:j.ops }, 'Job '+j.id+' was sent back: '+note, '#/jobs/'+j.id);
  closeDrawer(); showToast('Sent back to Operations.', 'info', 'refresh'); render();
}
