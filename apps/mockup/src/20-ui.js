/* ============================== SMALL HELPERS ============================== */
function icon(name, cls){ return '<svg class="ds-icon'+(cls?' '+cls:'')+'" aria-hidden="true"><use href="#i-'+name+'"/></svg>'; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pill(text, tone, iconName, extra){ return '<span class="ds-pill ds-pill--'+(tone||'neutral')+(extra?' '+extra:'')+'">'+(iconName?icon(iconName):'')+esc(text)+'</span>'; }
function stagePill(j){ return '<span class="ds-pill ds-pill--stage">'+icon(j.status==='Completed'?'check':(currentMs(j)?SERVICES[currentMs(j).svc].icon:'flag'))+esc(stageText(j))+'</span>'; }
function healthPill(j){ const h = jobHealth(j); return pill(h.label, h.tone, h.icon); }
function inqPill(i){ const s = inqStatus(i); return pill(s.label, s.tone, s.icon); }
function servicesText(list){ return SERVICE_ORDER.filter(s=>list.includes(s)).map(s=>SERVICES[s].short).join(' + '); }
function scopeText(x){ return x.scope==='International' ? 'International · '+x.direction : 'Domestic'; }
function selectWrap(selectHtml){ return '<div class="ds-select-wrap">'+selectHtml+icon('chevron-down')+'</div>'; }
function options(list, selected){ return list.map(o=>{ const v = typeof o==='string'?o:o.value, l = typeof o==='string'?o:o.label; return '<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(l)+'</option>'; }).join(''); }
const AVATAR_STOPS = [['--t1m-navy-700','--t1m-navy-950'],['--t1m-navy-600','--t1m-navy-800'],['--t1m-navy-800','--t1m-navy-950'],['--t1m-navy-600','--t1m-navy-700'],['--t1m-navy-950','--t1m-navy-700'],['--t1m-navy-600','--t1m-navy-950'],['--t1m-navy-800','--t1m-navy-600']];
function avatarBg(name){ let h = 0; for(const ch of String(name)) h = (h*31 + ch.charCodeAt(0))>>>0; const g = AVATAR_STOPS[h%AVATAR_STOPS.length]; return 'linear-gradient(135deg,var('+g[0]+'),var('+g[1]+'))'; }
function avatar(name, sm){ return '<span class="ds-avatar'+(sm?' ds-avatar--sm':'')+'" style="background:'+avatarBg(name)+'" title="'+esc(name)+'">'+icon('user')+'</span>'; }
function plural(n, one, many){ return n+' '+(n===1?one:(many||one+'s')); }
function emptyState(ic, title, text, actionHtml){ return '<div class="ds-empty">'+icon(ic)+'<h3>'+esc(title)+'</h3>'+(text?'<p>'+esc(text)+'</p>':'')+(actionHtml||'')+'</div>'; }
/* Check list of options (services, staff, roles). disabled: {value: reason}. */
function checkList(name, opts, checked, disabled, onchange){
  disabled = disabled||{};
  return '<div class="ds-stack--sm">'+opts.map(o=>{ const v = typeof o==='string'?o:o.value, l = typeof o==='string'?o:o.label, d = disabled[v];
    return '<div><label class="ds-check"'+(d?' title="'+esc(d)+'"':'')+'><input type="checkbox" name="'+name+'" value="'+esc(v)+'"'+((checked||[]).includes(v)&&!d?' checked':'')+(d?' disabled':'')+(onchange?' onchange="'+onchange+'"':'')+'> <span>'+esc(l)+(d?' <span class="ds-muted ds-xs">· '+esc(d)+'</span>':(o.sub?' <span class="ds-muted ds-xs">· '+esc(o.sub)+'</span>':''))+'</span></label></div>'; }).join('')+'</div>';
}
/* Multi-select dropdown (design-system .ds-dropdown listbox with aria-multiselectable): pick one or
   more people. Selected values are posted as hidden inputs named `name`, so FormData.getAll works. */
function multiDropdown(id, name, opts, selected, placeholder, placement){
  const sel = selected||[];
  return '<div class="ds-select-wrap ds-dropdown" id="'+id+'" data-name="'+esc(name)+'" data-placeholder-text="'+esc(placeholder)+'"'+(placement==='bottom'?'':' data-placement="top"')+'>'+
    '<button type="button" class="ds-select" role="combobox" aria-haspopup="listbox" aria-expanded="false" onclick="toggleMulti(\''+id+'\', event)"><span class="ds-dropdown__value"'+(sel.length?'':' data-placeholder')+'>'+esc(sel.length?sel.join(', '):placeholder)+'</span></button>'+icon('chevron-down')+
    '<ul class="ds-menu" role="listbox" aria-multiselectable="true">'+opts.map(o=>'<li class="ds-option" role="option" data-value="'+esc(o.value)+'" aria-selected="'+sel.includes(o.value)+'" onclick="pickMulti(\''+id+'\', this, event)"><span class="ds-option__text">'+esc(o.label)+(o.sub?'<span class="ds-option__sub">'+esc(o.sub)+'</span>':'')+'</span>'+icon('check')+'</li>').join('')+'</ul>'+
    '<span data-inputs>'+sel.map(v=>'<input type="hidden" name="'+esc(name)+'" value="'+esc(v)+'">').join('')+'</span></div>';
}
function toggleMulti(id, ev){
  ev.stopPropagation();
  const el = document.getElementById(id), open = !el.hasAttribute('data-open');
  document.querySelectorAll('.ds-dropdown[data-open]').forEach(d=>{ d.removeAttribute('data-open'); d.querySelector('[role=combobox]').setAttribute('aria-expanded','false'); });
  if(open){ el.setAttribute('data-open',''); el.querySelector('[role=combobox]').setAttribute('aria-expanded','true');
    const close = e=>{ if(!el.contains(e.target)){ el.removeAttribute('data-open'); el.querySelector('[role=combobox]').setAttribute('aria-expanded','false'); document.removeEventListener('click', close); } };
    setTimeout(()=>document.addEventListener('click', close), 0); }
}
function pickMulti(id, li, ev){
  ev.stopPropagation();
  li.setAttribute('aria-selected', String(li.getAttribute('aria-selected')!=='true'));
  const el = document.getElementById(id), vals = [...el.querySelectorAll('.ds-option[aria-selected="true"]')].map(o=>o.dataset.value);
  const v = el.querySelector('.ds-dropdown__value');
  v.textContent = vals.length ? vals.join(', ') : el.dataset.placeholderText;
  vals.length ? v.removeAttribute('data-placeholder') : v.setAttribute('data-placeholder','');
  el.querySelector('[data-inputs]').innerHTML = vals.map(x=>'<input type="hidden" name="'+esc(el.dataset.name)+'" value="'+esc(x)+'">').join('');
  clearFieldErrorIn(el);
}
function segControl(name, opts, value, onchange, block){ return '<fieldset class="ds-seg'+(block?' ds-seg--block':'')+'" aria-label="'+esc(name)+'">'+opts.map(o=>'<label><input type="radio" name="'+name+'" value="'+esc(o)+'"'+(o===value?' checked':'')+(onchange?' onchange="'+onchange+'"':'')+'>'+esc(o)+'</label>').join('')+'</fieldset>'; }
function reasonFields(list, label, selected){ return '<div class="ds-field"><label for="rs-type">'+esc(label||'Reason')+'</label>'+selectWrap('<select class="ds-select" id="rs-type" name="reasonType"><option value="">Select a reason</option>'+options(list, selected)+'</select>')+errorSlot('reasonType')+'</div>'+
  '<div class="ds-field"><label for="rs-comment">Comment</label><textarea class="ds-textarea" id="rs-comment" name="comment" style="min-height:72px" placeholder="Explain in a sentence or two"></textarea>'+errorSlot('comment')+'</div>'; }
function dateField(id, name, label, value, opt){ return '<div class="ds-field"><label for="'+id+'">'+esc(label)+(opt?' <span class="ds-opt">optional</span>':'')+'</label><input class="ds-input" type="date" id="'+id+'" name="'+name+'" value="'+dmyToISO(value||'')+'">'+errorSlot(name)+'</div>'; }
function moneyField(id, name, label, cur, value){ return '<div class="ds-field"><label for="'+id+'">'+esc(label)+'</label><div class="ds-input-group"><span class="ds-affix">'+(cur||'PHP')+'</span><input class="ds-input" id="'+id+'" name="'+name+'" type="number" step="0.01" min="0" placeholder="0.00"'+(value!=null?' value="'+value+'"':'')+'></div>'+errorSlot(name)+'</div>'; }
function fileRow(name, meta, extra){ return '<div class="ds-doc"><span class="ds-doc__icon">'+icon('file')+'</span><div><div class="ds-doc__name">'+esc(name)+'</div>'+(meta?'<div class="ds-doc__meta">'+esc(meta)+'</div>':'')+'</div>'+(extra||'<span></span>')+'<a class="ds-btn ds-btn--ghost ds-btn--sm" href="dummy.pdf" target="_blank" rel="noopener">'+icon('eye')+'View</a></div>'; }
function denied(msg){ showToast(msg||'Your role cannot do that.', 'danger', 'lock'); return true; }

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
function pickFile(slotId, f){ if(!f) return; UPLOADS[slotId] = f.name; const el = document.querySelector('.ds-upload[data-upload-slot="'+slotId+'"]'); if(el){ clearFieldErrorIn(el); const hint = el.dataset.hint||''; const next = el.nextElementSibling; if(next && next.classList.contains('ds-link')) next.remove(); el.outerHTML = uploadHtml(slotId, hint); } }
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
/* An error disappears as soon as the person changes the field it is about. */
function clearFieldError(e){
  const t = e.target, f = t && t.form; if(!f || !t.name) return;
  const slot = f.querySelector('[data-error-for="'+t.name+'"]');
  if(slot && !slot.hidden) fieldError(f, t.name, '');
}
document.addEventListener('input', clearFieldError); document.addEventListener('change', clearFieldError);
function clearFieldErrorIn(el){ const fld = el && el.closest('.ds-field'); if(fld) fld.querySelectorAll('.ds-field__error').forEach(x=>{ x.hidden = true; }); }

/* ============================== OVERLAYS ============================== */
/* Drawer: record detail and quick edits slide in from the right (a bottom sheet on phones), so the
   page underneath keeps its place. The footer holds the actions and never scrolls away. */
/* Adds a red * to the label of every form field that is not marked "optional". */
function markRequired(root){
  (root||document).querySelectorAll('form .ds-field > label, form .ds-field > .ds-field__label').forEach(l=>{
    if(l.querySelector('.ds-req') || l.closest('.ds-check')) return;
    const o = l.querySelector('.ds-opt'); if(o && /optional/i.test(o.textContent)) return;
    const star = '<span class="ds-req" aria-hidden="true">*</span>';
    if(o) o.insertAdjacentHTML('beforebegin', star); else l.insertAdjacentHTML('beforeend', star);
  });
}
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
  markRequired(el);
  setTimeout(()=>{ const f = el.querySelector('.ds-drawer__body input:not([type=hidden]):not([type=file]):not([readonly]),.ds-drawer__body textarea, .ds-drawer__body select'); if(f && window.innerWidth>640) f.focus(); }, 50);
}
/* Asks before a critical save. Validation runs first; the same call is repeated once the person confirms. */
let CONFIRM_OK = false;
function needConfirm(title, text, label, again, danger){
  if(CONFIRM_OK){ CONFIRM_OK = false; return false; }
  confirmAction(title, text, label, 'CONFIRM_OK = true; try { '+again+' } finally { CONFIRM_OK = false; }', danger);
  return true;
}
function confirmAction(title, text, label, js, danger, extraHtml){
  closeConfirm();
  const el = document.createElement('div'); el.id = 'confirmRoot'; el.className = 'ds-confirm-backdrop';
  el.innerHTML = '<div class="ds-confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><div class="ds-confirm__body"><h3 id="confirm-title">'+esc(title)+'</h3><p>'+esc(text)+'</p>'+(extraHtml?'<div style="margin-top:var(--t1m-space-4)">'+extraHtml+'</div>':'')+'</div>'+
    '<div class="ds-confirm__foot"><button type="button" class="ds-btn ds-btn--ghost" onclick="closeConfirm()">Cancel</button><button type="button" class="ds-btn ds-btn--'+(danger?'danger':'primary')+'" id="confirm-yes" onclick="'+(extraHtml?'':'closeConfirm(); ')+js+'">'+esc(label)+'</button></div></div>';
  document.body.appendChild(el);
  markRequired(el);
}
function closeConfirm(){ const el = document.getElementById('confirmRoot'); if(el) el.remove(); }
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

function openPopover(btn, itemsHtml){
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
  JOBS.filter(j=>canView('job.view', j)).forEach(j=> items.push({ icon:'box', title:j.id, sub:custById(j.customerId).name+' · '+stageText(j)+(j.refs.bl?' · '+j.refs.bl:'')+(j.refs.containers?' · '+j.refs.containers:''), go:'#/jobs/'+j.id }));
  INQUIRIES.filter(i=>canView('inquiry.view', i)).forEach(i=> items.push({ icon:'quote', title:i.id, sub:custById(i.customerId).name+' · '+servicesText(i.services)+' · '+inqStatus(i).label, go:'#/inquiries/'+i.id }));
  if(canView('customer.edit')) CUSTOMERS.forEach(c=> items.push({ icon:'building', title:c.name, sub:'Customer · '+c.address, go:'#/customers/'+c.id }));
  return items;
}
function openCmdk(){
  if(!CURRENT_USER) return;
  const root = document.getElementById('cmdkRoot');
  root.innerHTML = '<div class="ds-cmdk" role="dialog" aria-label="Search">'+
    '<div class="ds-cmdk__input-row">'+icon('search')+'<input class="ds-cmdk__input" id="cmdk-input" placeholder="Job, inquiry, customer, BL or container…" autocomplete="off"></div>'+
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
    : '<div class="ds-cmdk__empty">'+(q?'Nothing matches “'+esc(q)+'”.':'Nothing to search yet. Customers, inquiries and jobs you create appear here.')+'</div>';
}
function markCmdk(){ document.querySelectorAll('.ds-cmdk__item').forEach((el,i)=>el.setAttribute('data-active', String(i===CMDK_ACTIVE))); const a = document.querySelectorAll('.ds-cmdk__item')[CMDK_ACTIVE]; if(a) a.scrollIntoView({block:'nearest'}); }
function closeCmdk(){ const r=document.getElementById('cmdkRoot'); r.classList.remove('open'); r.innerHTML=''; }
window.addEventListener('keydown', e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); document.getElementById('cmdkRoot').classList.contains('open') ? closeCmdk() : openCmdk(); }
  else if(e.key==='Escape'){ closeDrawer(); closePopover(); closeAvatarMenu(); }
  else if(e.key==='Enter' && e.target && e.target.matches && e.target.matches('tr[data-href]')){ e.preventDefault(); e.target.click(); }
  else if(e.key==='/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'') && CURRENT_USER){ e.preventDefault(); openCmdk(); }
});

/* ============================== ROUTER ==============================
   Hash routes: #/home, #/mywork, #/jobs, #/jobs/ID/TAB, #/inquiries, #/inquiries/ID, #/customers, #/customers/ID,
   #/users, #/settings, #/audit, #/track, #/track/CODE, #/login. The whole page re-renders from state,
   keeping focus and scroll when the route itself did not change. */
const STATE = { jobFilter:'active', jobQuery:'', jobService:'', inqFilter:'open', inqQuery:'', inqService:'', inqScope:'', inqStaff:'', inqFrom:'', inqTo:'', customerQuery:'',
  auditQuery:'', auditUser:'', auditPreset:'all', auditStart:null, auditEnd:null, auditCalMonth:new Date(TODAY.getFullYear(),TODAY.getMonth(),1), auditPickerOpen:false, auditPickStart:null, auditPage:1, auditPageSize:25,
  dashTab:'sales', dashRange:'All time', dashService:'', dashScope:'', dashCustomer:'', dashStaff:'', justNext:null, trackError:'', trackQuery:'', userQuery:'', fundFilter:null, fundQuery:'' };
function go(hash){ if(location.hash===hash) render(); else location.hash = hash; }
function goTab(jobId, tab){ go('#/jobs/'+jobId+'/'+tab); setTimeout(()=>{ const t = document.getElementById('job-tabs'); if(t) t.scrollIntoView({behavior:'smooth', block:'start'}); }, 30); }
window.addEventListener('hashchange', ()=>render());
/* Crossing the phone breakpoint changes nav labels and layout, so redraw once when it happens. */
window.matchMedia('(max-width: 640px)').addEventListener('change', ()=>{ if(CURRENT_USER) render(); });
window.addEventListener('DOMContentLoaded', ()=>{ if(!location.hash) location.hash='#/login'; render(); });

/* Rows that open a record are reachable by keyboard; scrolling lists can be focused so the arrow keys work. */
function enhanceA11y(root){
  root.querySelectorAll('tr[data-href]').forEach(tr=>{ tr.tabIndex = 0; });
  root.querySelectorAll('.ds-table-wrap').forEach(e=>{ if(e.scrollWidth>e.clientWidth+1){ e.tabIndex = 0; e.setAttribute('role','region'); e.setAttribute('aria-label','Table, scrolls sideways'); } });
  root.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea').forEach(el=>{
    if(el.getAttribute('aria-label') || el.closest('label') || (el.id && root.querySelector('label[for="'+el.id+'"]'))) return;
    const t = el.getAttribute('placeholder') || el.name; if(t) el.setAttribute('aria-label', t); });
  root.querySelectorAll('.ds-scroll-list').forEach(e=>{ e.tabIndex = 0; e.setAttribute('role','region'); if(!e.getAttribute('aria-label')) e.setAttribute('aria-label','Scrollable list'); });
}
let LAST_HASH = null;
function render(){
  const hash = (location.hash||'#/login').replace(/^#\//,'');
  let parts = hash.split('/').filter(Boolean);
  const root = document.getElementById('app');
  closeDrawer(); closePopover(); closeAvatarMenu(); runEscalations();
  const sameRoute = hash === LAST_HASH;
  const newSection = !LAST_HASH || LAST_HASH.split('/')[0] !== (parts[0]||'');
  LAST_HASH = hash;
  const active = document.activeElement;
  const focusId = active && active.id ? active.id : null;
  const selStart = focusId && typeof active.selectionStart==='number' ? active.selectionStart : null;
  const scrollY = window.scrollY;

  if(parts[0]==='track') root.innerHTML = renderTrackPage(parts[1]);
  else if(parts[0]==='inquire') root.innerHTML = renderInquirePage(parts[1], parts[2]);
  else if(parts[0]==='quote') root.innerHTML = renderQuotePage(parts[1]);
  else if(parts[0]==='login' || !parts.length) root.innerHTML = renderLogin();
  else if(!CURRENT_USER){ location.hash = '#/login'; return; }
  else root.innerHTML = renderShell(parts);
  if(newSection){ root.classList.remove('ds-motion-in'); void root.offsetWidth; root.classList.add('ds-motion-in'); }
  if(focusId){ const el = document.getElementById(focusId); if(el && el.focus){ el.focus({preventScroll:true}); if(selStart!=null && el.setSelectionRange) try{ el.setSelectionRange(selStart, selStart); }catch(e){} } }
  window.scrollTo(0, sameRoute ? scrollY : 0);
  document.querySelectorAll('.ds-track [data-state="current"], .ds-track [data-state="blocked"]').forEach(cur=>{ const tr = cur.parentElement; tr.scrollLeft = cur.offsetLeft - tr.clientWidth/2 + cur.clientWidth/2; });
  markRequired(root); enhanceA11y(root);
  STATE.justNext = null;
}
