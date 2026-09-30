/* ============================== SMALL HELPERS ============================== */
function icon(name, cls){ return '<svg class="ds-icon'+(cls?' '+cls:'')+'" aria-hidden="true"><use href="#i-'+name+'"/></svg>'; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pill(text, tone, iconName, extra){ return '<span class="ds-pill ds-pill--'+(tone||'neutral')+(extra?' '+extra:'')+'">'+(iconName?icon(iconName):'')+esc(text)+'</span>'; }
function stagePill(j){
  const s = STATUS_STEPS[j.statusIndex];
  const sub = s===CUSTOMS_PHASE && j.customs ? ' · '+CUSTOMS_SUBSTAGES[j.customs.subIndex] : '';
  return '<span class="ds-pill ds-pill--stage">'+icon(STAGE_ICON[j.statusIndex])+esc(s+sub)+'</span>';
}
const STAGE_ICON = ['box','file','ship','anchor','shield','truck','check','receipt','check'];
function healthPill(j){ const h = jobHealth(j); return pill(h.label, h.tone, h.icon); }
function taskPill(j,t){ const s = taskStatus(j,t); return pill(s, TASK_TONE[s], TASK_ICON[s]); }
function selectWrap(selectHtml){ return '<div class="ds-select-wrap">'+selectHtml+icon('chevron-down')+'</div>'; }
function options(list, selected){ return list.map(o=>{ const v = typeof o==='string'?o:o.value, l = typeof o==='string'?o:o.label; return '<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(l)+'</option>'; }).join(''); }
function initials(name){ return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase(); }
const AVATAR_GRADIENT = {
  'Ana Cruz':['--t1m-navy-700','--t1m-navy-950'], 'Ben Santos':['--t1m-navy-600','--t1m-navy-800'], 'Cathy Lim':['--t1m-navy-800','--t1m-navy-950'],
  'Rico Domingo':['--t1m-navy-600','--t1m-navy-700'], 'Grace Tan':['--t1m-navy-950','--t1m-navy-700'], 'Paolo Reyes':['--t1m-navy-600','--t1m-navy-950'], 'Mark Villar':['--t1m-navy-800','--t1m-navy-600']
};
function avatarBg(name){ const g = AVATAR_GRADIENT[name] || ['--t1m-navy-700','--t1m-navy-950']; return 'linear-gradient(135deg,var('+g[0]+'),var('+g[1]+'))'; }
function avatar(name, sm){ return '<span class="ds-avatar'+(sm?' ds-avatar--sm':'')+'" style="background:'+avatarBg(name)+'" title="'+esc(name)+'">'+icon('user')+'</span>'; }
function kv(label, value){ return '<div><span class="ds-label">'+esc(label)+'</span><div>'+value+'</div></div>'; }
function plural(n, one, many){ return n+' '+(n===1?one:(many||one+'s')); }
function emptyState(ic, title, text, actionHtml){ return '<div class="ds-empty">'+icon(ic)+'<h3>'+esc(title)+'</h3>'+(text?'<p>'+esc(text)+'</p>':'')+(actionHtml||'')+'</div>'; }
function jobLink(id){ return '<a class="ds-mono ds-cell-primary" href="#/jobs/'+id+'" onclick="event.stopPropagation()">'+id+'</a>'; }

/* ============================== FILE UPLOAD WIDGET ==============================
   A drawer is generated once when it opens, so picking a file patches this widget in place
   instead of re-rendering (which would close the drawer mid-upload). */
const UPLOADS = {};
function uploadHtml(slotId, hint){
  const filename = UPLOADS[slotId];
  const hintAttr = hint ? ' data-hint="'+esc(hint)+'"' : '';
  if(filename) return '<div class="ds-upload" data-filled="true" data-upload-slot="'+slotId+'"'+hintAttr+'><div class="ds-upload__file">'+icon('file')+'<span>'+esc(filename)+'</span></div><button type="button" class="ds-upload__remove" onclick="clearUpload(\''+slotId+'\')" aria-label="Remove file">'+icon('x')+'</button></div>';
  return '<div class="ds-upload" data-upload-slot="'+slotId+'"'+hintAttr+' ondragover="event.preventDefault(); this.dataset.drag=\'true\'" ondragleave="delete this.dataset.drag" ondrop="event.preventDefault(); delete this.dataset.drag; pickFile(\''+slotId+'\', event.dataTransfer.files[0])">'+
    icon('upload')+'<span>Click to choose a file, or drag it here</span>'+(hint?'<p class="ds-upload__hint">'+esc(hint)+'</p>':'')+
    '<input type="file" onchange="pickFile(\''+slotId+'\', this.files[0])" aria-label="Choose file"></div>'+
    '<button type="button" class="ds-link ds-xs" style="margin-top:6px" onclick="pickFile(\''+slotId+'\', {name:\'sample-'+slotId.toLowerCase()+'.pdf\'})">'+icon('file')+'Use a sample file (demo)</button>';
}
function pickFile(slotId, f){ if(!f) return; UPLOADS[slotId] = f.name; const el = document.querySelector('.ds-upload[data-upload-slot="'+slotId+'"]'); if(el){ const hint = el.dataset.hint||''; const next = el.nextElementSibling; if(next && next.classList.contains('ds-link')) next.remove(); el.outerHTML = uploadHtml(slotId, hint); } }
function clearUpload(slotId){ delete UPLOADS[slotId]; const el = document.querySelector('.ds-upload[data-upload-slot="'+slotId+'"]'); if(el) el.outerHTML = uploadHtml(slotId, el.dataset.hint||''); }

/* Field errors name the problem and the fix, under the field, not in a toast that vanishes. */
function errorSlot(name){ return '<span class="ds-field__error" data-error-for="'+name+'" hidden>'+icon('alert')+'<span></span></span>'; }
function fieldError(form, name, msg){
  const el = form.querySelector('[data-error-for="'+name+'"]');
  const input = form.elements[name];
  if(input && input.setAttribute) input.setAttribute('aria-invalid', msg?'true':'false');
  if(el){ el.hidden = !msg; el.lastElementChild.textContent = msg||''; }
  return !!msg;
}
function formError(form, msg){
  let el = form.querySelector('.ds-form-error');
  if(!el){ el = document.createElement('div'); el.className = 'ds-alert ds-alert--danger ds-form-error ds-alert--enter'; form.prepend(el); }
  el.innerHTML = icon('alert')+'<div><strong>'+esc(msg.title)+'</strong>'+esc(msg.text||'')+'</div>';
  el.scrollIntoView({block:'nearest'});
}

/* ============================== OVERLAYS ============================== */
/* Drawer: record detail and quick edits slide in from the right (a bottom sheet on phones), so the
   page underneath keeps its place. The footer holds the actions and never scrolls away. */
function openDrawer(o){
  const el = document.getElementById('drawerRoot');
  el.innerHTML = '<div class="ds-drawer-backdrop" onclick="closeDrawer()"></div>'+
    '<aside class="ds-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">'+
      '<div class="ds-drawer__head"><div><h3 id="drawer-title">'+esc(o.title)+'</h3>'+(o.sub?'<p>'+o.sub+'</p>':'')+'</div>'+
      '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="closeDrawer()" aria-label="Close">'+icon('x')+'</button></div>'+
      '<div class="ds-drawer__body">'+o.body+'</div>'+
      (o.foot?'<div class="ds-drawer__foot">'+o.foot+'</div>':'')+
    '</aside>';
  el.classList.add('open');
  setTimeout(()=>{ const f = el.querySelector('.ds-drawer__body input:not([type=hidden]):not([type=file]):not([readonly]),.ds-drawer__body textarea, .ds-drawer__body select'); if(f && window.innerWidth>640) f.focus(); }, 50);
}
function closeDrawer(){ const el=document.getElementById('drawerRoot'); el.classList.remove('open'); el.innerHTML=''; for(const k in UPLOADS) delete UPLOADS[k]; }
function drawerFoot(primaryLabel, formId, opts){
  opts = opts||{};
  return '<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button>'+
    (opts.extra||'')+
    '<button type="submit" form="'+formId+'" class="ds-btn ds-btn--'+(opts.danger?'danger':'primary')+'">'+(opts.icon?icon(opts.icon):'')+esc(primaryLabel)+'</button>';
}

function showToast(message, tone, iconName){
  const root = document.getElementById('toastRoot');
  const el = document.createElement('div');
  el.className = 'ds-toast'+(tone?' ds-toast--'+tone:'');
  el.setAttribute('role','status');
  el.innerHTML = icon(iconName||(tone==='success'?'check':tone==='danger'?'alert':'info'))+'<span>'+esc(message)+'</span>';
  root.appendChild(el);
  setTimeout(()=>{ el.classList.add('ds-toast--leaving'); setTimeout(()=>el.remove(), 200); }, 3200);
}

function showPopover(btn, itemsHtml){
  closePopover();
  const r = btn.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'ds-popover'; pop.id = 'popover';
  pop.innerHTML = itemsHtml;
  document.body.appendChild(pop);
  const w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))+'px';
  pop.style.top = (r.bottom + 6 + h > window.innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6)+'px';
  setTimeout(()=>document.addEventListener('click', closePopover, {once:true}), 0);
}
function closePopover(){ const p=document.getElementById('popover'); if(p) p.remove(); }

/* Command palette (Ctrl/Cmd+K): jump straight to any job, customer or inquiry by ID, container,
   BL or name. At hundreds of thousands of rows, search beats clicking through lists. */
let CMDK_ACTIVE = 0, CMDK_ITEMS = [];
function cmdkIndex(){
  const items = [];
  JOBS.filter(canSeeJob).forEach(j=> items.push({ icon:'box', title:j.id, sub:custById(j.customerId).name+' · '+STATUS_STEPS[j.statusIndex]+' · '+j.containerNo+' · '+j.blNo, go:'#/jobs/'+j.id }));
  if(can('Inquiry & Quotation')) INQUIRIES.forEach(i=> items.push({ icon:'quote', title:i.id, sub:custById(i.customerId).name+' · '+i.cargo+' · '+inquiryStage(i).label, go:'#/inquiries/'+i.id }));
  if(can('Customer Mgmt')) CUSTOMERS.forEach(c=> items.push({ icon:'building', title:c.name, sub:'Customer · '+c.city, go:'#/customers/'+c.id }));
  return items;
}
function openCmdk(){
  if(!CURRENT_USER) return;
  const root = document.getElementById('cmdkRoot');
  root.innerHTML = '<div class="ds-cmdk" role="dialog" aria-label="Search">'+
    '<div class="ds-cmdk__input-row">'+icon('search')+'<input class="ds-cmdk__input" id="cmdk-input" placeholder="Job, container, BL, customer or inquiry…" autocomplete="off"></div>'+
    '<div class="ds-cmdk__list" id="cmdk-list" role="listbox"></div>'+
    '<div class="ds-cmdk__hint"><span>↑ ↓ to move · Enter to open</span><span>Esc to close</span></div></div>';
  root.classList.add('open');
  const input = document.getElementById('cmdk-input');
  input.addEventListener('input', ()=>renderCmdkList(input.value));
  input.addEventListener('keydown', e=>{
    if(e.key==='Escape') closeCmdk();
    else if(e.key==='ArrowDown'){ e.preventDefault(); CMDK_ACTIVE = Math.min(CMDK_ACTIVE+1, CMDK_ITEMS.length-1); markCmdk(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); CMDK_ACTIVE = Math.max(CMDK_ACTIVE-1, 0); markCmdk(); }
    else if(e.key==='Enter'){ e.preventDefault(); const it = CMDK_ITEMS[CMDK_ACTIVE]; if(it){ closeCmdk(); go(it.go); } }
  });
  renderCmdkList('');
  setTimeout(()=>input.focus(), 0);
}
function renderCmdkList(q){
  q = q.trim().toLowerCase().replace(/\s+/g,' ');
  const all = cmdkIndex();
  CMDK_ITEMS = q ? all.filter(i=>(i.title+' '+i.sub).toLowerCase().includes(q)).slice(0,20) : all.slice(0,8);
  CMDK_ACTIVE = 0;
  document.getElementById('cmdk-list').innerHTML = CMDK_ITEMS.length ? CMDK_ITEMS.map((i,idx)=>
    '<div class="ds-cmdk__item" role="option" data-active="'+(idx===0)+'" onmousemove="CMDK_ACTIVE='+idx+'; markCmdk()" onclick="closeCmdk(); go(\''+i.go+'\')">'+icon(i.icon)+
    '<span class="ds-cmdk__item-main"><span class="ds-cmdk__item-title">'+esc(i.title)+'</span><span class="ds-cmdk__item-sub">'+esc(i.sub)+'</span></span></div>').join('')
    : '<div class="ds-cmdk__empty">Nothing matches “'+esc(q)+'”. Try a job number like SJ-2026-00120 or a container number.</div>';
}
function markCmdk(){ document.querySelectorAll('.ds-cmdk__item').forEach((el,i)=>el.setAttribute('data-active', String(i===CMDK_ACTIVE))); const a = document.querySelectorAll('.ds-cmdk__item')[CMDK_ACTIVE]; if(a) a.scrollIntoView({block:'nearest'}); }
function closeCmdk(){ const r=document.getElementById('cmdkRoot'); r.classList.remove('open'); r.innerHTML=''; }
window.addEventListener('keydown', e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); document.getElementById('cmdkRoot').classList.contains('open') ? closeCmdk() : openCmdk(); }
  else if(e.key==='Escape'){ closeDrawer(); closePopover(); closeAvatarMenu(); }
  else if(e.key==='/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'') && CURRENT_USER){ e.preventDefault(); openCmdk(); }
});

/* ============================== ROUTER ==============================
   Hash routes: #/home, #/jobs, #/jobs/ID/TAB, #/inquiries, #/inquiries/ID, #/customers, #/customers/ID,
   #/reports, #/users, #/audit, #/track, #/track/ID, #/login. The whole page re-renders from state,
   keeping focus and scroll when the route itself did not change. */
const STATE = { jobFilter:'all', jobStage:null, jobQuery:'', inqFilter:'open', customerQuery:'', queueFilter:'all', auditQuery:'',
  auditPreset:'all', auditStart:null, auditEnd:null, auditCalMonth:new Date(TODAY.getFullYear(),TODAY.getMonth(),1), auditPickerOpen:false, auditPickStart:null, auditPage:1, auditPageSize:25,
  showUpcoming:false, justAdvanced:null, justNext:null, trackError:'', trackQuery:'' };
function go(hash){ if(location.hash===hash) render(); else location.hash = hash; }
function goTab(jobId, tab){ go('#/jobs/'+jobId+'/'+tab); setTimeout(()=>{ const t = document.getElementById('job-tabs'); if(t) t.scrollIntoView({behavior:'smooth', block:'start'}); }, 30); }
window.addEventListener('hashchange', ()=>render());
/* Crossing the phone breakpoint changes nav labels and layout, so redraw once when it happens. */
window.matchMedia('(max-width: 640px)').addEventListener('change', ()=>{ if(CURRENT_USER) render(); });
window.addEventListener('DOMContentLoaded', ()=>{ if(!location.hash) location.hash='#/login'; render(); });

let LAST_HASH = null;
function render(){
  const hash = (location.hash||'#/login').replace(/^#\//,'');
  let parts = hash.split('/').filter(Boolean);
  const root = document.getElementById('app');
  closeDrawer(); closePopover(); closeAvatarMenu();
  const sameRoute = hash === LAST_HASH;
  const newSection = !LAST_HASH || LAST_HASH.split('/')[0] !== (parts[0]||'');
  LAST_HASH = hash;
  const active = document.activeElement;
  const focusId = active && active.id ? active.id : null;
  const selStart = focusId && typeof active.selectionStart==='number' ? active.selectionStart : null;
  const scrollY = window.scrollY;

  if(parts[0]==='track') root.innerHTML = renderTrackPage(parts[1]);
  else if(parts[0]==='login' || !parts.length) root.innerHTML = renderLogin();
  else if(!CURRENT_USER){ location.hash = '#/login'; return; }
  else {
    if(['dashboard','field'].includes(parts[0])) parts = ['home'];
    if(parts[0]==='quotations'){ const q = QUOTATIONS[parts[1]]; parts = q ? ['inquiries', q.inquiryId] : ['inquiries']; }
    root.innerHTML = renderShell(parts);
  }
  if(newSection){ root.classList.remove('ds-motion-in'); void root.offsetWidth; root.classList.add('ds-motion-in'); }
  if(focusId){ const el = document.getElementById(focusId); if(el && el.focus){ el.focus({preventScroll:true}); if(selStart!=null && el.setSelectionRange) try{ el.setSelectionRange(selStart, selStart); }catch(e){} } }
  window.scrollTo(0, sameRoute ? scrollY : 0);
  const cur = document.querySelector('#journey [data-state="current"], #journey [data-state="blocked"]');
  if(cur){ const tr = cur.parentElement; tr.scrollLeft = cur.offsetLeft - tr.clientWidth/2 + cur.clientWidth/2; }
  STATE.justAdvanced = null; STATE.justNext = null;
}
