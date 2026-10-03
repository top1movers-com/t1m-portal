/* ============================== USERS & ROLES (Stage 4) ==============================
   Admin adds people (they sign in with their Microsoft work account; passwords stay with Microsoft),
   edits roles (several per person) and deactivates (never deletes). Open work of a leaver must be reassigned by a
   Manager before the deactivation completes. The permission matrix is editable by the Admin. */
function openWorkOf(name){
  return {
    inquiries: INQUIRIES.filter(i=>i.staff.includes(name) && OPEN_INQ.includes(inqStatus(i).key)),
    jobs: JOBS.filter(j=>j.ops.includes(name) && j.status!=='Completed'),
    funds: [].concat(...JOBS.map(j=>j.funds.filter(f=>f.by===name && f.status!=='Verified').map(f=>({ j, f }))))
  };
}
function workCount(w){ return w.inquiries.length + w.jobs.length + w.funds.length; }
function adminLog(action, detail, ref){ ADMIN_LOG.push({ ts:nowStamp(), actor:actorLabel(), action, detail, ref:ref||null }); }
function renderUsers(){
  const q = STATE.userQuery.trim().toLowerCase(), manage = can('users.manage');
  const list = USERS.filter(u=>!q || (u.name+' '+u.dept+' '+u.roles.join(' ')).toLowerCase().includes(q));
  const rows = list.map(u=>{
    const w = openWorkOf(u.name), n = workCount(w);
    const status = u.pendingDeactivation ? pill('Pending handover','warning','clock','ds-pill--sm') : '';
    return '<tr id="user-'+u.id+'"><td data-label="Person"><span class="ds-row ds-row--tight">'+avatar(u.name,true)+'<span class="ds-cell-name"><span class="ds-strong">'+esc(u.name)+'</span><span class="ds-cell-sub">'+esc(emailForUser(u.name))+'</span></span></span></td>'+
      '<td data-label="Department">'+esc(u.dept)+'</td><td data-label="Roles">'+u.roles.map(r=>pill(r,'neutral',null,'ds-pill--sm')).join(' ')+'</td>'+
      '<td data-label="Open work">'+(n ? plural(n,'item') : '<span class="ds-muted3">None</span>')+'</td>'+
      '<td data-label="Status">'+(manage ? '<label class="ds-switch"><input type="checkbox" role="switch" '+(u.active?'checked ':'')+'onchange="toggleUser(\''+u.id+'\')" aria-label="'+esc(u.name)+' active"><span class="ds-switch__track"></span>'+(u.active?'Active':'Inactive')+'</label>' : (u.active?'Active':'Inactive'))+' '+status+'</td>'+
      '<td data-label="" class="ds-num">'+(manage ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openEditRoles(\''+u.id+'\')">Roles</button>' : '')+'</td></tr>';
  }).join('');
  return '<div class="ds-page-head"><div><h1>Users &amp; roles</h1><p class="ds-page-head__sub">Who can sign in, with which roles. Deactivating keeps a person’s history; their open work goes to someone else first.</p></div>'+
    '<div class="ds-page-head__actions">'+(manage?'<button class="ds-btn ds-btn--primary" id="add-user" onclick="openNewUser()">'+icon('plus')+'Add user</button>':'')+'</div></div>'+
    '<div class="ds-stack"><section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-row"><div class="ds-search" style="max-width:420px;flex:1">'+icon('search')+'<input class="ds-input" id="user-search" placeholder="Name, department or role" value="'+esc(STATE.userQuery)+'" oninput="STATE.userQuery=this.value; render()"></div><span class="ds-muted ds-small" style="margin-left:auto">'+plural(USERS.filter(u=>u.active).length,'active user')+' of '+USERS.length+'</span></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="users-table"><thead><tr><th>Person</th><th>Department</th><th>Roles</th><th>Open work</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
    permMatrixHtml()+'</div>';
}
const LEVEL_TEXT = { Y:'Yes', A:'Assigned only', V:'View', VA:'View assigned', VL:'View linked' };
function permMatrixHtml(){
  const edit = can('perms.edit');
  const body = PERM_GROUPS.map(g=>'<tr><td colspan="'+(ROLES.length+1)+'" class="ds-label" style="padding-top:var(--t1m-space-4)">'+esc(g.group)+'</td></tr>'+g.items.map(([key,label])=>'<tr><td data-label="Permission" style="white-space:normal">'+esc(label)+'</td>'+ROLES.map(r=>{
    const lv = PERM[key][r], locked = r==='Admin';
    const box = edit ? '<label class="ds-check" style="justify-content:center" title="'+esc(locked?'Admin always has full access':(lv?'Untick to remove':'Tick to grant'))+'"><input type="checkbox" '+(lv?'checked ':'')+(locked?'disabled ':'')+'onchange="togglePerm(\''+key+'\',\''+r+'\')" aria-label="'+esc(r+': '+label)+'"></label>'
      : (lv?'<span style="color:var(--t1m-success)">'+icon('check')+'</span>':'<span class="ds-muted3">—</span>');
    return '<td data-label="'+esc(r)+'" style="text-align:center">'+box+(lv && lv!=='Y'?'<div class="ds-muted ds-xs">'+esc(LEVEL_TEXT[lv])+'</div>':'')+'</td>'; }).join('')+'</tr>').join('')).join('');
  return '<section class="ds-panel ds-panel--elevated" id="perm-matrix"><div class="ds-panel__head"><h2>'+icon('shield')+'Permission matrix</h2><span class="ds-panel__hint">'+(edit?'Admin can tick or untick · changes apply immediately':'read only')+'</span></div>'+
    '<div class="ds-panel__body ds-small ds-muted">Admin has full access to everything, so that column is locked. A person gets the best level any of their roles has. “Assigned only” means records they are assigned to. Money is split on purpose: a Manager approves, Accounting releases. Someone holding both roles can do both, and both actions are logged under their name.</div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr><th>Permission</th>'+ROLES.map(r=>'<th style="text-align:center">'+esc(r)+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div></section>';
}
function togglePerm(key, r){
  if(!can('perms.edit')) return denied();
  const was = PERM[key][r];
  PERM[key][r] = was ? '' : (PERM_DEFAULT[key][r] || 'Y');
  adminLog('Permission changed', r+' · '+PERM_LABEL[key]+': '+(was?'removed':'granted ('+LEVEL_TEXT[PERM[key][r]]+')')+'.');
  showToast(r+': '+(was?'removed':'granted')+' “'+PERM_LABEL[key]+'”.', 'info', 'shield');
  if(CURRENT_USER && !can('perms.edit') && !can('users.manage')){ go('#/home'); return; }
  render();
}
function openNewUser(){
  openDrawer({ title:'Add user', sub:'They sign in with their Microsoft work account. The roles decide what they see.',
    body:'<form class="ds-stack--sm" id="user-form" novalidate onsubmit="event.preventDefault(); saveUser(this)">'+
      '<div class="ds-field"><label for="nu-name">Full name</label><input class="ds-input" id="nu-name" name="name" oninput="document.getElementById(\'nu-email\').value=emailForUser(this.value)">'+errorSlot('name')+'</div>'+
      '<div class="ds-field"><label for="nu-email">Work email</label><input class="ds-input" id="nu-email" name="email" readonly><p class="ds-field__hint">Their Microsoft work account. Generated from the name in this mockup.</p></div>'+
      '<div class="ds-field"><label for="nu-dept">Department</label><input class="ds-input" id="nu-dept" name="dept" placeholder="e.g. Operations"></div>'+
      '<div class="ds-field"><span class="ds-field__label">Roles (one or more)</span>'+checkList('roles', ROLES.map(r=>({ value:r, label:r, sub:ROLE_BLURB[r] })), [])+errorSlot('roles')+'</div></form>',
    foot: drawerFoot('Add user','user-form',{icon:'plus'}) });
}
function saveUser(form){
  const fd = new FormData(form), name = String(fd.get('name')||'').trim(), roles = fd.getAll('roles');
  if(fieldError(form,'name', !name?'Enter the person’s name.':USERS.some(x=>x.name.toLowerCase()===name.toLowerCase())?name+' already exists.':'') | fieldError(form,'roles', roles.length?'':'Pick at least one role.')) return;
  const u = { id:'U'+(USERS.length+1), name, dept:String(fd.get('dept')||'').trim()||'—', roles:ROLES.filter(r=>roles.includes(r)), active:true };
  USERS.push(u);
  adminLog('User added', name+' ('+rolesText(u)+'). Signs in with Microsoft as '+emailForUser(name)+'.', u.name);
  closeDrawer(); showToast(name+' added. They can sign in with Microsoft now.', 'success', 'check'); render();
}
function openEditRoles(id){
  const u = USERS.find(x=>x.id===id);
  openDrawer({ title:'Roles for '+u.name, sub:esc(u.dept),
    body:'<form class="ds-stack--sm" id="roles-form" novalidate onsubmit="event.preventDefault(); saveRoles(\''+id+'\', this)"><div class="ds-field"><span class="ds-field__label">Roles</span>'+checkList('roles', ROLES.map(r=>({ value:r, label:r, sub:ROLE_BLURB[r] })), u.roles)+errorSlot('roles')+'</div></form>',
    foot: drawerFoot('Save roles','roles-form',{icon:'check'}) });
}
function saveRoles(id, form){
  const u = USERS.find(x=>x.id===id), roles = new FormData(form).getAll('roles');
  if(fieldError(form,'roles', roles.length?'':'Pick at least one role.')) return;
  if(u.roles.includes('Admin') && !roles.includes('Admin') && USERS.filter(x=>x.active && x.roles.includes('Admin')).length===1){ fieldError(form,'roles','There must be at least one active Admin.'); return; }
  const before = rolesText(u); u.roles = ROLES.filter(r=>roles.includes(r));
  adminLog('Roles changed', u.name+': '+before+' → '+rolesText(u)+'.', u.name);
  closeDrawer(); showToast(u.name+' now: '+rolesText(u)+'.', 'success', 'check');
  if(CURRENT_USER===u && !can('users.manage')){ go('#/home'); return; }
  render();
}
function toggleUser(id){
  const u = USERS.find(x=>x.id===id);
  if(!u.active){ u.active = true; u.pendingDeactivation = null; adminLog('User reactivated', u.name+' can sign in again.', u.name); showToast(u.name+' is active again.', 'success', 'check'); render(); return; }
  if(u.roles.includes('Admin') && USERS.filter(x=>x.active && x.roles.includes('Admin')).length===1){ showToast('There must be at least one active Admin.', 'danger', 'alert'); render(); return; }
  const n = workCount(openWorkOf(u.name));
  if(!n){ render(); confirmAction('Deactivate '+u.name+'?', 'They can no longer sign in. Their history stays in the audit log.', 'Deactivate', "deactivate(USERS.find(x=>x.id==='"+id+"'))", true); return; }
  if(can('inquiry.create')){ render(); setTimeout(()=>openHandover(id), 0); return; }
  u.pendingDeactivation = { by:me(), on:todayDMY() };
  adminLog('Deactivation requested', u.name+' has '+plural(n,'open item')+'. Waiting for a Manager to reassign them.', u.name);
  notify({ roles:['Manager'] }, 'Reassign '+u.name+'’s open work ('+plural(n,'item')+') so the deactivation can complete.', '#/home');
  showToast(u.name+' has open work. A manager reassigns it, then the account switches off.', 'warning', 'users'); render();
}
function deactivate(u){
  u.active = false; u.pendingDeactivation = null;
  adminLog('User deactivated', u.name+' can no longer sign in. History kept.', u.name);
  if(CURRENT_USER===u){ showToast('You switched off your own account and were signed out.', 'warning', 'alert'); signOut(); return; }
  showToast(u.name+' is now inactive. Their history stays in the audit log.', 'warning', 'x'); render();
}
function openHandover(id){
  const u = USERS.find(x=>x.id===id), w = openWorkOf(u.name);
  const pick = (name, role)=>selectWrap('<select class="ds-select" name="'+name+'">'+options(USERS.filter(x=>x.active && x.id!==id && x.roles.includes(role)).map(x=>x.name))+'</select>');
  const list = (items)=>'<ul class="ds-gate">'+items.join('')+'</ul>';
  openDrawer({ title:'Reassign '+u.name+'’s open work', sub:'The account switches off once everything has a new owner.',
    body:'<form class="ds-stack--sm" id="handover-form" onsubmit="event.preventDefault(); saveHandover(\''+id+'\', this)">'+
      (w.inquiries.length ? '<div class="ds-field"><span class="ds-field__label">'+plural(w.inquiries.length,'open inquiry','open inquiries')+'</span>'+list(w.inquiries.map(i=>gateItemHtml({ label:i.id+' · '+cname(i.customerId), sub:inqStatus(i).label, met:false })))+'<label class="ds-small" style="margin-top:var(--t1m-space-2)">Hand to</label>'+pick('inqTo','Sales')+'</div>' : '')+
      (w.jobs.length ? '<div class="ds-field"><span class="ds-field__label">'+plural(w.jobs.length,'active job')+'</span>'+list(w.jobs.map(j=>gateItemHtml({ label:j.id+' · '+cname(j.customerId), sub:stageText(j), met:false })))+'<label class="ds-small" style="margin-top:var(--t1m-space-2)">Hand to</label>'+pick('jobTo','Operations')+'</div>' : '')+
      (w.funds.length ? '<div class="ds-field"><span class="ds-field__label">'+plural(w.funds.length,'open fund request')+'</span>'+list(w.funds.map(x=>gateItemHtml({ label:x.f.id+' · '+x.j.id, sub:x.f.status+' · '+money(x.f.amount), met:false })))+'<label class="ds-small" style="margin-top:var(--t1m-space-2)">Hand to</label>'+pick('fundTo','Operations')+'</div>' : '')+
    '</form>',
    foot: drawerFoot('Reassign and deactivate','handover-form',{icon:'users'}) });
}
function saveHandover(id, form){
  const u = USERS.find(x=>x.id===id), w = openWorkOf(u.name), fd = new FormData(form);
  const swap = (list, to)=>list.map(n=>n===u.name?to:n).filter((n,k,a)=>a.indexOf(n)===k);
  if(w.inquiries.length){ const to = fd.get('inqTo'); w.inquiries.forEach(i=>{ i.staff = swap(i.staff, to); logTo(i, 'Inquiry updated', 'Handed from '+u.name+' to '+to+' (deactivation).'); }); notify({ users:[to] }, 'You took over '+plural(w.inquiries.length,'inquiry','inquiries')+' from '+u.name+'.', '#/inquiries'); }
  if(w.jobs.length){ const to = fd.get('jobTo'); w.jobs.forEach(j=>{ j.ops = swap(j.ops, to); if(j.opsByService) for(const k in j.opsByService) j.opsByService[k] = swap(j.opsByService[k], to); logTo(j, 'References updated', 'Operations handed from '+u.name+' to '+to+' (deactivation).'); }); notify({ users:[to] }, 'You took over '+plural(w.jobs.length,'job')+' from '+u.name+'.', '#/jobs'); }
  if(w.funds.length){ const to = fd.get('fundTo'); w.funds.forEach(x=>{ x.f.by = to; if(!x.j.ops.includes(to)) x.j.ops.push(to); logTo(x.j, 'Fund request', x.f.id+' handed from '+u.name+' to '+to+' (deactivation).'); }); }
  adminLog('Work reassigned', u.name+'’s open work handed over by '+me()+'.', u.name);
  closeDrawer(); deactivate(u);
}

/* ============================== SETTINGS (Admin + Manager) ============================== */
const SETTING_FIELDS = [
  ['quoteValidityDays','Quote validity (days)','Default “valid until” when sales uploads a quote.'],
  ['awaitingClientDays','Awaiting-client alert (days)','A sent quote with no answer for this long shows on the dashboard.'],
  ['stepDays','Days allowed per step','Each step is due this many days after the one before it. A few steps, such as ocean transit, have their own allowance.'],
  ['escalateDays','Escalate to a Manager after (days overdue)','The owner is emailed when a step becomes overdue; a Manager is emailed after this many days.'],
  ['reminderEveryDays','Follow-up reminder (every N days)','Automatic email to the assigned Sales staff while a quote is waiting for the client.'],
  ['unliquidatedDays','Receipts due (days)','Released funds without receipts after this many days are flagged as overdue.'],
  ['portFreeDays','Default port free days','Pre-filled when a job is created; Ops can change it per job.'],
  ['containerFreeDays','Default container free days (FCL)','Pre-filled when a job is created; Ops can change it per job.']
];
function renderSettings(){
  const fields = SETTING_FIELDS.map(([k,l,h])=>'<div class="ds-field"><label for="set-'+k+'">'+esc(l)+'</label><input class="ds-input" style="max-width:160px" type="number" min="0" id="set-'+k+'" name="'+k+'" value="'+SETTINGS[k]+'"><p class="ds-field__hint">'+esc(h)+'</p></div>').join('');
  const docs = Object.keys(DOC_TEMPLATES).map(k=>'<div class="ds-panel" style="margin-bottom:var(--t1m-space-3)"><div class="ds-panel__head"><h3>'+esc(DOC_TEMPLATE_LABEL[k])+'</h3></div><div class="ds-panel__body ds-stack--sm">'+
    DOC_TEMPLATES[k].map((d,x)=>'<div class="ds-row--between"><span>'+icon('file')+' '+esc(d)+'</span><button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="removeDocTemplate(\''+k+'\','+x+')" aria-label="Remove '+esc(d)+'">'+icon('x')+'</button></div>').join('')+
    '<form class="ds-row" onsubmit="event.preventDefault(); addDocTemplate(\''+k+'\', this)"><input class="ds-input" name="doc" placeholder="Add a document" style="max-width:280px"><button class="ds-btn ds-btn--secondary ds-btn--sm" type="submit">'+icon('plus')+'Add</button></form></div></div>').join('');
  const tracks = [['Domestic',null],['International','Import'],['International','Export']].map(([s,d])=>'<div class="ds-label" style="margin-top:var(--t1m-space-5)">'+esc(s+(d?' · '+d:''))+'</div>'+progressPreview(SERVICE_ORDER.filter(k=>serviceAllowed(k,s,d)), s, d, 'FCL', null, true)).join('');
  return '<div class="ds-page-head"><div><h1>Settings</h1><p class="ds-page-head__sub">Defaults, document checklists and service tracks. Changes apply to new records.</p></div></div>'+
    '<div class="ds-stack"><section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('settings')+'Defaults</h2></div><div class="ds-panel__body"><form class="ds-grid-2" id="settings-form" onsubmit="event.preventDefault(); saveSettings(this)">'+fields+'<div><button class="ds-btn ds-btn--primary" type="submit">'+icon('check')+'Save defaults</button></div></form></div></section>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('file')+'Document checklists</h2><span class="ds-panel__hint">per service · used when a job is created</span></div><div class="ds-panel__body">'+docs+'</div></section>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('flag')+'Service tracks</h2><span class="ds-panel__hint">milestones per service · fixed in this mockup</span></div><div class="ds-panel__body">'+tracks+'</div></section></div>';
}
function saveSettings(form){
  const fd = new FormData(form), changed = [];
  SETTING_FIELDS.forEach(([k,l])=>{ const v = Math.max(0, parseInt(fd.get(k),10)||0); if(v!==SETTINGS[k]){ changed.push(l+' '+SETTINGS[k]+' → '+v); SETTINGS[k] = v; } });
  if(changed.length) adminLog('Settings changed', changed.join('; ')+'.');
  showToast(changed.length ? 'Saved '+plural(changed.length,'change')+'.' : 'Nothing changed.', 'success', 'check'); render();
}
function addDocTemplate(k, form){ const v = String(new FormData(form).get('doc')||'').trim(); if(!v) return; DOC_TEMPLATES[k].push(v); adminLog('Checklist changed', DOC_TEMPLATE_LABEL[k]+': added '+v+'.'); render(); }
function removeDocTemplate(k, x){ const d = DOC_TEMPLATES[k].splice(x,1)[0]; adminLog('Checklist changed', DOC_TEMPLATE_LABEL[k]+': removed '+d+'.'); render(); }

/* ============================== AUDIT LOG (Admin + Manager) ============================== */
function tsValue(ts){ const d = parseDMY(ts); if(!d) return 0; const m = String(ts).match(/(\d{1,2}):(\d{2}) (AM|PM)/); if(m){ let h = +m[1]%12; if(m[3]==='PM') h += 12; d.setHours(h, +m[2]); } return d.getTime(); }
function globalAudit(){
  const rows = [];
  INQUIRIES.forEach(i=>i.log.forEach(a=>rows.push(Object.assign({ rec:i.id, href:'#/inquiries/'+i.id }, a))));
  JOBS.forEach(j=>j.log.forEach(a=>rows.push(Object.assign({ rec:j.id, href:'#/jobs/'+j.id+'/history' }, a))));
  ADMIN_LOG.forEach(a=>rows.push(Object.assign({ rec:a.ref||'System', href:a.ref && a.ref.startsWith('CUST') ? '#/customers/'+a.ref : '#/users' }, a)));
  return rows.map((a,k)=>({a,k})).sort((x,y)=>(tsValue(y.a.ts)-tsValue(x.a.ts)) || (y.k-x.k)).map(o=>o.a);
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
  if(STATE.auditUser) rows = rows.filter(a=>a.actor.startsWith(STATE.auditUser+' ('));
  const q = STATE.auditQuery.trim().toLowerCase();
  if(q) rows = rows.filter(a=>(a.actor+' '+a.action+' '+a.rec+' '+a.detail).toLowerCase().includes(q));
  const size = STATE.auditPageSize, pages = Math.max(1, Math.ceil(rows.length/size));
  STATE.auditPage = Math.min(Math.max(1, STATE.auditPage), pages);
  const page = rows.slice((STATE.auditPage-1)*size, STATE.auditPage*size);
  const presets = [['today','Today'],['7d','Last 7 days'],['30d','Last 30 days'],['month','This month'],['all','All time']].map(([k,l])=>'<button type="button" class="ds-datepicker__preset" aria-current="'+(STATE.auditPreset===k)+'" onclick="applyAuditPreset(\''+k+'\')">'+l+'</button>').join('');
  const label = STATE.auditStart && STATE.auditEnd ? fmtShortDate(STATE.auditStart)+' – '+fmtShortDate(STATE.auditEnd) : 'All time';
  const picker = '<div class="ds-datepicker ds-datepicker--right"'+(STATE.auditPickerOpen?' data-open':'')+'><button type="button" class="ds-datepicker__trigger" id="audit-range" onclick="STATE.auditPickerOpen=!STATE.auditPickerOpen; render()">'+icon('calendar')+esc(label)+'</button>'+
    '<div class="ds-datepicker__panel"><div class="ds-datepicker__body"><div class="ds-datepicker__presets">'+presets+'</div><div class="ds-datepicker__cal"><div class="ds-datepicker__calhead"><button type="button" class="ds-datepicker__navbtn" aria-label="Previous month" onclick="STATE.auditCalMonth=new Date(STATE.auditCalMonth.getFullYear(),STATE.auditCalMonth.getMonth()-1,1); render()">'+icon('chevron-right','ds-flip')+'</button><span>'+MONTH_NAMES[STATE.auditCalMonth.getMonth()]+' '+STATE.auditCalMonth.getFullYear()+'</span><button type="button" class="ds-datepicker__navbtn" aria-label="Next month" onclick="STATE.auditCalMonth=new Date(STATE.auditCalMonth.getFullYear(),STATE.auditCalMonth.getMonth()+1,1); render()">'+icon('chevron-right')+'</button></div>'+
    '<div class="ds-datepicker__grid">'+['S','M','T','W','T','F','S'].map(d=>'<span class="ds-datepicker__dow">'+d+'</span>').join('')+auditCalendar()+'</div></div></div>'+
    '<div class="ds-datepicker__footer"><button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" onclick="applyAuditPreset(\'all\')">Clear</button><button type="button" class="ds-btn ds-btn--primary ds-btn--sm" onclick="STATE.auditPickerOpen=false; render()">Done</button></div></div></div>';
  const body = page.length ? page.map(a=>'<tr><td data-label="When" class="ds-mono ds-small">'+esc(a.ts)+'</td><td data-label="Who">'+esc(a.actor)+'</td><td data-label="What"><span class="ds-row ds-row--tight"><span class="ds-activity__icon">'+icon(HISTORY_ICON[a.action]||'clock')+'</span>'+esc(a.action)+'</span></td>'+
    '<td data-label="Record"><a class="ds-mono ds-cell-primary" href="'+a.href+'">'+esc(a.rec)+'</a></td><td data-label="Detail" style="white-space:normal;min-width:260px">'+esc(a.detail)+'</td></tr>').join('')
    : '<tr><td colspan="5">'+emptyState('calendar','No events','Everything people do in this session (inquiries, jobs, money, users, settings) is logged here.')+'</td></tr>';
  return '<div class="ds-page-head"><div><h1>Audit log</h1><p class="ds-page-head__sub"><span id="audit-count">'+plural(rows.length,'event')+'</span>. Who did what, on which record, when. Nothing here can be edited.</p></div>'+picker+'</div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-row" style="flex-wrap:wrap"><div class="ds-search" style="max-width:380px;flex:1">'+icon('search')+'<input class="ds-input" id="audit-search" placeholder="Action, record or detail" value="'+esc(STATE.auditQuery)+'" oninput="STATE.auditQuery=this.value; STATE.auditPage=1; render()"></div>'+
      '<div style="width:220px">'+selectWrap('<select class="ds-select" id="audit-user" aria-label="Person" onchange="STATE.auditUser=this.value; STATE.auditPage=1; render()"><option value="">Everyone</option>'+options(USERS.map(u=>u.name), STATE.auditUser)+'</select>')+'</div></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="audit-table"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Record</th><th>Detail</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
    '<div class="ds-pager"><span>Page '+STATE.auditPage+' of '+pages+'</span><span class="ds-row ds-row--tight"><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" '+(STATE.auditPage<=1?'disabled':'')+' onclick="STATE.auditPage--; render()">Previous</button><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" '+(STATE.auditPage>=pages?'disabled':'')+' onclick="STATE.auditPage++; render()">Next</button></span></div></section>';
}

/* ============================== CLIENT TRACKING (public, no login) ==============================
   Opened only with the job's random tracking code, never a guessable job number. Shows the
   service tracks in plain words; never money, staff, documents or internal issue details. */
function findByCode(code){ const c = String(code||'').trim().toUpperCase(); return c ? JOBS.find(j=>j.trackingCode===c) || null : null; }
function trackLookup(form){
  const q = String(new FormData(form).get('q')||'').trim(), j = findByCode(q);
  if(j){ STATE.trackError = ''; go('#/track/'+j.trackingCode); return; }
  STATE.trackError = q ? 'We could not find a shipment for “'+q+'”. Check the tracking code from your Top1Movers coordinator.' : 'Enter your tracking code.';
  STATE.trackQuery = q; render();
}
function trackHero(inner, label){ return '<div class="ds-public__hero"><div class="ds-public__hero-inner"><div class="ds-public__brand"><img src="'+LOGO_SRC+'" alt="Top1Movers"><span>'+(label||'Shipment tracking')+'</span></div>'+inner+'</div><div class="ds-public__mark" aria-hidden="true">T1M</div></div>'; }
function renderTrackLookup(){
  const err = STATE.trackError;
  return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><p class="ds-label">Customer tracking</p><h1 class="ds-public__status">Where is your shipment?</h1><p class="ds-public__meta">Enter the tracking code your Top1Movers coordinator gave you. No account needed.</p></div>')+
    '<div class="ds-public__body"><div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><form class="ds-stack--sm" onsubmit="event.preventDefault(); trackLookup(this)">'+
      '<div class="ds-field"><label for="track-q">Tracking code</label><input class="ds-input ds-mono" id="track-q" name="q" value="'+esc(STATE.trackQuery)+'" placeholder="T1M-XXXX-XXXX" autocomplete="off"'+(err?' aria-invalid="true"':'')+'>'+(err?'<span class="ds-field__error" id="track-error">'+icon('alert')+'<span>'+esc(err)+'</span></span>':'')+'</div>'+
      '<button class="ds-btn ds-btn--primary" type="submit">'+icon('search')+'Track shipment</button></form>'+
      '<p class="ds-muted ds-xs">'+icon('info')+' Mockup: tracking codes exist only for jobs created in this browser session (see the job’s Key facts).</p></div></div>'+
      '<p class="ds-small" style="text-align:center"><a href="#/login">Top1Movers staff sign in</a></p></div></div>';
}
function renderTrackPage(code){
  if(!code) return renderTrackLookup();
  const j = findByCode(code);
  if(!j) return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><h1 class="ds-public__status">We could not find that shipment</h1></div>')+'<div class="ds-public__body"><div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><p>Check the tracking code and try again.</p><a class="ds-btn ds-btn--secondary" href="#/track">'+icon('search')+'Try another code</a></div></div></div></div>';
  const done = j.status==='Completed', held = !!openIssue(j), cur = currentMs(j);
  const tracks = jobTracks(j);
  const items = tracks.map(t=>{
    const all = t.ms.every(m=>m.done), here = !done && cur && t.ms.includes(cur);
    const state = all || done ? 'done' : here ? (held?'attention':'current') : 'todo';
    const last = t.ms.filter(m=>m.done).slice(-1)[0];
    const text = state==='done' ? 'Completed'+(last?' · '+last.date:'') : state==='attention' ? 'Pending. Our team is working on it.' : state==='current' ? 'Now: '+cur.name+(last?' (last update '+shortDate(last.date)+')':'') : '';
    return '<li class="ds-timeline__item" data-state="'+state+'"><span class="ds-timeline__dot">'+icon(state==='done'?'check':state==='attention'?'alert':SERVICES[t.svc].icon)+'</span><div><div class="ds-timeline__title">'+esc(t.phase)+'</div>'+(text?'<div class="ds-timeline__sub">'+esc(text)+'</div>':'')+'</div></li>';
  }).join('');
  const total = j.ms.length, got = j.ms.filter(m=>m.done).length, pct = done ? 100 : Math.max(6, Math.round(got/total*100));
  const headline = done ? 'Completed' : held ? 'Your shipment is delayed' : cur ? cur.phase : 'Finishing up';
  const kvv = (l,v)=>'<div><span class="ds-label">'+l+'</span><div>'+v+'</div></div>';
  const hero = trackHero('<div class="ds-public__headline"><p class="ds-label">Tracking <span class="ds-mono" style="color:var(--t1m-ink-inverse)">'+esc(j.trackingCode)+'</span></p><h1 class="ds-public__status" id="track-status">'+esc(headline)+'</h1>'+
    '<div class="ds-public__meta"><span>'+pill(done?'Completed':held?'Delayed':'On track', done?'success':held?'warning':'info', done?'check':held?'alert':'truck')+'</span><span>'+got+' of '+total+' steps done</span></div></div>'+
    (routeText(j.origin, j.destination) ? '<div class="ds-route" style="--p:'+pct+'%" aria-label="Progress '+pct+' percent"><div class="ds-route__stop"><small>From</small>'+esc(j.origin)+'</div><div class="ds-route__line"><span class="ds-route__fill"></span><span class="ds-route__marker">'+icon(done?'check':cur?SERVICES[cur.svc].icon:'flag')+'</span></div><div class="ds-route__stop ds-route__stop--end"><small>To</small>'+esc(j.destination)+'</div></div>' : ''));
  return '<div class="ds-public">'+hero+'<div class="ds-public__body">'+
    '<div class="ds-panel"><div class="ds-panel__head"><h2>Progress</h2></div><div class="ds-panel__body">'+(held?'<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Pending</strong>Our team is working on it and will contact you if anything is needed from you.</div></div>':'')+'<ol class="ds-timeline" aria-label="Shipment progress">'+items+'</ol></div></div>'+
    '<div class="ds-panel"><div class="ds-panel__head"><h2>Shipment details</h2></div><div class="ds-panel__body ds-grid-kv ds-kv">'+kvv('Cargo',esc(j.commodity))+kvv('Services',esc(servicesText(j.services)))+(j.refs.bl?kvv('BL / AWB','<span class="ds-mono">'+esc(j.refs.bl)+'</span>'):'')+(j.refs.containers?kvv('Container','<span class="ds-mono">'+esc(j.refs.containers)+'</span>'):'')+'</div></div>'+
    '<div class="ds-panel"><div class="ds-panel__body ds-row--between"><div><strong class="ds-strong">Questions about this shipment?</strong><p class="ds-muted ds-small">Contact your Top1Movers coordinator and quote '+esc(j.trackingCode)+'.</p></div><a class="ds-btn ds-btn--secondary" href="#/track">'+icon('search')+'Track another</a></div></div>'+
    '<p class="ds-muted ds-xs">'+icon('info')+' Updated by Top1Movers staff as the shipment moves.</p></div></div>';
}
