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
  'Funds released':'arrow-out', 'Liquidated':'receipt', 'Liquidation verified':'check', 'Vendor bill recorded':'receipt', 'Billing submitted':'upload', 'Billing approved':'check',
  'Billing returned':'refresh', 'Billing sent':'arrow-right', 'Payment recorded':'arrow-in' };
function historyList(entries){
  if(!entries.length) return '<p class="ds-muted ds-small">Nothing yet.</p>';
  return '<ul class="ds-activity">'+entries.map(a=>'<li><span class="ds-activity__icon">'+icon(HISTORY_ICON[a.action]||'clock')+'</span><div><strong>'+esc(a.action)+'</strong> · '+esc(a.detail)+'<time>'+esc(a.ts)+' · '+esc(a.actor)+'</time></div></li>').join('')+'</ul>';
}
function phaseLabel(p, k){ return '<div class="ds-label" style="margin:var(--t1m-space-3) 0 var(--t1m-space-1)">'+icon(SERVICES[p.svc].icon)+' '+(k+1)+' · '+esc(p.phase)+'</div>'; }
/* The plan before a job exists (on the inquiry and in Settings). */
function progressPreview(services, scope, direction, cargoType, truckLegs){
  const ph = phasesOf(buildPlan(services, scope, direction, cargoType||'FCL', truckLegs));
  if(!ph.length) return '<p class="ds-muted ds-small">Pick services to see the plan.</p>';
  return ph.map((p,k)=>phaseLabel(p,k)+'<ol class="ds-track ds-track--compact">'+p.ms.map(m=>'<li class="ds-track__step" title="'+esc(STEP_HINT[m.name]||'')+'">'+esc(m.name)+'</li>').join('')+'</ol>').join('')+
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
  const overview = '<div class="ds-label" style="margin:var(--t1m-space-3) 0 var(--t1m-space-1)">All phases</div><ol class="ds-track ds-track--compact ds-track--left ds-track--phases" aria-label="All phases">'+tracks.map((t,k)=>{
    const d = t.ms.filter(m=>m.done).length, state = d===t.ms.length ? 'done' : k===ci ? (held?'blocked':'current') : '';
    return '<li class="ds-track__step" data-state="'+state+'"'+(k===vi?' data-selected':'')+' role="button" tabindex="0" aria-label="Show '+esc(t.phase)+' steps" onclick="pickPhase(\''+j.id+'\','+k+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){ event.preventDefault(); pickPhase(\''+j.id+'\','+k+'); }">'+esc((k+1)+' · '+t.phase)+'<span class="ds-track__date">'+d+' of '+t.ms.length+' done</span></li>';
  }).join('')+'</ol>';
  const t = tracks[vi];
  const detail = '<div class="ds-label" style="margin:var(--t1m-space-5) 0 var(--t1m-space-1)">'+(vi===ci?'Current phase':'Reviewing phase · click another phase above to switch')+'</div>'+phaseLabel(t, vi)+'<ol class="ds-track ds-track--compact ds-track--left" aria-label="'+esc(t.phase)+'">'+t.ms.map(m=>{
    const state = m.done ? 'done' : m===cur ? (held?'blocked':'current') : '';
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
function convertToJob(inqId, form){
  const i = inqById(inqId), v = acceptedVersion(i), fd = new FormData(form);
  const opsByService = {}; let bad = false;
  SERVICE_ORDER.filter(k=>i.services.includes(k)).forEach(k=>{ opsByService[k] = fd.getAll('ops_'+k); if(fieldError(form,'ops_'+k, opsByService[k].length?'':'Assign at least one person for '+SERVICES[k].label+'.')) bad = true; });
  if(bad) return;
  if(needConfirm('Convert to job?', 'This creates the job and notifies the Operations staff you assigned. The inquiry is locked afterwards.', 'Create job', "convertToJob('"+inqId+"',document.getElementById('"+form.id+"'))")) return;
  const ops = [].concat(...Object.values(opsByService)).filter((n,k,a)=>a.indexOf(n)===k);
  const cargoType = String(fd.get('cargoType')), num = k=>{ const x = fd.get(k); return x===null || x==='' ? null : Math.max(0, parseInt(x,10)||0); };
  const j = { id:nextId('job'), inquiryId:i.id, quoteV:v.v, customerId:i.customerId, scope:i.scope, direction:i.direction, services:i.services.slice(), cargoType,
    commodity:reqWhat(i), origin:reqFrom(i.request), destination:reqTo(i.request), request:Object.assign({}, i.request), deliveryInstructions:i.request.deliveryInstructions||'',
    refs:{ bl:String(fd.get('bl')||'').trim(), containers:String(fd.get('containers')||'').trim() }, ops, opsByService, sales:i.staff.slice(), createdBy:me(), createdOn:todayDMY(),
    ms:buildMilestones(i.services, i.scope, i.direction, cargoType, i.truckLegs), truckLegs:i.truckLegs||null, docs:null, issues:[],
    free:null, status:'Active', funds:[], vendorBills:[], billing:null, trackingCode:newTrackingCode(), log:[] };
  j.docs = linkDocs(j.ms, buildDocs(i.services, i.scope, i.direction));
  if(clockApplies(j)) j.free = { portDays:num('portDays') ?? SETTINGS.portFreeDays, containerDays:num('containerDays') ?? SETTINGS.containerFreeDays, arrival:null };
  JOBS.push(j); i.jobId = j.id;
  logTo(i, 'Converted to job', j.id+' created. Operations: '+ops.join(', ')+'.');
  logTo(j, 'Job created', 'From '+i.id+' (accepted v'+v.v+', '+amountText(v)+'). Operations: '+ops.join(', ')+'. Tracking code '+j.trackingCode+'.');
  notify({ users:ops }, 'You were assigned to job '+j.id+' ('+custById(j.customerId).name+').', '#/jobs/'+j.id);
  notify({ roles:['Accounting'] }, 'New job '+j.id+' ('+custById(j.customerId).name+'). Fund requests and billing will come through it.', '#/jobs/'+j.id);
  closeDrawer(); STATE.justNext = j.id; showToast('Job '+j.id+' created.', 'success', 'box'); go('#/jobs/'+j.id);
}

/* ---------- Jobs list ---------- */
const JOB_FILTERS = [
  ['active','Active', j=>j.status!=='Completed'],
  ['attention','Needs attention', j=>jobHealth(j).tone==='warning'],
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
  const bills = canView('bill.view');
  const body = rows.map(j=>{
    const c = custById(j.customerId), clk = worstClock(j), bs = billingStatus(j);
    return '<tr data-href onclick="go(\'#/jobs/'+j.id+'\')"><td data-label="Job"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(c.name)+(routeText(j.origin, j.destination)?' · '+esc(routeText(j.origin, j.destination)):'')+'</span></span></td>'+
      '<td data-label="Services" style="white-space:normal">'+esc(servicesText(j.services))+'<div class="ds-muted ds-xs">'+esc(scopeText(j)+' · '+j.cargoType)+'</div></td>'+
      '<td data-label="Current step">'+stagePill(j)+'</td><td data-label="Health">'+healthPill(j)+'</td>'+
      '<td data-label="Free time">'+(clk?'<span class="'+(clockTone(clk)==='danger'?'ds-overdue':'ds-small')+'">'+icon('clock')+' '+esc(clockText(clk))+'</span>':'<span class="ds-muted3">—</span>')+'</td>'+
      (bills?'<td data-label="Billing">'+(j.status==='Completed'?pill(bs.label, bs.tone, bs.icon, 'ds-pill--sm'):'<span class="ds-muted3">—</span>')+'</td>':'')+'</tr>';
  }).join('');
  return '<div class="ds-page-head"><div><h1>Jobs</h1><p class="ds-page-head__sub">'+(hasRole('Operations')&&!hasRole('Manager')?'Jobs you are assigned to. ':'')+'Where each job is, whether it is OK, and how much free time is left.</p></div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-stack--sm"><div class="ds-chips ds-chips--scroll">'+JOB_FILTERS.map(chip).join('')+'</div>'+
      '<div class="ds-row" style="flex-wrap:wrap"><div class="ds-search" style="flex:1;min-width:220px;max-width:420px">'+icon('search')+'<input class="ds-input" id="job-search" placeholder="Job, inquiry, customer, BL, container or tracking code" value="'+esc(STATE.jobQuery)+'" oninput="STATE.jobQuery=this.value; render()"></div>'+
      '<div style="width:220px">'+selectWrap('<select class="ds-select" id="job-svc" aria-label="Service" onchange="STATE.jobService=this.value; render()"><option value="">All services</option>'+options(SERVICE_ORDER.map(k=>({value:k,label:SERVICES[k].label})), STATE.jobService)+'</select>')+'</div>'+
      '<span class="ds-muted ds-small" style="margin-left:auto">'+plural(rows.length,'job')+'</span></div></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="jobs-table"><thead><tr><th>Job</th><th>Services</th><th>Current step</th><th>Health</th><th>Free time</th>'+(bills?'<th>Billing</th>':'')+'</tr></thead><tbody>'+
      (body || '<tr><td colspan="6">'+(base.length ? emptyState('search','No jobs match','Clear the search or pick another group.') : emptyState('box','No jobs yet','A job is created when a Manager converts a won inquiry.'))+'</td></tr>')+'</tbody></table></div></section>';
}

/* ---------- Job page ---------- */
function jobNext(j){
  const id = j.id, mgrs = usersWithRole('Manager').map(u=>u.name);
  if(j.status==='Completed'){
    const bs = billingStatus(j), fin = financiallyClosed(j);
    return { tone:'done', icon:'check', eyebrow: fin ? 'Financially closed' : 'Completed', title: fin ? 'Paid in full and every fund request verified' : 'Job completed',
      text:'Confirmed by '+j.completed.by+' on '+j.completed.on+'.'+(canView('bill.view') ? ' Billing: '+bs.label+'.' : ''), items:[],
      primary: canView('bill.view') ? act('Open billing',"goTab('"+id+"','money')",'receipt') : null };
  }
  if(j.status==='For closing'){
    const mine = can('job.complete');
    return { tone: mine?'ready':'waiting', icon:'flag', eyebrow: mine?'Needs your confirmation':'Waiting on a manager', title:'Confirm the job is completed',
      text:'Submitted by '+j.submitted.by+' on '+j.submitted.on+'. Confirming hands it to Accounting for billing.',
      items:closingGate(j).map(g=>({ label:g.label, sub:g.sub, met:g.ok })), gateTitle:'Closing checklist',
      primary: mine ? act('Confirm completed',"openConfirmComplete('"+id+"')",'check') : null,
      secondary: mine ? act('Send back to Ops',"openSendBack('"+id+"')",'refresh') : null, who: mine ? null : waitingOn(mgrs,'Manager') };
  }
  const iss = openIssue(j);
  if(iss){
    const mine = can('job.issue', j);
    return { tone:'blocked', icon:'lock', eyebrow:'On hold · issue', title:iss.reason, text:'Flagged by '+iss.by+' on '+iss.on+'. Milestones are frozen until it is resolved.',
      items:[{ label:'Issue resolved', sub:'Manager or assigned Operations', met:false, blocked:true, act: mine ? act('Resolve',"openResolveIssue('"+id+"','"+iss.id+"')",'check') : null }],
      primary: mine ? act('Resolve issue',"openResolveIssue('"+id+"','"+iss.id+"')",'check') : null, who: mine ? null : 'Waiting on '+j.ops.join(', ')+' (Operations) or a manager.' };
  }
  const k = nextMsIndex(j), mine = k>=0 ? canWork(j, j.ms[k].svc) : can('job.update', j);
  if(k>=0){
    const m = j.ms[k], phases = jobTracks(j), pk = phases.findIndex(p=>p.ms.includes(m)), track = phases[pk].ms;
    const items = track.map(x=>({ label:x.name+(x.proof?' (proof needed)':''), hint:STEP_HINT[x.name], sub: x.done ? shortDate(x.date)+' · '+x.by+(x.laneValue?' · lane '+x.laneValue:'') : null, met:x.done,
      act: x===m && mine && !missingNeeds(j, m).length && !fundGate(j, m) ? act('Mark done',"openMilestone('"+id+"',"+k+")",'check') : null }));
    const needs = stepDocs(j, m, 'needs'), missing = missingNeeds(j, m), makes = stepDocs(j, m, 'produces');
    const docItems = needs.map(d=>({ label:'Needed first: '+d.name, sub: d.status==='Received' ? 'Received · '+d.file : 'Required before “'+m.name+'” can be ticked', met:d.status==='Received', act: d.status!=='Received' && mine ? act('Upload',"openUploadDoc('"+id+"','"+d.id+"')",'upload') : null }));
    const fg = fundGate(j, m);
    const fgAct = fg ? (fg.fund && fg.fund.status==='Returned' ? act('Edit & resubmit',"openFundRequest('"+id+"','"+fg.fund.id+"')",'refresh') : fg.none ? act('Request funds',"openFundRequest('"+id+"',null,'"+fg.purpose+"')",'wallet') : act('Open money',"goTab('"+id+"','money')",'wallet')) : null;
    if(fg) docItems.unshift({ label:fg.label, sub:fg.sub, badge:fg.badge, met:false, act: mine ? fgAct : null });
    const firstMissing = missing[0];
    return { tone: mine?'ready':'waiting', icon:SERVICES[m.svc].icon, eyebrow:'Phase '+(pk+1)+' of '+phases.length+' · '+m.phase+' · step '+(track.indexOf(m)+1)+' of '+track.length, title:'Next: '+m.name,
      text:(STEP_HINT[m.name]||'')+(m.proof?' Needs a file attached.':'')+(missing.length?' First, upload: '+missing.map(d=>d.name).join(', ')+'.':'')+(fg?' Funds for the '+fg.what+' must be released first.':''),
      items:docItems.concat(items), gateTitle:m.phase,
      primary: !mine ? null : firstMissing ? act('Upload '+firstMissing.name,"openUploadDoc('"+id+"','"+firstMissing.id+"')",'upload') : fg ? fgAct : act('Mark “'+m.name+'” done',"openMilestone('"+id+"',"+k+")",'check'),
      who: mine ? null : 'Waiting on '+opsFor(j, m.svc).join(', ')+' ('+SERVICES[m.svc].label+').' };
  }
  const gate = closingGate(j), ok = gate.every(g=>g.ok), mineClose = can('job.submitClose', j);
  return { tone:'ready', icon:'flag', eyebrow:'All milestones done', title: ok ? 'Submit for closing' : 'Finish the closing checklist',
    text:'A manager confirms completion, then Accounting bills the client.',
    items:gate.map(g=>({ label:g.label, sub:g.sub, met:g.ok, act: g.ok ? null : g.key==='docs' ? act('Open documents',"goTab('"+id+"','documents')",'file') : null })), gateTitle:'Closing checklist',
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
  return '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('file')+'Supporting documents</h3></div><div class="ds-panel__body ds-panel__body--flush ds-scroll-list">'+docs.map(d=>fileRow(d.name, d.meta)).join('')+'</div></section>';
}
function factsPanel(j){
  const c = custById(j.customerId), i = inqById(j.inquiryId), v = i ? i.versions.find(x=>x.v===j.quoteV) : null;
  const f = (k,val)=>'<dt>'+esc(k)+'</dt><dd>'+val+'</dd>';
  return '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('info')+'Key facts</h3></div><div class="ds-panel__body"><dl class="ds-facts ds-facts--stacked">'+
    f('Customer', canView('customer.edit')?'<a class="ds-link" href="#/customers/'+c.id+'">'+esc(c.name)+'</a>':esc(c.name))+
    f('Inquiry', canView('inquiry.view', i)?'<a class="ds-link ds-mono" href="#/inquiries/'+j.inquiryId+'">'+esc(j.inquiryId)+'</a>':'<span class="ds-mono">'+esc(j.inquiryId)+'</span>')+
    (v && (canView('bill.view') || hasRole('Sales')) ? f('Accepted quote', 'v'+v.v+' · '+amountText(v)) : '')+
    f('Request', esc(j.commodity+(j.cargoType?' · '+j.cargoType:'')))+
    ((j.ms.find(x=>x.shippingLine)||{}).shippingLine?f('Shipping line', esc(j.ms.find(x=>x.shippingLine).shippingLine)):'')+
    (j.deliveryInstructions?f('Delivery instructions', esc(j.deliveryInstructions)):'')+
    f('Operations', j.opsByService ? SERVICE_ORDER.filter(k=>j.opsByService[k]).map(k=>'<div>'+esc(SERVICES[k].label)+': '+esc(j.opsByService[k].join(', '))+'</div>').join('') : esc(j.ops.join(', ')))+
    (j.refs.bl?f('BL / AWB', '<span class="ds-mono">'+esc(j.refs.bl)+'</span>'):'')+
    (j.refs.containers?f('Container(s)', '<span class="ds-mono">'+esc(j.refs.containers)+'</span>'):'')+
    f('Tracking code', '<span class="ds-mono">'+esc(j.trackingCode)+'</span> <a class="ds-link ds-xs" href="#/track/'+esc(j.trackingCode)+'" title="The page the client sees">'+icon('eye')+'Client view</a>')+
  '</dl><p class="ds-muted ds-xs" style="margin-top:var(--t1m-space-2)">Give the client the tracking code. Job numbers alone do not open the tracking page.</p></div></section>';
}
const TAB_LABELS = { milestones:'Milestones', documents:'Documents', issues:'Issues', money:ACCOUNTING_BASIC?'Funds':'Money', history:'History' };
function jobTabs(j){ const t = ['milestones','documents','issues']; if(canView('money.view', j) || canView('bill.view')) t.push('money'); t.push('history'); return t; }
function tabCount(j, t){
  if(t==='documents'){ const n = pendingDocs(j).length; return n ? '<span class="ds-tab__count ds-tab__count--warning">'+n+'</span>' : ''; }
  if(t==='issues'){ return openIssue(j) ? '<span class="ds-tab__count ds-tab__count--danger">1</span>' : ''; }
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
  const body = { milestones:jobMilestonesTab, documents:jobDocumentsTab, issues:jobIssuesTab, money:jobMoneyTab, history:j=>historyList(j.log.slice().reverse()) }[active](j);
  const menu = [];
  if(can('job.issue', j) && j.status==='Active' && !openIssue(j)) menu.push('<button onclick="closePopover(); openFlagIssue(\''+id+'\')">'+icon('flag')+'Flag an issue</button>');
  if(can('job.freeDays', j) && clockApplies(j) && j.status!=='Completed') menu.push('<button onclick="closePopover(); openFreeDays(\''+id+'\')">'+icon('clock')+'Set free days</button>');
  if(can('fund.request', j) && j.status!=='Completed') menu.push('<button onclick="closePopover(); openFundRequest(\''+id+'\')">'+icon('wallet')+'New fund request</button>');
  menu.push('<a href="#/track/'+esc(j.trackingCode)+'" onclick="closePopover()">'+icon('eye')+'Open the client tracking page</a>');
  JOB_MENU = menu.join('');
  return '<nav class="ds-crumbs"><a href="#/jobs">Jobs</a>'+icon('chevron-right')+'<span class="ds-mono">'+j.id+'</span></nav>'+
    '<header class="ds-jobhead"><div><h1>'+j.id+' '+healthPill(j)+'</h1>'+
      '<div class="ds-jobhead__line"><strong class="ds-strong">'+esc(c.name)+'</strong>'+(routeText(j.origin, j.destination)?'<span class="ds-routeline">'+esc(j.origin||'—')+icon('arrow-right')+esc(j.destination||'—')+'</span>':'')+'<span>'+esc(scopeText(j))+'</span><span>'+esc(servicesText(j.services))+'</span></div></div>'+
      '<div class="ds-jobhead__actions">'+stagePill(j)+'<button class="ds-btn ds-btn--secondary" id="job-more" onclick="event.stopPropagation(); openPopover(this, JOB_MENU)" aria-haspopup="true">'+icon('more')+'More</button></div></header>'+
    '<div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('flag')+'Progress map</h2><span class="ds-panel__hint">'+j.ms.filter(m=>m.done).length+' of '+j.ms.length+' milestones</span></div><div class="ds-panel__body" id="progress-map-body" style="padding-top:0">'+progressMapHtml(j)+'</div></section>'+
      '<div class="ds-split"><div class="ds-stack">'+nextPanelHtml(n)+jobSupportDocsPanel(j)+'</div><div class="ds-stack">'+clocksPanel(j)+factsPanel(j)+'</div></div>'+
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
      '<td data-label="Status">'+st+'</td><td data-label="Date">'+(m.done?esc(m.date):'—')+'</td><td data-label="By">'+(m.done?esc(m.by):'—')+'</td>'+
      '<td data-label="Remark" style="white-space:normal">'+esc([m.laneValue?'Lane '+m.laneValue:'', m.truck?m.truck.driver+' · '+m.truck.plate+' · '+m.truck.type:'', m.shippingLine?'Shipping line: '+m.shippingLine:'', m.remark||''].filter(Boolean).join(' · '))+(m.file?' <span class="ds-mono ds-xs">'+esc(m.file)+'</span>':'')+'</td>'+
      '</tr>';
  }).join('');
  return '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">Milestones are done in order from the Next step panel above. No approval per milestone.</p>'+
    '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack ds-table--compact"><thead><tr><th>Phase</th><th>Milestone</th><th>Status</th><th>Date</th><th>By</th><th>Remark / file</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function openMilestone(jobId, k){
  const j = jobById(jobId), m = j.ms[k];
  if(!canWork(j, m.svc)) return denied('Only the Operations staff assigned to '+SERVICES[m.svc].label+' (or a Manager) can update this step.');
  if(openIssue(j)) return denied('The job is on hold. Resolve the issue first.');
  if(nextMsIndex(j)!==k) return denied('Milestones are done in order.');
  const missing = missingNeeds(j, m);
  if(missing.length) return denied('Upload first: '+missing.map(d=>d.name).join(', ')+'.');
  const fg = fundGate(j, m); if(fg) return denied('Duties can only be marked paid after the funds are released. '+fg.sub+'.');
  const makes = stepDocs(j, m, 'produces').filter(d=>d.status!=='Received');
  const proofDoc = m.proof && makes.length===1 ? makes[0] : null;
  openDrawer({ title:'Mark “'+m.name+'” done', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(m.phase),
    body:'<form class="ds-stack--sm" id="ms-form" novalidate onsubmit="event.preventDefault(); saveMilestone(\''+jobId+'\','+k+', this)">'+
      (STEP_HINT[m.name]?'<p class="ds-small ds-muted">'+esc(STEP_HINT[m.name])+'</p>':'')+
      dateField('ms-date','date','Date', todayDMY())+
      (/^Booked/.test(m.name) ? '<div class="ds-field"><label for="ms-line">Shipping line</label><input class="ds-input" id="ms-line" name="shippingLine" placeholder="Name of the shipping line" autocomplete="off">'+errorSlot('shippingLine')+'</div>' : '')+
      (m.name==='Truck scheduled' ? '<div class="ds-field"><label for="ms-driver">Driver name</label><input class="ds-input" id="ms-driver" name="driver" placeholder="Full name of the driver">'+errorSlot('driver')+'</div><div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="ms-plate">Plate number</label><input class="ds-input ds-mono" id="ms-plate" name="plate" placeholder="e.g. ABC 1234">'+errorSlot('plate')+'</div><div class="ds-field"><label for="ms-ttype">Type of truck</label>'+selectWrap('<select class="ds-select" id="ms-ttype" name="truckType"><option value="">Select type</option>'+options(TRUCK_TYPES)+'</select>')+errorSlot('truckType')+'</div></div>' : '')+
      (m.lane ? '<div class="ds-field"><span class="ds-field__label">Lane assigned by BOC</span><div class="ds-stack--sm">'+LANES.map((l,x)=>'<label class="ds-check" style="align-items:flex-start"><input type="radio" name="lane" value="'+l+'"'+(x===0?' checked':'')+'> <span>'+pill(l, LANE_TONE[l], l==='Green'?'check':'alert','ds-pill--sm')+'<br><span class="ds-muted ds-xs">'+esc(LANE_MEANING[l])+'</span></span></label>').join('')+'</div></div>' : '')+
      makes.map(d=>'<div class="ds-field"><label>'+esc(d.name)+'</label>'+uploadHtml('doc_'+d.id)+errorSlot('file_'+d.id)+'</div>').join('')+
      (proofDoc ? '' : '<div class="ds-field"><label>'+(m.proof?'Proof':'Other attachment <span class="ds-opt">optional</span>')+'</label>'+uploadHtml('msFile', m.proof ? (m.name==='Duties paid'?'The duty payment receipt':m.name==='Approved'?'The BOC approval or accreditation certificate':m.name==='Empty container returned'?'The container return or interchange receipt':'Proof for this step') : 'Photo or document')+(m.proof?errorSlot('file'):'')+'</div>')+
      '<div class="ds-field"><label for="ms-remark">Remark <span class="ds-opt">optional</span></label><textarea class="ds-textarea" id="ms-remark" name="remark" style="min-height:64px"></textarea></div></form>',
    foot: drawerFoot('Mark done','ms-form',{icon:'check'}) });
}
function saveMilestone(jobId, k, form){
  const j = jobById(jobId), m = j.ms[k], fd = new FormData(form), date = isoToDMY(fd.get('date'));
  const prev = j.ms.slice(0,k).reverse().find(x=>x.done);
  const bad = fieldError(form,'date', !date?'Pick the date.':daysUntil(date)>0?'The date cannot be in the future.':(prev && daysBetween(prev.date, date)<0)?'Earlier than the previous milestone ('+prev.date+').':'') |
    0;
  const makes = stepDocs(j, m, 'produces').filter(d=>d.status!=='Received');
  const proofDoc = m.proof && makes.length===1 ? makes[0] : null;
  const proofFile = proofDoc ? UPLOADS['doc_'+proofDoc.id] : UPLOADS.msFile;
  let missingDoc = 0;
  makes.forEach(d=>{ if(fieldError(form,'file_'+d.id, UPLOADS['doc_'+d.id] ? '' : 'Upload the '+d.name+' to continue.')) missingDoc = 1; });
  const trk = m.name==='Truck scheduled' ? { driver:String(fd.get('driver')||'').trim(), plate:String(fd.get('plate')||'').trim().toUpperCase(), type:String(fd.get('truckType')||'') } : null;
  const line = /^Booked/.test(m.name) ? String(fd.get('shippingLine')||'').trim() : null;
  const lineBad = line!==null ? fieldError(form,'shippingLine', line?'':'Enter the shipping line.') : 0;
  const truckBad = trk ? (fieldError(form,'driver', trk.driver?'':'Enter the driver’s name.') | fieldError(form,'plate', trk.plate?'':'Enter the plate number.') | fieldError(form,'truckType', trk.type?'':'Pick the type of truck.')) : 0;
  if(bad | missingDoc | truckBad | lineBad | fieldError(form,'file', m.proof && !proofDoc && !proofFile ? 'This step needs proof attached.' : '')) return;
  if(needConfirm('Mark “'+m.name+'” done?', 'It is recorded in the job history under your name, with the date you picked.', 'Mark done', "saveMilestone('"+jobId+"',"+k+",document.getElementById('"+form.id+"'))")) return;
  makes.forEach(d=>{ const f = UPLOADS['doc_'+d.id]; if(f){ Object.assign(d, { status:'Received', file:f, by:me(), on:date }); logTo(j, 'Document uploaded', d.name+' ('+f+') with “'+m.name+'”.'); } });
  Object.assign(m, { done:true, date, by:me(), remark:String(fd.get('remark')||'').trim()||null, file:proofFile||UPLOADS.msFile||null, laneValue: m.lane ? String(fd.get('lane')) : null, truck:trk, shippingLine:line||null });
  logTo(j, 'Milestone done', m.phase+' · '+m.name+(m.laneValue?' (lane '+m.laneValue+')':'')+(m.truck?' · '+m.truck.driver+', '+m.truck.plate+', '+m.truck.type:'')+(m.shippingLine?' · '+m.shippingLine:'')+' on '+date+(m.file?' · '+m.file:'')+'.');
  closeDrawer(); STATE.justNext = j.id; showToast(m.name+' done.', 'success', 'check'); render();
}

/* ---------- Documents ---------- */
function jobDocumentsTab(j){
  const got = j.docs.filter(d=>d.status==='Received').length, mine = can('job.update', j) && j.status!=='Completed';
  const order = d=>{ const k = j.ms.findIndex(m=>m.name===d.step && m.svc===d.svc); return k<0 ? 999 : k; };
  const rows = j.docs.slice().sort((a,b)=>order(a)-order(b)).map(d=>{
    const got = d.status==='Received', canAct = got && mine && (hasRole('Manager') || hasRole('Admin'));
    const view = got ? '<a class="ds-btn ds-btn--ghost ds-btn--sm" href="dummy.pdf" target="_blank" rel="noopener">'+icon('eye')+'View</a>' : '';
    const a = '<span class="ds-row ds-row--tight">'+view+(canAct ? '<button class="ds-btn ds-btn--'+(got?'ghost':'secondary')+' ds-btn--sm" onclick="openUploadDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('upload')+(got?'Replace':'Upload')+'</button>' : '')+'</span>';
    return '<div class="ds-doc" id="doc-'+d.id+'"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">'+esc(d.name)+'</div><div class="ds-doc__meta">'+esc((d.step ? (d.kind==='needs' ? 'Needed before “'+d.step+'”' : 'Comes with “'+d.step+'”') : 'Needed before closing')+' · '+(d.status==='Received'?d.file+' · '+d.by+', '+d.on:'Not received yet'))+'</div></div>'+
      pill(d.status, d.status==='Received'?'success':'warning', d.status==='Received'?'check':'alert')+a+'</div>';
  }).join('');
  return '<div class="ds-stack--sm"><div class="ds-row--between"><span><span class="ds-strong">'+got+' of '+j.docs.length+' received</span><span class="ds-muted ds-small"> · each belongs to the step where it is needed or produced; all are needed before the job can close</span></span>'+
    (mine?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openAddDoc(\''+j.id+'\')">'+icon('plus')+'Add a document</button>':'')+'</div>'+
    '<span class="ds-bar-track" style="display:block;height:6px"><span class="ds-bar-fill ds-bar-fill--success" style="width:'+(j.docs.length?Math.round(got/j.docs.length*100):0)+'%"></span></span>'+
    '<div class="ds-panel" style="margin-top:var(--t1m-space-4)" id="doc-list">'+(rows||'<div class="ds-panel__body ds-muted">No documents on the checklist.</div>')+'</div></div>';
}
function openUploadDoc(jobId, docId){
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  if(!can('job.update', j)) return denied();
  if(d.status==='Received' && !hasRole('Manager') && !hasRole('Admin')) return denied('Only a Manager can replace a received document.');
  if(!canWork(j, d.svc)) return denied('Only the Operations staff assigned to '+SERVICES[d.svc].label+' (or a Manager) can upload this.');
  openDrawer({ title:(d.status==='Received'?'Replace ':'Upload ')+d.name, sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="doc-form" novalidate onsubmit="event.preventDefault(); saveDoc(\''+jobId+'\',\''+docId+'\', this)"><div class="ds-field"><label>File</label>'+uploadHtml('docFile','PDF, image or scan')+errorSlot('file')+'</div></form>',
    foot: drawerFoot('Save document','doc-form',{icon:'upload'}) });
}
function saveDoc(jobId, docId, form){
  if(fieldError(form,'file', UPLOADS.docFile?'':'Choose a file first.')) return;
  const j = jobById(jobId), d = j.docs.find(x=>x.id===docId);
  Object.assign(d, { status:'Received', file:UPLOADS.docFile, by:me(), on:todayDMY() });
  logTo(j, 'Document uploaded', d.name+' ('+d.file+').');
  closeDrawer(); STATE.justNext = j.id; showToast(d.name+' received.', 'success', 'upload'); render();
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
  j.docs.push({ id:nextId('doc'), svc:String(fd.get('svc')), name, status:'Pending', file:null, by:null, on:null, step:null, kind:null });
  logTo(j, 'Document added', name+' added to the checklist.');
  closeDrawer(); showToast(name+' added.', 'success', 'plus'); render();
}

/* ---------- Issues ---------- */
function jobIssuesTab(j){
  const mine = can('job.issue', j) && j.status==='Active';
  const cards = j.issues.slice().reverse().map(x=>'<article class="ds-panel" style="margin-bottom:var(--t1m-space-3)"><div class="ds-panel__body ds-stack--sm"><div class="ds-row--between"><strong class="ds-strong">'+esc(x.reason)+'</strong>'+
    (x.resolved?pill('Resolved','success','check'):pill('Open · job on hold','danger','lock'))+'</div><p class="ds-muted ds-xs">Flagged by '+esc(x.by)+' on '+esc(x.on)+'</p>'+
    (x.resolved?'<div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>Resolved by '+esc(x.resolved.by)+', '+esc(x.resolved.on)+'</strong>'+esc(x.resolved.note)+'</div></div>':(mine?'<div><button class="ds-btn ds-btn--secondary" onclick="openResolveIssue(\''+j.id+'\',\''+x.id+'\')">'+icon('check')+'Resolve</button></div>':''))+'</div></article>').join('');
  return '<div class="ds-row--between" style="margin-bottom:var(--t1m-space-4)"><p class="ds-muted ds-small" style="max-width:60ch">Anything that stops the job (red lane, missing permit, short shipment, damage). Flagging puts the job on hold until it is resolved; managers and the assigned sales staff are told.</p>'+
    (mine && !openIssue(j) ? '<button class="ds-btn ds-btn--secondary" onclick="openFlagIssue(\''+j.id+'\')">'+icon('flag')+'Flag an issue</button>' : '')+'</div>'+
    (cards || emptyState('shield','No issues on this job','Everything has gone to plan so far.'));
}
function openFlagIssue(jobId){
  const j = jobById(jobId);
  if(!can('job.issue', j)) return denied();
  openDrawer({ title:'Flag an issue', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(stageText(j)),
    body:'<form class="ds-stack--sm" id="issue-form" novalidate onsubmit="event.preventDefault(); saveIssue(\''+jobId+'\', this)">'+
      '<div class="ds-alert ds-alert--warning">'+icon('lock')+'<div><strong>This puts the job on hold</strong>Milestones are frozen until the issue is resolved.</div></div>'+
      '<div class="ds-field"><label for="is-reason">What is wrong?</label><textarea class="ds-textarea" id="is-reason" name="reason" placeholder="e.g. Red lane: physical inspection, FDA permit missing"></textarea>'+errorSlot('reason')+'</div></form>',
    foot: drawerFoot('Flag issue','issue-form',{icon:'flag', danger:true}) });
}
function saveIssue(jobId, form){
  const reason = String(new FormData(form).get('reason')||'').trim();
  if(fieldError(form,'reason', reason?'':'Describe the issue.')) return;
  if(needConfirm('Flag this issue?', 'The job goes on hold and its milestones are frozen until the issue is resolved.', 'Flag issue', "saveIssue('"+jobId+"',document.getElementById('"+form.id+"'))", true)) return;
  const j = jobById(jobId);
  j.issues.push({ id:nextId('issue'), reason, by:me(), on:todayDMY(), resolved:null });
  logTo(j, 'Issue flagged', reason);
  notify({ roles:['Manager'], users:j.sales }, 'Job '+j.id+' is on hold: '+reason, '#/jobs/'+j.id+'/issues');
  closeDrawer(); STATE.justNext = j.id; showToast('Issue flagged. The job is on hold.', 'warning', 'flag'); render();
}
function openResolveIssue(jobId, issueId){
  const j = jobById(jobId), x = j.issues.find(y=>y.id===issueId);
  if(!can('job.issue', j)) return denied();
  openDrawer({ title:'Resolve issue', sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="resolve-form" novalidate onsubmit="event.preventDefault(); saveResolve(\''+jobId+'\',\''+issueId+'\', this)"><div class="ds-alert ds-alert--danger">'+icon('lock')+'<div><strong>Open issue</strong>'+esc(x.reason)+'</div></div>'+
      '<div class="ds-field"><label for="rs-note">How was it resolved?</label><textarea class="ds-textarea" id="rs-note" name="note"></textarea>'+errorSlot('note')+'</div></form>',
    foot: drawerFoot('Mark resolved','resolve-form',{icon:'check'}) });
}
function saveResolve(jobId, issueId, form){
  const note = String(new FormData(form).get('note')||'').trim();
  if(fieldError(form,'note', note?'':'Say how it was resolved.')) return;
  if(needConfirm('Resolve this issue?', 'The job moves again.', 'Resolve', "saveResolve('"+jobId+"','"+issueId+"',document.getElementById('"+form.id+"'))")) return;
  const j = jobById(jobId), x = j.issues.find(y=>y.id===issueId);
  x.resolved = { by:me(), on:todayDMY(), note };
  logTo(j, 'Issue resolved', x.reason+' → '+note);
  notify({ roles:['Manager'], users:j.sales.concat(j.ops) }, 'Job '+j.id+' is moving again: issue resolved.', '#/jobs/'+j.id);
  closeDrawer(); STATE.justNext = j.id; showToast('Resolved. The job can move again.', 'success', 'check'); render();
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
      '<div class="ds-field"><label for="rf-bl">BL / AWB no.</label><input class="ds-input" id="rf-bl" name="bl" value="'+esc(j.refs.bl)+'"></div>'+
      '<div class="ds-field"><label for="rf-cont">Container no(s).</label><input class="ds-input" id="rf-cont" name="containers" value="'+esc(j.refs.containers)+'" placeholder="Comma separated"></div></form>',
    foot: drawerFoot('Save','refs-form',{icon:'check'}) });
}
function saveRefs(jobId, form){
  const j = jobById(jobId), fd = new FormData(form);
  j.refs = { bl:String(fd.get('bl')||'').trim(), containers:String(fd.get('containers')||'').trim() };
  logTo(j, 'References updated', 'BL '+(j.refs.bl||'—')+', containers '+(j.refs.containers||'—')+'.');
  closeDrawer(); showToast('References saved.', 'success', 'check'); render();
}

/* ---------- Closing ---------- */
function submitForClosing(jobId){
  const j = jobById(jobId);
  if(!can('job.submitClose', j)) return denied();
  if(!closingGate(j).every(g=>g.ok)) return denied('Finish the closing checklist first.');
  if(needConfirm('Submit for closing?', 'A manager will confirm completion. Make sure every milestone and document is in.', 'Submit for closing', "submitForClosing('"+jobId+"')")) return;
  j.status = 'For closing'; j.submitted = { by:me(), on:todayDMY() };
  logTo(j, 'Submitted for closing', 'All milestones and documents done.');
  notify({ roles:['Manager'] }, 'Job '+j.id+' was submitted for closing by '+me()+'.', '#/jobs/'+j.id);
  STATE.justNext = j.id; showToast('Submitted. A manager will confirm it.', 'success', 'flag'); render();
}
function openConfirmComplete(jobId){
  const j = jobById(jobId);
  if(!can('job.complete')) return denied('Only a Manager confirms completion.');
  const unverified = j.funds.filter(f=>f.status!=='Verified').length;
  openDrawer({ title:'Confirm job completed', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<div class="ds-stack--sm"><ul class="ds-gate">'+closingGate(j).map(g=>gateItemHtml({ label:g.label, sub:g.sub, met:g.ok })).join('')+'</ul>'+
      (unverified?'<div class="ds-alert ds-alert--info">'+icon('wallet')+'<div><strong>'+plural(unverified,'fund request')+' not verified yet</strong>That does not stop completion. Accounting finishes them before the job is financially closed.</div></div>':'')+
      '<p class="ds-small">Completing marks the job as done.</p></div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--primary" id="confirm-complete" onclick="confirmComplete(\''+jobId+'\')">'+icon('check')+'Confirm completed</button>' });
}
function confirmComplete(jobId){
  const j = jobById(jobId);
  if(needConfirm('Confirm job completed?', 'The job is marked as completed.', 'Confirm completed', "confirmComplete('"+jobId+"')")) return;
  j.status = 'Completed'; j.completed = { by:me(), on:todayDMY() }; j.billing = j.billing || { versions:[], payments:[] };
  logTo(j, 'Job completed', 'Confirmed by '+me()+'.');
  if(!ACCOUNTING_BASIC) notify({ roles:['Accounting'] }, 'Job '+j.id+' is completed and ready to bill.', '#/jobs/'+j.id+'/money');
  notify({ users:j.ops.concat(j.sales) }, 'Job '+j.id+' was confirmed completed.', '#/jobs/'+j.id);
  closeDrawer(); STATE.justNext = j.id; showToast(j.id+' completed. Accounting can bill it now.', 'success', 'check'); render();
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
