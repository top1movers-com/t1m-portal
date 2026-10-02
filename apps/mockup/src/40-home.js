/* ============================== HOME (Stage 5) ==============================
   Admin + Manager land on the Dashboard: "Needs attention" first, then four tabs of analytics.
   Sales, Operations and Accounting land on "My Work": to-do lists only, no charts. */
function greeting(){ const h = new Date().getHours(); return (h<12?'Good morning':h<18?'Good afternoon':'Good evening')+', '+CURRENT_USER.name.split(' ')[0]+'.'; }
function queueHtml(items, emptyText){
  if(!items.length) return '<div class="ds-queue__empty">'+icon('check')+'<span>'+esc(emptyText)+'</span></div>';
  return '<ul class="ds-queue">'+items.map((x,i)=>
    '<li class="ds-queue__item" data-tone="'+x.tone+'" style="--i:'+i+'"><span class="ds-queue__icon">'+icon(x.icon)+'</span>'+
      '<div style="min-width:0;cursor:pointer" onclick="'+(x.open||'go(\''+x.href+'\')')+'"><div class="ds-queue__title">'+esc(x.title)+'</div><div class="ds-queue__meta">'+(x.meta||[]).map(m=>'<span'+(/^(INQ|SJ|FR)-/.test(m)?' class="ds-mono"':'')+'>'+esc(m)+'</span>').join('')+'</div>'+
      (x.why?'<div class="ds-queue__why'+(x.whyTone?' ds-queue__why--'+x.whyTone:'')+'">'+esc(x.why)+'</div>':'')+'</div>'+
      '<div class="ds-queue__actions">'+(x.btn?'<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="event.stopPropagation(); '+x.btn.js+'">'+esc(x.btn.label)+'</button>':'')+'</div></li>').join('')+'</ul>';
}
const TONE_RANK = { danger:0, warning:1, brand:2, info:3, success:4, neutral:5, '':6 };
const byTone = (a,b)=>TONE_RANK[a.tone]-TONE_RANK[b.tone];
const cname = id => (custById(id)||{}).name || '';

/* ---------- My Work ---------- */
function salesWork(){
  const out = [];
  INQUIRIES.filter(i=>i.staff.includes(me())).forEach(i=>{
    const s = inqStatus(i), v = latestV(i), meta = [i.id, cname(i.customerId), servicesText(i.services)], href = '#/inquiries/'+i.id;
    if(['preparing','revise','expired'].includes(s.key)) out.push({ tone: s.key==='preparing'?'info':'warning', icon:'upload', title:'Upload quotation v'+(v?v.v+1:1), meta, href,
      why: s.key==='preparing' ? 'New inquiry assigned to you.' : s.key==='expired' ? 'v'+v.v+' expired on '+v.validUntil+'.' : REVISE_LABEL[v.status]+': '+((v.review&&v.review.decision==='Returned')?v.review.reasonType:(v.outcome?v.outcome.reasonType:'')),
      whyTone: s.key==='preparing'?null:'warning', btn:{ label:'Upload', js: s.key==='expired' ? "openUploadQuote('"+i.id+"',true)" : "openUploadQuote('"+i.id+"')" } });
    if(s.key==='ready') out.push({ tone:'brand', icon:'arrow-right', title:'Send v'+v.v+' to the client', meta, href, why:'Approved by '+v.review.by+'.', btn:{ label:'Mark as sent', js:"openMarkSent('"+i.id+"')" } });
    if(s.key==='awaiting'){ const d = awaitingDays(i), late = d>=SETTINGS.awaitingClientDays;
      out.push({ tone: late?'warning':'info', icon:'clock', title:'Follow up: awaiting client · '+plural(d,'day'), meta, href, why:'Sent '+v.sent.on+' via '+v.sent.channel+'. Valid until '+v.validUntil+'.', whyTone: late?'warning':null, btn:{ label:'Record response', js:"openClientOutcome('"+i.id+"')" } }); }
  });
  return out.sort(byTone);
}
function opsWork(){
  const out = [];
  JOBS.filter(j=>j.ops.includes(me()) && j.status!=='Completed').forEach(j=>{
    const meta = [j.id, cname(j.customerId), servicesText(j.services)], href = '#/jobs/'+j.id, iss = openIssue(j);
    if(j.status==='For closing') return;
    if(iss) out.push({ tone:'danger', icon:'lock', title:'On hold: '+iss.reason, meta, href, why:'Resolve it so the job can move again.', whyTone:'danger', btn:{ label:'Resolve', js:"openResolveIssue('"+j.id+"','"+iss.id+"')" } });
    else { const k = nextMsIndex(j);
      if(k>=0) out.push({ tone:'info', icon:SERVICES[j.ms[k].svc].icon, title:'Next: '+j.ms[k].name, meta, href, why:j.ms[k].phase+(pendingDocs(j).length?' · '+plural(pendingDocs(j).length,'document')+' still pending':''), btn:{ label:'Mark done', js:"openMilestone('"+j.id+"',"+k+")" } });
      else out.push({ tone: closingGate(j).every(g=>g.ok)?'brand':'warning', icon:'flag', title: closingGate(j).every(g=>g.ok)?'Submit for closing':'Finish the closing checklist', meta, href, why:closingGate(j).filter(g=>!g.ok).map(g=>g.label+': '+g.sub).join(' · ')||'Everything is done.', btn: closingGate(j).every(g=>g.ok)?{ label:'Submit', js:"submitForClosing('"+j.id+"')" }:{ label:'Open', js:"goTab('"+j.id+"','documents')" } }); }
    jobClocks(j).filter(c=>c.state==='running' && c.left<=3).forEach(c=>out.push({ tone:c.left<=0?'danger':'warning', icon:'clock', title:c.label+': '+clockText(c), meta, href, why:'Fees ('+c.risk+') start after '+c.lastFree+'. Stops at '+c.ends+'.', whyTone:c.left<=0?'danger':'warning', btn:{ label:'Open', js:"go('"+href+"')" } }));
    if(clockApplies(j) && j.free && j.free.portDays==null) out.push({ tone:'warning', icon:'clock', title:'Set free days', meta, href, btn:{ label:'Set', js:"openFreeDays('"+j.id+"')" } });
  });
  JOBS.filter(j=>j.ops.includes(me())).forEach(j=>j.funds.forEach(f=>{
    const meta = [f.id, j.id, cname(j.customerId)], href = '#/jobs/'+j.id+'/money';
    if(f.status==='Returned' && f.by===me()) out.push({ tone:'warning', icon:'refresh', title:'Fund request returned: '+f.purpose, meta, href, why:f.review.comment, whyTone:'warning', btn:{ label:'Edit & resubmit', js:"openFundRequest('"+j.id+"','"+f.id+"')" } });
    if(f.status==='Released'){ const d = daysBetween(f.release.on, todayDMY()), late = d>SETTINGS.unliquidatedDays;
      out.push({ tone: late?'warning':'info', icon:'receipt', title:'Liquidate '+money(f.amount)+' ('+f.purpose+')', meta, href, why:'Released '+f.release.on+' · '+plural(d,'day')+' ago'+(late?'. Overdue for liquidation.':'.'), whyTone: late?'warning':null, btn:{ label:'Liquidate', js:"openLiquidate('"+j.id+"','"+f.id+"')" } }); }
  }));
  return out.sort(byTone);
}
function acctWork(){
  const out = [];
  JOBS.forEach(j=>{
    j.funds.forEach(f=>{
      const meta = [f.id, j.id, cname(j.customerId)], href = '#/jobs/'+j.id+'/money';
      if(f.status==='Approved') out.push({ tone:'brand', icon:'arrow-out', title:'Release '+money(f.amount)+' to '+f.payee, meta, href, why:f.purpose+' · needed by '+f.neededBy+' · approved by '+f.review.by, whyTone: daysUntil(f.neededBy)<=0?'warning':null, btn:{ label:'Release', js:"openReleaseFund('"+j.id+"','"+f.id+"')" } });
      if(f.status==='Liquidated') out.push({ tone:'info', icon:'check', title:'Verify liquidation: '+money(f.liq.actual), meta, href, why:'Released '+money(f.amount)+' · '+f.purpose, btn:{ label:'Verify', js:"openVerify('"+j.id+"','"+f.id+"')" } });
    });
    if(ACCOUNTING_BASIC) return;
    const bs = billingStatus(j).key, meta = [j.id, cname(j.customerId)], href = '#/jobs/'+j.id+'/money';
    if(bs==='tobill') out.push({ tone:'brand', icon:'receipt', title:'Ready to bill', meta, href, why:'Completed '+j.completed.on+' · pass-through on file '+money(reimbursable(j)), btn:{ label:'Upload SOA', js:"openUploadSOA('"+j.id+"')" } });
    if(bs==='returned') out.push({ tone:'warning', icon:'refresh', title:'SOA returned: '+latestBill(j).review.reasonType, meta, href, why:latestBill(j).review.comment, whyTone:'warning', btn:{ label:'Upload revised', js:"openUploadSOA('"+j.id+"')" } });
    if(bs==='ready') out.push({ tone:'brand', icon:'arrow-right', title:'Send the approved SOA', meta, href, btn:{ label:'Mark as sent', js:"openSendBill('"+j.id+"')" } });
    if(bs==='overdue') out.push({ tone:'danger', icon:'alert', title:'Overdue: '+money(latestBill(j).amount-paidTotal(j))+' unpaid', meta, href, why:'Due '+latestBill(j).dueDate+'.', whyTone:'danger', btn:{ label:'Record payment', js:"openPayment('"+j.id+"')" } });
  });
  return out.sort(byTone);
}
function myWorkSections(){
  const s = [];
  if(hasRole('Sales')) s.push({ key:'sales', title:'Inquiries & quotes', icon:'quote', items:salesWork(), empty:'Nothing waiting on you. New inquiries appear here when a manager assigns you.' });
  if(hasRole('Operations')) s.push({ key:'ops', title:'Jobs', icon:'box', items:opsWork(), empty:'No job steps waiting on you.' });
  if(hasRole('Accounting')) s.push({ key:'acct', title:'Money', icon:'wallet', items:acctWork(), empty:'No fund releases to approve or liquidations to review.' });
  return s;
}
function myWorkCount(){ return hasMyWork() ? sumOf(myWorkSections(), s=>s.items.length) : 0; }
function renderMyWork(){
  const secs = myWorkSections(), total = sumOf(secs, s=>s.items.length);
  const reports = INTAKE.filter(t=>t.by===me()).slice().reverse();
  const waiting = hasRole('Sales') ? INQUIRIES.filter(i=>i.staff.includes(me()) && ['approval','accepted'].includes(inqStatus(i).key)) : [];
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+esc(todayLong())+'. <strong>'+plural(total,'thing')+'</strong> waiting on you.</p></div>'+
    (hasRole('Sales') && !can('inquiry.create') ? '<div class="ds-page-head__actions"><button class="ds-btn ds-btn--secondary" onclick="openReportInquiry()">'+icon('flag')+'Report an inquiry to the manager</button></div>' : '')+'</div>'+
    '<div class="ds-stack">'+(secs.length ? secs.map(s=>'<section class="ds-panel ds-panel--elevated" id="mywork-'+s.key+'"><div class="ds-panel__head"><h2>'+icon(s.icon)+esc(s.title)+'</h2><span class="ds-panel__hint">'+plural(s.items.length,'item')+' · most urgent first</span></div>'+queueHtml(s.items, s.empty)+'</section>').join('')
      : '<div class="ds-panel ds-panel--elevated">'+emptyState('check','Nothing assigned','Your roles do not have a to-do list.')+'</div>')+
    (reports.length ? '<section class="ds-panel ds-panel--elevated" id="my-reports"><div class="ds-panel__head"><h2>'+icon('flag')+'My reports</h2><span class="ds-panel__hint">inquiries you reported to the manager</span></div>'+
      queueHtml(reports.map(t=>{ const st = intakeState(t); return { tone: t.status==='open'?'info':t.status==='done'?'success':'neutral', icon:st.icon, title:t.client+' · '+st.label+(t.inquiryId?' → '+t.inquiryId:''), meta:[t.on], why:t.note+(t.file?' · Attached: '+t.file:''), href:'#/mywork', open:"openIntake('"+t.id+"')", btn:{ label:'View', js:"openIntake('"+t.id+"')" } }; }), '')+'</section>' : '')+
    (waiting.length ? '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('clock')+'Waiting on a manager</h2><span class="ds-panel__hint">nothing to do yet</span></div>'+
      queueHtml(waiting.map(i=>({ tone:'neutral', icon:'clock', title:inqStatus(i).label, meta:[i.id, cname(i.customerId)], href:'#/inquiries/'+i.id })), '')+'</section>' : '')+'</div>';
}

/* ---------- Needs attention (Dashboard) ---------- */
function needsAttention(){
  const q = [], P = (p,o)=>q.push(Object.assign({ p }, o));
  const mgr = can('quote.approve');
  INTAKE.filter(t=>t.status==='open').forEach(t=>P(1, { tone:'brand', icon:'flag', title:'New inquiry reported: '+t.client, meta:[t.by, t.on], why:t.note+(t.file?' · Attached: '+t.file:''), href:'#/home', open:"openIntake('"+t.id+"')", btn:{ label:'View', js:"openIntake('"+t.id+"')" } }));
  USERS.filter(u=>u.pendingDeactivation).forEach(u=>P(0, { tone:'warning', icon:'users', title:'Reassign '+u.name+'’s open work before deactivation', meta:[rolesText(u)], why:'Requested by '+u.pendingDeactivation.by+'.', href:'#/users', btn: can('inquiry.create') ? { label:'Reassign', js:"openHandover('"+u.id+"')" } : null }));
  INQUIRIES.forEach(i=>{
    const s = inqStatus(i), v = latestV(i), meta = [i.id, cname(i.customerId)], href = '#/inquiries/'+i.id;
    if(s.key==='approval') P(2, { tone:'warning', icon:'eye', title:'Quote v'+v.v+' waiting for approval · '+amountText(v), meta:meta.concat([v.by]), href, btn: mgr ? { label:'Review', js:"openReviewQuote('"+i.id+"')" } : null });
    if(s.key==='accepted') P(3, { tone:'success', icon:'check', title:'Client accepted v'+v.v+': acknowledge and close', meta, href, btn: can('inquiry.close') ? { label:'Acknowledge', js:"openAckAccept('"+i.id+"')" } : null });
    if(s.key==='won') P(3, { tone:'brand', icon:'box', title:'Won: convert to job', meta, href, btn: can('job.convert') ? { label:'Convert', js:"openConvert('"+i.id+"')" } : null });
    if(s.key==='awaiting' && awaitingDays(i)>=SETTINGS.awaitingClientDays) P(8, { tone:'warning', icon:'clock', title:'Awaiting client response · '+plural(awaitingDays(i),'day'), meta:meta.concat([i.staff.join(', ')]), why:'Sent '+v.sent.on+'. Valid until '+v.validUntil+'.', href, btn:{ label:'Open', js:"go('"+href+"')" } });
    if(s.key==='expired') P(8, { tone:'warning', icon:'alert', title:'Quote expired with no answer', meta, href, btn: can('inquiry.close') ? { label:'Close as lost', js:"openCloseLost('"+i.id+"')" } : null });
  });
  JOBS.forEach(j=>{
    const meta = [j.id, cname(j.customerId)], href = '#/jobs/'+j.id, iss = openIssue(j);
    j.funds.filter(f=>f.status==='For approval').forEach(f=>P(2, { tone:'warning', icon:'wallet', title:'Fund request '+money(f.amount)+' waiting for approval', meta:[f.id].concat(meta), why:f.purpose+' · needed by '+f.neededBy, href:href+'/money', btn: can('fund.approve') ? { label:'Review', js:"openReviewFund('"+j.id+"','"+f.id+"')" } : null }));
    if(billingStatus(j).key==='approval') P(2, { tone:'warning', icon:'receipt', title:'SOA v'+latestBill(j).v+' waiting for approval · '+money(latestBill(j).amount), meta, href:href+'/money', btn: can('bill.approve') ? { label:'Review', js:"openReviewBill('"+j.id+"')" } : null });
    if(j.status==='For closing') P(4, { tone:'brand', icon:'flag', title:'Job submitted for closing', meta:meta.concat([j.submitted.by]), href, btn: can('job.complete') ? { label:'Confirm', js:"openConfirmComplete('"+j.id+"')" } : null });
    if(iss && j.status!=='Completed') P(1, { tone:'danger', icon:'lock', title:'On hold: '+iss.reason, meta:meta.concat([iss.by]), whyTone:'danger', href, btn:{ label:'Open', js:"go('"+href+"/issues')" } });
    jobClocks(j).filter(c=>c.state==='running' && c.left<=1).forEach(c=>P(5, { tone:c.left<=0?'danger':'warning', icon:'clock', title:c.label+': '+clockText(c), meta, why:'Fees ('+c.risk+') after '+c.lastFree+'.', whyTone:c.left<=0?'danger':'warning', href, btn:{ label:'Open', js:"go('"+href+"')" } }));
    if(billingStatus(j).key==='overdue') P(6, { tone:'danger', icon:'alert', title:'Billing overdue: '+money(latestBill(j).amount-paidTotal(j))+' unpaid', meta, why:'Due '+latestBill(j).dueDate+'.', whyTone:'danger', href:href+'/money', btn:{ label:'Open', js:"go('"+href+"/money')" } });
    j.funds.filter(f=>f.status==='Released' && daysBetween(f.release.on, todayDMY())>SETTINGS.unliquidatedDays).forEach(f=>P(7, { tone:'warning', icon:'receipt', title:'Cash advance not liquidated · '+plural(daysBetween(f.release.on, todayDMY()),'day'), meta:[f.id].concat(meta), why:money(f.amount)+' released '+f.release.on+' to '+f.by+'.', href:href+'/money', btn:{ label:'Open', js:"go('"+href+"/money')" } }));
  });
  return q.sort((a,b)=>a.p-b.p || byTone(a,b));
}

/* ---------- Dashboard ---------- */
const RANGES = { 'This month':1, 'Last 3 months':3, 'Last 6 months':6, 'All time':null };
function inRange(dmy){
  const m = RANGES[STATE.dashRange]; if(!m) return true;
  const d = parseDMY(dmy); if(!d) return false;
  return d >= new Date(TODAY.getFullYear(), TODAY.getMonth()-m+1, 1);
}
function scopeMatch(x){ return !STATE.dashScope || scopeKey(x)===STATE.dashScope; }
function dashInq(){ return INQUIRIES.filter(i=>inRange(i.createdOn) && (!STATE.dashService||i.services.includes(STATE.dashService)) && scopeMatch(i) && (!STATE.dashCustomer||i.customerId===STATE.dashCustomer) && (!STATE.dashStaff||i.staff.includes(STATE.dashStaff))); }
function dashJobs(){ return JOBS.filter(j=>inRange(j.createdOn) && (!STATE.dashService||j.services.includes(STATE.dashService)) && scopeMatch(j) && (!STATE.dashCustomer||j.customerId===STATE.dashCustomer) && (!STATE.dashStaff||j.ops.includes(STATE.dashStaff)||j.sales.includes(STATE.dashStaff))); }
function avg(list){ return list.length ? list.reduce((a,b)=>a+b,0)/list.length : null; }
function fmtAvg(n, unit, dp){ return n==null ? '—' : n.toFixed(dp==null?1:dp)+' '+unit; }
function barRows(rows, opts){
  opts = opts||{};
  const max = Math.max(1, ...rows.map(r=>r.value));
  if(!rows.length || rows.every(r=>!r.value)) return '<p class="ds-muted ds-small">'+esc(opts.empty||'No data in this range yet.')+'</p>';
  return '<div class="ds-bars">'+rows.map(r=>'<div class="ds-bar-row'+(opts.wide?' ds-bar-row--wide':'')+'" data-tip="'+esc(r.tip||r.label+': '+r.valueText)+'"><span class="ds-bar-row__name">'+(r.icon?icon(r.icon)+' ':'')+esc(r.label)+'</span><span class="ds-bar-track"><span class="ds-bar-fill'+(r.tone?' ds-bar-fill--'+r.tone:'')+'" style="width:'+Math.round(r.value/max*100)+'%"></span></span><span class="ds-bar-row__value">'+esc(r.valueText)+'</span></div>').join('')+'</div>';
}
function panel(title, ic, inner, note, hint){ return '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+(ic?icon(ic):'')+esc(title)+'</h2>'+(hint?'<span class="ds-panel__hint">'+esc(hint)+'</span>':'')+'</div><div class="ds-panel__body">'+inner+(note?'<p class="ds-chart-note">'+icon('info')+'<span>'+esc(note)+'</span></p>':'')+'</div></section>'; }
function lastMonths(n){ const out = []; for(let k=n-1;k>=0;k--){ const d = new Date(TODAY.getFullYear(), TODAY.getMonth()-k, 1); out.push({ y:d.getFullYear(), m:d.getMonth(), label:MONTH_NAMES[d.getMonth()].slice(0,3)+' '+d.getFullYear() }); } return out; }
function monthOf(dmy){ const d = parseDMY(dmy); return d ? d.getFullYear()*12+d.getMonth() : null; }
function monthlyRows(list, dateFn, valFn, fmt){
  return lastMonths(6).map(mo=>{ const v = sumOf(list.filter(x=>monthOf(dateFn(x))===mo.y*12+mo.m), x=>valFn?valFn(x):1); return { label:mo.label, value:v, valueText: fmt?fmt(v):String(v) }; });
}
function countBy(list, keyFn, labels){ const m = {}; list.forEach(x=>[].concat(keyFn(x)).forEach(k=>{ if(k) m[k] = (m[k]||0)+1; })); return (labels||Object.keys(m)).map(k=>({ label:k, value:m[k]||0, valueText:String(m[k]||0) })); }
function isWon(i){ return i.closed==='won' || !!i.jobId; }
function firstSent(i){ const v = i.versions.find(x=>x.sent); return v ? v.sent.on : null; }

function salesTab(){
  const inq = dashInq(), won = inq.filter(isWon), lost = inq.filter(i=>i.closed==='lost'), decided = won.length + lost.length;
  const quoted = inq.filter(i=>i.versions.some(v=>v.sent));
  const key = i=>inqStatus(i).key;
  const openInq = inq.filter(i=>!i.closed && !i.jobId);
  const awaiting = inq.filter(i=>key(i)==='awaiting');
  const stand = [
    ['Preparing the quote', inq.filter(i=>['preparing','revise','expired'].includes(key(i))).length],
    ['Waiting for manager approval', inq.filter(i=>['approval','ready'].includes(key(i))).length],
    ['Waiting for the client', awaiting.length],
    ['Accepted, to be closed', inq.filter(i=>key(i)==='accepted').length],
    ['Won', won.length],
    ['Lost', lost.length]
  ].map(([l,n])=>({ label:l, value:n, valueText:String(n) }));
  const funnel = barRows([['Inquiries', inq.length],['Quoted', quoted.length],['Accepted', won.length]].map(([l,n])=>({ label:l, value:n, valueText:String(n)+(l!=='Inquiries'&&inq.length?' ('+Math.round(n/inq.length*100)+'%)':'') })), { empty:'No inquiries in this range.' });
  const custRows = CUSTOMERS.map(c=>{ const ci = inq.filter(i=>i.customerId===c.id); return { c, n:ci.length, w:ci.filter(isWon).length }; }).filter(r=>r.n).sort((a,b)=>b.n-a.n || b.w-a.w).slice(0,8);
  return '<div class="ds-stack"><div class="ds-kpis">'+
      kpi('quote','Inquiries', inq.length, 'received in the selected range', null, "STATE.inqFilter='all'; go('#/inquiries')")+
      kpi('clock','Open now', openInq.length, 'still being worked on', null, "STATE.inqFilter='open'; go('#/inquiries')")+
      kpi('arrow-right','Waiting for client', awaiting.length, 'quote sent, no answer yet', awaiting.length?'warning':null, "STATE.inqFilter='awaiting'; go('#/inquiries')")+
      kpi('check','Win rate', decided ? Math.round(won.length/decided*100)+'%' : '—', won.length+' won · '+lost.length+' lost', null, "STATE.inqFilter='accepted'; go('#/inquiries')")+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Where inquiries stand','tasks', barRows(stand, { empty:'No inquiries in this range.' }), 'Every inquiry in the range, by where it is right now.')+
      panel('Conversion funnel','chart', funnel, 'How many requests turn into quotes, and quotes into wins.')+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Inquiries by month','calendar', barRows(monthlyRows(inq, i=>i.createdOn)), null, 'last 6 months')+
      panel('Why we lose deals','x', barRows(countBy(lost, i=>i.lostReason.type, CLIENT_REASONS), { empty:'No lost inquiries in this range.' }), 'From the reason picked when an inquiry is closed as lost.')+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('By service','box', barRows(countBy(inq, i=>i.services.map(s=>SERVICES[s].short), SERVICE_ORDER.map(s=>SERVICES[s].short))))+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('building')+'Top customers</h2></div>'+(custRows.length ? '<div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr><th>Customer</th><th class="ds-num">Inquiries</th><th class="ds-num">Won</th></tr></thead><tbody>'+
        custRows.map(r=>'<tr data-href onclick="go(\'#/customers/'+r.c.id+'\')"><td data-label="Customer">'+esc(r.c.name)+'</td><td data-label="Inquiries" class="ds-num">'+r.n+'</td><td data-label="Won" class="ds-num">'+r.w+'</td></tr>').join('')+'</tbody></table></div>' : '<div class="ds-panel__body ds-muted">No customers with inquiries in this range.</div>')+'</section>'+
    '</div></div>';
}
function opsTab(){
  const jobs = dashJobs(), active = jobs.filter(j=>j.status!=='Completed'), held = active.filter(j=>openIssue(j)), done = jobs.filter(j=>j.status==='Completed');
  const stageRows = SERVICE_ORDER.map(s=>({ label:SERVICES[s].short, value:active.filter(j=>j.status==='Active' && currentMs(j) && currentMs(j).svc===s).length })).concat([{ label:'For closing', value:active.filter(j=>j.status==='For closing').length }]).map(r=>Object.assign(r,{ valueText:String(r.value) }));
  const lanes = jobs.map(laneOf).filter(Boolean);
  const laneRows = LANES.map(l=>{ const n = lanes.filter(x=>x===l).length; return { label:l, value:n, valueText: lanes.length ? Math.round(n/lanes.length*100)+'% ('+n+')' : '0', tone:LANE_TONE[l] }; });
  const release = avg(jobs.map(j=>{ const rel = j.ms.find(m=>m.name==='BOC released' && m.done), arr = msByFlag(j,'arrival'); const start = arr && arr.done ? arr.date : (j.free && j.free.arrival); return rel && start ? daysBetween(start, rel.date) : null; }).filter(x=>x!=null));
  const cycle = avg(done.map(j=>daysBetween(j.createdOn, j.completed.on)));
  const stopped = [].concat(...jobs.map(j=>jobClocks(j).filter(c=>c.type==='port' && c.state==='stopped')));
  const within = stopped.filter(c=>!c.over).length, over = sumOf(stopped, c=>c.over);
  return '<div class="ds-stack"><div class="ds-kpis">'+
      kpi('box','Active jobs', active.length, 'not yet completed', null, "STATE.jobFilter='active'; go('#/jobs')")+
      kpi('lock','On hold', held.length, 'open issue', held.length?'danger':null, "STATE.jobFilter='hold'; go('#/jobs')")+
      kpi('shield','Customs release time', fmtAvg(release,'days'), 'arrived → BOC released', null, "go('#/jobs')")+
      kpi('check','Job cycle time', fmtAvg(cycle,'days'), 'created → completed', null, "STATE.jobFilter='completed'; go('#/jobs')")+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Active jobs by stage','flag', barRows(stageRows, { empty:'No active jobs.' }), 'The service track each active job is on now. A long bar is a queue forming.')+
      panel('Customs lanes','shield', barRows(laneRows, { empty:'No lanes recorded yet.' }), 'Share of jobs per BOC lane. Red means physical inspection and the longest release.')+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Free-time performance','clock', stopped.length ? '<div class="ds-stats">'+stat('Released within free time', Math.round(within/stopped.length*100)+'%', false, within+' of '+stopped.length+' jobs')+stat('Total days over', String(over), over>0, 'storage + demurrage days')+'</div>' : '<p class="ds-muted ds-small">No port clocks have stopped yet.</p>')+
      panel('Jobs completed by month','calendar', barRows(monthlyRows(done, j=>j.completed.on)), null, 'last 6 months')+
    '</div>'+
    (held.length ? panel('On hold now','lock', '<ul class="ds-gate">'+held.map(j=>gateItemHtml({ label:j.id+' · '+cname(j.customerId), sub:openIssue(j).reason, met:false, blocked:true, act:act('Open',"go('#/jobs/"+j.id+"/issues')",'arrow-right') })).join('')+'</ul>') : '')+
  '</div>';
}
function financeTab(){
  const jobs = dashJobs(), sent = jobs.filter(j=>latestBill(j) && latestBill(j).status==='Sent');
  const billed = sumOf(jobs, billedAmount), collected = sumOf(jobs, j=>j.billing?sumOf(j.billing.payments, p=>p.amount):0), wht = sumOf(jobs, j=>j.billing?sumOf(j.billing.payments, p=>p.wht||0):0);
  const outstanding = sumOf(sent, j=>Math.max(0, latestBill(j).amount - paidTotal(j)));
  const buckets = [['0–30 days',0,30],['31–60 days',31,60],['61–90 days',61,90],['90+ days',91,1e9]];
  const aging = buckets.map(([l,a,b])=>{ const v = sumOf(sent.filter(j=>{ const d = daysBetween(latestBill(j).sent.on, todayDMY()); return d>=a && d<=b; }), j=>Math.max(0, latestBill(j).amount-paidTotal(j))); return { label:l, value:v, valueText:moneyShort(v), tip:l+': '+money(v) }; });
  const adv = [].concat(...jobs.map(j=>j.funds.filter(f=>f.status==='Released')));
  const advRows = [['0–'+SETTINGS.unliquidatedDays+' days',0,SETTINGS.unliquidatedDays],['Over '+SETTINGS.unliquidatedDays+' days',SETTINGS.unliquidatedDays+1,1e9]].map(([l,a,b])=>{ const v = sumOf(adv.filter(f=>{ const d = daysBetween(f.release.on, todayDMY()); return d>=a && d<=b; }), f=>f.amount); return { label:l, value:v, valueText:moneyShort(v), tone: a>0?'warning':null }; });
  const done = jobs.filter(j=>billedAmount(j));
  const profitBlock = can('profit.view') ? '<div class="ds-grid-2">'+
      panel('Job profit by service','chart', barRows(SERVICE_ORDER.map(s=>{ const v = sumOf(done.filter(j=>j.services.includes(s)), j=>jobProfit(j).profit); return { label:SERVICES[s].short, value:Math.max(0,v), valueText:moneyShort(v) }; }), { wide:true, empty:'No billed jobs yet.' }), 'A job with several services counts toward each of them.')+
      panel('Job profit by month','calendar', barRows(monthlyRows(done, j=>j.completed.on, j=>Math.max(0,jobProfit(j).profit), moneyShort), { wide:true }), null, 'by completion month')+
    '</div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('receipt')+'Quoted vs. billed, and profit per job</h2><span class="ds-panel__hint">Manager only</span></div>'+(done.length ? '<div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr><th>Job</th><th class="ds-num">Quoted</th><th class="ds-num">Billed</th><th class="ds-num">Difference</th><th class="ds-num">Profit</th></tr></thead><tbody>'+
      done.map(j=>{ const i = inqById(j.inquiryId), q = toPHP(acceptedVersion(i)), p = jobProfit(j); return '<tr data-href onclick="go(\'#/jobs/'+j.id+'/money\')"><td data-label="Job"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(cname(j.customerId))+'</span></span></td><td data-label="Quoted" class="ds-num">'+money(q)+'</td><td data-label="Billed" class="ds-num">'+money(p.billed)+'</td><td data-label="Difference" class="ds-num'+(p.billed-q<0?' ds-overdue':'')+'">'+money(p.billed-q)+'</td><td data-label="Profit" class="ds-num'+(p.profit<0?' ds-overdue':'')+'">'+money(p.profit)+' <span class="ds-muted ds-xs">'+p.pct.toFixed(1)+'%</span></td></tr>'; }).join('')+'</tbody></table></div>' : '<div class="ds-panel__body ds-muted ds-small">No billed jobs yet.</div>')+'</section>' : '';
  return '<div class="ds-stack"><div class="ds-kpis">'+
      kpi('receipt','Billed', moneyShort(billed), 'approved Statements of Account', null, "STATE.jobFilter='completed'; go('#/jobs')")+
      kpi('arrow-in','Collected', moneyShort(collected), 'payments recorded', null, "STATE.jobFilter='completed'; go('#/jobs')")+
      kpi('alert','Outstanding', moneyShort(outstanding), plural(sent.filter(j=>billingStatus(j).key==='overdue').length,'job')+' overdue', outstanding?'warning':null, "STATE.jobFilter='completed'; go('#/jobs')")+
      kpi('file','Withholding tax', moneyShort(wht), 'match against BIR 2307 forms', null, "STATE.jobFilter='completed'; go('#/jobs')")+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Receivables aging','clock', barRows(aging, { wide:true, empty:'Nothing unpaid.' }), 'Unpaid balances by how long ago the SOA was sent.')+
      panel('Unliquidated cash advances','wallet', barRows(advRows, { wide:true, empty:'No released funds waiting for liquidation.' }), 'Released fund requests not yet liquidated with receipts.')+
    '</div>'+profitBlock+'</div>';
}
function teamTab(){
  const staff = USERS.filter(u=>u.active && u.roles.some(r=>['Sales','Operations','Accounting'].includes(r)) && (!STATE.dashStaff || u.name===STATE.dashStaff));
  const rows = staff.map(u=>({ u,
    inq: INQUIRIES.filter(i=>i.staff.includes(u.name) && OPEN_INQ.includes(inqStatus(i).key)).length,
    jobs: JOBS.filter(j=>j.ops.includes(u.name) && j.status!=='Completed').length,
    fr: sumOf(JOBS, j=>j.funds.filter(f=>f.by===u.name && f.status!=='Verified').length) })).filter(r=>r.inq||r.jobs||r.fr||!STATE.dashStaff);
  const inq = dashInq(), jobs = dashJobs();
  const sales = USERS.filter(u=>u.roles.includes('Sales')).map(u=>{ const mine = inq.filter(i=>i.staff.includes(u.name)), w = mine.filter(isWon).length, l = mine.filter(i=>i.closed==='lost').length;
    return { u, n:mine.length, rate: w+l ? Math.round(w/(w+l)*100)+'%' : '—', billed: sumOf(jobs.filter(j=>j.sales.includes(u.name)), billedAmount) }; }).filter(r=>r.n);
  const ops = USERS.filter(u=>u.roles.includes('Operations')).map(u=>{ const mine = jobs.filter(j=>j.ops.includes(u.name)); return { u, n:mine.length, cyc: avg(mine.filter(j=>j.completed).map(j=>daysBetween(j.createdOn, j.completed.on))) }; }).filter(r=>r.n);
  const tbl = (head, body, empty)=>body ? '<div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>' : '<div class="ds-panel__body ds-muted ds-small">'+esc(empty)+'</div>';
  return '<div class="ds-stack">'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('users')+'Workload per person</h2><span class="ds-panel__hint">open work right now</span></div>'+
      tbl('<th>Person</th><th>Roles</th><th class="ds-num">Open inquiries</th><th class="ds-num">Open jobs</th><th class="ds-num">Open fund requests</th>',
        rows.filter(r=>r.inq||r.jobs||r.fr).map(r=>'<tr><td data-label="Person"><span class="ds-row ds-row--tight">'+avatar(r.u.name,true)+esc(r.u.name)+'</span></td><td data-label="Roles">'+esc(rolesText(r.u))+'</td><td data-label="Inquiries" class="ds-num">'+r.inq+'</td><td data-label="Jobs" class="ds-num">'+r.jobs+'</td><td data-label="Fund requests" class="ds-num">'+r.fr+'</td></tr>').join(''), 'Nobody has open work yet.')+'</section>'+
    '<div class="ds-grid-2">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('quote')+'Sales per person</h2></div>'+
        tbl('<th>Person</th><th class="ds-num">Inquiries</th><th class="ds-num">Win rate</th><th class="ds-num">Billed</th>', sales.map(r=>'<tr><td data-label="Person">'+esc(r.u.name)+'</td><td data-label="Inquiries" class="ds-num">'+r.n+'</td><td data-label="Win rate" class="ds-num">'+r.rate+'</td><td data-label="Billed" class="ds-num">'+money(r.billed)+'</td></tr>').join(''), 'No inquiries in this range.')+'</section>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('box')+'Operations per person</h2></div>'+
        tbl('<th>Person</th><th class="ds-num">Jobs handled</th><th class="ds-num">Avg cycle time</th>', ops.map(r=>'<tr><td data-label="Person">'+esc(r.u.name)+'</td><td data-label="Jobs" class="ds-num">'+r.n+'</td><td data-label="Cycle time" class="ds-num">'+fmtAvg(r.cyc,'days')+'</td></tr>').join(''), 'No jobs in this range.')+'</section>'+
    '</div></div>';
}
function kpi(ic, label, value, hint, tone, js){
  return '<button class="ds-kpi'+(tone?' ds-kpi--'+tone:'')+'" onclick="'+js+'"><span class="ds-kpi__icon">'+icon(ic)+'</span><span class="ds-kpi__label">'+esc(label)+'</span><span class="ds-kpi__value">'+value+'</span><span class="ds-kpi__hint">'+esc(hint)+'</span></button>';
}
const DASH_TABS = Object.assign({ sales:'Sales & quotations', ops:'Operations' }, FINANCE_SOA_ONLY ? {} : { finance:'Finance' }, { team:'Team' });
function renderDashboard(){
  const q = needsAttention();
  const sel = (id, label, key, opts)=>'<div style="min-width:180px">'+selectWrap('<select class="ds-select" id="'+id+'" aria-label="'+label+'" onchange="STATE.'+key+'=this.value; render()">'+(label?'<option value="">'+label+'</option>':'')+options(opts, STATE[key])+'</select>')+'</div>';
  const staff = USERS.filter(u=>u.roles.some(r=>['Sales','Operations'].includes(r))).map(u=>u.name);
  const body = { sales:salesTab, ops:opsTab, finance:financeTab, team:teamTab }[STATE.dashTab]();
  const empty = !INQUIRIES.length && !JOBS.length;
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+esc(todayLong())+'. <strong>'+plural(q.length,'item')+'</strong> need'+(q.length===1?'s':'')+' attention.</p></div>'+
      '<div class="ds-page-head__actions no-print">'+
      (can('inquiry.create')?'<button class="ds-btn ds-btn--primary" onclick="openNewInquiry()">'+icon('plus')+'New inquiry</button>':'')+'</div></div>'+
    '<div class="ds-stack">'+
    '<section class="ds-panel ds-panel--elevated" id="needs-attention"><div class="ds-panel__head"><h2>'+icon('flag')+'Needs attention</h2><span class="ds-panel__hint">most urgent first · each row opens the record</span></div>'+
      queueHtml(q, 'Nothing needs you right now. Approvals, holds and free-time alerts appear here.'+(FINANCE_SOA_ONLY?'':' Overdue bills too.'))+'</section>'+
    (empty ? '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>No data yet</strong>The figures below fill in as customers, inquiries and jobs are created in this session.</div></div>' : '')+
    '<section class="ds-panel ds-panel--elevated no-print"><div class="ds-panel__body"><div class="ds-row" style="flex-wrap:wrap">'+icon('filter')+
      sel('dash-range','', 'dashRange', Object.keys(RANGES))+
      sel('dash-svc','All services','dashService', SERVICE_ORDER.map(k=>({value:k,label:SERVICES[k].label})))+
      sel('dash-scope','All scopes','dashScope', ['Domestic','International Import','International Export'])+
      sel('dash-cust','All customers','dashCustomer', CUSTOMERS.map(c=>({value:c.id,label:c.name})))+
      sel('dash-staff','All staff','dashStaff', staff)+
      ((STATE.dashService||STATE.dashScope||STATE.dashCustomer||STATE.dashStaff||STATE.dashRange!=='All time')?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="STATE.dashService=STATE.dashScope=STATE.dashCustomer=STATE.dashStaff=\'\'; STATE.dashRange=\'All time\'; render()">'+icon('x')+'Clear</button>':'')+
    '</div></div></section>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-tabs no-print" role="tablist">'+Object.entries(DASH_TABS).map(([k,l])=>'<button class="ds-tab" role="tab" aria-selected="'+(STATE.dashTab===k)+'" onclick="STATE.dashTab=\''+k+'\'; render()"><span class="ds-tab__label" data-text="'+l+'">'+l+'</span></button>').join('')+'</div>'+
      '<div class="ds-panel__body" id="dash-body">'+body+'</div></section></div>';
}
/* Excel export: the records behind the current tab, as CSV (opens in Excel). */
function exportDashCSV(){
  let head, rows;
  if(STATE.dashTab==='sales'){ head = ['Inquiry','Created','Customer','Scope','Services','Staff','Latest version','Amount','Currency','Status','Lost reason'];
    rows = dashInq().map(i=>{ const v = latestV(i); return [i.id, i.createdOn, cname(i.customerId), scopeText(i), servicesText(i.services), i.staff.join('; '), v?'v'+v.v:'', v?v.amount:'', v?v.currency:'', inqStatus(i).label, i.lostReason?i.lostReason.type:'']; }); }
  else if(STATE.dashTab==='ops'){ head = ['Job','Created','Customer','Scope','Services','Operations','Current step','Health','Lane','Completed'];
    rows = dashJobs().map(j=>[j.id, j.createdOn, cname(j.customerId), scopeText(j), servicesText(j.services), j.ops.join('; '), stageText(j), jobHealth(j).label, laneOf(j)||'', j.completed?j.completed.on:'']); }
  else if(STATE.dashTab==='finance'){ head = ['Job','Customer','Billing status','Billed','Received','Withholding','Pass-through']+(can('profit.view')?',Own costs,Profit'.split(',').slice(1):[]);
    rows = dashJobs().map(j=>{ const p = jobProfit(j); return [j.id, cname(j.customerId), billingStatus(j).label, p.billed, j.billing?sumOf(j.billing.payments,x=>x.amount):0, j.billing?sumOf(j.billing.payments,x=>x.wht||0):0, p.reimb].concat(can('profit.view')?[p.own, p.profit]:[]); }); }
  else { head = ['Person','Roles','Open inquiries','Open jobs','Open fund requests'];
    rows = USERS.filter(u=>u.active).map(u=>[u.name, rolesText(u), INQUIRIES.filter(i=>i.staff.includes(u.name) && OPEN_INQ.includes(inqStatus(i).key)).length, JOBS.filter(j=>j.ops.includes(u.name) && j.status!=='Completed').length, sumOf(JOBS, j=>j.funds.filter(f=>f.by===u.name && f.status!=='Verified').length)]); }
  const csv = [head].concat(rows).map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type:'text/csv' }));
  a.download = 'top1movers-'+STATE.dashTab+'-'+dmyToISO(todayDMY())+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  showToast('Exported '+plural(rows.length,'row')+' ('+DASH_TABS[STATE.dashTab]+').', 'success', 'download');
}
