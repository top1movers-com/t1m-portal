/* ============================== INQUIRIES & QUOTES (Stage 1) ==============================
   Manager-led: the Manager creates the customer and the inquiry, picks scope + services and assigns
   staff. Sales prepares the quote in their own format and UPLOADS it (no quote builder) with amount,
   currency and validity. Manager approves or returns it; Sales sends it and records the client's
   answer. Every version that did not go through keeps its reason in one version history. */
const INQ_FILTERS = [
  ['open','Open', i=>OPEN_INQ.includes(inqStatus(i).key)],
  ['preparing','Preparing', i=>inqStatus(i).key==='preparing'],
  ['approval','For approval', i=>inqStatus(i).key==='approval'],
  ['revise','Revision needed', i=>['revise','expired'].includes(inqStatus(i).key)],
  ['ready','Ready to send', i=>inqStatus(i).key==='ready'],
  ['awaiting','Awaiting client', i=>inqStatus(i).key==='awaiting'],
  ['accepted','Accepted / won', i=>['accepted','won'].includes(inqStatus(i).key)],
  ['converted','Converted', i=>inqStatus(i).key==='converted'],
  ['lost','Lost', i=>inqStatus(i).key==='lost'],
  ['all','All', ()=>true]
];
function scopeKey(x){ return x.scope==='Domestic' ? 'Domestic' : 'International '+x.direction; }
function awaitingBadge(i){
  const d = awaitingDays(i);
  if(d==null) return '';
  return ' '+pill('Awaiting client · '+plural(d,'day'), d>=SETTINGS.awaitingClientDays?'warning':'neutral', 'clock', 'ds-pill--sm');
}
function renderInquiries(){
  const base = INQUIRIES.filter(i=>canView('inquiry.view', i));
  const f = INQ_FILTERS.find(x=>x[0]===STATE.inqFilter) || INQ_FILTERS[0];
  const q = STATE.inqQuery.trim().toLowerCase();
  const from = parseDMY(isoToDMY(STATE.inqFrom)), to = parseDMY(isoToDMY(STATE.inqTo));
  const rows = base.filter(i=>f[2](i) &&
    (!q || (i.id+' '+custById(i.customerId).name+' '+reqWhat(i)).toLowerCase().includes(q)) &&
    (!STATE.inqService || i.services.includes(STATE.inqService)) &&
    (!STATE.inqScope || scopeKey(i)===STATE.inqScope) &&
    (!STATE.inqStaff || i.staff.includes(STATE.inqStaff)) &&
    (!from || parseDMY(i.createdOn)>=from) && (!to || parseDMY(i.createdOn)<=to)).slice().reverse();
  const chip = ([k,l,fn])=>'<button class="ds-chip" aria-pressed="'+(STATE.inqFilter===k)+'" onclick="STATE.inqFilter=\''+k+'\'; render()">'+l+'<span class="ds-chip__count">'+base.filter(fn).length+'</span></button>';
  const sel = (id, label, key, opts)=>'<div style="width:200px">'+selectWrap('<select class="ds-select" id="'+id+'" aria-label="'+label+'" onchange="STATE.'+key+'=this.value; render()"><option value="">'+label+'</option>'+options(opts, STATE[key])+'</select>')+'</div>';
  const staff = USERS.filter(u=>u.roles.includes('Sales') || u.roles.includes('Manager')).map(u=>u.name);
  const body = rows.map(i=>{
    const c = custById(i.customerId), v = latestV(i);
    return '<tr data-href onclick="go(\'#/inquiries/'+i.id+'\')"><td data-label="Inquiry"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+i.id+'</span><span class="ds-cell-sub">'+esc(i.createdOn)+' · '+esc(i.channel)+'</span></span></td>'+
      '<td data-label="Client"><span class="ds-cell-name">'+esc(c.name)+'<span class="ds-cell-sub">'+esc(reqWhat(i))+'</span></span></td>'+
      '<td data-label="Services" style="white-space:normal">'+esc(servicesText(i.services))+'<div class="ds-muted ds-xs">'+esc(scopeText(i))+'</div></td>'+
      '<td data-label="Assigned" style="white-space:normal">'+esc(i.staff.join(', '))+'</td>'+
      '<td data-label="Version">'+(v?'v'+v.v:'<span class="ds-muted3">—</span>')+'</td>'+
      '<td data-label="Amount" class="ds-num">'+(v?amountText(v):'<span class="ds-muted3">—</span>')+'</td>'+
      '<td data-label="Status">'+inqPill(i)+awaitingBadge(i)+'</td></tr>';
  }).join('');
  const anyFilter = q || STATE.inqService || STATE.inqScope || STATE.inqStaff || STATE.inqFrom || STATE.inqTo;
  return '<div class="ds-page-head"><div><h1>Inquiries &amp; quotes</h1><p class="ds-page-head__sub">Every client request, its quotation versions and the outcome. Filter to compare previous quotes.</p></div>'+
    '<div class="ds-page-head__actions">'+(can('inquiry.create')?'<button class="ds-btn ds-btn--primary" id="new-inquiry" onclick="openNewInquiry()">'+icon('plus')+'New inquiry</button>':'<button class="ds-btn ds-btn--secondary" onclick="openReportInquiry()">'+icon('flag')+'Report an inquiry to the manager</button>')+'</div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-stack--sm">'+
      '<div class="ds-chips ds-chips--scroll">'+INQ_FILTERS.map(chip).join('')+'</div>'+
      '<div class="ds-row" style="flex-wrap:wrap"><div class="ds-search" style="flex:1;min-width:220px;max-width:340px">'+icon('search')+'<input class="ds-input" id="inq-search" placeholder="Client name or inquiry no." value="'+esc(STATE.inqQuery)+'" oninput="STATE.inqQuery=this.value; render()"></div>'+
        sel('inq-svc','All services','inqService', SERVICE_ORDER.map(k=>({value:k,label:SERVICES[k].label})))+
        sel('inq-scope','All scopes','inqScope', ['Domestic','International Import','International Export'])+
        sel('inq-staff','All staff','inqStaff', staff)+
        '<label class="ds-small ds-muted" for="inq-from">From</label><input class="ds-input" style="width:160px" type="date" id="inq-from" value="'+esc(STATE.inqFrom)+'" onchange="STATE.inqFrom=this.value; render()">'+
        '<label class="ds-small ds-muted" for="inq-to">To</label><input class="ds-input" style="width:160px" type="date" id="inq-to" value="'+esc(STATE.inqTo)+'" onchange="STATE.inqTo=this.value; render()">'+
        (anyFilter?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="STATE.inqQuery=STATE.inqService=STATE.inqScope=STATE.inqStaff=STATE.inqFrom=STATE.inqTo=\'\'; render()">'+icon('x')+'Clear</button>':'')+
        '<span class="ds-muted ds-small" style="margin-left:auto">'+plural(rows.length,'inquiry','inquiries')+'</span></div></div>'+
      '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="inq-table"><thead><tr><th>Inquiry</th><th>Client</th><th>Services</th><th>Assigned</th><th>Version</th><th class="ds-num">Amount</th><th>Status</th></tr></thead><tbody>'+
      (body || '<tr><td colspan="7">'+(base.length ? emptyState('search','Nothing matches','Clear the filters or pick another group.') : emptyState('quote','No inquiries yet', can('inquiry.create') ? 'Create the first one with New inquiry. You will need a customer first.' : 'A Manager creates inquiries and assigns staff. Tell them about a new request with “Report an inquiry to the manager”.'))+'</td></tr>')+
      '</tbody></table></div></section>';
}

/* ---------- Inquiry page ---------- */
function inqGate(i){
  const v = latestV(i), live = v && !['Returned','Renegotiated','Rejected','Expired'].includes(v.status) && !sentExpired(v);
  const st = s=>live && s.includes(v.status);
  return [
    { label:'Staff assigned', sub:i.staff.join(', '), met:true },
    { label:'Quotation uploaded', sub: live ? 'v'+v.v+' · '+amountText(v)+' · valid until '+v.validUntil : (v ? 'v'+(v.v+1)+' needed' : 'v1 needed'), met:!!live },
    { label:'Approved by a manager', sub: live && v.review && v.review.decision==='Approved' ? v.review.by+(v.review.self?' (self-approved)':'')+' · '+v.review.on : null, met:st(['Approved','Sent','Accepted']) },
    { label:'Sent to the client', sub: live && v.sent ? (v.sent.auto ? 'Emailed automatically · '+v.sent.on : v.sent.on+' via '+v.sent.channel) : null, met:st(['Sent','Accepted']) },
    { label:'Client response', sub: live && v.outcome && v.outcome.type==='Accepted' ? 'Accepted · '+v.outcome.on : (live && v.status==='Sent' ? 'Waiting for response' : null), met:st(['Accepted']),
      act: live && ['Approved','Sent'].includes(v.status) ? act('View page',"go('#/quote/"+i.id+"')",'eye') : null },
    { label:'Manager acknowledged', sub: i.closed==='won' ? i.closedBy+' · '+i.closedOn : null, met:i.closed==='won' }
  ];
}
function waitingOn(names, role){ return 'Waiting on '+(names.length ? names.join(', ')+' ('+role+')' : 'a '+role)+'.'; }
function inqNext(i){
  const s = inqStatus(i), v = latestV(i), id = i.id, mgrs = usersWithRole('Manager').map(u=>u.name);
  const gate = inqGate(i);
  const base = { items:gate, gateTitle:'Quotation round'+(v?' (v'+(['revise','expired'].includes(s.key)?v.v+1:v.v)+')':' (v1)') };
  if(s.key==='converted') return { tone:'done', icon:'check', eyebrow:'Done', title:'Converted to '+i.jobId, text:'Operations runs it from the job page. This inquiry and its versions stay on record.', items:[], primary:act('Open '+i.jobId,"go('#/jobs/"+i.jobId+"')",'arrow-right') };
  if(s.key==='lost') return { tone:'done', icon:'x', eyebrow:'Closed · lost', title:i.lostReason.type, text:i.lostReason.comment+' Closed by '+i.closedBy+' on '+i.closedOn+'.', items:[] };
  if(s.key==='preparing' || s.key==='revise' || s.key==='expired'){
    const n = v ? v.v+1 : 1, mine = can('quote.submit', i);
    const why = !v ? 'Get the carrier rates, prepare the quotation in your usual format, then upload it here for the manager to check.'
      : s.key==='expired' ? 'v'+v.v+' passed its validity date ('+v.validUntil+') without an answer. Prepare a new version, or the manager can close the inquiry as lost.'
      : REVISE_LABEL[v.status]+': '+((v.review&&v.review.decision==='Returned')?v.review.reasonType+'. '+v.review.comment:(v.outcome?v.outcome.reasonType+'. '+v.outcome.comment:''));
    return Object.assign(base, { tone: mine?'ready':'waiting', icon: s.key==='preparing'?'upload':'refresh', eyebrow: s.key==='preparing'?'Next step':'Revision needed',
      title: 'Upload quotation v'+n, text: s.key==='revise' ? '' : why,
      bodyHtml: s.key==='revise' ? '<div class="ds-alert ds-alert--warning" id="revise-reason">'+icon('alert')+'<div><strong>'+esc(REVISE_LABEL[v.status])+': '+esc((v.review&&v.review.decision==='Returned')?v.review.reasonType:(v.outcome?v.outcome.reasonType:''))+'</strong>'+esc((v.review&&v.review.decision==='Returned')?v.review.comment:(v.outcome?v.outcome.comment:''))+'</div></div>' : '',
      primary: mine ? act('Upload quotation v'+n, s.key==='expired' ? "openUploadQuote('"+id+"',true)" : "openUploadQuote('"+id+"')", 'upload') : null,
      secondary: (s.key!=='preparing' && can('inquiry.close')) ? act('Close as lost',"openCloseLost('"+id+"')",'x') : null,
      who: mine ? null : waitingOn(i.staff,'Sales') });
  }
  if(s.key==='approval'){
    const mine = can('quote.approve');
    return Object.assign(base, { tone: mine?'ready':'waiting', icon:'eye', eyebrow: mine?'Needs your approval':'Waiting on a manager', title:'Review quotation v'+v.v,
      text:v.by+' uploaded '+amountText(v)+', valid until '+v.validUntil+'. Approve it so Sales can send it, or return it with a reason.',
      primary: mine ? act('Review quotation v'+v.v,"openReviewQuote('"+id+"')",'eye') : null, who: mine ? null : waitingOn(mgrs,'Manager') });
  }
  if(s.key==='ready'){
    const mine = can('quote.send', i);
    return Object.assign(base, { tone: mine?'ready':'waiting', icon:'arrow-right', eyebrow:'Green light', title:'Send v'+v.v+' to the client',
      text:'Approved by '+v.review.by+(v.review.self?' (self-approved)':'')+'. Send it to the client, then mark it as sent.',
      primary: mine ? act('Mark as sent',"openMarkSent('"+id+"')",'arrow-right') : null, who: mine ? null : waitingOn(i.staff,'Sales') });
  }
  if(s.key==='awaiting'){
    const mine = can('quote.send', i), d = awaitingDays(i);
    return Object.assign(base, { tone:'waiting', icon:'clock', eyebrow:'Awaiting client response · '+plural(d,'day'), title:'Waiting for '+custById(i.customerId).contact.name+' to answer',
      text:'Sent '+v.sent.on+' via '+v.sent.channel+'. Valid until '+v.validUntil+' ('+plural(daysUntil(v.validUntil),'day')+' left). Follow up, then record the answer with proof.',
      primary: mine ? act('Record client response',"openClientOutcome('"+id+"')",'check') : null, who: mine ? null : waitingOn(i.staff,'Sales') });
  }
  if(s.key==='accepted'){
    const mine = can('inquiry.close');
    return Object.assign(base, { tone: mine?'ready':'waiting', icon:'check', eyebrow:'Client accepted', title:'Acknowledge and close the inquiry',
      text:v.outcome.on+': the client accepted v'+v.v+' ('+amountText(v)+'). Proof: '+v.outcome.proof+'. Closing it makes it ready to convert into a job.',
      primary: mine ? act('Acknowledge & close',"openAckAccept('"+id+"')",'check') : null, who: mine ? null : waitingOn(mgrs,'Manager') });
  }
  if(s.key==='won'){
    const mine = can('job.convert');
    return { tone: mine?'ready':'waiting', icon:'box', eyebrow:'Won', title:'Convert to job', text:'Everything carries over: customer, scope, services and the accepted quote. Pick the Operations staff who will run it.',
      items:[], primary: mine ? act('Convert to job',"openConvert('"+id+"')",'box') : null, who: mine ? null : waitingOn(mgrs,'Manager') };
  }
  return { tone:'waiting', icon:'clock', eyebrow:'', title:s.label, text:'', items:[] };
}
function nextPanelHtml(n, extraFoot){
  const enter = n.enter ? ' ds-next--enter' : '';
  return '<section class="ds-next ds-next--'+n.tone+enter+'" id="next-step" aria-live="polite"><div class="ds-next__head"><span class="ds-next__icon">'+icon(n.icon)+'</span><div><div class="ds-next__eyebrow">'+esc(n.eyebrow)+'</div><h2 class="ds-next__title">'+esc(n.title)+'</h2>'+(n.text?'<p class="ds-next__text">'+esc(n.text)+'</p>':'')+'</div></div>'+
    ((n.items&&n.items.length)||n.bodyHtml?'<div class="ds-next__body">'+(n.bodyHtml||'')+(n.items&&n.items.length?'<div><div class="ds-gate__title"><span>'+esc(n.gateTitle||'Checklist')+'</span><span>'+n.items.filter(x=>x.met).length+' of '+n.items.length+' done</span></div><ul class="ds-gate">'+n.items.map(gateItemHtml).join('')+'</ul></div>':'')+'</div>':'')+
    '<div class="ds-next__foot"><div class="ds-next__who">'+(n.who?icon('user')+esc(n.who):'')+'</div><div class="ds-next__actions">'+(extraFoot||'')+
      (n.secondary?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="'+n.secondary.js+'">'+icon(n.secondary.icon)+esc(n.secondary.label)+'</button>':'')+
      (n.primary?'<button class="ds-btn ds-btn--primary" id="next-primary" onclick="'+n.primary.js+'">'+icon(n.primary.icon)+esc(n.primary.label)+'</button>':'')+'</div></div></section>';
}
const V_TONE = { 'For approval':'warning', Returned:'danger', Approved:'brand', Sent:'info', Accepted:'success', Renegotiated:'warning', Rejected:'danger', Expired:'neutral' };
const V_ICON = { 'For approval':'clock', Returned:'refresh', Approved:'check', Sent:'arrow-right', Accepted:'check', Renegotiated:'refresh', Rejected:'x', Expired:'clock' };
function versionHistoryHtml(i){
  if(!i.versions.length) return '<div class="ds-panel__body ds-muted">No quotation uploaded yet.</div>';
  const rows = i.versions.slice().reverse().map(v=>{
    let reason = '';
    if(v.review && v.review.decision==='Returned') reason = '<strong class="ds-strong">Manager: '+esc(v.review.reasonType)+'</strong><div class="ds-small">'+esc(v.review.comment)+'</div><div class="ds-muted ds-xs">'+esc(v.review.by+' · '+v.review.on)+'</div>';
    else if(v.outcome) reason = '<strong class="ds-strong">'+(v.outcome.type==='Accepted'?'Client accepted':v.outcome.type==='Expired'?'Expired':'Client: '+esc(v.outcome.reasonType))+'</strong>'+(v.outcome.comment?'<div class="ds-small">'+esc(v.outcome.comment)+'</div>':'')+'<div class="ds-muted ds-xs">'+esc(v.outcome.on)+(v.outcome.proof?' · proof '+esc(v.outcome.proof):'')+'</div>';
    const approved = v.review && v.review.decision==='Approved' ? esc(v.review.by)+(v.review.self?' '+pill('Self-approved','neutral','user','ds-pill--sm'):'')+'<div class="ds-muted ds-xs">'+esc(v.review.on)+'</div>' : '<span class="ds-muted3">—</span>';
    const shown = sentExpired(v) ? 'Expired' : v.status;
    return '<tr><td data-label="Version"><strong class="ds-strong">v'+v.v+'</strong></td><td data-label="Uploaded">'+esc(v.by)+'<div class="ds-muted ds-xs">'+esc(v.on)+'</div></td>'+
      '<td data-label="File"><span class="ds-mono ds-xs">'+esc(v.file)+'</span></td><td data-label="Amount" class="ds-num">'+amountText(v)+'</td><td data-label="Valid until">'+esc(v.validUntil)+'</td>'+
      '<td data-label="Approved by">'+approved+'</td><td data-label="Status">'+pill(shown, V_TONE[shown], V_ICON[shown], 'ds-pill--sm')+(v.sent?'<div class="ds-muted ds-xs">sent '+esc(shortDate(v.sent.on))+' · '+esc(v.sent.channel)+(v.sent.proof?' · proof '+esc(v.sent.proof):'')+'</div>':'')+'</td>'+
      '<td data-label="Reason" style="white-space:normal;min-width:200px">'+(reason||'<span class="ds-muted3">—</span>')+'</td></tr>';
  }).join('');
  return '<div class="ds-table-wrap"><table class="ds-table ds-table--stack" id="version-history"><thead><tr><th>Ver.</th><th>Uploaded</th><th>File</th><th class="ds-num">Amount</th><th>Valid until</th><th>Approved by</th><th>Status</th><th>Reason / note</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="ds-panel__foot ds-muted ds-xs">Every version is kept with why it did not go through: manager returns, client renegotiation or rejection, and expiry.</div>';
}
function renderInquiry(id){
  const i = inqById(id);
  if(!i) return '<div class="ds-panel ds-panel--elevated">'+emptyState('search','Inquiry not found','Inquiries live only for this session. Refreshing the page clears them.','<a class="ds-btn ds-btn--secondary" href="#/inquiries">All inquiries</a>')+'</div>';
  if(!canView('inquiry.view', i)) return accessDenied('Inquiries', i.id+' is not linked to a job you are assigned to.');
  const c = custById(i.customerId), n = inqNext(i);
  if(STATE.justNext===i.id) n.enter = true;
  const f = (k,v)=>'<dt>'+esc(k)+'</dt><dd>'+v+'</dd>';
  const r = i.request;
  const docs = [].concat(r.attachment ? [{ name:r.attachment, meta:'Supporting document' }] : [], i.versions.map(v=>({ name:v.file, meta:'Quotation v'+v.v })));
  const editBtn = can('inquiry.create') && !i.jobId && !i.closed ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openEditInquiry(\''+i.id+'\')">'+icon('users')+'Edit / reassign</button>' : '';
  return '<nav class="ds-crumbs"><a href="#/inquiries">Inquiries &amp; quotes</a>'+icon('chevron-right')+'<span class="ds-mono">'+i.id+'</span></nav>'+
    '<header class="ds-jobhead"><div><h1>'+i.id+' '+inqPill(i)+awaitingBadge(i)+'</h1></div>'+
      '<div class="ds-jobhead__actions">'+editBtn+'</div></header>'+
    '<div class="ds-stack"><div class="ds-split"><div class="ds-stack">'+nextPanelHtml(n)+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('quote')+'Version history</h2><span class="ds-panel__hint">'+esc(quoteNo(i))+'</span></div>'+versionHistoryHtml(i)+'</section></div>'+
    '<div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('info')+'The request</h3></div><div class="ds-panel__body"><dl class="ds-facts">'+
        [['Customer', null],['Scope',scopeText(i)],['Services',servicesText(i.services)],['Cargo',r.commodity],['From',r.origin],['To',r.destination],[i.direction==='Export'?'Port of exit':'Port of entry',r.port],['Pickup address',r.pickupAddress],['Delivery address',r.deliveryAddress],
          ['Expected volume',r.volume],['Storage period',r.storagePeriod],['Vehicle',r.vehicle],['LTO transaction',r.ltoType],
          ['Notes',r.notes]].filter(x=>x[1]||x[0]==='Customer').map(x=>x[0]==='Customer' ? f('Customer', canView('customer.edit')?'<a class="ds-link" href="#/customers/'+c.id+'">'+esc(c.name)+'</a>':esc(c.name)) : f(x[0], esc(x[1]))).join('')+
        f('Created', esc(i.createdOn+' by '+i.createdBy))+'</dl></div></section>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('users')+'Assigned staff</h3></div><div class="ds-panel__body ds-stack--sm">'+i.staff.map(s=>'<div class="ds-row ds-row--tight">'+avatar(s,true)+esc(s)+'<span class="ds-muted ds-xs">'+esc(rolesText(userByName(s)))+'</span></div>').join('')+'</div></section>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('file')+'Supporting documents</h3></div><div class="ds-panel__body ds-stack--sm ds-scroll-list">'+(docs.length ? docs.map(d=>fileRow(d.name, d.meta)).join('') : '<p class="ds-muted ds-small">No documents yet.</p>')+'</div></section>'+
    '</div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('clock')+'Activity</h2></div><div class="ds-panel__body">'+historyList(i.log.slice().reverse())+'</div></section></div>';
}

/* ---------- New / edit inquiry (Manager) ---------- */
function inqServicesHtml(scope, direction, checked){
  /* Only the services that apply to this scope/direction are offered (e.g. no Importer Accreditation for exports). */
  return checkList('services', SERVICE_ORDER.filter(k=>serviceAllowed(k, scope, direction)).map(k=>({ value:k, label:SERVICES[k].label })), checked, null, 'refreshPlan()');
}
function refreshInqForm(){
  const form = document.getElementById('inq-form'); if(!form) return;
  const fd = new FormData(form), scope = fd.get('scope'), dir = scope==='International' ? fd.get('direction') : null;
  const dw = document.getElementById('inq-dir-wrap'); if(dw) dw.style.display = scope==='International' ? '' : 'none';
  const sv = document.getElementById('inq-services'); if(sv) sv.innerHTML = inqServicesHtml(scope, dir, fd.getAll('services'));
  refreshPlan();
}
/* Trucking legs (domestic freight + trucking only) and a live preview of the job plan. */
function refreshPlan(){
  const form = document.getElementById('inq-form'); if(!form) return;
  const fd = new FormData(form), editing = form.dataset.locked ? inqById(form.dataset.locked) : null;
  const scope = editing ? editing.scope : fd.get('scope'), dir = scope==='International' ? (editing ? editing.direction : fd.get('direction')) : null;
  const services = editing ? editing.services : fd.getAll('services');
  const lw = document.getElementById('inq-legs-wrap'); if(lw) lw.style.display = needsTruckLegs(services, scope) ? '' : 'none';
  const legs = fd.getAll('truckLegs');
  const vis = reqVisible(services, scope, dir, legs);
  form.querySelectorAll('[data-req]').forEach(el=>{ el.style.display = vis.has(el.dataset.req) ? '' : 'none'; });
  const pl = form.querySelector('[data-port-label]'); if(pl) pl.textContent = dir==='Export' ? 'Port of exit' : 'Port of entry';
  const pv = document.getElementById('inq-plan'); if(pv) pv.innerHTML = progressPreview(services, scope, dir, fd.get('cargoType'), legs);
}
function requestFieldsHtml(r){
  r = r || {};
  const wrap = (key, html)=>'<div data-req="'+key+'" style="display:none">'+html+'</div>';
  const inp = (id, name, label, ph)=>'<div class="ds-field"><label for="'+id+'">'+label+'</label><input class="ds-input" id="'+id+'" name="'+name+'" value="'+esc(r[name]||'')+'" placeholder="'+esc(ph)+'">'+errorSlot(name)+'</div>';
  const two = (x, y)=>'<div class="ds-grid-2" style="gap:var(--t1m-space-3)">'+x+y+'</div>';
  return wrap('route', two(inp('inq-origin','origin','From','e.g. Yokohama, JP'), inp('inq-dest','destination','To','e.g. Quezon City, PH')))+
    wrap('port', inp('inq-port','port','<span data-port-label>Port</span>','e.g. Manila International Container Port'))+
    wrap('pickup', inp('inq-pickup','pickupAddress','Pickup address','Where the truck collects the cargo'))+
    wrap('delivery', inp('inq-delivery','deliveryAddress','Delivery address','Where the truck delivers the cargo'))+
    wrap('lto', '<div class="ds-field"><label for="inq-lto">LTO transaction</label>'+selectWrap('<select class="ds-select" id="inq-lto" name="ltoType">'+options(LTO_TYPES, r.ltoType||'')+'</select>')+'</div>')+
    '<div class="ds-field"><label for="inq-notes">Notes <span class="ds-opt">optional</span></label><textarea class="ds-textarea" id="inq-notes" name="notes" style="min-height:64px">'+esc(r.notes||'')+'</textarea></div>';
}
function legsHtml(sel){ return '<div class="ds-field" id="inq-legs-wrap" style="display:none"><span class="ds-field__label">Trucking covers</span>'+checkList('truckLegs', [{ value:'pickup', label:'Pickup: shipper to the origin port' },{ value:'delivery', label:'Delivery: destination port to the consignee' }], sel||['pickup','delivery'], null, 'refreshPlan()')+errorSlot('truckLegs')+'</div>'; }
function planPreviewHtml(){ return '<div class="ds-field"><span class="ds-field__label">How the job will run</span><div id="inq-plan" class="ds-panel" style="padding:0 var(--t1m-space-3) var(--t1m-space-3)"></div><p class="ds-field__hint">Built from scope, direction and services. Hover a step to see what it means.</p></div>'; }
function staffSelect(sales, sel){ return selectWrap('<select class="ds-select" id="inq-staff" name="staff"><option value="">Select sales staff</option>'+options(sales.map(u=>({value:u.value,label:u.label})), sel||'')+'</select>'); }
function openNewInquiry(presetCustomer, intakeId){
  if(!can('inquiry.create')) return denied('Only a Manager creates inquiries. Use “Report an inquiry to the manager”.');
  if(!CUSTOMERS.length){
    openDrawer({ title:'New inquiry', body:'<div class="ds-alert ds-alert--info">'+icon('building')+'<div><strong>Add the customer first</strong>An inquiry belongs to a customer profile. There are none in this session yet.<div class="ds-alert__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="closeDrawer(); openNewCustomer(true)">'+icon('plus')+'New customer</button></div></div></div>' });
    return;
  }
  const intake = intakeId ? INTAKE.find(x=>x.id===intakeId) : null;
  const reports = INTAKE.filter(t=>t.status==='open');
  const firstCust = presetCustomer || CUSTOMERS[0].id;
  const linked = intake ? intake.id : (matchIntake(firstCust)||{}).id || '';
  const sales = USERS.filter(u=>u.active && u.roles.includes('Sales')).map(u=>({ value:u.name, label:u.name, sub:u.dept }));
  openDrawer({ title:'New inquiry', sub:'Pick the services; the progress map follows from them. Assign who prepares the quote.',
    body:'<form class="ds-stack--sm" id="inq-form" novalidate onsubmit="event.preventDefault(); saveInquiry(this, null)">'+
      (intake?'<div class="ds-alert ds-alert--info">'+icon('flag')+'<div><strong>Reported by '+esc(intake.by)+'</strong>'+esc(intake.client+': '+intake.note)+(intake.file?'<div class="ds-muted ds-xs">'+icon('file')+' '+esc(intake.file)+' (attached to the inquiry)</div>':'')+'</div></div>':'')+
      '<div class="ds-field"><label for="inq-cust">Customer</label>'+selectWrap('<select class="ds-select" id="inq-cust" name="customerId" onchange="suggestIntake(this.value)">'+options(CUSTOMERS.map(c=>({value:c.id,label:c.name})), presetCustomer||'')+'</select>')+
        '<button type="button" class="ds-link ds-xs" style="margin-top:6px" onclick="closeDrawer(); openNewCustomer(true)">'+icon('plus')+'Customer not listed? Add a new customer</button></div>'+
      (reports.length ? '<div class="ds-field"><label for="inq-intake">From a reported inquiry <span class="ds-opt">optional</span></label>'+selectWrap('<select class="ds-select" id="inq-intake" name="intakeId"><option value="">None, not reported by staff</option>'+options(reports.map(t=>({ value:t.id, label:t.client+' · '+t.by+' · '+t.on })), linked)+'</select>')+'</div>' : '')+
      '<div class="ds-field"><span class="ds-field__label">Scope</span>'+segControl('scope', SCOPES, 'International', 'refreshInqForm()')+'</div>'+
      '<div class="ds-field" id="inq-dir-wrap"><span class="ds-field__label">Direction</span>'+segControl('direction', DIRECTIONS, 'Import', 'refreshInqForm()')+'</div>'+
      '<div class="ds-field"><span class="ds-field__label">Services needed (any combination)</span><div id="inq-services">'+inqServicesHtml('International','Import',[])+'</div>'+errorSlot('services')+'</div>'+legsHtml()+
      '<div class="ds-label" style="margin-top:var(--t1m-space-4)">The request</div>'+
      requestFieldsHtml({ notes: intake?intake.note:'' })+
      '<div class="ds-label" style="margin-top:var(--t1m-space-4)">Assign staff</div>'+
      '<div class="ds-field"><label for="inq-staff">Who prepares and sends the quote</label>'+staffSelect(sales, intake&&userByName(intake.by)&&userByName(intake.by).roles.includes('Sales')?intake.by:'')+errorSlot('staff')+'</div>'+
    '</form>',
    foot: drawerFoot('Create inquiry','inq-form',{icon:'plus'}) });
  refreshPlan();
}
function readInquiryForm(form, editing){
  const fd = new FormData(form), v = k=>String(fd.get(k)||'').trim();
  const locked = editing && editing.versions.length;
  const scope = locked ? editing.scope : v('scope');
  const direction = scope==='International' ? (locked ? editing.direction : v('direction')) : null;
  const services = (locked ? editing.services : fd.getAll('services')).filter(s=>serviceAllowed(s, scope, direction));
  const legs = fd.getAll('truckLegs'), staff = fd.getAll('staff').filter(Boolean);
  const vis = reqVisible(services, scope, direction, legs);
  const need = (key, name, msg)=> vis.has(key) ? fieldError(form, name, v(name)?'':msg) : fieldError(form, name, '');
  const bad = need('route','origin','Where does it come from?') | need('route','destination','Where does it go?') |
    need('port','port','Which port?') | need('pickup','pickupAddress','Where is it picked up?') | need('delivery','deliveryAddress','Where is it delivered?') |
    fieldError(form,'services', services.length?'':'Pick at least one service.') | fieldError(form,'staff', staff.length?'':'Assign at least one person.') |
    (needsTruckLegs(services, scope) ? fieldError(form,'truckLegs', legs.length?'':'Pick pickup, delivery or both.') : false);
  if(bad) return null;
  const val = (key, name)=> vis.has(key) ? v(name) : '';
  return { customerId: editing ? editing.customerId : v('customerId'), scope, direction, services, staff,
    truckLegs: needsTruckLegs(services, scope) ? legs : null,
    request:{ origin:val('route','origin'), destination:val('route','destination'), port:val('port','port'),
      pickupAddress:val('pickup','pickupAddress'), deliveryAddress:val('delivery','deliveryAddress'), 
      ltoType:val('lto','ltoType'),
      notes:v('notes') } };
}
/* Which waiting report is about this customer? Matches names loosely (spacing, "Inc/Co", small typos). */
function lev(a, b){ const d = Array.from({length:a.length+1},(_,i)=>[i]); for(let j=1;j<=b.length;j++) d[0][j]=j; for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) d[i][j]=Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[a.length][b.length]; }
function matchIntake(custId){
  const c = custById(custId); if(!c) return null;
  const n = normName(c.name);
  return INTAKE.find(t=>{ if(t.status!=='open') return false; const m = normName(t.client); return m===n || (m.length>=3 && (n.startsWith(m) || m.startsWith(n))) || lev(m, n)<=2; }) || null;
}
function suggestIntake(custId){ const sel = document.getElementById('inq-intake'); if(!sel) return; const t = matchIntake(custId); if(t) sel.value = t.id; }
function saveInquiry(form, editId, intakeId){
  const editing = editId ? inqById(editId) : null;
  if(!editing) intakeId = intakeId || String(new FormData(form).get('intakeId')||'') || null;
  const d = readInquiryForm(form, editing); if(!d) return;
  if(editing){
    const added = d.staff.filter(s=>!editing.staff.includes(s));
    if(editing.request.attachment) d.request.attachment = editing.request.attachment;
    Object.assign(editing, d);
    logTo(editing, 'Inquiry updated', 'Staff: '+d.staff.join(', ')+'. '+servicesText(d.services)+'.');
    if(added.length) notify({ users:added }, 'You were assigned to '+editing.id+' ('+custById(editing.customerId).name+').', '#/inquiries/'+editing.id);
    closeDrawer(); showToast(editing.id+' updated.', 'success', 'check'); render(); return;
  }
  const i = Object.assign({ id:nextId('inq'), createdBy:me(), createdOn:todayDMY(), versions:[], closed:null, jobId:null, log:[] }, d);
  INQUIRIES.push(i);
  logTo(i, 'Inquiry created', custById(i.customerId).name+'. '+scopeText(i)+': '+servicesText(i.services)+'. Assigned to '+i.staff.join(', ')+'.');
  notify({ users:i.staff }, 'You were assigned to '+i.id+' ('+custById(i.customerId).name+'): prepare the quotation.', '#/inquiries/'+i.id);
  if(intakeId){ const t = INTAKE.find(x=>x.id===intakeId); if(t){ t.status = 'done'; t.inquiryId = i.id; t.doneBy = me(); t.doneOn = todayDMY();
      notify({ users:[t.by] }, 'Your report about '+t.client+' became inquiry '+i.id+'.', '#/inquiries/'+i.id); if(t.file){ i.request.attachment = t.file; logTo(i, 'Inquiry updated', 'Supporting document from '+t.by+': '+t.file+'.'); } } }
  closeDrawer(); STATE.justNext = i.id; showToast(i.id+' created and assigned to '+i.staff.join(', ')+'.', 'success', 'quote');
  go('#/inquiries/'+i.id);
}
function openEditInquiry(id){
  const i = inqById(id), locked = i.versions.length>0;
  const sales = USERS.filter(u=>u.active && u.roles.includes('Sales')).map(u=>({ value:u.name, label:u.name, sub:u.dept }));
  const r = i.request;
  openDrawer({ title:'Edit / reassign', sub:'<span class="ds-mono">'+i.id+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="inq-form"'+(locked?' data-locked="'+id+'"':'')+' novalidate onsubmit="event.preventDefault(); saveInquiry(this, \''+id+'\')">'+
      (locked ? '<div class="ds-alert ds-alert--info">'+icon('lock')+'<div><strong>Scope and services are locked</strong>A quotation has been uploaded against them. Staff and request details can still change.</div></div>'
        : '<div class="ds-field"><span class="ds-field__label">Scope</span>'+segControl('scope', SCOPES, i.scope, 'refreshInqForm()')+'</div>'+
          '<div class="ds-field" id="inq-dir-wrap"'+(i.scope==='International'?'':' style="display:none"')+'><span class="ds-field__label">Direction</span>'+segControl('direction', DIRECTIONS, i.direction||'Import', 'refreshInqForm()')+'</div>'+
          '<div class="ds-field"><span class="ds-field__label">Services</span><div id="inq-services">'+inqServicesHtml(i.scope, i.direction, i.services)+'</div>'+errorSlot('services')+'</div>')+legsHtml(i.truckLegs)+
      '<div class="ds-label" style="margin-top:var(--t1m-space-4)">The request</div>'+requestFieldsHtml(r)+
      '<div class="ds-field"><label for="inq-staff">Assigned staff</label>'+staffSelect(sales, i.staff[0])+errorSlot('staff')+'</div></form>',
    foot: drawerFoot('Save changes','inq-form',{icon:'check'}) });
  refreshPlan();
}

/* ---------- Quote actions ---------- */
function openUploadQuote(id, fromExpired){
  const i = inqById(id);
  if(!can('quote.submit', i)) return denied('Only the assigned sales staff (or a Manager) can upload the quote.');
  const v = latestV(i), n = v ? v.v+1 : 1;
  openDrawer({ title:'Upload quotation v'+n, sub:'<span class="ds-mono">'+quoteNo(i)+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="quote-form" novalidate onsubmit="event.preventDefault(); saveQuote(\''+id+'\', this, '+(fromExpired?'true':'false')+')">'+
      '<div class="ds-field"><label>Quotation file</label>'+uploadHtml('quoteFile','Your quotation in your usual format (PDF, Excel, Word)')+errorSlot('file')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="q-amount">Total amount</label><input class="ds-input" id="q-amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00"'+(v?' value="'+v.amount+'"':'')+'>'+errorSlot('amount')+'</div>'+
        '<div class="ds-field"><label for="q-cur">Currency</label>'+'<input class="ds-input" id="q-cur" name="currency" value="PHP" readonly>'+'</div></div>'+
      dateField('q-valid','validUntil','Valid until', addDaysDMY(SETTINGS.quoteValidityDays))+
      '<p class="ds-muted ds-xs">'+icon('info')+' Amount and validity are for tracking and reports only. The file is what the client receives.</p></form>',
    foot: drawerFoot('Submit for approval','quote-form',{icon:'upload'}) });
}
function saveQuote(id, form, fromExpired){
  const i = inqById(id), fd = new FormData(form), amount = Number(fd.get('amount')), valid = isoToDMY(fd.get('validUntil'));
  const bad = fieldError(form,'file', UPLOADS.quoteFile?'':'Attach the quotation file.') | fieldError(form,'amount', amount>0?'':'Enter the total amount.') |
    fieldError(form,'validUntil', !valid?'Pick the validity date.':daysUntil(valid)<0?'The validity date is already past.':'');
  if(bad) return;
  if(needConfirm('Submit quotation for approval?', 'It goes to a manager. Once approved it is emailed to the client automatically.', 'Submit for approval', "saveQuote('"+id+"',document.getElementById('"+form.id+"'),"+(fromExpired?'true':'false')+")")) return;
  const prev = latestV(i);
  if(fromExpired && prev && prev.status==='Sent'){ prev.status = 'Expired'; prev.outcome = { type:'Expired', reasonType:'No response', comment:'Validity date passed without an answer.', by:me(), on:todayDMY() }; logTo(i, 'Quote expired', 'v'+prev.v+' expired on '+prev.validUntil+'.'); }
  const v = { v: prev ? prev.v+1 : 1, file:UPLOADS.quoteFile, amount, currency:'PHP', validUntil:valid, by:me(), on:todayDMY(), at:Date.now(), status:'For approval' };
  i.versions.push(v);
  logTo(i, 'Quote submitted', 'v'+v.v+' '+amountText(v)+', valid until '+valid+' ('+v.file+').');
  notify({ roles:['Manager'] }, me()+' submitted '+quoteNo(i)+' v'+v.v+' ('+amountText(v)+') for approval.', '#/inquiries/'+id);
  closeDrawer(); STATE.justNext = id; showToast('v'+v.v+' submitted. A manager will review it.', 'success', 'upload'); render();
}
function openReviewQuote(id){
  const i = inqById(id), v = latestV(i);
  if(!can('quote.approve')) return denied('Only a Manager approves quotations.');
  const self = v.by===me();
  openDrawer({ title:'Review quotation v'+v.v, sub:'<span class="ds-mono">'+quoteNo(i)+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="review-form" novalidate onsubmit="event.preventDefault(); confirmDecision(\'quote\', \''+id+'\', \'Approved\')">'+
      '<div class="ds-panel">'+fileRow(v.file, 'Uploaded by '+v.by+' · '+v.on)+'</div>'+
      '<dl class="ds-facts"><dt>Amount</dt><dd>'+amountText(v)+'</dd><dt>Valid until</dt><dd>'+esc(v.validUntil)+'</dd><dt>Services</dt><dd>'+esc(servicesText(i.services))+'</dd><dt>Scope</dt><dd>'+esc(scopeText(i))+'</dd></dl>'+
      (self?'<div class="ds-alert ds-alert--info">'+icon('user')+'<div><strong>You uploaded this version</strong>You can approve it; the history will say “Self-approved”.</div></div>':'')+
      '</form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Close</button><button type="button" class="ds-btn ds-btn--secondary" id="return-quote" onclick="confirmDecision(\'quote\', \''+id+'\', \'Returned\')">'+icon('x')+'Reject</button><button type="submit" form="review-form" class="ds-btn ds-btn--primary" id="approve-quote">'+icon('check')+'Approve</button>' });
}
function confirmDecision(kind, id, decision, id2){
  const approve = decision==='Approved';
  if(!approve) return openRejectDialog(kind, id, id2);
  const what = kind==='quote' ? 'this quotation' : kind==='fund' ? 'this fund request' : 'this SOA';
  const call = kind==='quote' ? "decideQuote('"+id+"','"+decision+"',document.getElementById('review-form'))" : kind==='fund' ? "decideFund('"+id+"','"+id2+"','"+decision+"',document.getElementById('rf-form'))" : "decideBill('"+id+"','"+decision+"',document.getElementById('rb-form'))";
  confirmAction(approve?'Approve '+what+'?':'Reject '+what+'?', approve?'This will be recorded under your name.':'It goes back with your reason, which stays in the history.', approve?'Approve':'Reject', call, !approve);
}
function openRejectDialog(kind, id, id2){
  const what = kind==='quote' ? 'quotation' : kind==='fund' ? 'fund request' : 'SOA';
  const fields = kind==='fund' ? '<div class="ds-field"><label for="rs-comment">Reason</label><textarea class="ds-textarea" id="rs-comment" name="comment" style="min-height:72px" placeholder="Say why it is rejected"></textarea>'+errorSlot('comment')+'</div>'
    : reasonFields(MANAGER_RETURN_REASONS, 'What is wrong');
  confirmAction('Reject this '+what+'?', 'It goes back with your reason, which stays in the history.', 'Reject', "submitReject('"+kind+"','"+id+"','"+(id2||'')+"')", true,
    '<form class="ds-stack--sm" id="reject-form" novalidate onsubmit="event.preventDefault()">'+fields+'</form>');
}
function submitReject(kind, id, id2){
  const form = document.getElementById('reject-form');
  if(String(new FormData(form).get('comment')||'').trim()==='') return fieldError(form,'comment', kind==='fund'?'Say why it is rejected.':'Say what to fix. It stays in the history.');
  if(kind==='quote') decideQuote(id, 'Returned', form); else if(kind==='fund') decideFund(id, id2, 'Returned', form); else decideBill(id, 'Returned', form);
  closeConfirm();
}
function decideQuote(id, decision, form){
  const i = inqById(id), v = latestV(i), fd = new FormData(form), comment = String(fd.get('comment')||'').trim();
  if(decision==='Returned' && fieldError(form,'comment', comment?'':'Say what to fix. It stays in the version history.')) return;
  v.review = { by:me(), on:todayDMY(), at:Date.now(), decision, self: v.by===me(), reasonType: decision==='Returned' ? String(fd.get('reasonType')) : null, comment: decision==='Returned' ? comment : null };
  v.status = decision;
  if(decision==='Approved'){
    v.status = 'Sent'; v.sent = { on:todayDMY(), channel:'Email', proof:null, auto:true };
    logTo(i, 'Quote approved', 'v'+v.v+' approved'+(v.review.self?' (self-approved)':'')+'.');
    logTo(i, 'Quote sent', 'v'+v.v+' emailed to the client automatically on '+v.sent.on+'.');
    notify({ users:i.staff }, quoteNo(i)+' v'+v.v+' approved by '+me()+' and emailed to the client. Waiting for their response.', '#/inquiries/'+id);
    showToast('v'+v.v+' approved and emailed to the client.', 'success', 'check');
  } else {
    logTo(i, 'Quote returned', 'v'+v.v+': '+v.review.reasonType+'. '+comment);
    notify({ users:[v.by].concat(i.staff) }, quoteNo(i)+' v'+v.v+' returned by '+me()+': '+v.review.reasonType+'.', '#/inquiries/'+id);
    showToast('v'+v.v+' returned to sales with your reason.', 'warning', 'refresh');
  }
  closeDrawer(); STATE.justNext = id; render();
}
function openMarkSent(id){
  const i = inqById(id), v = latestV(i);
  if(!can('quote.send', i)) return denied();
  openDrawer({ title:'Mark v'+v.v+' as sent', sub:'<span class="ds-mono">'+quoteNo(i)+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="sent-form" novalidate onsubmit="event.preventDefault(); saveSent(\''+id+'\', this)">'+
      '<p class="ds-small">Send the approved file to the client yourself (email, Viber, WhatsApp…), then record it here. The awaiting-response count starts today.</p>'+
      '<div class="ds-field"><label for="sent-ch">Sent via</label>'+selectWrap('<select class="ds-select" id="sent-ch" name="channel">'+options(CHANNELS, i.channel)+'</select>')+'</div>'+
      dateField('sent-on','on','Date sent', todayDMY())+
      '<div class="ds-field"><label>Proof it was sent</label>'+uploadHtml('sentProof')+errorSlot('proof')+'</div></form>',
    foot: drawerFoot('Mark as sent','sent-form',{icon:'arrow-right'}) });
}
function saveSent(id, form){
  const i = inqById(id), v = latestV(i), fd = new FormData(form), on = isoToDMY(fd.get('on'));
  if(fieldError(form,'on', on?'':'Pick the date it was sent.') | fieldError(form,'proof', UPLOADS.sentProof?'':'Attach proof that the quotation was sent.')) return;
  v.status = 'Sent'; v.sent = { by:me(), on, channel:String(fd.get('channel')), proof:UPLOADS.sentProof };
  logTo(i, 'Quote sent', 'v'+v.v+' sent to the client via '+v.sent.channel+' on '+on+' (proof '+v.sent.proof+').');
  closeDrawer(); STATE.justNext = id; showToast('Marked as sent. Follow up if there is no answer.', 'success', 'arrow-right'); render();
}
function openClientOutcome(id){
  const i = inqById(id), v = latestV(i);
  if(!can('quote.send', i)) return denied();
  openDrawer({ title:'Client response to v'+v.v, sub:'<span class="ds-mono">'+quoteNo(i)+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="outcome-form" novalidate onsubmit="event.preventDefault(); saveOutcome(\''+id+'\', this)">'+
      '<div class="ds-field"><span class="ds-field__label">What did the client say?</span>'+segControl('type', ['Accepted','Renegotiate','Rejected'], 'Accepted', "document.getElementById('oc-reason').hidden = this.value==='Accepted'")+'</div>'+
      '<div id="oc-reason" hidden class="ds-stack--sm">'+reasonFields(CLIENT_REASONS, 'Reason')+'</div>'+
      dateField('oc-on','on','Date of the answer', todayDMY())+
      '<div class="ds-field"><label>Proof</label>'+uploadHtml('outcomeProof','Screenshot of the message, the email, or the signed quote')+errorSlot('proof')+'</div></form>',
    foot: drawerFoot('Record response','outcome-form',{icon:'check'}) });
}
function saveOutcome(id, form){
  const i = inqById(id), v = latestV(i), fd = new FormData(form);
  const type = { Accepted:'Accepted', Renegotiate:'Renegotiated', Rejected:'Rejected' }[fd.get('type')];
  const on = isoToDMY(fd.get('on')), comment = String(fd.get('comment')||'').trim();
  const bad = fieldError(form,'proof', UPLOADS.outcomeProof?'':'Attach proof of the client’s answer.') | fieldError(form,'on', on?'':'Pick the date.') |
    (type!=='Accepted' ? fieldError(form,'comment', comment?'':'Add a short note on what the client said.') : false);
  if(bad) return;
  if(needConfirm('Record the client’s answer?', 'This updates the inquiry and notifies the manager and sales staff.', 'Record answer', "saveOutcome('"+id+"',document.getElementById('"+form.id+"'))")) return;
  recordOutcome(id, type, type==='Accepted'?null:String(fd.get('reasonType')), comment, UPLOADS.outcomeProof, me(), on);
  closeDrawer(); STATE.justNext = id; render();
}
function recordOutcome(id, type, reasonType, comment, proof, by, on){
  const i = inqById(id), v = latestV(i);
  v.status = type; v.outcome = { type, reasonType, comment: type==='Accepted'?null:comment, proof, by, on };
  const c = custById(i.customerId).name;
  if(type==='Accepted'){
    logTo(i, 'Client accepted', 'v'+v.v+' accepted on '+on+' (proof '+v.outcome.proof+').');
    notify({ roles:['Manager'], users:i.staff }, c+' accepted '+quoteNo(i)+' v'+v.v+'. A manager needs to acknowledge it.', '#/inquiries/'+id);
    showToast('Accepted. A manager will acknowledge and close it.', 'success', 'check');
  } else {
    logTo(i, 'Client '+(type==='Rejected'?'rejected':'renegotiating'), 'v'+v.v+': '+v.outcome.reasonType+'. '+comment);
    notify({ roles:['Manager'], users:i.staff }, c+' '+(type==='Rejected'?'rejected':'wants to renegotiate')+' '+quoteNo(i)+' v'+v.v+': '+v.outcome.reasonType+'.', '#/inquiries/'+id);
    showToast('Recorded. Prepare v'+(v.v+1)+', or the manager can close it as lost.', 'info', 'refresh');
  }
}
/* ---------- Client quotation page (the email link; public, no login) ---------- */
function renderQuotePage(id){
  const i = INQUIRIES.find(x=>x.id===id), v = i && latestV(i);
  const sim = CURRENT_USER && i ? '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Simulation</strong>This is the page the client opens from the email link.<div class="ds-alert__actions"><a class="ds-btn ds-btn--secondary ds-btn--sm" href="#/inquiries/'+esc(id)+'">Back to the inquiry</a></div></div></div>' : '';
  if(!i || !v) return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><h1 class="ds-public__status">We could not find that quotation</h1></div>','Quotation')+'<div class="ds-public__body">'+sim+'</div></div>';
  const c = custById(i.customerId).name, open = ['Approved','Sent'].includes(v.status) && !sentExpired(v), o = v.outcome;
  const answered = ['Accepted','Renegotiated','Rejected'].includes(v.status) && o;
  const said = { Accepted:'You accepted this quotation.', Renegotiated:'You asked to renegotiate. Top1Movers will send a new version.', Rejected:'You declined this quotation.' }[v.status];
  const headline = answered ? 'Thank you, your answer is recorded' : open ? 'Your quotation is ready' : 'This quotation is no longer open';
  const body = answered ? '<div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>'+esc(said)+'</strong>Answered '+esc(o.on)+'.</div></div>'
    : open ? '<form class="ds-stack--sm" id="client-form" novalidate onsubmit="event.preventDefault(); confirmClientAnswer(\''+esc(id)+'\', this)">'+
        '<div class="ds-field">'+segControl('type', ['Accept','Renegotiate','Decline'], 'Accept', "document.getElementById('cl-reason').hidden = this.value==='Accept'")+'</div>'+
        '<div id="cl-reason" hidden><div class="ds-field"><label for="cl-reason-text">Reason</label><textarea class="ds-textarea" id="cl-reason-text" name="comment" style="min-height:96px" placeholder="Tell us why"></textarea>'+errorSlot('comment')+'</div></div>'+
        '<button class="ds-btn ds-btn--primary" type="submit" id="client-send">'+icon('check')+'Send my answer</button></form>'
    : '<div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>Please contact your Top1Movers coordinator</strong>This version has expired or was replaced.</div></div>';
  return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><p class="ds-label">Quotation <span class="ds-mono" style="color:var(--t1m-ink-inverse)">'+esc(quoteNo(i))+'</span></p><h1 class="ds-public__status" id="quote-status">'+esc(headline)+'</h1><div class="ds-public__meta"><span>'+esc(c)+'</span></div></div>','Quotation')+
    '<div class="ds-public__body">'+sim+
    '<div class="ds-panel"><div class="ds-panel__head"><h2>Quotation v'+v.v+'</h2></div><div class="ds-panel__body ds-stack--sm">'+fileRow(v.file,'Prepared by Top1Movers')+
      '<dl class="ds-facts"><dt>Amount</dt><dd>'+amountText(v)+'</dd><dt>Valid until</dt><dd>'+esc(v.validUntil)+'</dd><dt>Services</dt><dd>'+esc(servicesText(i.services))+'</dd></dl></div></div>'+
    '<div class="ds-panel"><div class="ds-panel__head"><h2>Your answer</h2></div><div class="ds-panel__body ds-stack--sm">'+body+'</div></div></div></div>';
}
function confirmClientAnswer(id, form){
  const fd = new FormData(form), type = String(fd.get('type')), comment = String(fd.get('comment')||'').trim();
  if(type!=='Accept' && fieldError(form,'comment', comment?'':'Please tell us the reason.')) return;
  const word = { Accept:'accept', Renegotiate:'ask to renegotiate', Decline:'decline' }[type];
  confirmAction('Send your answer?', 'You are about to '+word+' this quotation. Top1Movers will be notified.', 'Send answer', "submitClientAnswer('"+id+"')", type==='Decline');
}
function submitClientAnswer(id){
  const form = document.getElementById('client-form'), fd = new FormData(form), t = String(fd.get('type'));
  const type = { Accept:'Accepted', Renegotiate:'Renegotiated', Decline:'Rejected' }[t], comment = String(fd.get('comment')||'').trim();
  recordOutcome(id, type, type==='Accepted'?null:'Client reason', comment, 'Client page response', custById(inqById(id).customerId).name, todayDMY());
  render();
}
function openAckAccept(id){
  const i = inqById(id), v = latestV(i);
  if(!can('inquiry.close')) return denied('Only a Manager closes inquiries.');
  openDrawer({ title:'Acknowledge and close', sub:'<span class="ds-mono">'+i.id+'</span>',
    body:'<div class="ds-stack--sm"><div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>The client accepted v'+v.v+'</strong>'+esc(amountText(v)+' · answered '+v.outcome.on+' · recorded by '+v.outcome.by)+'</div></div>'+
      '<div class="ds-panel">'+fileRow(v.outcome.proof, 'Proof of acceptance')+'</div>'+
      '<p class="ds-small">Closing the inquiry locks the version history and makes it ready to convert into a job.</p></div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--primary" id="ack-accept" onclick="ackAccept(\''+id+'\')">'+icon('check')+'Acknowledge &amp; close</button>' });
}
function ackAccept(id){
  const i = inqById(id), v = latestV(i);
  if(needConfirm('Acknowledge and close?', 'The inquiry is closed as won and the version history is locked.', 'Acknowledge & close', "ackAccept('"+id+"')")) return;
  v.ack = { by:me(), on:todayDMY() }; i.closed = 'won'; i.closedBy = me(); i.closedOn = todayDMY();
  logTo(i, 'Inquiry closed (won)', 'Acceptance of v'+v.v+' acknowledged. Ready for Convert to job.');
  notify({ users:i.staff }, i.id+' closed as won by '+me()+'. It is ready to become a job.', '#/inquiries/'+id);
  closeDrawer(); STATE.justNext = id; showToast(i.id+' closed. Convert it to a job next.', 'success', 'check'); render();
}
function openCloseLost(id){
  const i = inqById(id);
  if(!can('inquiry.close')) return denied('Only a Manager closes inquiries.');
  openDrawer({ title:'Close as lost', sub:'<span class="ds-mono">'+i.id+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="lost-form" novalidate onsubmit="event.preventDefault(); saveLost(\''+id+'\', this)"><p class="ds-small">No more versions will be made. The reason feeds the “why we lose deals” report.</p>'+reasonFields(CLIENT_REASONS, 'Why was it lost?', (()=>{ const v = latestV(i); return v && v.outcome && v.outcome.reasonType ? v.outcome.reasonType : (v && sentExpired(v) ? 'No response' : ''); })())+'</form>',
    foot: drawerFoot('Close as lost','lost-form',{icon:'x', danger:true}) });
}
function saveLost(id, form){
  const i = inqById(id), fd = new FormData(form), comment = String(fd.get('comment')||'').trim();
  if(fieldError(form,'comment', comment?'':'Add a short note.')) return;
  if(needConfirm('Close as lost?', 'No more versions can be made. This can’t be undone.', 'Close as lost', "saveLost('"+id+"',document.getElementById('"+form.id+"'))", true)) return;
  const v = latestV(i);
  if(v && sentExpired(v)){ v.status = 'Expired'; v.outcome = { type:'Expired', reasonType:'No response', comment:'Validity date passed without an answer.', by:me(), on:todayDMY() }; }
  i.closed = 'lost'; i.closedBy = me(); i.closedOn = todayDMY(); i.lostReason = { type:String(fd.get('reasonType')), comment };
  logTo(i, 'Inquiry closed (lost)', i.lostReason.type+'. '+comment);
  notify({ users:i.staff }, i.id+' was closed as lost: '+i.lostReason.type+'.', '#/inquiries/'+id);
  closeDrawer(); showToast(i.id+' closed as lost.', 'info', 'x'); render();
}

/* ---------- Staff report a new inquiry to the manager (the manager creates it) ---------- */
function openReportInquiry(){
  openDrawer({ title:'Report an inquiry to the manager', sub:'A manager creates the inquiry and assigns staff. This tells them about it.',
    body:'<form class="ds-stack--sm" id="intake-form" novalidate onsubmit="event.preventDefault(); saveIntake(this)">'+
      '<div class="ds-field"><label for="in-client">Client</label><input class="ds-input" id="in-client" name="client" placeholder="Company or person">'+errorSlot('client')+'</div>'+
      '<div class="ds-field"><label for="in-note">Description</label><textarea class="ds-textarea" id="in-note" name="note" placeholder="Describe the request"></textarea>'+errorSlot('note')+'</div>'+
      '<div class="ds-field"><label>Supporting document</label>'+uploadHtml('intakeFile')+errorSlot('file')+'</div></form>',
    foot: drawerFoot('Send to managers','intake-form',{icon:'flag'}) });
}
function saveIntake(form){
  const fd = new FormData(form), client = String(fd.get('client')||'').trim(), note = String(fd.get('note')||'').trim();
  if(fieldError(form,'client', client?'':'Who is the client?') | fieldError(form,'note', note?'':'Add a description.') | fieldError(form,'file', UPLOADS.intakeFile?'':'Attach a supporting document.')) return;
  const t = { id:nextId('intake'), by:me(), on:nowStamp(), client, note, file:UPLOADS.intakeFile||null, status:'open' };
  INTAKE.push(t);
  notify({ roles:['Manager'] }, me()+' reported a new inquiry from '+client+'.', '#/home');
  closeDrawer(); showToast('Sent. A manager will create the inquiry and assign it.', 'success', 'flag'); render();
}
function intakeState(t){
  if(t.status==='done') return { label:'Inquiry created', tone:'success', icon:'check' };
  if(t.status==='dismissed') return { label:'Dismissed', tone:'neutral', icon:'x' };
  return { label:'Sent · waiting for manager', tone:'info', icon:'clock' };
}
function openIntake(id){
  const t = INTAKE.find(x=>x.id===id), open = t.status==='open';
  const f = (k,v)=>'<dt>'+esc(k)+'</dt><dd>'+v+'</dd>';
  const banner = t.status==='done'
      ? '<div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>Inquiry created: '+esc(t.inquiryId)+'</strong>By '+esc(t.doneBy)+' on '+esc(t.doneOn)+'.<div class="ds-alert__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="closeDrawer(); go(\'#/inquiries/'+t.inquiryId+'\')">Open '+esc(t.inquiryId)+'</button></div></div></div>'
    : t.status==='dismissed'
      ? '<div class="ds-alert ds-alert--info">'+icon('x')+'<div><strong>Dismissed</strong>By '+esc(t.dismissedBy)+' on '+esc(t.dismissedOn)+'. No inquiry was created from this report.</div></div>'
      : '<div class="ds-alert ds-alert--info">'+icon('clock')+'<div><strong>Sent · waiting for a manager</strong>A manager will create the inquiry and assign staff.</div></div>';
  const foot = open && can('inquiry.create')
    ? '<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer(); dismissIntake(\''+id+'\')">'+icon('x')+'Dismiss</button><button type="button" class="ds-btn ds-btn--primary" onclick="closeDrawer(); openNewInquiry(null,\''+id+'\')">'+icon('plus')+'Create inquiry</button>'
    : '<button type="button" class="ds-btn ds-btn--primary" onclick="closeDrawer()">Close</button>';
  openDrawer({ title:'Reported inquiry', sub:'From '+esc(t.by)+' · '+esc(t.on),
    body:'<div class="ds-stack--sm">'+banner+'<dl class="ds-facts">'+f('Client', esc(t.client))+f('Reported by', esc(t.by))+f('Reported on', esc(t.on))+'</dl>'+
      '<div><span class="ds-label">What they need</span><p style="white-space:pre-wrap">'+esc(t.note)+'</p></div>'+
      '<div><span class="ds-label">Supporting document</span>'+(t.file ? '<div class="ds-panel" style="margin-top:var(--t1m-space-2)">'+fileRow(t.file, 'Attached by '+t.by)+'</div>' : '<p class="ds-muted ds-small">None attached.</p>')+'</div></div>',
    foot });
}
function dismissIntake(id){ const t = INTAKE.find(x=>x.id===id); t.status = 'dismissed'; t.dismissedBy = me(); t.dismissedOn = todayDMY();
  notify({ users:[t.by] }, 'Your report about '+t.client+' was dismissed by '+me()+'.', '#/mywork');
  showToast('Report dismissed.', 'info', 'x'); render(); }

/* ============================== CUSTOMERS ==============================
   One profile per client. Only a Manager creates or edits; everyone else can look. */
function normName(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\b(inc|corp|co|ltd|corporation|company|the)\b/g,'').replace(/\s+/g,' ').trim(); }
function renderCustomers(){
  const q = STATE.customerQuery.trim().toLowerCase();
  const rows = CUSTOMERS.filter(c=>!q || (c.name+' '+c.contact.name+' '+(c.address||'')).toLowerCase().includes(q)).map(c=>{
    const inq = INQUIRIES.filter(i=>i.customerId===c.id), jobs = JOBS.filter(j=>j.customerId===c.id);
    return '<tr data-href onclick="go(\'#/customers/'+c.id+'\')"><td data-label="Customer"><span class="ds-cell-name"><span class="ds-cell-primary">'+esc(c.name)+'</span><span class="ds-cell-sub">'+esc(c.address)+'</span></span></td>'+
      '<td data-label="Contact">'+esc(c.contact.name)+'<div class="ds-muted ds-xs">'+esc(c.contact.phone)+'</div></td>'+
      '<td data-label="Open inquiries" class="ds-num">'+inq.filter(i=>OPEN_INQ.includes(inqStatus(i).key)).length+'</td><td data-label="Active jobs" class="ds-num">'+jobs.filter(j=>j.status!=='Completed').length+'</td></tr>';
  }).join('');
  return '<div class="ds-page-head"><div><h1>Customers</h1><p class="ds-page-head__sub">One profile per client, with every inquiry and job they have had.</p></div>'+
    '<div class="ds-page-head__actions">'+(can('customer.edit')?'<button class="ds-btn ds-btn--primary" id="new-customer" onclick="openNewCustomer()">'+icon('plus')+'New customer</button>':'<span class="ds-readonly">'+icon('eye')+'View only · a Manager adds customers</span>')+'</div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body"><div class="ds-search" style="max-width:420px">'+icon('search')+'<input class="ds-input" id="customer-search" placeholder="Name, contact or address" value="'+esc(STATE.customerQuery)+'" oninput="STATE.customerQuery=this.value; render()"></div></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Customer</th><th>Contact</th><th class="ds-num">Open inquiries</th><th class="ds-num">Active jobs</th></tr></thead><tbody>'+
    (rows || '<tr><td colspan="4">'+(CUSTOMERS.length ? emptyState('search','No customers match','Try part of the name.') : emptyState('building','No customers yet', can('customer.edit')?'Add the first one with New customer.':'A Manager adds customers.'))+'</td></tr>')+'</tbody></table></div></section>';
}
function customerFields(c){
  c = c || { contact:{} };
  return '<div class="ds-field"><label for="nc-name">Company name</label><input class="ds-input" id="nc-name" name="name" value="'+esc(c.name||'')+'" placeholder="e.g. Sample Trading Co." oninput="checkDuplicate(this.form)" autocomplete="off">'+errorSlot('name')+'</div><div id="nc-dup"></div>'+
    '<div class="ds-field"><label for="nc-contact">Contact person</label><input class="ds-input" id="nc-contact" name="contact" value="'+esc(c.contact.name||'')+'">'+errorSlot('contact')+'</div>'+
    '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="nc-phone">Phone</label><input class="ds-input" id="nc-phone" name="phone" type="tel" value="'+esc(c.contact.phone||'')+'" placeholder="+63 917 555 0123" oninput="checkDuplicate(this.form)">'+errorSlot('phone')+'</div>'+
    '<div class="ds-field"><label for="nc-email">Email</label><input class="ds-input" id="nc-email" name="email" type="email" value="'+esc(c.contact.email||'')+'" placeholder="ops@company.example" oninput="checkDuplicate(this.form)">'+errorSlot('email')+'</div></div>'+
    '<div class="ds-field"><label for="nc-addr">Business address</label><input class="ds-input" id="nc-addr" name="address" value="'+esc(c.address||'')+'" placeholder="Office address, e.g. Unit 5, 123 Ortigas Ave, Pasig City">'+errorSlot('address')+'</div>';
}
function openNewCustomer(thenInquiry){
  if(!can('customer.edit')) return denied('Only a Manager adds customers.');
  openDrawer({ title:'New customer', sub:'Name, contact person, phone, email and business address are required.',
    body:'<form class="ds-stack--sm" id="cust-form" novalidate onsubmit="event.preventDefault(); saveCustomer(this, null, '+(thenInquiry?'true':'false')+')">'+customerFields()+'</form>',
    foot: drawerFoot(thenInquiry?'Save and continue to inquiry':'Save customer','cust-form',{icon:'check'}) });
}
function openEditCustomer(id){
  const c = custById(id);
  openDrawer({ title:'Edit customer', sub:esc(c.id),
    body:'<form class="ds-stack--sm" id="cust-form" data-editing="'+id+'" novalidate onsubmit="event.preventDefault(); saveCustomer(this, \''+id+'\')">'+customerFields(c)+'</form>',
    foot: drawerFoot('Save changes','cust-form',{icon:'check'}) });
}
function checkDuplicate(form){
  const fd = new FormData(form), n = normName(fd.get('name')), e = String(fd.get('email')||'').trim().toLowerCase(), p = String(fd.get('phone')||'').replace(/\D/g,'');
  const m = CUSTOMERS.find(c=>c.id!==form.dataset.editing && ((n.length>=3 && (normName(c.name)===n || normName(c.name).startsWith(n) || n.startsWith(normName(c.name)))) || (e && c.contact.email.toLowerCase()===e) || (p.length>=7 && c.contact.phone.replace(/\D/g,'')===p)));
  document.getElementById('nc-dup').innerHTML = m ? '<div class="ds-alert ds-alert--warning" id="dup-warning">'+icon('alert')+'<div><strong>Possible duplicate</strong>“'+esc(m.name)+'” has a similar name, email or phone. Check it is not the same client.<div class="ds-alert__actions"><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" onclick="closeDrawer(); go(\'#/customers/'+m.id+'\')">Open '+esc(m.name)+'</button></div></div></div>' : '';
}
function saveCustomer(form, editId, thenInquiry){
  const fd = new FormData(form), v = k=>String(fd.get(k)||'').trim();
  const bad = fieldError(form,'name', v('name')?'':'Enter the company name.') | fieldError(form,'contact', v('contact')?'':'Who do we talk to there?') | fieldError(form,'address', v('address')?'':'Enter the client’s business address.') |
    fieldError(form,'phone', !v('phone')?'Enter the contact phone number.':/^\+?[\d\s()-]{7,}$/.test(v('phone'))?'':'Enter a valid phone number.') |
    fieldError(form,'email', !v('email')?'Enter the contact email.':/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))?'':'Enter a valid email.');
  if(bad) return;
  const data = { name:v('name'), contact:{ name:v('contact'), email:v('email'), phone:v('phone') }, address:v('address') };
  if(editId){ Object.assign(custById(editId), data); closeDrawer(); showToast('Customer updated.', 'success', 'check'); render(); return; }
  const c = Object.assign({ id:nextId('cust'), createdBy:me(), createdOn:todayDMY() }, data);
  CUSTOMERS.push(c);
  ADMIN_LOG.push({ ts:nowStamp(), actor:actorLabel(), action:'Customer created', detail:c.name+' ('+c.id+').', ref:c.id });
  closeDrawer(); showToast(c.name+' saved.', 'success', 'check');
  if(thenInquiry){ openNewInquiry(c.id); return; }
  go('#/customers/'+c.id);
}
function renderCustomer(id){
  const c = custById(id);
  if(!c) return '<div class="ds-panel ds-panel--elevated">'+emptyState('search','Customer not found','','<a class="ds-btn ds-btn--secondary" href="#/customers">All customers</a>')+'</div>';
  const inqs = INQUIRIES.filter(i=>i.customerId===id && canView('inquiry.view', i)), jobs = JOBS.filter(j=>j.customerId===id && canView('job.view', j));
  const f = (k,v)=>'<dt>'+esc(k)+'</dt><dd>'+v+'</dd>';
  return '<nav class="ds-crumbs"><a href="#/customers">Customers</a>'+icon('chevron-right')+'<span>'+esc(c.name)+'</span></nav>'+
    '<div class="ds-page-head"><div><h1>'+esc(c.name)+'</h1><p class="ds-page-head__sub">'+esc(c.address)+' · added '+esc(c.createdOn)+' by '+esc(c.createdBy)+'</p></div><div class="ds-page-head__actions">'+
      (can('customer.edit')?'<button class="ds-btn ds-btn--secondary" onclick="openEditCustomer(\''+id+'\')">'+icon('user')+'Edit</button>':'')+
      (can('inquiry.create')?'<button class="ds-btn ds-btn--primary" id="cust-new-inquiry" onclick="openNewInquiry(\''+id+'\')">'+icon('plus')+'New inquiry</button>':'')+'</div></div>'+
    '<div class="ds-split"><div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('quote')+'Inquiries &amp; quotes</h2><span class="ds-panel__hint">compare previous quotes here</span></div>'+
        (inqs.length ? '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Inquiry</th><th>Services</th><th>Version</th><th class="ds-num">Amount</th><th>Status</th></tr></thead><tbody>'+inqs.slice().reverse().map(i=>{ const v = latestV(i);
          return '<tr data-href onclick="go(\'#/inquiries/'+i.id+'\')"><td data-label="Inquiry"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+i.id+'</span><span class="ds-cell-sub">'+esc(i.createdOn)+'</span></span></td><td data-label="Services" style="white-space:normal">'+esc(servicesText(i.services))+'<div class="ds-muted ds-xs">'+esc(scopeText(i))+'</div></td><td data-label="Version">'+(v?'v'+v.v:'—')+'</td><td data-label="Amount" class="ds-num">'+(v?amountText(v):'—')+'</td><td data-label="Status">'+inqPill(i)+'</td></tr>'; }).join('')+'</tbody></table></div>'
          : '<div class="ds-panel__body ds-muted">No inquiries yet.</div>')+'</section>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('box')+'Jobs</h2></div>'+
        (jobs.length ? '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Job</th><th>Services</th><th>Current step</th><th>Health</th></tr></thead><tbody>'+jobs.map(j=>'<tr data-href onclick="go(\'#/jobs/'+j.id+'\')"><td data-label="Job"><span class="ds-mono ds-cell-primary">'+j.id+'</span></td><td data-label="Services">'+esc(servicesText(j.services))+'</td><td data-label="Step">'+stagePill(j)+'</td><td data-label="Health">'+healthPill(j)+'</td></tr>').join('')+'</tbody></table></div>'
          : '<div class="ds-panel__body ds-muted">No jobs yet.</div>')+'</section>'+
    '</div><div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('user')+'Contact</h3></div><div class="ds-panel__body"><dl class="ds-facts">'+f('Name',esc(c.contact.name))+f('Email',esc(c.contact.email))+f('Phone',esc(c.contact.phone))+f('Business address',esc(c.address||'—'))+'</dl></div></section>'+
    '</div></div>';
}
