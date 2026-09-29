/* ============================== REPORTS ==============================
   Analysis lives here, separate from Home. Home asks "what needs me now?"; Reports asks "how are we
   doing?". Every chart is one series in one hue, labelled in ink, with a sentence saying what it tells
   you; status colours appear only where the bars ARE statuses. */
function barRows(rows, max, opts){
  opts = opts||{};
  return '<div class="ds-bars">'+rows.map(r=>'<div class="ds-bar-row"'+(r.js?' data-href onclick="'+r.js+'"':'')+' data-tip="'+esc(r.tip||r.label+': '+r.valueText)+'"><span class="ds-bar-row__name">'+(r.icon?icon(r.icon)+' ':'')+esc(r.label)+'</span><span class="ds-bar-track"><span class="ds-bar-fill'+(r.tone?' ds-bar-fill--'+r.tone:'')+'" style="width:'+(max?Math.round(r.value/max*100):0)+'%"></span></span><span class="ds-bar-row__value">'+esc(r.valueText)+'</span></div>').join('')+'</div>';
}
function renderReports(){
  const all = JOBS, active = all.filter(j=>j.statusIndex<8);
  const stageRows = STATUS_STEPS.map((s,i)=>{ const here = all.filter(j=>j.statusIndex===i); const b = here.filter(j=>jobHealth(j).tone==='danger').length; return { label:(i+1)+'. '+s, value:here.length, valueText:String(here.length), tip:s+': '+plural(here.length,'job')+(b?', '+b+' blocked':''), js:jobsFilterJs('all',i) }; });
  const healthDefs = [['On track','success','check'],['Needs attention','warning','alert'],['Blocked','danger','lock'],['With Finance','brand','receipt']];
  const healthRows = healthDefs.map(([l,t,ic])=>{ const n = active.filter(j=>jobHealth(j).label===l).length; return { label:l, icon:ic, value:n, valueText:String(n), tone: t==='brand'?null:t, js: l==='Blocked'?jobsFilterJs('blocked'):l==='Needs attention'?jobsFilterJs('attention'):jobsFilterJs('all') }; });
  const docCounts = { 'Approved':0,'Pending Review':0,'Missing':0,'Rejected':0 };
  active.filter(docsDue).forEach(j=>j.documents.forEach(d=>docCounts[d.status]++));
  const docRows = [['Approved','success'],['Pending Review',null],['Missing','warning'],['Rejected','danger']].map(([s,t])=>({ label:DOC_LABEL[s], icon:DOC_ICON[s], value:docCounts[s], valueText:String(docCounts[s]), tone:t }));
  const maxStage = Math.max(1, ...stageRows.map(r=>r.value)), maxHealth = Math.max(1, ...healthRows.map(r=>r.value)), maxDoc = Math.max(1, ...docRows.map(r=>r.value));
  const onTime = sumOf(active, j=>j.tasks.filter(t=>!t.done && taskStatus(j,t)!=='Overdue').length), late = sumOf(active, j=>j.tasks.filter(t=>taskStatus(j,t)==='Overdue').length);
  let money_ = '';
  if(canSeeFunds()){
    const ready = all.filter(j=>j.statusIndex===7);
    const value = sumOf(ready, j=>jobCostMargin(j).billed);
    const withCharges = all.filter(j=>j.charges.length && j.statusIndex<8);
    const avg = withCharges.length ? sumOf(withCharges, j=>jobCostMargin(j).marginPct)/withCharges.length : 0;
    const oldest = Math.max(0, ...ready.map(j=>j.billingReadyDays||0));
    const cats = CHARGE_CATEGORIES.map(cat=>({ label:cat, value:sumOf(all, j=>sumOf(j.charges.filter(c=>categoryOf(c)===cat), c=>c.amount)) })).map(r=>Object.assign(r,{ valueText:moneyShort(r.value), tip:r.label+': '+money(r.value) }));
    const maxCat = Math.max(1, ...cats.map(c=>c.value));
    const margins = all.filter(j=>j.charges.length).map(j=>({ j, m:jobCostMargin(j) })).sort((a,b)=>b.m.marginPct-a.m.marginPct);
    money_ = '<div class="ds-section-head" style="margin-top:var(--t1m-space-8)"><h2>'+icon('wallet')+'Money</h2><span class="ds-panel__hint">cost visibility, not accounting</span></div>'+
      '<div class="ds-stats" style="margin-bottom:var(--t1m-space-6)">'+stat('Waiting on Finance', money(value), false, plural(ready.length,'job')+' ready to bill')+stat('Average margin', avg.toFixed(1)+'%', false, 'service fees + markup, jobs with charges')+stat('Oldest with Finance', plural(oldest,'day'), oldest>=5, oldest>=5?'Finance has not picked it up':'')+'</div>'+
      '<div class="ds-grid-2">'+
        '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>Where the money goes</h2><span class="ds-panel__hint">all recorded charges</span></div><div class="ds-panel__body">'+barRows(cats, maxCat)+'<p class="ds-chart-note">'+icon('info')+'<span>Freight and duties are pass-through: we pay them and bill them back at cost. Our income is the fees.</span></p></div></section>'+
        '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>Margin by job</h2></div><div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr><th>Job</th><th class="ds-num">Billed</th><th class="ds-num">Margin</th></tr></thead><tbody>'+
          margins.map(({j,m})=>'<tr data-href onclick="go(\'#/jobs/'+j.id+'/money\')"><td data-label="Job"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(custById(j.customerId).name)+'</span></span></td><td data-label="Billed" class="ds-num">'+money(m.billed)+'</td><td data-label="Margin" class="ds-num'+(m.margin<0?' ds-overdue':'')+'">'+moneySigned(m.margin)+' <span class="ds-muted ds-xs">'+m.marginPct.toFixed(1)+'%</span></td></tr>').join('')+'</tbody></table></div></section>'+
      '</div>';
  }
  return '<div class="ds-page-head"><div><h1>Reports</h1><p class="ds-page-head__sub">How the operation is doing. For what needs action today, use Home.</p></div><span class="ds-mockbadge">'+icon('info')+'Sample data</span></div>'+
    '<div class="ds-section-head"><h2>'+icon('ship')+'Operations</h2><span class="ds-panel__hint">'+plural(active.length,'active job')+' · click a bar to open those jobs</span></div>'+
    '<div class="ds-grid-2">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>Jobs by stage</h2></div><div class="ds-panel__body">'+barRows(stageRows, maxStage)+'<p class="ds-chart-note">'+icon('info')+'<span>A tall bar at one stage is a queue forming there. Customs Clearance is where time, and storage fees, are usually lost.</span></p></div></section>'+
      '<div class="ds-stack">'+
        '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>Health of active jobs</h2></div><div class="ds-panel__body">'+barRows(healthRows, maxHealth)+'<p class="ds-chart-note">'+icon('info')+'<span>Blocked means it cannot move until a manager acts. Needs attention means something is late, missing or about to cost money.</span></p></div></section>'+
        '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>Document status</h2><span class="ds-panel__hint">jobs past booking</span></div><div class="ds-panel__body">'+barRows(docRows, maxDoc)+'</div></section>'+
      '</div>'+
    '</div>'+
    '<div class="ds-grid-2" style="margin-top:var(--t1m-space-6)">'+workloadPanel(active)+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('tasks')+'Tasks on time</h2></div><div class="ds-panel__body"><div class="ds-stats">'+stat('Open, on time', String(onTime))+stat('Overdue', String(late), late>0, late?'owners were emailed':'')+'</div></div></section>'+
    '</div>'+
    money_;
}

/* ============================== USERS & ROLES ============================== */
function openWorkOf(name){ const out = []; JOBS.forEach(j=>j.tasks.forEach(t=>{ if(!t.done && t.owner===name) out.push({ j, t }); })); return out; }
function renderUsers(){
  const rows = USERS.map(u=>{
    const work = openWorkOf(u.name), od = work.filter(x=>taskStatus(x.j,x.t)==='Overdue').length;
    return '<tr id="user-'+u.id+'"><td data-label="Person"><span class="ds-row ds-row--tight">'+avatar(u.name,true)+'<span class="ds-cell-name"><span class="ds-strong">'+esc(u.name)+'</span><span class="ds-cell-sub">'+esc(emailForUser(u.name))+'</span></span></span></td>'+
      '<td data-label="Department">'+esc(u.dept)+'</td><td data-label="Role">'+esc(u.role)+'</td>'+
      '<td data-label="Open work">'+(work.length ? (u.active?plural(work.length,'task'):pill(plural(work.length,'task')+' orphaned','warning','alert','ds-pill--sm'))+(od?' <span class="ds-overdue ds-xs">('+od+' overdue)</span>':'') : '<span class="ds-muted3">None</span>')+'</td>'+
      '<td data-label="Status"><label class="ds-switch"><input type="checkbox" role="switch" '+(u.active?'checked ':'')+'onchange="toggleUser(\''+u.id+'\')" aria-label="'+esc(u.name)+' active"><span class="ds-switch__track"></span>'+(u.active?'Active':'Inactive')+'</label></td></tr>';
  }).join('');
  const matrix = MODULES.map((m,mi)=>'<tr><td data-label="Area">'+esc(m)+'</td>'+ROLES.map(r=>{ const note = (PERM_NOTE[r]||{})[m]; return '<td data-label="'+esc(r)+'" style="text-align:center;white-space:normal">'+(PERM[r][mi]?'<span style="color:var(--t1m-success)">'+icon('check')+'</span>'+(note?'<div class="ds-muted ds-xs">'+esc(note)+'</div>':''):'<span class="ds-muted3" aria-label="No access">—</span>')+'</td>'; }).join('')+'</tr>').join('');
  return '<div class="ds-page-head"><div><h1>Users &amp; roles</h1><p class="ds-page-head__sub">Who can sign in, and what each role can see and do. Switching someone off keeps their history; their open work must go to someone else.</p></div>'+
    '<div class="ds-page-head__actions"><button class="ds-btn ds-btn--primary" id="add-user" onclick="openNewUser()">'+icon('plus')+'Add user</button></div></div>'+
    '<div class="ds-stack"><section class="ds-panel ds-panel--elevated"><div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="users-table"><thead><tr><th>Person</th><th>Department</th><th>Role</th><th>Open work</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
    '<section class="ds-panel ds-panel--elevated" id="perm-matrix"><div class="ds-panel__head"><h2>'+icon('shield')+'Who can do what</h2><span class="ds-mockbadge">Illustrative, to agree with the client</span></div><div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr><th>Area</th>'+ROLES.map(r=>'<th style="text-align:center">'+esc(r)+'</th>').join('')+'</tr></thead><tbody>'+matrix+'</tbody></table></div>'+
    '<div class="ds-panel__foot ds-muted ds-xs">A role never sees a menu it cannot use; typing the address shows a plain “not available” message instead.</div></section></div>';
}
function toggleUser(id){
  const u = USERS.find(x=>x.id===id);
  if(u.active){
    if(u.role==='Admin' && USERS.filter(x=>x.role==='Admin' && x.active).length===1){ showToast('There must be at least one active Admin.', 'danger', 'alert'); render(); return; }
    const work = openWorkOf(u.name);
    if(work.length){ openDeactivate(id); render(); return; }
    u.active = false;
    if(CURRENT_USER && u.name===CURRENT_USER.name){ showToast('You switched off your own account and were signed out.', 'warning', 'alert'); signOut(); return; }
    showToast(u.name+' is now inactive. Their history stays in the audit trail.', 'warning', 'x'); render(); return;
  }
  u.active = true; showToast(u.name+' is active again.', 'success', 'check'); render();
}
function openDeactivate(id){
  const u = USERS.find(x=>x.id===id), work = openWorkOf(u.name);
  const to = USERS.filter(x=>x.active && x.id!==id && (x.role===u.role || x.role==='Manager')).map(x=>({ value:x.name, label:x.name+' · '+x.role }));
  setTimeout(()=>openDrawer({ title:'Switch off '+u.name, sub:esc(u.role)+' · '+esc(u.dept),
    body:'<form class="ds-stack--sm" id="deact-form" onsubmit="event.preventDefault(); saveDeactivate(\''+id+'\', this)">'+
      '<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>'+esc(u.name)+' still owns '+plural(work.length,'open task')+'</strong>If nobody takes them over, they sit with a person who can no longer sign in.</div></div>'+
      '<ul class="ds-gate">'+work.map(({j,t})=>gateItemHtml({ label:t.name, sub:j.id+' · due '+shortDate(t.due)+(taskStatus(j,t)==='Overdue'?' (overdue)':''), met:false, overdue:taskStatus(j,t)==='Overdue', act:null })).join('')+'</ul>'+
      '<div class="ds-field"><label for="deact-to">Hand all of it to</label>'+selectWrap('<select class="ds-select" id="deact-to" name="to">'+options(to)+'</select>')+'</div>'+
      '<p class="ds-muted ds-xs">Due dates stay the same, so overdue work stays visibly overdue for the new owner. Every reassignment is written to the job’s history.</p></form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--secondary" onclick="saveDeactivate(\''+id+'\', null)">Switch off, reassign later</button><button type="submit" form="deact-form" class="ds-btn ds-btn--primary" id="deact-confirm">'+icon('user')+'Switch off and hand over</button>' }), 0);
}
function saveDeactivate(id, form){
  const u = USERS.find(x=>x.id===id);
  let msg = u.name+' is now inactive.';
  if(form){
    const to = new FormData(form).get('to');
    const work = openWorkOf(u.name);
    work.forEach(({j,t})=>{ t.owner = to; log(j, 'Task reassigned', t.name+': '+u.name+' → '+to+' (handover, '+u.name+' switched off).'); });
    msg += ' '+plural(work.length,'task')+' handed to '+to+'.';
  }
  u.active = false;
  closeDrawer();
  if(CURRENT_USER && u.name===CURRENT_USER.name){ signOut(); return; }
  showToast(msg, 'success', 'user'); render();
}
function openNewUser(){
  openDrawer({ title:'Add user', sub:'They sign in with their Microsoft work account. The role decides what they see.',
    body:'<form class="ds-stack--sm" id="user-form" onsubmit="event.preventDefault(); saveUser(this)">'+
      '<div class="ds-field"><label for="nu-name">Full name</label><input class="ds-input" id="nu-name" name="name">'+errorSlot('name')+'</div>'+
      '<div class="ds-field"><label for="nu-dept">Department</label><input class="ds-input" id="nu-dept" name="dept" placeholder="e.g. Finance"></div>'+
      '<div class="ds-field"><label for="nu-role">Role</label>'+selectWrap('<select class="ds-select" id="nu-role" name="role" onchange="document.getElementById(\'nu-blurb\').textContent=ROLE_BLURB[this.value]">'+options(ROLES)+'</select>')+'<p class="ds-field__hint" id="nu-blurb">'+esc(ROLE_BLURB[ROLES[0]])+'</p></div></form>',
    foot: drawerFoot('Add user','user-form',{icon:'plus'}) });
}
function saveUser(form){
  const fd = new FormData(form), name = String(fd.get('name')||'').trim();
  if(fieldError(form,'name', !name?'Enter the person’s name.':USERS.some(x=>x.name.toLowerCase()===name.toLowerCase())?name+' already exists.':'')) return;
  USERS.push({ id:'U'+(USERS.length+1), name, dept:String(fd.get('dept')||'').trim()||'—', role:fd.get('role'), active:true });
  closeDrawer(); showToast(name+' added as '+fd.get('role')+'.', 'success', 'check'); render();
}

/* ============================== AUDIT TRAIL ============================== */
function globalAudit(){
  const rows = [];
  JOBS.forEach(j=>visibleAudit(j).forEach(a=>rows.push(Object.assign({ jobId:j.id }, a))));
  return rows.map((a,i)=>({a,i})).sort((x,y)=>((parseDMY(y.a.ts)||0)-(parseDMY(x.a.ts)||0)) || (y.i-x.i)).map(o=>o.a);
}
function fmtShortDate(d){ return MONTH_NAMES[d.getMonth()].slice(0,3)+' '+d.getDate()+', '+d.getFullYear(); }
function applyAuditPreset(p){
  STATE.auditPreset = p; STATE.auditPage = 1; STATE.auditPickStart = null; STATE.auditPickerOpen = false;
  if(p==='all'){ STATE.auditStart = STATE.auditEnd = null; render(); return; }
  const end = new Date(TODAY); let start = new Date(TODAY);
  if(p==='7d') start.setDate(start.getDate()-6); else if(p==='30d') start.setDate(start.getDate()-29); else if(p==='month') start = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  STATE.auditStart = start; STATE.auditEnd = end; render();
}
function auditPickDay(y,m,d){
  const picked = new Date(y,m,d);
  if(!STATE.auditPickStart) STATE.auditPickStart = picked;
  else { let s = STATE.auditPickStart, e = picked; if(s>e){ const t=s; s=e; e=t; } STATE.auditStart = s; STATE.auditEnd = e; STATE.auditPreset='custom'; STATE.auditPage=1; STATE.auditPickStart = null; }
  render();
}
function auditCalendar(){
  const y = STATE.auditCalMonth.getFullYear(), m = STATE.auditCalMonth.getMonth(), first = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate(), prev = new Date(y,m,0).getDate();
  const cells = []; for(let i=0;i<first;i++) cells.push({ d:prev-first+1+i, muted:true }); for(let d=1; d<=dim; d++) cells.push({ d }); let n=1; while(cells.length%7) cells.push({ d:n++, muted:true });
  const same = (a,b)=>a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  return cells.map(c=>{
    if(c.muted) return '<span class="ds-datepicker__day" data-muted="true">'+c.d+'</span>';
    const dt = new Date(y,m,c.d), s = STATE.auditStart, e = STATE.auditEnd;
    const end = same(dt,s)||same(dt,e)||same(dt,STATE.auditPickStart), inR = s && e && dt>s && dt<e;
    return '<button type="button" class="ds-datepicker__day"'+(end?' data-endpoint="true"':'')+(inR?' data-in-range="true"':'')+' onclick="auditPickDay('+y+','+m+','+c.d+')">'+c.d+'</button>';
  }).join('');
}
function renderAudit(){
  let rows = globalAudit();
  if(STATE.auditStart && STATE.auditEnd){ const endD = new Date(STATE.auditEnd.getFullYear(), STATE.auditEnd.getMonth(), STATE.auditEnd.getDate(), 23,59,59); rows = rows.filter(a=>{ const d = parseDMY(a.ts); return d && d>=STATE.auditStart && d<=endD; }); }
  const q = STATE.auditQuery.trim().toLowerCase();
  if(q) rows = rows.filter(a=>(a.actor+' '+a.action+' '+a.jobId+' '+a.detail).toLowerCase().includes(q));
  const size = STATE.auditPageSize, pages = Math.max(1, Math.ceil(rows.length/size));
  STATE.auditPage = Math.min(Math.max(1, STATE.auditPage), pages);
  const page = rows.slice((STATE.auditPage-1)*size, STATE.auditPage*size);
  const presets = [['today','Today'],['7d','Last 7 days'],['30d','Last 30 days'],['month','This month'],['all','All time']].map(([k,l])=>'<button type="button" class="ds-datepicker__preset" aria-current="'+(STATE.auditPreset===k)+'" onclick="applyAuditPreset(\''+k+'\')">'+l+'</button>').join('');
  const label = STATE.auditStart && STATE.auditEnd ? fmtShortDate(STATE.auditStart)+' – '+fmtShortDate(STATE.auditEnd) : 'All time';
  const picker = '<div class="ds-datepicker ds-datepicker--right"'+(STATE.auditPickerOpen?' data-open':'')+'><button type="button" class="ds-datepicker__trigger" id="audit-range" onclick="STATE.auditPickerOpen=!STATE.auditPickerOpen; render()">'+icon('calendar')+esc(label)+'</button>'+
    '<div class="ds-datepicker__panel"><div class="ds-datepicker__body"><div class="ds-datepicker__presets">'+presets+'</div><div class="ds-datepicker__cal"><div class="ds-datepicker__calhead"><button type="button" class="ds-datepicker__navbtn" aria-label="Previous month" onclick="STATE.auditCalMonth=new Date(STATE.auditCalMonth.getFullYear(),STATE.auditCalMonth.getMonth()-1,1); render()">'+icon('chevron-right','ds-flip')+'</button><span>'+MONTH_NAMES[STATE.auditCalMonth.getMonth()]+' '+STATE.auditCalMonth.getFullYear()+'</span><button type="button" class="ds-datepicker__navbtn" aria-label="Next month" onclick="STATE.auditCalMonth=new Date(STATE.auditCalMonth.getFullYear(),STATE.auditCalMonth.getMonth()+1,1); render()">'+icon('chevron-right')+'</button></div>'+
    '<div class="ds-datepicker__grid">'+['S','M','T','W','T','F','S'].map(d=>'<span class="ds-datepicker__dow">'+d+'</span>').join('')+auditCalendar()+'</div></div></div>'+
    '<div class="ds-datepicker__footer"><button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" onclick="applyAuditPreset(\'all\')">Clear</button><button type="button" class="ds-btn ds-btn--primary ds-btn--sm" onclick="STATE.auditPickerOpen=false; render()">Done</button></div></div></div>';
  const body = page.length ? page.map(a=>'<tr><td data-label="When" class="ds-mono ds-small">'+esc(a.ts)+'</td><td data-label="Who">'+esc(a.actor)+'</td><td data-label="What"><span class="ds-row ds-row--tight"><span class="ds-activity__icon">'+icon(HISTORY_ICON[a.action]||(a.finance?'wallet':'clock'))+'</span>'+esc(a.action)+'</span></td><td data-label="Job"><a class="ds-mono ds-cell-primary" href="#/jobs/'+a.jobId+'/history">'+a.jobId+'</a></td><td data-label="Detail" style="white-space:normal;min-width:260px">'+esc(a.detail)+'</td></tr>').join('')
    : '<tr><td colspan="5">'+emptyState('calendar','No events','Nothing matches this date range and search.')+'</td></tr>';
  return '<div class="ds-page-head"><div><h1>Audit trail</h1><p class="ds-page-head__sub"><span id="audit-count">'+plural(rows.length,'event')+'</span> in range. Who did what, when, to which job. Nothing here can be edited.'+(canSeeFunds()?'':' Money entries are hidden for your role.')+'</p></div>'+picker+'</div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body"><div class="ds-search" style="max-width:420px">'+icon('search')+'<input class="ds-input" id="audit-search" placeholder="Person, action, job or detail" value="'+esc(STATE.auditQuery)+'" oninput="STATE.auditQuery=this.value; STATE.auditPage=1; render()"></div></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="audit-table"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Job</th><th>Detail</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
    '<div class="ds-pager"><span>Page '+STATE.auditPage+' of '+pages+'</span><span class="ds-row ds-row--tight"><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" '+(STATE.auditPage<=1?'disabled':'')+' onclick="STATE.auditPage--; render()">Previous</button><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" '+(STATE.auditPage>=pages?'disabled':'')+' onclick="STATE.auditPage++; render()">Next</button></span></div></section>';
}

/* ============================== CUSTOMER TRACKING (public, no login) ==============================
   The customer's words, not ours: seven plain steps, a calm sentence when something is late, and
   an "action needed" note only when it is truly the customer's move. Never money, staff, tasks or
   exception details. A real build would use a signed, expiring link instead of a guessable number. */
const CLIENT_STEPS = ['Booked','Preparing documents','On the water','Arrived at port','Customs clearance','Out for delivery','Delivered'];
const CLIENT_STEP_ICON = ['tasks','file','ship','anchor','shield','truck','check'];
const CLIENT_CUSTOMS_SENTENCE = { 'Lodging Pending':'We are preparing the customs declaration.', 'Lodged':'The customs declaration is filed.', 'Assessment Pending':'Customs is working out the duties.', 'Payment Pending':'Duties are being paid.', 'Payment Completed':'Duties are paid.', 'Release Pending':'Waiting for customs to release the goods.', 'Released':'Released by customs. Arranging the truck.' };
function findShipment(q){ const n = String(q||'').toLowerCase().replace(/\s+/g,''); return n ? JOBS.find(j=>[j.id,j.blNo,j.containerNo].some(v=>String(v).toLowerCase().replace(/\s+/g,'')===n)) || null : null; }
function trackLookup(form){
  const q = String(new FormData(form).get('q')||'').trim(), j = findShipment(q);
  if(j){ STATE.trackError=''; go('#/track/'+j.id); return; }
  STATE.trackError = q ? 'We could not find a shipment for “'+q+'”. Check the number and try again.' : 'Enter a job, bill of lading or container number.';
  STATE.trackQuery = q; render();
}
function trackHero(inner){ return '<div class="ds-public__hero"><div class="ds-public__hero-inner"><div class="ds-public__brand"><img src="'+LOGO_SRC+'" alt="Top1Movers"><span>Shipment tracking</span></div>'+inner+'</div></div>'; }
function renderTrackLookup(){
  const err = STATE.trackError;
  return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><p class="ds-label">Customer tracking</p><h1 class="ds-public__status">Where is your shipment?</h1><p class="ds-public__meta">Enter your Top1Movers job number, bill of lading number or container number. No account needed.</p></div>')+
    '<div class="ds-public__body"><div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><form class="ds-stack--sm" onsubmit="event.preventDefault(); trackLookup(this)">'+
      '<div class="ds-field"><label for="track-q">Job, BL or container number</label><input class="ds-input" id="track-q" name="q" value="'+esc(STATE.trackQuery)+'" placeholder="e.g. SJ-2026-00120" autocomplete="off"'+(err?' aria-invalid="true"':'')+'>'+(err?'<span class="ds-field__error" id="track-error">'+icon('alert')+'<span>'+esc(err)+'</span></span>':'')+'</div>'+
      '<button class="ds-btn ds-btn--primary" type="submit">'+icon('search')+'Track shipment</button></form>'+
      '<p class="ds-muted ds-xs">'+icon('info')+' Sample data: try SJ-2026-00120, BL-2026-04520 or TMWU-118899-2.</p></div></div>'+
      '<p class="ds-small" style="text-align:center"><a href="#/login">Top1Movers staff sign in</a></p></div></div>';
}
function renderTrackPage(id){
  if(!id) return renderTrackLookup();
  const j = findShipment(id);
  if(!j) return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><h1 class="ds-public__status">We could not find that shipment</h1></div>')+'<div class="ds-public__body"><div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><p>Check the number and try again.</p><a class="ds-btn ds-btn--secondary" href="#/track">'+icon('search')+'Try another number</a></div></div></div></div>';
  const cur = Math.min(j.statusIndex, CLIENT_STEPS.length-1);
  const delivered = j.delivery && j.delivery.confirmed;
  const held = isOnHold(j) || !!customsHold(j);
  const sub = j.customs ? CUSTOMS_SUBSTAGES[j.customs.subIndex] : null;
  const items = CLIENT_STEPS.map((s,idx)=>{
    const done = idx<cur || (delivered && idx===cur);
    const state = done ? 'done' : idx===cur ? (held?'attention':'current') : 'todo';
    let text = '';
    if(state==='done') text = idx===6 && j.delivery.date ? 'Delivered on '+j.delivery.date : 'Completed';
    else if(state==='attention') text = 'This step is taking longer than usual. We are on it.';
    else if(state==='current') text = ['Your booking is confirmed.','We are collecting and checking your shipping documents.','Your cargo is at sea aboard '+j.vessel+'.','Your shipment has arrived at '+j.portOfEntry+'.', sub ? CLIENT_CUSTOMS_SENTENCE[sub] : 'Being cleared through customs.','On its way to '+j.destination+'.','Delivered.'][idx];
    return '<li class="ds-timeline__item" data-state="'+state+'"><span class="ds-timeline__dot">'+icon(done?'check':state==='attention'?'alert':CLIENT_STEP_ICON[idx])+'</span><div><div class="ds-timeline__title">'+esc(s)+'</div>'+(text?'<div class="ds-timeline__sub">'+esc(text)+'</div>':'')+'</div></li>';
  }).join('');
  const pct = delivered ? 100 : Math.max(6, Math.round(cur/(CLIENT_STEPS.length-1)*100));
  const headline = delivered ? 'Delivered' : held ? 'Your shipment is delayed' : CLIENT_STEPS[cur];
  const notices = [];
  if(customsHold(j)) notices.push('<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Customs inspection in progress</strong>The Bureau of Customs has selected this shipment for a check. Our team is handling it and will contact you if anything is needed from you.</div></div>');
  else if(isOnHold(j)) notices.push('<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Your shipment is delayed</strong>Our team is resolving an issue and will contact you with an update.</div></div>');
  if(j.statusIndex===4 && sub==='Payment Pending' && j.customs.paymentParty==='Client') notices.push('<div class="ds-alert ds-alert--info" id="action-needed">'+icon('info')+'<div><strong>Action needed from you</strong>Customs duties are waiting to be paid before your shipment can be released. Please contact your Top1Movers coordinator.</div></div>');
  const kvv = (l,v)=>'<div><span class="ds-label">'+l+'</span><div>'+v+'</div></div>';
  const delivery = delivered ? '<div class="ds-panel" id="track-delivery"><div class="ds-panel__head"><h2>Delivery</h2>'+pill('Delivered','success','check')+'</div><div class="ds-panel__body ds-stack--sm"><div class="ds-grid-kv ds-kv">'+kvv('Delivered on',esc(j.delivery.date))+kvv('Received by',esc(j.delivery.receiver||'—'))+'</div>'+
    (j.delivery.damage && !j.delivery.damageResolved?'<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Damage or incomplete delivery reported</strong>Our team will contact you about next steps.</div></div>':'')+
    '<div class="ds-panel" style="box-shadow:none;border-color:var(--t1m-border)"><div class="ds-doc"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">Proof of delivery</div><div class="ds-doc__meta">'+esc(j.delivery.podFile)+'</div></div><span></span><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="showToast(\'Mockup: file download is not wired up.\',\'info\',\'info\')">'+icon('download')+'View</button></div></div></div></div>' : '';
  const hero = trackHero('<div class="ds-public__headline"><p class="ds-label">Shipment <span class="ds-mono" style="color:var(--t1m-ink-inverse)">'+esc(j.id)+'</span></p><h1 class="ds-public__status" id="track-status">'+esc(headline)+'</h1>'+
    '<div class="ds-public__meta"><span>'+pill(delivered?'Delivered':held?'Delayed':'On track', delivered?'success':held?'warning':'info', delivered?'check':held?'alert':'truck')+'</span><span>'+(delivered?'Delivered ':j.statusIndex<3?'Estimated arrival ':'Arrived ')+'<strong>'+esc(delivered?j.delivery.date:j.eta)+'</strong></span></div></div>'+
    '<div class="ds-route" style="--p:'+pct+'%" aria-label="Route progress '+pct+' percent"><div class="ds-route__stop"><small>From</small>'+esc(j.origin)+'</div><div class="ds-route__line"><span class="ds-route__fill"></span><span class="ds-route__marker">'+icon(delivered?'check':j.statusIndex<=2?'ship':'truck')+'</span></div><div class="ds-route__stop ds-route__stop--end"><small>To</small>'+esc(j.destination)+'</div><div class="ds-route__via">via '+esc(j.portOfEntry)+'</div></div>');
  return '<div class="ds-public">'+hero+'<div class="ds-public__body">'+
    '<div class="ds-panel"><div class="ds-panel__head"><h2>Journey</h2></div><div class="ds-panel__body">'+notices.join('')+'<ol class="ds-timeline" aria-label="Shipment progress">'+items+'</ol></div></div>'+delivery+
    '<div class="ds-panel"><div class="ds-panel__head"><h2>Shipment details</h2></div><div class="ds-panel__body ds-grid-kv ds-kv">'+kvv('Cargo',esc(j.commodity))+kvv('Vessel / voyage',esc(j.vessel+' / '+j.voyage))+kvv('Shipping line',esc(j.shippingLine))+kvv('Container','<span class="ds-mono">'+esc(j.containerNo)+'</span>')+kvv('Bill of lading','<span class="ds-mono">'+esc(j.blNo)+'</span>')+kvv('Delivering to',esc(j.consignee))+'</div></div>'+
    '<div class="ds-panel"><div class="ds-panel__body ds-row--between"><div><strong class="ds-strong">Questions about this shipment?</strong><p class="ds-muted ds-small">Contact your Top1Movers coordinator and quote '+esc(j.id)+'.</p></div><a class="ds-btn ds-btn--secondary" href="#/track">'+icon('search')+'Track another</a></div></div>'+
    '<p class="ds-muted ds-xs">'+icon('info')+' Sample data. Status is updated by Top1Movers staff as the shipment moves.</p></div></div>';
}
