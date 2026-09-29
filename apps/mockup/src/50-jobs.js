/* ============================== SHIPMENTS LIST ==============================
   Columns answer, in order: which job, where is it, is it OK, what happens next, and how long before
   fees start. "Next step" is the column that makes the list something you can work from. */
function jobMatchesFilter(j, f){
  const h = jobHealth(j);
  if(f==='closed') return j.statusIndex===8;
  if(j.statusIndex===8) return false;
  if(f==='blocked') return h.tone==='danger';
  if(f==='attention') return h.tone==='warning';
  if(f==='clock'){ const c = deadlineInfo(j); return !!(c && c.days!=null && c.days<=2); }
  if(f==='funds') return canSeeFunds() && !!fundingGap(j);
  return true;
}
function renderJobsList(){
  const base = JOBS.filter(canSeeJob);
  const q = STATE.jobQuery.trim().toLowerCase();
  const f = STATE.jobFilter, st = STATE.jobStage;
  const rows = base.filter(j=>jobMatchesFilter(j, st===8 ? 'closed' : f) && (st==null || j.statusIndex===st) &&
    (!q || [j.id, j.containerNo, j.blNo, custById(j.customerId).name, j.consignee].some(v=>String(v).toLowerCase().includes(q))));
  const count = k => base.filter(j=>jobMatchesFilter(j,k)).length;
  const chip = (k,label,tone)=>'<button class="ds-chip'+(tone?' ds-chip--'+tone:'')+'" aria-pressed="'+(f===k && st==null)+'" onclick="STATE.jobFilter=\''+k+'\'; STATE.jobStage=null; render()">'+label+'<span class="ds-chip__count">'+count(k)+'</span></button>';
  const stageOpts = '<option value="">All stages</option>'+STATUS_STEPS.map((s,i)=>'<option value="'+i+'"'+(st===i?' selected':'')+'>'+(i+1)+'. '+s+' ('+base.filter(j=>j.statusIndex===i).length+')</option>').join('');
  const body = rows.map(j=>{
    const c = custById(j.customerId), n = nextStep(j), clk = deadlineInfo(j);
    const clkHtml = clk && clk.days!=null ? '<span class="'+(clk.days<0?'ds-overdue':clk.days<=2?'ds-strong':'ds-muted')+'" style="'+(clk.days>=0&&clk.days<=2?'color:var(--t1m-warning)':'')+'">'+icon('clock')+' '+esc(clockText(clk))+'</span>' : '<span class="ds-muted3">—</span>';
    return '<tr data-href onclick="go(\'#/jobs/'+j.id+'\')">'+
      '<td data-label="Shipment"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(c.name)+' · '+esc(j.origin.split(',')[0])+' → '+esc(j.destination.split(',')[0])+'</span></span></td>'+
      '<td data-label="Stage">'+stagePill(j)+'</td>'+
      '<td data-label="Health">'+healthPill(j)+'</td>'+
      '<td data-label="Next step" style="white-space:normal;min-width:220px"><span class="'+(n.tone==='blocked'?'ds-overdue':'ds-strong')+'">'+esc(n.short)+'</span></td>'+
      '<td data-label="Fee clock">'+clkHtml+'</td></tr>';
  }).join('');
  const stageChip = st!=null ? '<button class="ds-chip" aria-pressed="true" onclick="STATE.jobStage=null; render()">Stage: '+esc(STATUS_STEPS[st])+icon('x')+'</button>' : '';
  return '<div class="ds-page-head"><div><h1>'+(isCrew()?'My shipments':'Shipments')+'</h1><p class="ds-page-head__sub">Every job, where it is, whether it is OK, and what has to happen next.'+(isCrew()?' Only jobs you have tasks on.':'')+'</p></div>'+
    (can('Inquiry & Quotation')?'<div class="ds-page-head__actions"><button class="ds-btn ds-btn--secondary" onclick="go(\'#/inquiries\')" title="Jobs are created from an approved quotation, so nothing is typed twice">'+icon('plus')+'New job from a quote</button></div>':'')+'</div>'+
    '<section class="ds-panel ds-panel--elevated">'+
      '<div class="ds-panel__body ds-stack--sm">'+
        '<div class="ds-chips ds-chips--scroll">'+chip('all','Active')+chip('attention','Needs attention','warning')+chip('blocked','Blocked','danger')+chip('clock','Fees at risk','warning')+(canSeeFunds()?chip('funds','Short on funds','warning'):'')+chip('closed','Closed')+stageChip+'</div>'+
        '<div class="ds-row"><div class="ds-search" style="flex:1;min-width:220px;max-width:420px">'+icon('search')+'<input class="ds-input" id="job-search" placeholder="Job, container, BL, customer or consignee" value="'+esc(STATE.jobQuery)+'" oninput="STATE.jobQuery=this.value; render()"></div>'+
        '<div style="width:230px">'+selectWrap('<select class="ds-select" id="stage-filter" aria-label="Stage" onchange="STATE.jobStage=this.value===\'\'?null:+this.value; render()">'+stageOpts+'</select>')+'</div>'+
        '<span class="ds-muted ds-small" style="margin-left:auto">'+plural(rows.length,'job')+'</span></div>'+
      '</div>'+
      '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="jobs-table"><thead><tr><th>Shipment</th><th>Stage</th><th>Health</th><th>Next step</th><th>Fee clock</th></tr></thead><tbody>'+
        (body || '<tr><td colspan="5">'+emptyState('search','No jobs match','Clear the search or pick another filter.','<button class="ds-btn ds-btn--secondary" onclick="STATE.jobFilter=\'all\'; STATE.jobStage=null; STATE.jobQuery=\'\'; render()">Clear filters</button>')+'</td></tr>')+
      '</tbody></table></div>'+
    '</section>';
}

/* ============================== SHIPMENT 360 ==============================
   Top to bottom: who and where (header), how far (journey), WHAT NOW (next step, the hero), the
   clocks that cost money, then the record itself in tabs. The work is above the fold; the archive
   is below it. */
function journeyHtml(j){
  const blocked = isOnHold(j) || !!customsHold(j);
  return '<ol class="ds-track ds-track--compact" id="journey" aria-label="Journey">'+STATUS_STEPS.map((s,idx)=>{
    const state = idx<j.statusIndex || j.statusIndex===8 ? 'done' : idx===j.statusIndex ? (blocked?'blocked':'current') : '';
    const just = STATE.justAdvanced && STATE.justAdvanced.id===j.id && STATE.justAdvanced.idx===idx;
    const sub = s===CUSTOMS_PHASE ? '<span class="ds-track__sub" aria-label="Customs step '+((j.customs?j.customs.subIndex:0)+(idx<j.statusIndex?7:1))+' of 7">'+CUSTOMS_SUBSTAGES.map((x,k)=>'<i'+((idx<j.statusIndex)||(idx===j.statusIndex && j.customs && k<=j.customs.subIndex)?' data-on':'')+'></i>').join('')+'</span>' : '';
    return '<li class="ds-track__step" data-state="'+state+'"'+(just?' data-just':'')+' title="'+esc(STAGE_HINT[idx])+'">'+esc(s)+sub+'</li>';
  }).join('')+'</ol>';
}
function gateItemHtml(it){
  const ic = it.met ? 'check' : it.blocked ? 'lock' : 'circle';
  return '<li class="ds-gate__item"'+(it.met?' data-met':'')+(it.blocked?' data-blocked':'')+'>'+icon(ic)+
    '<div class="ds-gate__label">'+esc(it.label)+(it.sub?'<small'+(it.overdue?' class="ds-overdue"':'')+'>'+esc(it.sub)+'</small>':'')+'</div>'+
    (it.act?'<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="'+it.act.js+'">'+(it.act.icon?icon(it.act.icon):'')+esc(it.act.label)+'</button>':'<span></span>')+'</li>';
}
function customsStrip(j){
  if(STATUS_STEPS[j.statusIndex]!==CUSTOMS_PHASE || !j.customs) return '';
  const c = j.customs;
  return '<div class="ds-row" style="gap:var(--t1m-space-2) var(--t1m-space-4)">'+
    '<span class="ds-small">'+icon('shield')+' Customs step <strong>'+(c.subIndex+1)+' of 7</strong>: '+esc(CUSTOMS_SUBSTAGES[c.subIndex])+'</span>'+
    '<span class="ds-row ds-row--tight">'+pill('Lane '+c.lane, LANE_TONE[c.lane], c.lane==='Green'?'check':'alert')+'<span class="ds-muted ds-xs">'+esc(LANE_MEANING[c.lane])+'</span>'+
    (isManagerLike()?'<button class="ds-link ds-small" onclick="openLane(\''+j.id+'\')">Change</button>':'')+'</span>'+
    (CUSTOMS_SUBSTAGES[c.subIndex]==='Payment Pending' && c.paymentParty ? pill('Waiting on '+(c.paymentParty==='Client'?'the client':'Top1Movers'), c.paymentParty==='Client'?'warning':'info','clock') : '')+
  '</div>';
}
function nextStepHtml(j){
  const n = nextStep(j);
  const enter = STATE.justNext===j.id ? ' ds-next--enter' : '';
  const items = (n.items||[]);
  const override = isManagerLike() && j.statusIndex<8 ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" id="override-btn" onclick="openOverride(\''+j.id+'\')" title="Move out of the normal order, with a logged reason">Override…</button>' : '';
  return '<section class="ds-next ds-next--'+n.tone+enter+'" id="next-step" aria-live="polite">'+
    '<div class="ds-next__head"><span class="ds-next__icon">'+icon(n.icon)+'</span><div><div class="ds-next__eyebrow">'+esc(n.eyebrow)+'</div><h2 class="ds-next__title">'+esc(n.title)+'</h2><p class="ds-next__text">'+esc(n.text)+'</p></div></div>'+
    ((items.length || customsStrip(j)) ? '<div class="ds-next__body">'+customsStrip(j)+
      (items.length?'<div><div class="ds-gate__title"><span>'+esc(n.gateTitle||'Checklist')+'</span><span>'+items.filter(i=>i.met).length+' of '+items.length+' done</span></div><ul class="ds-gate" id="gate">'+items.map(gateItemHtml).join('')+'</ul></div>':'')+'</div>' : '')+
    '<div class="ds-next__foot"><div class="ds-next__who">'+(n.who?icon('user')+esc(n.who):(n.locked?icon('lock')+'<span>'+esc(n.locked)+' unlocks when the list is done.</span>':''))+'</div>'+
      '<div class="ds-next__actions">'+override+(n.primary?'<button class="ds-btn ds-btn--primary" id="next-primary" onclick="'+n.primary.js+'">'+(n.primary.icon?icon(n.primary.icon):'')+esc(n.primary.label)+'</button>':'')+'</div></div>'+
  '</section>';
}
function clockPanel(j){
  const c = deadlineInfo(j);
  if(!c || c.days==null) return '';
  const tone = clockTone(c.days), pct = Math.max(0, Math.min(100, c.days/FREE_WINDOW_DAYS*100));
  const expl = c.type==='storage' ? 'The port charges storage every day after this date. Clearing customs is what stops it.' : 'The shipping line charges for its container every day after this date until the empty is returned.';
  return '<section class="ds-panel ds-panel--elevated" id="fee-clock"><div class="ds-panel__head"><h3>'+icon('clock')+esc(c.label)+'</h3>'+pill(tone==='danger'?'Fees running':tone==='warning'?'Ending soon':'On time', tone==='neutral'?'success':tone, tone==='neutral'?'check':'clock','ds-pill--sm')+'</div>'+
    '<div class="ds-panel__body"><div class="ds-clock ds-clock--'+tone+'"><div class="ds-clock__row"><span class="ds-clock__days">'+(c.days<0?Math.abs(c.days):c.days)+'<small>'+(c.days<0?'days of fees so far':'free day'+(c.days===1?'':'s')+' left')+'</small></span></div>'+
    '<span class="ds-bar-track"><span class="ds-bar-fill'+(tone==='neutral'?' ds-bar-fill--success':' ds-bar-fill--'+tone)+'" style="width:'+(c.days<0?100:pct)+'%"></span></span>'+
    '<p class="ds-muted ds-xs">'+(c.days<0?'Free time ended ':'Free until ')+esc(c.deadline)+'. '+esc(expl)+'</p></div></div></section>';
}
function factsPanel(j){
  const c = custById(j.customerId);
  const f = (k,v)=>'<dt>'+esc(k)+'</dt><dd>'+v+'</dd>';
  return '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('info')+'Key facts</h3><a class="ds-link ds-small" id="client-track-link" href="#/track/'+j.id+'" title="The page the customer sees, no login">'+icon('eye')+'Client view</a></div><div class="ds-panel__body"><dl class="ds-facts">'+
    f('Customer', can('Customer Mgmt')?'<a class="ds-link" href="#/customers/'+c.id+'">'+esc(c.name)+'</a>':esc(c.name))+
    f('Coordinator', esc(coordinatorFor(j.customerId)))+
    f('Crew', esc(crewFor(j)))+
    f('Container', '<span class="ds-mono">'+esc(j.containerNo)+'</span>')+
    f('Bill of lading', '<span class="ds-mono">'+esc(j.blNo)+'</span>')+
    f('Vessel', esc(j.vessel+' / '+j.voyage))+
    f(j.statusIndex<3?'ETA':'Arrived', esc(j.eta))+
    f('Priority', j.priority==='Normal'?'Normal':pill(j.priority, PRIORITY_TONE[j.priority], 'alert','ds-pill--sm'))+
  '</dl></div></section>';
}
const TAB_LABELS = { tasks:'Tasks', documents:'Documents', exceptions:'Exceptions', delivery:'Delivery', money:'Money', details:'Details', history:'History' };
function jobTabs(j){
  const tabs = ['tasks','documents','exceptions','delivery'];
  if(canSeeFunds()) tabs.push('money');
  tabs.push('details','history');
  return tabs.filter(t=>t!=='documents' || can('Document Mgmt') || isFinance()).filter(t=>t!=='exceptions' || can('Exceptions & Approval') || isFinance());
}
function tabCount(j, t){
  if(t==='tasks'){ const n = j.tasks.filter(x=>['Overdue','To do'].includes(taskStatus(j,x)) && (!isCrew()||x.owner===CURRENT_USER.name)).length; const od = j.tasks.some(x=>taskStatus(j,x)==='Overdue'); return n ? '<span class="ds-tab__count'+(od?' ds-tab__count--danger':'')+'">'+n+'</span>' : ''; }
  if(t==='documents'){ const n = j.documents.filter(d=>d.status!=='Approved' && (docsDue(j)||d.status!=='Missing')).length; return n ? '<span class="ds-tab__count ds-tab__count--warning">'+n+'</span>' : ''; }
  if(t==='exceptions'){ const n = j.exceptions.filter(e=>e.status==='Pending Approval').length; return n ? '<span class="ds-tab__count ds-tab__count--danger">'+n+'</span>' : ''; }
  if(t==='money' && canSeeFunds()){ const n = (fundingGap(j)?1:0) + j.charges.filter(isUnresolved).length; return n ? '<span class="ds-tab__count ds-tab__count--warning">'+n+'</span>' : ''; }
  return '';
}
function renderJob(id, tab){
  const j = jobById(id);
  if(!j) return '<div class="ds-panel ds-panel--elevated">'+emptyState('search','Job not found','Check the job number, or search for it with Ctrl K.','<a class="ds-btn ds-btn--secondary" href="#/jobs">All shipments</a>')+'</div>';
  if(!canSeeJob(j)) return accessDenied('Shipments', j.id+' is not assigned to you. Warehouse Crew only see jobs they have tasks on.');
  const c = custById(j.customerId);
  const tabs = jobTabs(j);
  const n = nextStep(j);
  const active = tabs.includes(tab) ? tab : (tabs.includes(n.tab) ? n.tab : 'tasks');
  const body = { tasks:jobTasksTab, documents:jobDocumentsTab, exceptions:jobExceptionsTab, delivery:jobDeliveryTab, money:jobMoneyTab, details:jobDetailsTab, history:jobHistoryTab }[active](j);
  const menu = [];
  if(canRaiseException() && j.statusIndex<8) menu.push('<button onclick="closePopover(); openRaiseException(\''+id+'\')">'+icon('flag')+'Raise an exception</button>');
  if(isManagerLike() && STATUS_STEPS[j.statusIndex]===CUSTOMS_PHASE) menu.push(customsHold(j) ? '<button onclick="closePopover(); clearCustomsHold(\''+id+'\')">'+icon('check')+'Clear customs hold</button>' : '<button onclick="closePopover(); openPlaceHold(\''+id+'\')">'+icon('lock')+'Place customs hold</button>', '<button onclick="closePopover(); openLane(\''+id+'\')">'+icon('shield')+'Set customs lane</button>');
  if(isManagerLike() && j.statusIndex<8) menu.push('<button onclick="closePopover(); openOverride(\''+id+'\')">'+icon('alert')+'Override stage…</button>');
  menu.push('<a href="#/track/'+id+'" onclick="closePopover()">'+icon('eye')+'Open the client tracking page</a>');
  if(canSeeFunds() && j.statusIndex>=7) menu.push('<a href="#/jobs/'+id+'/billing-summary" onclick="closePopover()">'+icon('file')+'Billing Summary</a>');
  JOB_MENU = menu.join('');
  return '<nav class="ds-crumbs"><a href="#/jobs">'+(isCrew()?'My shipments':'Shipments')+'</a>'+icon('chevron-right')+'<span class="ds-mono">'+j.id+'</span></nav>'+
    '<header class="ds-jobhead"><div><h1>'+j.id+' '+healthPill(j)+'</h1>'+
      '<div class="ds-jobhead__line"><strong class="ds-strong">'+esc(c.name)+'</strong><span class="ds-routeline">'+esc(j.origin)+icon('arrow-right')+esc(j.portOfEntry)+icon('arrow-right')+esc(j.destination)+'</span><span>'+esc(j.commodity)+'</span></div></div>'+
      '<div class="ds-jobhead__actions">'+stagePill(j)+'<button class="ds-btn ds-btn--secondary" id="job-more" onclick="event.stopPropagation(); showPopover(this, JOB_MENU)" aria-haspopup="true">'+icon('more')+'More</button></div></header>'+
    '<div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body">'+journeyHtml(j)+'</div></section>'+
      '<div class="ds-split">'+nextStepHtml(j)+'<div class="ds-stack">'+clockPanel(j)+factsPanel(j)+'</div></div>'+
      '<section class="ds-panel ds-panel--elevated" id="job-tabs"><div class="ds-tabs" role="tablist">'+tabs.map(t=>'<button class="ds-tab" role="tab" aria-selected="'+(t===active)+'" onclick="go(\'#/jobs/'+id+'/'+t+'\')"><span class="ds-tab__label" data-text="'+TAB_LABELS[t]+'">'+TAB_LABELS[t]+'</span>'+tabCount(j,t)+'</button>').join('')+'</div>'+
        '<div class="ds-panel__body" id="tab-body">'+body+'</div></section>'+
    '</div>';
}
let JOB_MENU = '';

/* ---------- Tasks tab ---------- */
function jobTasksTab(j){
  const mine = isCrew();
  const list = mine ? j.tasks.filter(t=>t.owner===CURRENT_USER.name) : j.tasks;
  const rows = list.map(t=>{
    const st = taskStatus(j,t);
    let actions = '';
    if(!t.done){
      if(canCompleteTask(t)) actions += t.via==='delivery' ? (canConfirmDelivery() && j.statusIndex===5 ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openConfirmDelivery(\''+j.id+'\')">Confirm delivery</button>' : '<span class="ds-muted ds-xs">Done by confirming delivery</span>')
        : '<button class="ds-btn ds-btn--'+(st==='Upcoming'?'ghost':'secondary')+' ds-btn--sm" onclick="openCompleteTask(\''+j.id+'\',\''+t.id+'\')">'+(st==='Upcoming'?'Complete early':'Complete')+'</button>';
      if(canReassign()) actions += ' <button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openReassignTask(\''+j.id+'\',\''+t.id+'\')">Reassign</button>';
    } else if(t.evidenceFile || t.note) actions = '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openTaskProof(\''+j.id+'\',\''+t.id+'\')">'+icon('file')+'View proof</button>';
    return '<tr><td data-label="Task" class="ds-col-main"><span class="ds-cell-name"><span class="ds-strong">'+esc(t.name)+'</span><span class="ds-cell-sub">'+[t.requiresEvidence?'Needs proof to complete':'', t.corrective?'Fix for an approved exception':'', t.detention?'Stops the detention clock':'', t.done?'Done by '+(t.doneBy||t.owner):''].filter(Boolean).join(' · ')+'</span></span></td>'+
      '<td data-label="Owner"><span class="ds-row ds-row--tight">'+avatar(t.owner,true)+esc(t.owner)+'</span></td>'+
      '<td data-label="Due" class="'+(st==='Overdue'?'ds-overdue':'')+'">'+esc(t.done?'—':shortDate(t.due))+'</td>'+
      '<td data-label="Status">'+pill(st, TASK_TONE[st], TASK_ICON[st])+'</td><td data-label="" class="ds-num">'+actions+'</td></tr>';
  }).join('');
  return '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">'+(mine?'Your tasks on this job. ':'')+'Tasks become <strong>To do</strong> when the job reaches their step, and turn <strong>Overdue</strong> the day after their due date, which emails the owner.</p>'+
    '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack" id="tasks-table"><thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>'+
    (rows || '<tr><td colspan="5" class="ds-muted">No tasks assigned to you on this job.</td></tr>')+'</tbody></table></div>';
}
function openCompleteTask(jobId, taskId){
  const j = jobById(jobId), t = j.tasks.find(x=>x.id===taskId);
  if(t.via==='delivery'){ openConfirmDelivery(jobId); return; }
  if(!canCompleteTask(t)){ showToast('Only '+t.owner+' or a coordinator can complete this task.', 'danger', 'lock'); return; }
  const gap = t.money ? fundingGap(j) : null;
  const blockMoney = gap ? '<div class="ds-alert ds-alert--danger" id="complete-blocked">'+icon('wallet')+'<div><strong>Not enough client funds to pay this</strong>'+esc(gap.text)+' '+(canManageFunds()?'Record the client’s deposit first.':'A Manager records the client’s deposit first.')+
    (canManageFunds()?'<div class="ds-alert__actions"><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openAddFunds(\''+jobId+'\')">'+icon('wallet')+'Add funds received</button></div>':'')+'</div></div>' : '';
  openDrawer({ title:'Complete task', sub:esc(t.name)+' · <span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="complete-form" onsubmit="event.preventDefault(); completeTask(\''+jobId+'\',\''+taskId+'\', this)">'+blockMoney+
      (t.requiresEvidence ? '<div class="ds-field"><label>Proof of completion</label>'+uploadHtml('taskEvidence', t.name==='Lodge customs entry'?'The lodged entry or BOC acknowledgement':t.money?'The duty payment receipt':'A file that shows it was done')+errorSlot('evidence')+'<p class="ds-field__hint">This task cannot be marked done without a file. That is what makes the record trustworthy later.</p></div>' : '<p class="ds-muted ds-small">No proof needed for this task.</p>')+
      '<div class="ds-field"><label for="task-note">Note <span class="ds-opt">optional</span></label><textarea class="ds-textarea" id="task-note" name="note" placeholder="Anything the next person should know"></textarea></div></form>',
    foot: drawerFoot('Mark done','complete-form',{icon:'check'}) });
  if(gap){ const b = document.querySelector('#drawerRoot button[type=submit]'); b.disabled = true; b.title = 'Record the client deposit first'; }
}
function completeTask(jobId, taskId, form){
  const j = jobById(jobId), t = j.tasks.find(x=>x.id===taskId);
  if(t.money && fundingGap(j)){ showToast('Record the client’s deposit before paying.', 'danger', 'wallet'); return; }
  if(t.requiresEvidence && !UPLOADS.taskEvidence){ fieldError(form,'evidence','Attach the completion evidence first. This task needs proof.'); return; }
  const note = String(new FormData(form).get('note')||'').trim();
  t.done = true; t.note = note||null; t.evidenceFile = UPLOADS.taskEvidence||null; t.doneBy = CURRENT_USER.name; t.doneOn = todayDMY();
  if(t.money){ j.charges.filter(c=>c.dueDate && !c.paidDate && isReimbursable(c)).forEach(c=>{ c.paidDate = todayDMY(); c.dueDate = null; if(!c.evidence) c.evidence = UPLOADS.taskEvidence||null; }); }
  log(j, 'Task completed', t.name+(t.evidenceFile?' (proof: '+t.evidenceFile+')':'')+'.');
  closeDrawer();
  STATE.justNext = j.id;
  showToast(t.name+' done.', 'success', 'check');
  render();
}
function openReassignTask(jobId, taskId){
  const j = jobById(jobId), t = j.tasks.find(x=>x.id===taskId);
  const people = USERS.filter(u=>u.active && ['Dispatcher','Warehouse Crew','Manager'].includes(u.role)).map(u=>({ value:u.name, label:u.name+' · '+u.role }));
  const quick = [['Today',0],['Tomorrow',1],['In 3 days',3]].map(([l,n])=>'<button type="button" class="ds-chip" onclick="document.getElementById(\'ra-due\').value=\''+addDaysDMY(n)+'\'">'+l+'</button>').join('');
  const cur = userByName(t.owner);
  openDrawer({ title:'Reassign task', sub:esc(t.name)+' · <span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="reassign-form" onsubmit="event.preventDefault(); saveReassign(\''+jobId+'\',\''+taskId+'\', this)">'+
      (cur && !cur.active ? '<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>'+esc(t.owner)+' is deactivated</strong>This task needs a new owner.</div></div>' : '')+
      '<div class="ds-field"><label for="ra-owner">New owner</label>'+selectWrap('<select class="ds-select" id="ra-owner" name="owner">'+options(people, t.owner)+'</select>')+'</div>'+
      '<div class="ds-field"><label for="ra-due">Due date</label><input class="ds-input" id="ra-due" name="due" value="'+esc(t.due||todayDMY())+'" placeholder="e.g. 30 Sep 2026">'+errorSlot('due')+'<div class="ds-chips" style="margin-top:6px">'+quick+'</div></div></form>',
    foot: drawerFoot('Reassign','reassign-form',{icon:'user'}) });
}
function saveReassign(jobId, taskId, form){
  const j = jobById(jobId), t = j.tasks.find(x=>x.id===taskId), fd = new FormData(form);
  const due = String(fd.get('due')||'').trim();
  if(!parseDMY(due)){ fieldError(form,'due','Enter the date like 30 Sep 2026.'); return; }
  const from = t.owner; t.owner = fd.get('owner'); t.due = due;
  log(j, 'Task reassigned', t.name+': '+from+' → '+t.owner+', due '+due+'.');
  closeDrawer(); showToast(t.name+' now with '+t.owner+'.', 'info', 'user'); render();
}
function openTaskProof(jobId, taskId){
  const j = jobById(jobId), t = j.tasks.find(x=>x.id===taskId);
  openDrawer({ title:'Proof of completion', sub:esc(t.name)+' · <span class="ds-mono">'+j.id+'</span>',
    body:'<div class="ds-stack--sm"><div class="ds-grid-kv ds-kv">'+kv('Done by', esc(t.doneBy||t.owner))+kv('Done on', esc(t.doneOn||'—'))+'</div>'+
      (t.evidenceFile ? '<div class="ds-panel"><div class="ds-doc"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">'+esc(t.evidenceFile)+'</div><div class="ds-doc__meta">Attached when the task was completed</div></div><span></span><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="showToast(\'Mockup: file preview is not wired up.\',\'info\',\'info\')">'+icon('eye')+'Open</button></div></div>' : '<p class="ds-muted">No file was required for this task.</p>')+
      '<div><span class="ds-label">Note</span><p>'+esc(t.note||'No note.')+'</p></div></div>' });
}

/* ---------- Documents tab ---------- */
function jobDocumentsTab(j){
  const ok = j.documents.filter(d=>d.status==='Approved').length, total = j.documents.length;
  const rows = j.documents.map(d=>{
    let a = '';
    if(d.status==='Missing' && canUploadDocs()) a = '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openUploadDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('upload')+'Upload</button>';
    else if(d.status==='Rejected' && canUploadDocs()) a = '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openUploadDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('upload')+'Replace</button>';
    else if(d.status==='Pending Review' && canApproveDocs()) a = '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openReviewDoc(\''+j.id+'\',\''+d.id+'\')">'+icon('eye')+'Review</button>';
    else if(d.file) a = '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="showToast(\'Mockup: file preview is not wired up.\',\'info\',\'info\')">'+icon('eye')+'View</button>';
    else a = '<span></span>';
    const meta = d.status==='Missing' ? (docsDue(j)?'Not uploaded yet':'Not needed until Documentation starts') : d.status==='Rejected' ? 'v'+d.version+' rejected: '+d.rejectReason : 'v'+d.version+' · '+(d.file||'');
    const st = d.status==='Missing' && !docsDue(j) ? pill('Not due yet','neutral','circle') : pill(DOC_LABEL[d.status], DOC_TONE[d.status], DOC_ICON[d.status]);
    return '<div class="ds-doc" id="doc-'+d.id+'"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">'+esc(d.name)+'</div><div class="ds-doc__meta'+(d.status==='Rejected'?' ds-overdue':'')+'">'+esc(meta)+'</div></div>'+st+a+'</div>';
  }).join('');
  return '<div class="ds-stack--sm"><div class="ds-row--between"><div><span class="ds-strong">'+ok+' of '+total+' approved</span><span class="ds-muted ds-small"> · every job needs these five before the goods sail</span></div>'+(isCrew()?'<span class="ds-readonly">'+icon('upload')+'You can upload; a coordinator reviews</span>':'')+'</div>'+
    '<span class="ds-bar-track" style="display:block;height:6px"><span class="ds-bar-fill ds-bar-fill--success" style="width:'+Math.round(ok/total*100)+'%"></span></span>'+
    '<div class="ds-panel" style="margin-top:var(--t1m-space-4)" id="doc-list">'+rows+'</div></div>';
}
function openUploadDoc(jobId, docId){
  const j = jobById(jobId), d = j.documents.find(x=>x.id===docId);
  openDrawer({ title:(d.status==='Rejected'?'Replace ':'Upload ')+d.name, sub:'<span class="ds-mono">'+j.id+'</span> · becomes v'+((d.version||0)+1)+' and goes to review',
    body:'<form class="ds-stack--sm" id="upload-form" onsubmit="event.preventDefault(); saveUpload(\''+jobId+'\',\''+docId+'\', this)">'+
      (d.status==='Rejected'?'<div class="ds-alert ds-alert--danger">'+icon('x')+'<div><strong>Why v'+d.version+' was rejected</strong>'+esc(d.rejectReason)+'</div></div>':'')+
      '<div class="ds-field"><label>File</label>'+uploadHtml('docUpload','PDF, image or scan')+errorSlot('file')+'</div></form>',
    foot: drawerFoot('Upload for review','upload-form',{icon:'upload'}) });
}
function saveUpload(jobId, docId, form){
  if(!UPLOADS.docUpload){ fieldError(form,'file','Choose a file to upload first.'); return; }
  const j = jobById(jobId), d = j.documents.find(x=>x.id===docId);
  d.version = (d.version||0)+1; d.status='Pending Review'; d.rejectReason=null; d.file = UPLOADS.docUpload;
  log(j, 'Document uploaded', d.name+' v'+d.version+' submitted for review.');
  closeDrawer(); STATE.justNext = j.id; showToast(d.name+' uploaded. It now waits for review.', 'info', 'upload'); render();
}
function openReviewDoc(jobId, docId){
  const j = jobById(jobId), d = j.documents.find(x=>x.id===docId);
  const cust = custById(j.customerId);
  openDrawer({ title:'Review '+d.name, sub:'<span class="ds-mono">'+j.id+'</span> · v'+d.version,
    body:'<form class="ds-stack--sm" id="review-form" onsubmit="event.preventDefault(); approveDoc(\''+jobId+'\',\''+docId+'\')">'+
      '<div class="ds-panel"><div class="ds-doc"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">'+esc(d.file||d.name)+'</div><div class="ds-doc__meta">Uploaded for review</div></div><span></span><button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" onclick="showToast(\'Mockup: file preview is not wired up.\',\'info\',\'info\')">'+icon('eye')+'Open</button></div></div>'+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Check against the customer’s requirements</strong>'+esc(cust.requirements)+'</div></div>'+
      '<div class="ds-field"><label for="reject-reason">If it is wrong, say what to fix <span class="ds-opt">needed only to reject</span></label><textarea class="ds-textarea" id="reject-reason" name="reason" placeholder="e.g. Signature block expired. Reissue with the current signatory."></textarea>'+errorSlot('reason')+'</div></form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--secondary" id="reject-doc" onclick="rejectDoc(\''+jobId+'\',\''+docId+'\')">'+icon('x')+'Reject</button><button type="submit" form="review-form" class="ds-btn ds-btn--primary" id="approve-doc">'+icon('check')+'Approve</button>' });
}
function approveDoc(jobId, docId){
  const j = jobById(jobId), d = j.documents.find(x=>x.id===docId);
  d.status='Approved';
  log(j, 'Document approved', d.name+' v'+d.version+' approved.');
  closeDrawer(); STATE.justNext = j.id; showToast(d.name+' approved.', 'success', 'check'); render();
}
function rejectDoc(jobId, docId){
  const form = document.getElementById('review-form');
  const reason = String(new FormData(form).get('reason')||'').trim();
  if(!reason){ fieldError(form,'reason','Say what is wrong, so whoever replaces it knows what to fix.'); document.getElementById('reject-reason').focus(); return; }
  const j = jobById(jobId), d = j.documents.find(x=>x.id===docId);
  d.status='Rejected'; d.rejectReason = reason;
  log(j, 'Document rejected', d.name+' v'+d.version+' rejected: '+reason);
  closeDrawer(); showToast(d.name+' rejected. The reason is on the document.', 'warning', 'x'); render();
}

/* ---------- Exceptions tab ---------- */
const CORRECTIVE_FOR = { 'Documentation Discrepancy':'Reissue the corrected document', 'Customs Hold':'Provide what customs asked for', 'Valuation Dispute':'Submit valuation evidence to customs', 'Damage':'File the damage claim', 'Delay':'Agree a new date with the client', 'Consignee Not Ready':'Rebook the delivery slot' };
function jobExceptionsTab(j){
  const cards = j.exceptions.slice().reverse().map(e=>{
    const fix = e.correctiveTaskId ? j.tasks.find(t=>t.id===e.correctiveTaskId) : null;
    return '<article class="ds-panel" style="margin-bottom:var(--t1m-space-3)"><div class="ds-panel__body ds-stack--sm">'+
      '<div class="ds-row--between"><strong class="ds-strong">'+esc(e.category)+'</strong>'+pill(EX_LABEL[e.status], EX_TONE[e.status], EX_ICON[e.status])+'</div>'+
      '<p>'+esc(e.reason)+'</p>'+
      '<div class="ds-grid-kv ds-kv">'+kv('Stage', esc(e.stage))+kv('Impact', esc(e.impact+(e.impactNote?' · '+e.impactNote:'')))+kv('Raised by', esc(e.raisedBy+', '+shortDate(e.date)))+kv('Evidence', '<span class="ds-mono ds-small">'+esc(e.evidence)+'</span>')+'</div>'+
      (fix ? '<div class="ds-alert ds-alert--'+(fix.done?'success':'info')+'">'+icon(fix.done?'check':'tasks')+'<div><strong>Fix: '+esc(fix.name)+'</strong>'+esc(fix.owner)+(fix.done?' · done':' · due '+fix.due)+'</div></div>' : '')+
      (e.status==='Rejected' && e.decisionNote ? '<p class="ds-muted ds-small">Rejected: '+esc(e.decisionNote)+'</p>' : '')+
      (e.status==='Pending Approval' ? (canApproveExceptions() ? '<div><button class="ds-btn ds-btn--secondary" onclick="openReviewException(\''+j.id+'\',\''+e.id+'\')">'+icon('eye')+'Review</button></div>' : '<p class="ds-muted ds-small">'+icon('lock')+' Waiting for a Manager or Admin to review.</p>') : '')+
    '</div></article>';
  }).join('');
  return '<div class="ds-row--between" style="margin-bottom:var(--t1m-space-4)"><p class="ds-muted ds-small" style="max-width:60ch">An exception is anything off plan that needs a decision. Raising one freezes the job until a Manager reviews it and assigns a fix, so a problem can never be quietly skipped.</p>'+
    (canRaiseException() && j.statusIndex<8 ? '<button class="ds-btn ds-btn--secondary" onclick="openRaiseException(\''+j.id+'\')">'+icon('flag')+'Raise exception</button>' : '')+'</div>'+
    (cards || emptyState('shield','No exceptions on this job','Everything has gone to plan so far.'));
}
function openRaiseException(jobId){
  const j = jobById(jobId);
  const impacts = [['Low','Minor, no delay'],['Medium','May delay a day'],['High','Delays clearance or delivery']];
  openDrawer({ title:'Raise an exception', sub:'<span class="ds-mono">'+j.id+'</span> · stage '+esc(STATUS_STEPS[j.statusIndex]),
    body:'<form class="ds-stack--sm" id="ex-form" onsubmit="event.preventDefault(); saveException(\''+jobId+'\', this)">'+
      '<div class="ds-alert ds-alert--warning">'+icon('lock')+'<div><strong>This freezes the job</strong>Nobody can move it on until a Manager or Admin reviews the exception.</div></div>'+
      '<div class="ds-field"><label for="ex-cat">What kind of problem</label>'+selectWrap('<select class="ds-select" id="ex-cat" name="category">'+options(EXCEPTION_CATEGORIES)+'</select>')+'</div>'+
      '<div class="ds-field"><label for="ex-reason">What happened</label><textarea class="ds-textarea" id="ex-reason" name="reason" placeholder="Be specific: what is wrong, and where"></textarea>'+errorSlot('reason')+'</div>'+
      '<div class="ds-field"><span class="ds-field__label">Impact</span><div class="ds-stack--sm">'+impacts.map(([v,h],i)=>'<label class="ds-check"><input type="radio" name="impact" value="'+v+'"'+(i===2?' checked':'')+'> '+v+' <span class="ds-muted ds-xs">'+h+'</span></label>').join('')+'</div></div>'+
      '<div class="ds-field"><label>Evidence <span class="ds-opt">optional</span></label>'+uploadHtml('exEvidence','Photo, email or document')+'</div></form>',
    foot: drawerFoot('Raise and freeze job','ex-form',{icon:'flag', danger:true}) });
}
function saveException(jobId, form){
  const j = jobById(jobId), fd = new FormData(form);
  const reason = String(fd.get('reason')||'').trim();
  if(!reason){ fieldError(form,'reason','Describe what happened.'); return; }
  const ex = { id:'EX'+(j.exceptions.length+1), stage:STATUS_STEPS[j.statusIndex], category:fd.get('category'), reason, impact:fd.get('impact'), raisedBy:actorLabel(), date:todayDMY(), status:'Pending Approval', evidence:UPLOADS.exEvidence||'no file attached', correctiveTaskId:null };
  j.exceptions.push(ex);
  log(j, 'Exception raised', ex.category+': '+reason);
  closeDrawer(); STATE.justNext = j.id; showToast('Exception raised. The job is frozen until a manager reviews it.', 'warning', 'flag'); render();
}
function openReviewException(jobId, exId){
  const j = jobById(jobId), e = j.exceptions.find(x=>x.id===exId);
  if(!canApproveExceptions()){ showToast('Only a Manager or Admin can review exceptions.', 'danger', 'lock'); return; }
  const people = USERS.filter(u=>u.active && ['Dispatcher','Warehouse Crew','Manager'].includes(u.role)).map(u=>({ value:u.name, label:u.name+' · '+u.role }));
  openDrawer({ title:'Review exception', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="rex-form" onsubmit="event.preventDefault(); approveException(\''+jobId+'\',\''+exId+'\', this)">'+
      '<div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><div class="ds-row--between"><strong class="ds-strong">'+esc(e.category)+'</strong>'+pill('Impact '+e.impact, e.impact==='High'?'danger':e.impact==='Medium'?'warning':'neutral','alert')+'</div><p>'+esc(e.reason)+'</p><p class="ds-muted ds-xs">Raised by '+esc(e.raisedBy)+' on '+esc(e.date)+' · evidence '+esc(e.evidence)+'</p></div></div>'+
      '<p class="ds-small"><strong>Approve</strong> if the problem is real: name the fix and who does it. The job unfreezes, and the fix becomes a task it must finish before moving on. <strong>Reject</strong> if it is not a real problem.</p>'+
      '<div class="ds-field"><label for="rex-task">The fix</label><input class="ds-input" id="rex-task" name="task" value="'+esc(CORRECTIVE_FOR[e.category]||'Corrective action')+'">'+errorSlot('task')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="rex-owner">Who does it</label>'+selectWrap('<select class="ds-select" id="rex-owner" name="owner">'+options(people, coordinatorFor(j.customerId))+'</select>')+'</div>'+
      '<div class="ds-field"><label for="rex-due">By</label><input class="ds-input" id="rex-due" name="due" value="'+addDaysDMY(2)+'">'+errorSlot('due')+'</div></div>'+
      '<div class="ds-field"><label for="rex-note">Decision note <span class="ds-opt">required to reject</span></label><textarea class="ds-textarea" id="rex-note" name="note" style="min-height:64px"></textarea>'+errorSlot('note')+'</div></form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--secondary" onclick="rejectException(\''+jobId+'\',\''+exId+'\')">'+icon('x')+'Reject</button><button type="submit" form="rex-form" class="ds-btn ds-btn--primary" id="approve-ex">'+icon('check')+'Approve &amp; assign fix</button>' });
}
function approveException(jobId, exId, form){
  const j = jobById(jobId), e = j.exceptions.find(x=>x.id===exId), fd = new FormData(form);
  const task = String(fd.get('task')||'').trim(), due = String(fd.get('due')||'').trim();
  if(fieldError(form,'task', task?'':'Name the fix.') | fieldError(form,'due', parseDMY(due)?'':'Enter the date like 30 Sep 2026.')) return;
  const t = { id:'T'+(j.tasks.length+1), name:task, owner:fd.get('owner'), due, done:false, requiresEvidence:true, corrective:true, flat:null, note:null };
  j.tasks.push(t);
  e.status='Approved'; e.correctiveTaskId = t.id; e.decisionNote = String(fd.get('note')||'').trim()||null; e.decidedBy = CURRENT_USER.name;
  log(j, 'Exception approved', e.category+' approved. Fix "'+task+'" assigned to '+t.owner+', due '+due+'.');
  closeDrawer(); STATE.justNext = j.id; showToast('Exception approved. '+t.owner+' has the fix on their list.', 'success', 'check'); render();
}
function rejectException(jobId, exId){
  const form = document.getElementById('rex-form');
  const note = String(new FormData(form).get('note')||'').trim();
  if(!note){ fieldError(form,'note','Say why this is not a real problem.'); return; }
  const j = jobById(jobId), e = j.exceptions.find(x=>x.id===exId);
  e.status='Rejected'; e.decisionNote = note; e.decidedBy = CURRENT_USER.name;
  log(j, 'Exception rejected', e.category+' rejected: '+note);
  closeDrawer(); STATE.justNext = j.id; showToast('Exception rejected. The job is unfrozen.', 'info', 'x'); render();
}

/* ---------- Delivery tab ---------- */
function jobDeliveryTab(j){
  const c = custById(j.customerId);
  const ret = j.tasks.find(t=>t.detention);
  const instr = '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Customer delivery instructions</strong>'+esc(c.instructions)+'</div></div>';
  if(j.delivery.confirmed){
    const d = j.delivery;
    return '<div class="ds-stack--sm">'+
      (d.damage ? '<div class="ds-alert ds-alert--'+(d.damageResolved?'success':'danger')+'">'+icon(d.damageResolved?'check':'alert')+'<div><strong>'+(d.damageResolved?'Damage reported and resolved':'Damage or incomplete delivery reported')+'</strong>'+esc(d.damageNote||'')+(d.damageResolved?' Resolution: '+esc(d.damageResolved.note)+' ('+esc(d.damageResolved.by)+')':' Billing is blocked until a Manager resolves it.')+
        (!d.damageResolved && isManagerLike()?'<div class="ds-alert__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openResolveDamage(\''+j.id+'\')">Resolve damage</button></div>':'')+'</div></div>'
        : '<div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>Delivered in full</strong>No damage reported.</div></div>')+
      '<div class="ds-grid-kv ds-kv">'+kv('Delivered on', esc(d.date))+kv('Received by', esc(d.receiver))+kv('Consignee', esc(j.consignee))+'</div>'+
      '<div class="ds-panel"><div class="ds-doc"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">Proof of delivery</div><div class="ds-doc__meta">'+esc(d.podFile)+'</div></div>'+pill('On file','success','check')+'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="showToast(\'Mockup: file preview is not wired up.\',\'info\',\'info\')">'+icon('eye')+'View</button></div>'+
      (ret ? '<div class="ds-doc"><span class="ds-doc__icon">'+icon('refresh')+'</span><div><div class="ds-doc__name">Empty container returned</div><div class="ds-doc__meta">'+(ret.done?'Returned, detention clock stopped':'Not yet. Free detention until '+esc(j.detentionDeadline||'—'))+'</div></div>'+(ret.done?pill('Done','success','check'):pill(taskStatus(j,ret), TASK_TONE[taskStatus(j,ret)], TASK_ICON[taskStatus(j,ret)]))+
        (!ret.done && canCompleteTask(ret) ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openCompleteTask(\''+j.id+'\',\''+ret.id+'\')">Mark returned</button>' : '<span></span>')+'</div>' : '')+'</div></div>';
  }
  const ready = j.statusIndex===5;
  return '<div class="ds-stack--sm">'+
    '<div class="ds-grid-kv ds-kv">'+kv('Consignee', esc(j.consignee))+kv('Deliver to', esc(c.consignees[0].address))+kv('Crew', esc(crewFor(j)))+'</div>'+instr+
    (ready ? (canConfirmDelivery() ? '<div><button class="ds-btn ds-btn--secondary" onclick="openConfirmDelivery(\''+j.id+'\')">'+icon('truck')+'Confirm delivery</button></div>' : '<p class="ds-muted ds-small">'+icon('user')+' The delivery crew or a Manager confirms delivery with proof.</p>')
      : '<div class="ds-alert ds-alert--info" id="delivery-locked">'+icon('lock')+'<div><strong>Not out for delivery yet</strong>Delivery is confirmed once the job is Out for Delivery. It is at '+esc(STATUS_STEPS[j.statusIndex])+' now.</div></div>')+
  '</div>';
}
function openConfirmDelivery(jobId){
  const j = jobById(jobId), c = custById(j.customerId);
  if(!canConfirmDelivery()){ showToast('Delivery is confirmed by the Warehouse Crew or a Manager.', 'danger', 'lock'); return; }
  if(j.statusIndex!==5){ showToast('This job is not out for delivery yet.', 'danger', 'lock'); return; }
  openDrawer({ title:'Confirm delivery', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(j.consignee),
    body:'<form class="ds-stack--sm" id="pod-form" onsubmit="event.preventDefault(); confirmDelivery(\''+jobId+'\', this)">'+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Customer instructions</strong>'+esc(c.instructions)+'</div></div>'+
      '<div class="ds-field"><label for="pod-receiver">Received by</label><input class="ds-input" id="pod-receiver" name="receiver" placeholder="Name and role of the person who signed" autocomplete="off">'+errorSlot('receiver')+'</div>'+
      '<div class="ds-field"><label for="pod-date">Delivery date</label><input class="ds-input" id="pod-date" name="date" value="'+todayDMY()+'"></div>'+
      '<div class="ds-field"><label>Proof of delivery</label>'+uploadHtml('podFile','Photo of the signed delivery receipt')+errorSlot('pod')+'</div>'+
      '<label class="ds-switch"><input type="checkbox" role="switch" name="damage" onchange="document.getElementById(\'damage-fields\').hidden=!this.checked"><span class="ds-switch__track"></span>Something arrived damaged or incomplete</label>'+
      '<div id="damage-fields" hidden class="ds-field"><label for="pod-damage">What is wrong</label><textarea class="ds-textarea" id="pod-damage" name="damageNote" placeholder="Which items, how many, what damage"></textarea></div></form>',
    foot: drawerFoot('Confirm delivery','pod-form',{icon:'check'}) });
}
function confirmDelivery(jobId, form){
  const j = jobById(jobId), fd = new FormData(form);
  const receiver = String(fd.get('receiver')||'').trim(), damage = fd.get('damage')==='on';
  const bad = fieldError(form,'receiver', receiver?'':'Enter who received the goods.') | fieldError(form,'pod', UPLOADS.podFile?'':'Attach the proof of delivery.');
  if(bad) return;
  j.delivery = { confirmed:true, date:String(fd.get('date')||todayDMY()), receiver, damage, damageNote: damage ? (String(fd.get('damageNote')||'').trim()||'Damage reported.') : null, podFile:UPLOADS.podFile };
  const t = j.tasks.find(x=>x.via==='delivery'); if(t){ t.done = true; t.doneBy = CURRENT_USER.name; t.doneOn = todayDMY(); t.evidenceFile = UPLOADS.podFile; }
  j.statusIndex = 6;
  log(j, 'Delivery confirmed', (damage?'Delivered with reported damage. ':'Delivered in full. ')+'Received by '+receiver+'. POD '+UPLOADS.podFile+'.');
  STATE.justAdvanced = { id:j.id, idx:6 }; STATE.justNext = j.id;
  closeDrawer(); showToast(damage ? 'Delivery confirmed, damage reported.' : 'Delivery confirmed in full.', damage?'warning':'success', damage?'alert':'check');
  render();
}
function openResolveDamage(jobId){
  const j = jobById(jobId);
  openDrawer({ title:'Resolve damage', sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="dmg-form" onsubmit="event.preventDefault(); saveResolveDamage(\''+jobId+'\', this)"><div class="ds-alert ds-alert--danger">'+icon('alert')+'<div><strong>Reported at delivery</strong>'+esc(j.delivery.damageNote||'')+'</div></div>'+
      '<div class="ds-field"><label for="dmg-note">How was it settled?</label><textarea class="ds-textarea" id="dmg-note" name="note" placeholder="e.g. Insurer accepted claim CLM-0091; client agreed to bill as normal"></textarea>'+errorSlot('note')+'</div></form>',
    foot: drawerFoot('Mark resolved','dmg-form',{icon:'check'}) });
}
function saveResolveDamage(jobId, form){
  const note = String(new FormData(form).get('note')||'').trim();
  if(!note){ fieldError(form,'note','Describe how it was settled.'); return; }
  const j = jobById(jobId);
  j.delivery.damageResolved = { note, by:CURRENT_USER.name, on:todayDMY() };
  log(j, 'Damage resolved', note);
  closeDrawer(); STATE.justNext = j.id; showToast('Damage marked resolved.', 'success', 'check'); render();
}

/* ---------- Details & history tabs ---------- */
function jobDetailsTab(j){
  const c = custById(j.customerId);
  return '<div class="ds-stack">'+
    '<div class="ds-grid-kv ds-kv">'+kv('Customer',esc(c.name))+kv('Consignee',esc(j.consignee))+kv('Commodity',esc(j.commodity))+kv('Route',esc(j.origin+' → '+j.portOfEntry+' → '+j.destination))+
      kv('Container','<span class="ds-mono">'+esc(j.containerNo)+'</span>')+kv('Bill of lading','<span class="ds-mono">'+esc(j.blNo)+'</span>')+kv('Shipping line',esc(j.shippingLine))+kv('Vessel / voyage',esc(j.vessel+' / '+j.voyage))+
      kv('Import / export',esc(j.importExportFlag))+kv('Ownership',esc(j.ownership))+(canSeeFunds()?kv('Declared value',money(j.declaredValue)):'')+kv('Quotation', j.quotationId?'<span class="ds-mono">'+esc(j.quotationId)+'</span>':'<span class="ds-muted">Not linked in sample data</span>')+'</div>'+
    '<div class="ds-grid-2"><div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Customer requirements</strong>'+esc(c.requirements)+'</div></div><div class="ds-alert ds-alert--info">'+icon('truck')+'<div><strong>Delivery instructions</strong>'+esc(c.instructions)+'</div></div></div>'+
    '<p class="ds-mockbadge" style="white-space:normal">'+icon('info')+'To confirm with the client: several containers per job, vessel delay or rollover as its own status, and partial deliveries.</p></div>';
}
const HISTORY_ICON = { 'Job created':'plus', 'Stage changed':'arrow-right', 'Customs step':'shield', 'Task completed':'check', 'Task reassigned':'user', 'Document uploaded':'upload', 'Document approved':'check', 'Document rejected':'x',
  'Exception raised':'flag', 'Exception approved':'check', 'Exception rejected':'x', 'Delivery confirmed':'truck', 'Funds received':'arrow-in', 'Charge recorded':'receipt', 'Ready for Finance':'receipt', 'Customs hold placed':'lock', 'Customs hold cleared':'check', 'Stage override':'alert' };
function historyList(entries){
  return '<ul class="ds-activity">'+entries.map(a=>'<li><span class="ds-activity__icon">'+icon(HISTORY_ICON[a.action]||(a.finance?'wallet':'clock'))+'</span><div><strong>'+esc(a.action)+'</strong> · '+esc(a.detail)+'<time>'+esc(a.ts)+' · '+esc(a.actor)+'</time></div></li>').join('')+'</ul>';
}
function jobHistoryTab(j){
  const e = visibleAudit(j).slice().reverse();
  return '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-2)">Every change to this job, newest first. '+(canSeeFunds()?'':'Money entries are hidden for your role.')+'</p>'+historyList(e);
}

/* ---------- Stage moves ---------- */
function advanceStage(id){
  const j = jobById(id), g = stageGate(j), n = nextStep(j);
  if(isOnHold(j) || customsHold(j)){ showToast('This job is frozen. Resolve the block first.', 'danger', 'lock'); return; }
  if(!g || g.items.some(i=>!i.met)){ showToast('Finish the checklist first: '+(g.items.find(i=>!i.met)||{}).label, 'danger', 'lock'); return; }
  if(g.managerOnly ? !isManagerLike() : !canMoveStage()){ showToast('Your role cannot move this job on.', 'danger', 'lock'); return; }
  if(j.statusIndex===4 && j.customs && j.customs.subIndex<CUSTOMS_SUBSTAGES.length-1){ showToast('Finish the customs steps first.', 'danger', 'lock'); return; }
  j.statusIndex++;
  const to = STATUS_STEPS[j.statusIndex];
  if(to===CUSTOMS_PHASE && !j.customs) j.customs = { subIndex:0, lane:'Green', hold:null, paymentParty:null };
  if(to==='Arrived at Port' && !j.storageDeadline) j.storageDeadline = addDaysDMY(5);
  if(to==='Out for Delivery' && !j.detentionDeadline) j.detentionDeadline = addDaysDMY(5);
  if(to==='Arrived at Port') j.eta = todayDMY();
  log(j, to==='Closed'?'Job closed':'Stage changed', 'Moved to '+to+'.');
  STATE.justAdvanced = { id, idx:j.statusIndex }; STATE.justNext = id;
  showToast(j.id+' moved to '+to+'.', 'success', 'arrow-right');
  render();
}
function openAdvanceCustoms(id){
  const j = jobById(id);
  openDrawer({ title:'Mark as Payment Pending', sub:'<span class="ds-mono">'+j.id+'</span> · customs has stated the duty',
    body:'<form class="ds-stack--sm" id="party-form" onsubmit="event.preventDefault(); advanceCustoms(\''+id+'\', new FormData(this).get(\'party\'))">'+
      '<p>Who pays the duty? The job page will show whose move it is, so nobody has to ask.</p>'+
      '<label class="ds-check"><input type="radio" name="party" value="Top1Movers" checked> <span><strong class="ds-strong">Top1Movers pays</strong><br><span class="ds-muted ds-xs">From the client’s deposit, then bills back</span></span></label>'+
      '<label class="ds-check"><input type="radio" name="party" value="Client"> <span><strong class="ds-strong">Waiting for the client</strong><br><span class="ds-muted ds-xs">The client must release funds or pay customs directly</span></span></label></form>',
    foot: drawerFoot('Mark as Payment Pending','party-form',{icon:'arrow-right'}) });
}
function advanceCustoms(id, party){
  const j = jobById(id);
  if(customsHold(j) || isOnHold(j)){ showToast('Customs steps are frozen by a hold or an exception.', 'danger', 'lock'); return; }
  const g = stageGate(j);
  if(g.items.some(i=>!i.met)){ showToast('Finish the checklist first.', 'danger', 'lock'); return; }
  j.customs.subIndex++;
  const to = CUSTOMS_SUBSTAGES[j.customs.subIndex];
  if(to==='Payment Pending') j.customs.paymentParty = party||'Top1Movers';
  log(j, 'Customs step', 'Moved to '+to+(to==='Payment Pending'?' (waiting on '+j.customs.paymentParty+')':'')+'.');
  STATE.justNext = id;
  closeDrawer(); STATE.justNext = id;
  showToast('Customs: '+to+'.', 'success', 'shield'); render();
}
function setPaymentParty(id, party){
  const j = jobById(id); j.customs.paymentParty = party;
  log(j, 'Customs step', party==='Top1Movers'?'Client released the duty payment. Top1Movers to pay.':'Waiting on the client.');
  STATE.justNext = id; showToast('Recorded: the client has released payment.', 'success', 'check'); render();
}
function openLane(id){
  const j = jobById(id);
  openDrawer({ title:'Customs lane', sub:'<span class="ds-mono">'+j.id+'</span> · set from the customs selectivity result',
    body:'<form class="ds-stack--sm" id="lane-form" onsubmit="event.preventDefault(); saveLane(\''+id+'\', new FormData(this).get(\'lane\'))">'+
      ['Green','Yellow','Red'].map(l=>'<label class="ds-check" style="align-items:flex-start"><input type="radio" name="lane" value="'+l+'"'+(j.customs.lane===l?' checked':'')+'> <span>'+pill(l, LANE_TONE[l], l==='Green'?'check':'alert','ds-pill--sm')+'<br><span class="ds-muted ds-xs">'+esc(LANE_MEANING[l])+'</span></span></label>').join('')+'</form>',
    foot: drawerFoot('Save lane','lane-form') });
}
function saveLane(id, lane){ const j = jobById(id); j.customs.lane = lane; log(j, 'Customs lane set', 'Lane '+lane+'.'); closeDrawer(); showToast('Customs lane set to '+lane+'.', 'info', 'shield'); render(); }
function openPlaceHold(id){
  const j = jobById(id);
  openDrawer({ title:'Place customs hold', sub:'<span class="ds-mono">'+j.id+'</span> · freezes the customs steps',
    body:'<form class="ds-stack--sm" id="hold-form" onsubmit="event.preventDefault(); savePlaceHold(\''+id+'\', this)">'+
      '<div class="ds-field"><span class="ds-field__label">Type</span><div class="ds-row"><label class="ds-check"><input type="radio" name="type" value="Under Inspection" checked> Under inspection</label><label class="ds-check"><input type="radio" name="type" value="On Hold"> On hold</label></div></div>'+
      '<div class="ds-field"><label for="hold-note">What is customs waiting on?</label><textarea class="ds-textarea" id="hold-note" name="note"></textarea>'+errorSlot('note')+'</div></form>',
    foot: drawerFoot('Place hold','hold-form',{icon:'lock', danger:true}) });
}
function savePlaceHold(id, form){
  const fd = new FormData(form), note = String(fd.get('note')||'').trim();
  if(!note){ fieldError(form,'note','Say what customs is waiting on.'); return; }
  const j = jobById(id); j.customs.hold = { type:fd.get('type'), note, by:CURRENT_USER.name, on:todayDMY() };
  log(j, 'Customs hold placed', j.customs.hold.type+': '+note);
  closeDrawer(); STATE.justNext = id; showToast('Customs hold placed on '+j.id+'.', 'warning', 'lock'); render();
}
function clearCustomsHold(id){
  if(!isManagerLike()){ showToast('Only a Manager or Admin can clear a customs hold.', 'danger', 'lock'); return; }
  const j = jobById(id); const h = j.customs.hold;
  log(j, 'Customs hold cleared', (h?h.type:'Hold')+' cleared.');
  j.customs.hold = null; STATE.justNext = id;
  showToast('Hold cleared. Customs steps can continue.', 'success', 'check'); render();
}
function openOverride(id){
  const j = jobById(id);
  const opts = [];
  STATUS_STEPS.forEach((s,i)=>{ if(s===CUSTOMS_PHASE) CUSTOMS_SUBSTAGES.forEach((c,k)=>opts.push({ value:i+':'+k, label:'Customs Clearance · '+c })); else opts.push({ value:i+':', label:s }); });
  const cur = j.statusIndex+':'+(STATUS_STEPS[j.statusIndex]===CUSTOMS_PHASE?j.customs.subIndex:'');
  openDrawer({ title:'Override stage', sub:'<span class="ds-mono">'+j.id+'</span> · Manager / Admin only',
    body:'<form class="ds-stack--sm" id="ov-form" onsubmit="event.preventDefault(); commitOverride(\''+id+'\', this)">'+
      '<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Skips the checklist</strong>Real jobs are not always in order (customs is often filed before the ship arrives). Use it when that happens. The reason is written to the audit trail with your name.</div></div>'+
      '<div class="ds-field"><label for="ov-to">Move to</label>'+selectWrap('<select class="ds-select" id="ov-to" name="to">'+options(opts, cur)+'</select>')+'</div>'+
      '<div class="ds-field"><label for="ov-reason">Reason</label><textarea class="ds-textarea" id="ov-reason" name="reason" placeholder="Why is this job leaving the normal order?"></textarea>'+errorSlot('reason')+'</div></form>',
    foot: drawerFoot('Override','ov-form',{icon:'alert', danger:true}) });
}
function commitOverride(id, form){
  const fd = new FormData(form), reason = String(fd.get('reason')||'').trim();
  if(!reason){ fieldError(form,'reason','A reason is required for an override.'); return; }
  const j = jobById(id), [si, sub] = String(fd.get('to')).split(':');
  j.statusIndex = +si;
  if(STATUS_STEPS[j.statusIndex]===CUSTOMS_PHASE){ if(!j.customs) j.customs = { subIndex:0, lane:'Green', hold:null, paymentParty:null }; j.customs.subIndex = +sub; }
  const label = STATUS_STEPS[j.statusIndex]+(sub!==''?' · '+CUSTOMS_SUBSTAGES[+sub]:'');
  log(j, 'Stage override', 'Forced to '+label+'. Reason: '+reason);
  closeDrawer(); STATE.justNext = id; showToast('Overridden to '+label+'. Logged.', 'warning', 'alert'); render();
}
