/* ============================== INQUIRIES & QUOTES ==============================
   The commercial half of the workflow lives on ONE page per inquiry: the request, its quotation
   versions, the client's approval (conforme) and the job it becomes. The same "next step" panel
   as a shipment job tells the dispatcher what is missing before it can become a job. */
function inquiryStage(i){
  if(i.status==='Declined') return { key:'Declined', label:'Declined', tone:'neutral', icon:'x', next:'Declined' };
  if(i.status==='Converted') return { key:'Converted', label:'Converted to job', tone:'success', icon:'check', next:'Done' };
  const q = i.quotationId ? QUOTATIONS[i.quotationId] : null;
  if(q && q.conforme) return { key:'Approved', label:'Client approved', tone:'brand', icon:'check', next: inquiryMissing(i).length ? 'Fill missing details, then convert' : 'Convert to a shipment job' };
  if(q) return { key:'Quoted', label:'Waiting on client', tone:'warning', icon:'clock', next:'Record the client’s approval' };
  return { key:'New', label:'Needs a quote', tone:'info', icon:'quote', next:'Create a quotation' };
}
function inquiryPill(i){ const s = inquiryStage(i); return pill(s.label, s.tone, s.icon); }
function linkedJob(i){ return i.quotationId ? JOBS.find(j=>j.quotationId===i.quotationId) : null; }
function renderInquiries(){
  const f = STATE.inqFilter;
  const keys = ['New','Quoted','Approved'];
  const match = i=>{ const k = inquiryStage(i).key; return f==='open' ? keys.includes(k) : f==='all' ? true : k===f; };
  const cnt = k => INQUIRIES.filter(i=> k==='open' ? keys.includes(inquiryStage(i).key) : k==='all' ? true : inquiryStage(i).key===k).length;
  const chip = (k,l)=>'<button class="ds-chip" aria-pressed="'+(f===k)+'" onclick="STATE.inqFilter=\''+k+'\'; render()">'+l+'<span class="ds-chip__count">'+cnt(k)+'</span></button>';
  const rows = INQUIRIES.filter(match).slice().reverse().map(i=>{
    const c = custById(i.customerId), st = inquiryStage(i), miss = inquiryMissing(i);
    return '<tr data-href onclick="go(\'#/inquiries/'+i.id+'\')"><td data-label="Inquiry"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+i.id+'</span><span class="ds-cell-sub">received '+shortDate(i.dateReceived)+'</span></span></td>'+
      '<td data-label="Customer"><span class="ds-cell-name">'+esc(c.name)+'<span class="ds-cell-sub">'+esc(i.cargo)+'</span></span></td>'+
      '<td data-label="Route">'+esc(i.origin.split(',')[0]+' → '+i.destination.split(',')[0])+'</td>'+
      '<td data-label="Stage">'+inquiryPill(i)+(miss.length && !['Declined','Converted'].includes(st.key)?' '+pill(miss.length+' missing','warning','alert','ds-pill--sm'):'')+'</td>'+
      '<td data-label="Next step" style="white-space:normal"><span class="ds-strong">'+esc(st.next)+'</span></td><td data-label="Owner">'+esc(i.assignedTo)+'</td></tr>';
  }).join('');
  const flow = ['Inquiry','Quotation','Client approval','Shipment job'].map((s,k)=>'<span class="ds-row ds-row--tight"><span class="ds-scenario__n" style="width:24px;height:24px;font-size:var(--t1m-text-xs)">'+(k+1)+'</span>'+s+'</span>').join(icon('arrow-right','ds-muted3'));
  return '<div class="ds-page-head"><div><h1>Inquiries &amp; quotes</h1><p class="ds-page-head__sub">Winning the work. A client asks, we quote, the client signs the quote (the conforme), and it becomes a shipment job without retyping anything.</p></div>'+
    '<div class="ds-page-head__actions"><button class="ds-btn ds-btn--primary" id="new-inquiry" onclick="openNewInquiry()">'+icon('plus')+'New inquiry</button></div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-stack--sm"><div class="ds-row ds-small ds-muted" aria-label="Sales flow">'+flow+'</div>'+
      '<div class="ds-chips ds-chips--scroll">'+chip('open','Open')+chip('New','Needs a quote')+chip('Quoted','Waiting on client')+chip('Approved','Ready to convert')+chip('Converted','Converted')+chip('Declined','Declined')+chip('all','All')+'</div></div>'+
      '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Inquiry</th><th>Customer</th><th>Route</th><th>Stage</th><th>Next step</th><th>Owner</th></tr></thead><tbody>'+
      (rows||'<tr><td colspan="6">'+emptyState('quote','Nothing here','No inquiries in this group.')+'</td></tr>')+'</tbody></table></div></section>';
}
function dealNext(i){
  const q = i.quotationId ? QUOTATIONS[i.quotationId] : null, miss = inquiryMissing(i), job = linkedJob(i);
  if(i.status==='Converted' && job) return { tone:'done', icon:'check', eyebrow:'Done', title:'Converted to '+job.id, text:'The job carries every detail from this inquiry and its approved quotation. Operations takes it from here.', items:[], primary:act('Open '+job.id,"go('#/jobs/"+job.id+"')",'arrow-right') };
  if(i.status==='Declined') return { tone:'done', icon:'x', eyebrow:'Closed', title:'Inquiry declined', text:i.declineReason||'No quotation will be made.', items:[], primary:null };
  const items = [
    { label:'Shipment details complete', sub: miss.length ? 'Missing: '+miss.join(', ') : 'Cargo, route, container, pickup date and delivery address', met:!miss.length, act: miss.length ? act('Fill in',"openEditInquiry('"+i.id+"')",'plus') : null },
    { label:'Quotation sent', sub: q ? q.id+' v'+q.versions[q.versions.length-1].v+' · '+money(q.versions[q.versions.length-1].total) : 'Price the request', met:!!q, act: q ? null : act('Create quotation',"openCreateQuote('"+i.id+"')",'quote') },
    { label:'Client approval recorded (conforme)', sub: q && q.conforme ? q.conforme.approvedBy+' · '+q.conforme.date : 'The client signs the quotation to accept it', met:!!(q && q.conforme), act: q && !q.conforme ? act('Record approval',"openConforme('"+q.id+"')",'check') : null }
  ];
  const unmet = items.filter(x=>!x.met);
  if(!unmet.length) return { tone:'ready', icon:'box', eyebrow:'Next step', title:'Create the shipment job', text:'Everything is agreed. One click opens the job with all details carried over, the five documents set as missing and the task list in place.', items, gateTitle:'Ready to become a job', primary:act('Create shipment job',"openConvert('"+i.id+"')",'box') };
  const first = unmet.find(x=>x.act);
  const waiting = unmet.length===1 && !miss.length && q && !q.conforme;
  return { tone: waiting ? 'waiting' : 'ready', icon: waiting ? 'clock' : 'flag', eyebrow: waiting ? 'Waiting on the client' : 'To become a shipment job',
    title: waiting ? 'Client to sign quotation '+q.id : plural(unmet.length,'thing')+' left before this can become a job',
    text: waiting ? 'Once '+custById(i.customerId).contact.name+' signs the conforme, record it here.' : 'You can price a request before every detail is known, but a job cannot run without them.',
    items, gateTitle:'What must be true first', primary: first ? first.act : null };
}
function renderInquiry(id){
  const i = INQUIRIES.find(x=>x.id===id);
  if(!i) return '<div class="ds-panel ds-panel--elevated">'+emptyState('search','Inquiry not found','','<a class="ds-btn ds-btn--secondary" href="#/inquiries">All inquiries</a>')+'</div>';
  const c = custById(i.customerId), q = i.quotationId ? QUOTATIONS[i.quotationId] : null, job = linkedJob(i), miss = inquiryMissing(i), st = inquiryStage(i);
  const n = dealNext(i);
  const nextHtml = '<section class="ds-next ds-next--'+n.tone+'" id="next-step"><div class="ds-next__head"><span class="ds-next__icon">'+icon(n.icon)+'</span><div><div class="ds-next__eyebrow">'+esc(n.eyebrow)+'</div><h2 class="ds-next__title">'+esc(n.title)+'</h2><p class="ds-next__text">'+esc(n.text)+'</p></div></div>'+
    (n.items.length?'<div class="ds-next__body"><div><div class="ds-gate__title"><span>'+esc(n.gateTitle||'')+'</span><span>'+n.items.filter(x=>x.met).length+' of '+n.items.length+' done</span></div><ul class="ds-gate">'+n.items.map(gateItemHtml).join('')+'</ul></div></div>':'')+
    '<div class="ds-next__foot"><div class="ds-next__who">'+(['New','Quoted'].includes(st.key)?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openDecline(\''+i.id+'\')">Decline inquiry</button>':'')+'</div><div class="ds-next__actions">'+(n.primary?'<button class="ds-btn ds-btn--primary" id="next-primary" onclick="'+n.primary.js+'">'+icon(n.primary.icon)+esc(n.primary.label)+'</button>':'')+'</div></div></section>';
  const stepState = k => { const done = [true, !!q, !!(q&&q.conforme), !!job][k]; const firstOpen = [true, !!q, !!(q&&q.conforme), !!job].indexOf(false); return done ? 'done' : (k===firstOpen ? 'current' : 'todo'); };
  const field = (label, key)=>kv(label, String(i[key]||'').trim() ? esc(i[key]) : '<span class="ds-overdue">'+icon('alert')+' Missing</span>');
  const step1 = '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>Inquiry</h3><button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openEditInquiry(\''+i.id+'\')">'+icon('plus')+'Edit details</button></div><div class="ds-panel__body ds-grid-kv ds-kv">'+
    kv('Cargo', esc(i.cargo))+kv('Route', esc(i.origin+' → '+i.portOfEntry+' → '+i.destination))+field('Container type','containerType')+field('Requested pickup','pickupDate')+field('Delivery address','deliveryAddress')+kv('Received', esc(i.dateReceived+' · '+i.assignedTo))+'</div></section>';
  const last = q ? q.versions[q.versions.length-1] : null;
  const step2 = '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>Quotation'+(q?' <span class="ds-mono ds-muted ds-small">'+q.id+'</span>':'')+'</h3>'+
    (q && !q.conforme ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openReviseQuote(\''+q.id+'\')">'+icon('plus')+'Revise</button>' : q ? '<span class="ds-readonly">'+icon('lock')+'Approved version locked</span>' : '')+'</div>'+
    (q ? '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Version</th><th>Date</th><th class="ds-num">Total</th><th>Terms</th><th>What changed</th></tr></thead><tbody>'+q.versions.slice().reverse().map(v=>'<tr'+(v===last?' aria-selected="true"':'')+'><td data-label="Version"><strong class="ds-strong">v'+v.v+'</strong>'+(v===last?' '+pill('Current','brand',null,'ds-pill--sm'):'')+'</td><td data-label="Date">'+esc(v.date)+'</td><td data-label="Total" class="ds-num">'+money(v.total)+'</td><td data-label="Terms">'+esc(v.terms)+'</td><td data-label="Notes" style="white-space:normal">'+esc(v.notes)+'</td></tr>').join('')+'</tbody></table></div>'+
      '<div class="ds-panel__foot ds-muted ds-xs">Every version is kept, so it is always clear what the client was offered and when.</div>'
      : '<div class="ds-panel__body ds-muted">No quotation yet.</div>')+'</section>';
  const step3 = '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>Client approval (conforme)</h3></div><div class="ds-panel__body">'+
    (q && q.conforme ? '<div class="ds-alert ds-alert--success" id="conforme-box">'+icon('check')+'<div><strong>Approved by '+esc(q.conforme.approvedBy)+' on '+esc(q.conforme.date)+'</strong>'+esc(q.conforme.method)+(q.conforme.version?' · version v'+q.conforme.version:'')+(q.conforme.file?' · '+esc(q.conforme.file):'')+'</div></div>'
      : '<p class="ds-muted">'+(q?'Waiting for '+esc(c.contact.name)+' to sign the quotation.':'Comes after the quotation.')+'</p>')+'</div></section>';
  const step4 = '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>Shipment job</h3></div><div class="ds-panel__body">'+
    (job ? '<div class="ds-row--between"><span class="ds-row">'+jobLink(job.id)+stagePill(job)+healthPill(job)+'</span><a class="ds-btn ds-btn--secondary ds-btn--sm" href="#/jobs/'+job.id+'">Open job</a></div>'
      : '<p class="ds-muted">Created in one click once the client has approved. Customer, cargo, route, container type, delivery address, quoted total and terms all carry over.</p>')+'</div></section>';
  const steps = [step1,step2,step3,step4].map((h,k)=>'<div class="ds-deal__step" data-state="'+stepState(k)+'"><span class="ds-deal__n">'+(stepState(k)==='done'?icon('check'):(k+1))+'</span>'+h+'</div>').join('');
  return '<nav class="ds-crumbs"><a href="#/inquiries">Inquiries &amp; quotes</a>'+icon('chevron-right')+'<span class="ds-mono">'+i.id+'</span></nav>'+
    '<header class="ds-jobhead"><div><h1>'+i.id+' '+inquiryPill(i)+'</h1><div class="ds-jobhead__line"><strong class="ds-strong">'+(can('Customer Mgmt')?'<a class="ds-link" href="#/customers/'+c.id+'">'+esc(c.name)+'</a>':esc(c.name))+'</strong><span>'+esc(i.cargo)+'</span><span>Owner '+esc(i.assignedTo)+'</span></div></div></header>'+
    '<div class="ds-stack">'+nextHtml+'<div class="ds-deal">'+steps+'</div></div>';
}
function inquiryFormFields(i, presetCustomer){
  const cust = custById(i ? i.customerId : (presetCustomer||CUSTOMERS[0].id));
  const ports = ['Manila, PH','Batangas, PH','Subic, PH','Cavite, PH','Cebu, PH','Davao, PH'];
  return (i ? '' : '<div class="ds-field"><label for="inq-cust">Customer</label>'+selectWrap('<select class="ds-select" id="inq-cust" name="customerId" onchange="const c=CUSTOMERS.find(x=>x.id===this.value); document.getElementById(\'inq-addr\').value=c.consignees[0].address">'+options(CUSTOMERS.map(c=>({value:c.id,label:c.name})), cust.id)+'</select>')+
      '<button type="button" class="ds-link ds-xs" style="margin-top:4px" onclick="openNewCustomer(true)">'+icon('plus')+'Customer not listed? Add them first</button></div>')+
    '<div class="ds-field"><label for="inq-cargo">Cargo</label><input class="ds-input" id="inq-cargo" name="cargo" value="'+esc(i?i.cargo:'')+'" placeholder="e.g. Insured goods, 1 container">'+errorSlot('cargo')+'</div>'+
    '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="inq-origin">From (foreign port)</label><input class="ds-input" id="inq-origin" name="origin" value="'+esc(i?i.origin:'')+'" placeholder="e.g. Shanghai, CN">'+errorSlot('origin')+'</div>'+
    '<div class="ds-field"><label for="inq-port">Port of entry</label>'+selectWrap('<select class="ds-select" id="inq-port" name="portOfEntry">'+options(ports, i?i.portOfEntry:'Manila, PH')+'</select>')+'</div></div>'+
    '<div class="ds-field"><label for="inq-dest">Final destination</label><input class="ds-input" id="inq-dest" name="destination" value="'+esc(i?i.destination:'')+'" placeholder="City, PH">'+errorSlot('destination')+'</div>'+
    '<div class="ds-label" style="margin-top:var(--t1m-space-4)">Needed before it can become a job</div>'+
    '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="inq-ctype">Container type</label>'+selectWrap('<select class="ds-select" id="inq-ctype" name="containerType"><option value="">Not known yet</option>'+options(CONTAINER_TYPES, i?i.containerType:'')+'</select>')+'</div>'+
    '<div class="ds-field"><label for="inq-pickup">Requested pickup</label><input class="ds-input" id="inq-pickup" name="pickupDate" value="'+esc(i?i.pickupDate:'')+'" placeholder="e.g. 05 Oct 2026"></div></div>'+
    '<div class="ds-field"><label for="inq-addr">Delivery address</label><input class="ds-input" id="inq-addr" name="deliveryAddress" value="'+esc(i?i.deliveryAddress:cust.consignees[0].address)+'"></div>';
}
function openNewInquiry(presetCustomer){
  if(!can('Inquiry & Quotation')){ showToast('Your role cannot register inquiries.', 'danger', 'lock'); return; }
  openDrawer({ title:'New inquiry', sub:'A client asking for a price. Only cargo and route are needed to start.',
    body:'<form class="ds-stack--sm" id="inq-form" onsubmit="event.preventDefault(); saveNewInquiry(this)">'+inquiryFormFields(null, presetCustomer)+'</form>',
    foot: drawerFoot('Register inquiry','inq-form',{icon:'plus'}) });
}
function readInquiryForm(form){
  const fd = new FormData(form), v = k=>String(fd.get(k)||'').trim();
  const bad = fieldError(form,'cargo', v('cargo')?'':'Describe the cargo.') | fieldError(form,'origin', v('origin')?'':'Where does it ship from?') | fieldError(form,'destination', v('destination')?'':'Where does it go?');
  if(bad) return null;
  if(v('pickupDate') && !parseDMY(v('pickupDate'))){ showToast('Enter the pickup date like 05 Oct 2026, or leave it empty.', 'danger', 'alert'); return null; }
  return { customerId:v('customerId'), cargo:v('cargo'), origin:v('origin'), portOfEntry:v('portOfEntry'), destination:v('destination'), containerType:v('containerType'), pickupDate:v('pickupDate'), deliveryAddress:v('deliveryAddress') };
}
function saveNewInquiry(form){
  const d = readInquiryForm(form); if(!d) return;
  const inq = Object.assign({ id:'INQ-2026-00'+(41+INQUIRIES.length), dateReceived:todayDMY(), assignedTo: isDispatcher() ? CURRENT_USER.name : coordinatorFor(d.customerId), status:'New', quotationId:null }, d);
  INQUIRIES.push(inq);
  closeDrawer();
  const miss = inquiryMissing(inq);
  showToast(inq.id+' registered.'+(miss.length?' Still missing: '+miss.join(', ').toLowerCase()+'.':''), 'success', 'quote');
  go('#/inquiries/'+inq.id);
}
function openEditInquiry(id){
  const i = INQUIRIES.find(x=>x.id===id);
  openDrawer({ title:'Edit inquiry details', sub:'<span class="ds-mono">'+i.id+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="inq-form" onsubmit="event.preventDefault(); saveEditInquiry(\''+id+'\', this)">'+inquiryFormFields(i)+'</form>',
    foot: drawerFoot('Save details','inq-form',{icon:'check'}) });
}
function saveEditInquiry(id, form){
  const i = INQUIRIES.find(x=>x.id===id); const d = readInquiryForm(form); if(!d) return;
  delete d.customerId; Object.assign(i, d);
  closeDrawer(); showToast('Details saved.'+(inquiryMissing(i).length?'':' Nothing missing now.'), 'success', 'check'); render();
}
function openCreateQuote(inqId){
  const i = INQUIRIES.find(x=>x.id===inqId);
  openDrawer({ title:'Create quotation', sub:'<span class="ds-mono">'+i.id+'</span> · '+esc(custById(i.customerId).name),
    body:'<form class="ds-stack--sm" id="qt-form" onsubmit="event.preventDefault(); saveQuote(\''+inqId+'\', null, this)">'+quoteFields({ total:150000, terms:'Net 30', notes:'' }, false)+'</form>',
    foot: drawerFoot('Create v1','qt-form',{icon:'quote'}) });
}
function quoteFields(v, revising){
  return '<div class="ds-field"><label for="qt-total">Total</label><div class="ds-input-group"><span class="ds-affix">PHP</span><input class="ds-input" id="qt-total" name="total" type="number" step="0.01" value="'+v.total+'"></div>'+errorSlot('total')+'</div>'+
    '<div class="ds-field"><label for="qt-terms">Terms</label><input class="ds-input" id="qt-terms" name="terms" value="'+esc(v.terms)+'"></div>'+
    '<div class="ds-field"><label for="qt-notes">'+(revising?'What changed from the last version?':'Notes <span class="ds-opt">optional</span>')+'</label><textarea class="ds-textarea" id="qt-notes" name="notes" style="min-height:72px">'+(revising?'':esc(v.notes))+'</textarea>'+errorSlot('notes')+'</div>';
}
function openReviseQuote(qid){
  const q = QUOTATIONS[qid], last = q.versions[q.versions.length-1];
  openDrawer({ title:'Revise quotation', sub:'<span class="ds-mono">'+q.id+'</span> · becomes v'+(last.v+1)+'; v'+last.v+' is kept',
    body:'<form class="ds-stack--sm" id="qt-form" onsubmit="event.preventDefault(); saveQuote(null, \''+qid+'\', this)">'+quoteFields(last, true)+'</form>',
    foot: drawerFoot('Save v'+(last.v+1),'qt-form',{icon:'quote'}) });
}
function saveQuote(inqId, qid, form){
  const fd = new FormData(form), total = Number(fd.get('total')), notes = String(fd.get('notes')||'').trim();
  if(fieldError(form,'total', total>0?'':'Enter the quoted total.')) return;
  if(qid){
    if(fieldError(form,'notes', notes?'':'Say what changed, so the history makes sense later.')) return;
    const q = QUOTATIONS[qid], last = q.versions[q.versions.length-1];
    q.versions.push({ v:last.v+1, date:todayDMY(), total, terms:String(fd.get('terms')||''), notes });
    closeDrawer(); showToast(q.id+' v'+(last.v+1)+' saved. Earlier versions are kept.', 'success', 'quote'); render(); return;
  }
  const i = INQUIRIES.find(x=>x.id===inqId);
  const id = 'QT-2026-00'+(41+Object.keys(QUOTATIONS).length+1);
  QUOTATIONS[id] = { id, inquiryId:inqId, versions:[{ v:1, date:todayDMY(), total, terms:String(fd.get('terms')||''), notes:notes||'Initial quotation.' }], conforme:null };
  i.quotationId = id; i.status = 'Quoted';
  closeDrawer(); showToast('Quotation '+id+' v1 created: '+money(total)+'.', 'success', 'quote'); render();
}
function openConforme(qid){
  const q = QUOTATIONS[qid], i = INQUIRIES.find(x=>x.id===q.inquiryId), c = custById(i.customerId), last = q.versions[q.versions.length-1];
  openDrawer({ title:'Record client approval', sub:'The conforme: the client’s signed acceptance of <span class="ds-mono">'+q.id+'</span> v'+last.v+' ('+money(last.total)+')',
    body:'<form class="ds-stack--sm" id="cf-form" onsubmit="event.preventDefault(); saveConforme(\''+qid+'\', this)">'+
      '<div class="ds-field"><label for="cf-who">Approved by</label><input class="ds-input" id="cf-who" name="who" value="'+esc(c.contact.name)+'">'+errorSlot('who')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="cf-date">Date</label><input class="ds-input" id="cf-date" name="date" value="'+todayDMY()+'">'+errorSlot('date')+'</div>'+
      '<div class="ds-field"><label for="cf-method">How</label>'+selectWrap('<select class="ds-select" id="cf-method" name="method">'+options(['Signed conforme (PDF)','Email confirmation','Signed in person'])+'</select>')+'</div></div>'+
      '<div class="ds-field"><label>Signed copy <span class="ds-opt">optional</span></label>'+uploadHtml('conformeFile','The signed quotation')+'</div></form>',
    foot: drawerFoot('Save approval','cf-form',{icon:'check'}) });
}
function saveConforme(qid, form){
  const fd = new FormData(form), who = String(fd.get('who')||'').trim(), date = String(fd.get('date')||'').trim();
  if(fieldError(form,'who', who?'':'Who at the client approved it?') | fieldError(form,'date', parseDMY(date)?'':'Enter the date like 28 Sep 2026.')) return;
  const q = QUOTATIONS[qid];
  q.conforme = { approvedBy:who, date, method:String(fd.get('method')), file:UPLOADS.conformeFile||null, version:q.versions[q.versions.length-1].v };
  closeDrawer(); showToast('Client approval recorded.', 'success', 'check'); render();
}
function openDecline(id){
  openDrawer({ title:'Decline inquiry', sub:'<span class="ds-mono">'+id+'</span>',
    body:'<form class="ds-stack--sm" id="dec-form" onsubmit="event.preventDefault(); saveDecline(\''+id+'\', this)"><div class="ds-field"><label for="dec-why">Why?</label><textarea class="ds-textarea" id="dec-why" name="why" placeholder="e.g. Client chose another forwarder"></textarea>'+errorSlot('why')+'</div></form>',
    foot: drawerFoot('Decline','dec-form',{danger:true}) });
}
function saveDecline(id, form){
  const why = String(new FormData(form).get('why')||'').trim();
  if(fieldError(form,'why', why?'':'Give a reason; it helps sales later.')) return;
  const i = INQUIRIES.find(x=>x.id===id); i.status = 'Declined'; i.declineReason = why;
  closeDrawer(); showToast(id+' declined.', 'info', 'x'); render();
}
function openConvert(inqId){
  const i = INQUIRIES.find(x=>x.id===inqId), q = QUOTATIONS[i.quotationId], c = custById(i.customerId), v = q.versions[q.versions.length-1];
  if(!q.conforme || inquiryMissing(i).length){ showToast('Record the client approval and fill the missing details first.', 'danger', 'lock'); return; }
  const f = (k,val)=>'<dt>'+esc(k)+'</dt><dd>'+esc(val)+'</dd>';
  openDrawer({ title:'Create shipment job', sub:'From <span class="ds-mono">'+i.id+'</span> and <span class="ds-mono">'+q.id+'</span> v'+v.v,
    body:'<div class="ds-stack--sm"><div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>Nothing to retype</strong>These details carry over as they are.</div></div>'+
      '<dl class="ds-facts">'+f('Customer',c.name)+f('Cargo',i.cargo)+f('From',i.origin)+f('Port of entry',i.portOfEntry)+f('To',i.destination)+f('Container type',i.containerType)+f('Pickup',i.pickupDate)+f('Deliver to',i.deliveryAddress)+f('Quoted total',money(v.total))+f('Terms',v.terms)+f('Approved by',q.conforme.approvedBy+', '+q.conforme.date)+'</dl>'+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Set up automatically</strong>Five required documents (all missing), the standard task list with owners, and the job’s history.</div></div></div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--primary" id="create-job" onclick="convertToJob(\''+inqId+'\')">'+icon('box')+'Create shipment job</button>' });
}
function convertToJob(inqId){
  const i = INQUIRIES.find(x=>x.id===inqId), q = QUOTATIONS[i.quotationId];
  const existing = linkedJob(i);
  if(existing){ closeDrawer(); go('#/jobs/'+existing.id); return; }
  const n = 111 + JOBS.length, v = q.versions[q.versions.length-1], line = SHIPPING_LINES[n%SHIPPING_LINES.length];
  const cust = custById(i.customerId);
  const j = job({ id:'SJ-2026-00'+n, customerId:i.customerId, commodity:i.cargo, origin:i.origin, portOfEntry:i.portOfEntry, destination:i.destination,
    containerNo:'TMWU-'+(100000+n)+'-'+(n%9+1), blNo:'BL-2026-0'+(4500+n), consignee:cust.consignees[0].name, ownership:'Direct',
    shippingLine:line, vessel:line.split(' ')[0]+' '+i.origin.split(',')[0], voyage:(100+n%99)+(n%2?'E':'W'), declaredValue:v.total*6, quotationId:q.id,
    eta:addDaysDMY(14), statusIndex:0,
    auditLog:[{ ts:nowStamp(), actor:actorLabel(), action:'Job created', detail:'Converted from '+i.id+' / '+q.id+' v'+v.v+'. No re-keying.' }] });
  JOBS.push(j); i.status = 'Converted';
  closeDrawer(); showToast('Shipment job '+j.id+' created.', 'success', 'box');
  STATE.justNext = j.id; go('#/jobs/'+j.id);
}

/* ============================== CUSTOMERS ============================== */
function normName(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\b(inc|corp|co|ltd|corporation|company|the)\b/g,'').replace(/\s+/g,' ').trim(); }
function renderCustomers(){
  const q = STATE.customerQuery.trim().toLowerCase();
  const rows = CUSTOMERS.filter(c=>!q || (c.name+' '+c.contact.name+' '+c.city).toLowerCase().includes(q)).map(c=>{
    const jobs = JOBS.filter(j=>j.customerId===c.id && j.statusIndex<8), inq = INQUIRIES.filter(i=>i.customerId===c.id && ['New','Quoted','Approved'].includes(inquiryStage(i).key));
    const att = jobs.filter(j=>['danger','warning'].includes(jobHealth(j).tone)).length;
    return '<tr data-href onclick="go(\'#/customers/'+c.id+'\')"><td data-label="Customer"><span class="ds-cell-name"><span class="ds-cell-primary">'+esc(c.name)+'</span><span class="ds-cell-sub">'+esc(c.city)+'</span></span></td>'+
      '<td data-label="Contact">'+esc(c.contact.name)+'</td><td data-label="Coordinator">'+esc(coordinatorFor(c.id))+'</td>'+
      '<td data-label="Active jobs" class="ds-num">'+jobs.length+(att?' '+pill(att+' need attention','warning','alert','ds-pill--sm'):'')+'</td><td data-label="Open inquiries" class="ds-num">'+inq.length+'</td></tr>';
  }).join('');
  return '<div class="ds-page-head"><div><h1>Customers</h1><p class="ds-page-head__sub">One reference for every client: contacts, consignees, delivery instructions and their full history.</p></div>'+
    '<div class="ds-page-head__actions"><button class="ds-btn ds-btn--primary" onclick="openNewCustomer()">'+icon('plus')+'New customer</button></div></div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body"><div class="ds-search" style="max-width:420px">'+icon('search')+'<input class="ds-input" id="customer-search" placeholder="Name, contact or city" value="'+esc(STATE.customerQuery)+'" oninput="STATE.customerQuery=this.value; render()"></div></div>'+
    '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Customer</th><th>Contact</th><th>Coordinator</th><th class="ds-num">Active jobs</th><th class="ds-num">Open inquiries</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="5">'+emptyState('search','No customers match','Try part of the name, or add them as a new customer.')+'</td></tr>')+'</tbody></table></div></section>';
}
function openNewCustomer(fromInquiry){
  openDrawer({ title:'New customer', sub:'Only the name is required. Everything else can be added later.',
    body:'<form class="ds-stack--sm" id="cust-form" onsubmit="event.preventDefault(); saveCustomer(this, '+(fromInquiry?'true':'false')+')">'+
      '<div class="ds-field"><label for="nc-name">Company name</label><input class="ds-input" id="nc-name" name="name" placeholder="e.g. Test Freight Co." oninput="checkDuplicate(this.value)" autocomplete="off">'+errorSlot('name')+'</div><div id="nc-dup"></div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="nc-contact">Contact person</label><input class="ds-input" id="nc-contact" name="contact"></div><div class="ds-field"><label for="nc-phone">Phone <span class="ds-opt">optional</span></label><input class="ds-input" id="nc-phone" name="phone"></div></div>'+
      '<div class="ds-field"><label for="nc-city">City</label><input class="ds-input" id="nc-city" name="city" placeholder="e.g. Pasig, PH"></div>'+
      '<div class="ds-field"><label for="nc-addr">Delivery address</label><input class="ds-input" id="nc-addr" name="address"></div>'+
      '<div class="ds-field"><label for="nc-instr">Delivery instructions <span class="ds-opt">shown to the crew on every delivery</span></label><textarea class="ds-textarea" id="nc-instr" name="instructions" style="min-height:64px" placeholder="e.g. Call the dock 30 minutes before arrival"></textarea></div></form>',
    foot: drawerFoot('Save customer','cust-form',{icon:'check'}) });
}
function checkDuplicate(v){
  const n = normName(v);
  const m = n.length>=3 ? CUSTOMERS.find(c=>normName(c.name)===n || normName(c.name).startsWith(n) || n.startsWith(normName(c.name))) : null;
  document.getElementById('nc-dup').innerHTML = m ? '<div class="ds-alert ds-alert--warning" id="dup-warning">'+icon('alert')+'<div><strong>Possible duplicate</strong>“'+esc(m.name)+'” already exists. Check it is not the same company before adding another record.<div class="ds-alert__actions"><button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" onclick="closeDrawer(); go(\'#/customers/'+m.id+'\')">Open '+esc(m.name)+'</button></div></div></div>' : '';
}
function saveCustomer(form, fromInquiry){
  const fd = new FormData(form), v = k=>String(fd.get(k)||'').trim();
  if(fieldError(form,'name', v('name')?'':'Enter the company name.')) return;
  const addr = v('address')||'—', id = 'CUST-0'+(CUSTOMERS.length+1);
  CUSTOMERS.push({ id, name:v('name'), city:v('city')||'—', contact:{ name:v('contact')||'—', email:'—', phone:v('phone')||'—' }, consignees:[{ name:v('name')+' — Main', address:addr }], deliveryAddresses:[addr], requirements:'None recorded.', instructions:v('instructions')||'None recorded.' });
  DISPATCHER_FOR_CUSTOMER[id] = isDispatcher() ? CURRENT_USER.name : 'Ana Cruz';
  closeDrawer(); showToast(v('name')+' saved.', 'success', 'check');
  if(fromInquiry){ openNewInquiry(id); return; }
  go('#/customers/'+id);
}
function renderCustomer(id){
  const c = custById(id);
  if(!c) return '<div class="ds-panel ds-panel--elevated">'+emptyState('search','Customer not found','','<a class="ds-btn ds-btn--secondary" href="#/customers">All customers</a>')+'</div>';
  const jobs = JOBS.filter(j=>j.customerId===id), inqs = INQUIRIES.filter(i=>i.customerId===id);
  const f = (k,v)=>'<dt>'+esc(k)+'</dt><dd>'+v+'</dd>';
  return '<nav class="ds-crumbs"><a href="#/customers">Customers</a>'+icon('chevron-right')+'<span>'+esc(c.name)+'</span></nav>'+
    '<div class="ds-page-head"><div><h1>'+esc(c.name)+'</h1><p class="ds-page-head__sub">'+esc(c.city)+' · coordinator '+esc(coordinatorFor(id))+'</p></div><div class="ds-page-head__actions"><button class="ds-btn ds-btn--primary" id="cust-new-inquiry" onclick="openNewInquiry(\''+id+'\')">'+icon('plus')+'New inquiry</button></div></div>'+
    '<div class="ds-split"><div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('box')+'Shipments</h2><span class="ds-panel__hint">'+plural(jobs.length,'job')+'</span></div>'+
        (jobs.length ? '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Job</th><th>Stage</th><th>Health</th><th>Next step</th></tr></thead><tbody>'+jobs.map(j=>'<tr data-href onclick="go(\'#/jobs/'+j.id+'\')"><td data-label="Job"><span class="ds-mono ds-cell-primary">'+j.id+'</span></td><td data-label="Stage">'+stagePill(j)+'</td><td data-label="Health">'+healthPill(j)+'</td><td data-label="Next step" style="white-space:normal">'+esc(nextStep(j).short)+'</td></tr>').join('')+'</tbody></table></div>'
          : '<div class="ds-panel__body ds-muted">No shipments yet.</div>')+'</section>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('quote')+'Inquiries &amp; quotes</h2></div>'+
        (inqs.length ? '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Inquiry</th><th>Cargo</th><th>Stage</th></tr></thead><tbody>'+inqs.map(i=>'<tr data-href onclick="go(\'#/inquiries/'+i.id+'\')"><td data-label="Inquiry"><span class="ds-mono ds-cell-primary">'+i.id+'</span></td><td data-label="Cargo">'+esc(i.cargo)+'</td><td data-label="Stage">'+inquiryPill(i)+'</td></tr>').join('')+'</tbody></table></div>'
          : '<div class="ds-panel__body ds-muted">No inquiries yet.</div>')+'</section>'+
    '</div><div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('user')+'Contact</h3></div><div class="ds-panel__body"><dl class="ds-facts">'+f('Name',esc(c.contact.name))+f('Email',esc(c.contact.email))+f('Phone',esc(c.contact.phone))+'</dl></div></section>'+
      '<div class="ds-alert ds-alert--info">'+icon('truck')+'<div><strong>Delivery instructions</strong>'+esc(c.instructions)+'<div class="ds-muted ds-xs" style="margin-top:4px">Shown to the crew on every delivery for this customer.</div></div></div>'+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Requirements</strong>'+esc(c.requirements)+'</div></div>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h3>'+icon('pin')+'Consignees &amp; addresses</h3></div><div class="ds-panel__body ds-stack--sm">'+c.consignees.map(x=>'<div><div class="ds-strong">'+esc(x.name)+'</div><div class="ds-muted ds-small">'+esc(x.address)+'</div></div>').join('')+c.deliveryAddresses.map(a=>'<div class="ds-muted ds-small">'+icon('pin')+' '+esc(a)+'</div>').join('')+'</div></section>'+
    '</div></div>';
}
