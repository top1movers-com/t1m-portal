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
    if(s.key==='awaiting'){ const d = awaitingDays(i), late = d>=SETTINGS.awaitingClientDays;
      out.push({ tone: late?'warning':'info', icon:'clock', title:'Follow up: awaiting client · '+plural(d,'day'), meta, href, why:'Sent '+v.sent.on+' via '+v.sent.channel+'. Valid until '+v.validUntil+'.', whyTone: late?'warning':null, btn:{ label:'Record response', js:"openClientOutcome('"+i.id+"')" } }); }
  });
  return out.sort(byTone);
}
function opsWork(){
  const out = [];
  JOBS.filter(j=>j.ops.includes(me()) && j.status!=='Completed').forEach(j=>{
    const meta = [j.id, cname(j.customerId), servicesText(j.services)], href = '#/jobs/'+j.id, iss = openIssue(j);
    j.issues.filter(x=>excActionOpen(x) && x.action.owner===me()).forEach(x=>out.push({ tone: excActionLate(x)?'danger':'info', icon:'flag', title:'Corrective action: '+x.action.text, meta, href, why:(excActionLate(x)?'Overdue by '+plural(-daysUntil(x.action.due),'day')+'. ':'Due '+x.action.due+'. ')+x.category+'.', whyTone: excActionLate(x)?'danger':null, btn:{ label:'Mark done', js:"openCompleteAction('"+j.id+"','"+x.id+"')" } }));
    j.docs.filter(d=>d.status==='Rejected' && opsFor(j,d.svc).includes(me())).forEach(d=>out.push({ tone:'warning', icon:'file', title:'Replace rejected document: '+d.name, meta, href:href+'/documents', why:d.review.reason, whyTone:'warning', btn:{ label:'Upload', js:"openUploadDoc('"+j.id+"','"+d.id+"')" } }));
    if(j.status==='For closing') return;
    if(iss) out.push({ tone:'danger', icon:'lock', title:'On hold: '+iss.category, meta, href, why: iss.status==='Returned' ? 'Sent back by '+iss.review.by+': '+iss.review.comment : 'Waiting for a Manager to approve it.', whyTone:'danger', btn: iss.status==='Returned' ? { label:'Edit & resubmit', js:"openFlagException('"+j.id+"','"+iss.id+"')" } : { label:'Open', js:"go('"+href+"/issues')" } });
    else { const k = nextMsIndex(j);
      if(k>=0) out.push({ tone:dueTone(j.ms[k]), icon:SERVICES[j.ms[k].svc].icon, title:'Next: '+j.ms[k].name, meta, href, why:j.ms[k].phase+dueSuffix(j.ms[k])+(pendingDocs(j).length?' · '+plural(pendingDocs(j).length,'document')+' still pending':''), whyTone:dueTone(j.ms[k])==='info'?null:dueTone(j.ms[k]), btn:{ label:'Mark done', js:"openMilestone('"+j.id+"',"+k+")" } });
      else out.push({ tone: closingGate(j).every(g=>g.ok)?'brand':'warning', icon:'flag', title: closingGate(j).every(g=>g.ok)?'Submit for closing':'Finish the closing checklist', meta, href, why:closingGate(j).filter(g=>!g.ok).map(g=>g.label+': '+g.sub).join(' · ')||'Everything is done.', btn: closingGate(j).every(g=>g.ok)?{ label:'Submit', js:"submitForClosing('"+j.id+"')" }:{ label:'Open', js:"goTab('"+j.id+"','documents')" } }); }
    jobClocks(j).filter(c=>c.state==='running' && c.left<=3).forEach(c=>out.push({ tone:c.left<=0?'danger':'warning', icon:'clock', title:c.label+': '+clockText(c), meta, href, why:'Fees ('+c.risk+') start after '+c.lastFree+'. Stops at '+c.ends+'.', whyTone:c.left<=0?'danger':'warning', btn:{ label:'Open', js:"go('"+href+"')" } }));
    if(clockApplies(j) && j.free && j.free.portDays==null) out.push({ tone:'warning', icon:'clock', title:'Set free days', meta, href, btn:{ label:'Set', js:"openFreeDays('"+j.id+"')" } });
  });
  JOBS.filter(j=>j.ops.includes(me())).forEach(j=>j.funds.forEach(f=>{
    const meta = [f.id, j.id, cname(j.customerId)], href = '#/jobs/'+j.id+'/money';
    if(f.status==='Returned' && f.by===me()) out.push({ tone:'warning', icon:'refresh', title:'Fund request sent back: '+f.purpose, meta, href, why:f.review.comment, whyTone:'warning', btn:{ label:'Edit & resubmit', js:"openFundRequest('"+j.id+"','"+f.id+"')" } });
    if(f.status==='Released'){ const d = daysBetween(f.release.on, todayDMY()), late = d>SETTINGS.unliquidatedDays;
      out.push({ tone: late?'warning':'info', icon:'receipt', title:'Submit receipts for '+money(f.amount)+' ('+f.purpose+')', meta, href, why:(f.liqBack?'Sent back by '+f.liqBack.by+': '+f.liqBack.comment+' · ':'')+'Released '+f.release.on+' · '+plural(d,'day')+' ago'+(late?'. Receipts are overdue.':'.'), whyTone: late||f.liqBack?'warning':null, btn:{ label:'Submit receipts', js:"openLiquidate('"+j.id+"','"+f.id+"')" } }); }
  }));
  return out.sort(byTone);
}
function acctWork(){
  const out = [];
  JOBS.forEach(j=>{
    j.funds.forEach(f=>{
      const meta = [f.id, j.id, cname(j.customerId)], href = '#/jobs/'+j.id+'/money';
      if(f.status==='Approved') out.push({ tone:'brand', icon:'arrow-out', title:'Release '+money(f.amount)+(frDirect(f)?' to '+f.payee:' to '+f.by+' (they hold it)'), meta, href, why:f.purpose+' · '+(frDirect(f)?'Accounting pays the vendor':'staff gets the money')+' · needed by '+f.neededBy+' · approved by '+f.review.by, whyTone: daysUntil(f.neededBy)<=0?'warning':null, btn:{ label:'Release', js:"openReleaseFund('"+j.id+"','"+f.id+"')" } });
      if(f.status==='Liquidated') out.push({ tone:'info', icon:'check', title:'Check receipts: '+money(f.liq.actual)+' spent', meta, href, why:'Released '+money(f.amount)+' · '+f.purpose+' · submitted by '+f.liq.by, btn:{ label:'Check receipts', js:"openVerify('"+j.id+"','"+f.id+"')" } });
      if(frLate(f)) out.push({ tone:'warning', icon:'alert', title:'Receipts overdue from '+f.by+' · '+plural(frDaysOut(f),'day'), meta, href, why:money(f.amount)+' released '+f.release.on+' for '+f.purpose+'. Nothing to do yet; follow up with '+f.by+'.', whyTone:'warning', btn:{ label:'Open', js:"openFundDetail('"+j.id+"','"+f.id+"')" } });
    });
    const rs = readinessStatus(j), rmeta = [j.id, cname(j.customerId)], rhref = '#/jobs/'+j.id+'/billing';
    if(rs.key==='ready') out.push({ tone:'brand', icon:'arrow-right', title:'Receive this job for billing', meta:rmeta, href:rhref, why:'Marked ready for Finance by '+j.handover.readyBy+' on '+j.handover.readyOn+'.', btn:{ label:'Open', js:"go('"+rhref+"')" } });
    if(rs.key==='complete') out.push({ tone:'info', icon:'receipt', title:'Billing checklist complete', meta:rmeta, href:rhref, why:'Mark it ready for Finance.', btn:{ label:'Mark ready', js:"markReadyForFinance('"+j.id+"')" } });
  });
  return out.sort(byTone);
}
function myWorkSections(){
  const s = [];
  if(hasRole('Sales')) s.push({ key:'sales', title:'Inquiries & quotes', icon:'quote', items:salesWork(), empty:'Nothing waiting on you. New inquiries appear here when a manager assigns you.' });
  if(hasRole('Operations')) s.push({ key:'ops', title:'Jobs', icon:'box', items:opsWork(), empty:'No job steps waiting on you.' });
  if(hasRole('Accounting')) s.push({ key:'acct', title:'Funds', icon:'wallet', items:acctWork(), empty:'Nothing to release, check or receive right now.' });
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
    if(j.status==='For closing') P(4, { tone:'brand', icon:'flag', title:'Job submitted for closing', meta:meta.concat([j.submitted.by]), href, btn: can('job.complete') ? { label:'Confirm', js:"openConfirmComplete('"+j.id+"')" } : null });
    j.issues.filter(x=>x.status==='For approval' || (x.status==='Returned' && x.holds)).forEach(x=>P(x.holds?1:2, { tone:x.holds?'danger':'warning', icon:x.holds?'lock':'alert', title:(x.holds?'On hold · ':'')+(x.status==='Returned'?'Exception sent back to '+x.by:'Exception waiting for approval')+': '+x.category, meta:meta.concat([x.by]), why:x.reason, whyTone:x.holds?'danger':null, href:href+'/issues', btn: x.status==='For approval' && can('exc.approve') ? { label:'Review', js:"openReviewException('"+j.id+"','"+x.id+"')" } : { label:'Open', js:"go('"+href+"/issues')" } }));
    if(readinessStatus(j).key==='complete' && can('ready.mark')) P(7, { tone:'info', icon:'receipt', title:'Billing checklist complete: mark ready for Finance', meta, href:href+'/billing', btn:{ label:'Open', js:"go('"+href+"/billing')" } });
    const od = jobOverdue(j); if(od) P(5, { tone:'danger', icon:'clock', title:'Step overdue by '+plural(od.days,'day')+': '+od.m.name, meta:meta.concat([opsFor(j, od.m.svc).join(', ')]), why:od.m.phase+'. It was due '+od.m.due+'.', whyTone:'danger', href, btn:{ label:'Open', js:"go('"+href+"')" } });
    j.issues.filter(excActionLate).forEach(x=>P(6, { tone:'danger', icon:'alert', title:'Corrective action overdue by '+plural(-daysUntil(x.action.due),'day')+': '+x.category, meta:meta.concat([x.action.owner]), why:x.action.text, whyTone:'danger', href:href+'/issues', btn:{ label:'Open', js:"go('"+href+"/issues')" } }));
    jobClocks(j).filter(c=>c.state==='running' && c.left<=1).forEach(c=>P(5, { tone:c.left<=0?'danger':'warning', icon:'clock', title:c.label+': '+clockText(c), meta, why:'Fees ('+c.risk+') after '+c.lastFree+'.', whyTone:c.left<=0?'danger':'warning', href, btn:{ label:'Open', js:"go('"+href+"')" } }));
    j.funds.filter(f=>f.status==='Released' && daysBetween(f.release.on, todayDMY())>SETTINGS.unliquidatedDays).forEach(f=>P(7, { tone:'warning', icon:'receipt', title:'Receipts overdue · '+plural(daysBetween(f.release.on, todayDMY()),'day'), meta:[f.id].concat(meta), why:money(f.amount)+' released '+f.release.on+'. Waiting on '+f.by+'.', href:href+'/money', btn:{ label:'Open', js:"go('"+href+"/money')" } }));
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
/* Donut: parts of a whole (6 slices at most). Colour is never the only carrier: the legend names every slice with its count and share. */
function donutChart(rows, opts){
  opts = opts||{};
  const total = sumOf(rows, r=>r.value);
  if(!total) return '<p class="ds-muted ds-small">'+esc(opts.empty||'No data in this range yet.')+'</p>';
  const R = 52, C = 2*Math.PI*R, live = rows.filter(r=>r.value); let off = 0;
  const arcs = live.map(r=>{ const len = r.value/total*C, gap = live.length>1 ? 2 : 0, a = '<circle class="ds-donut__arc" cx="70" cy="70" r="'+R+'" style="stroke:'+r.color+'" stroke-dasharray="'+Math.max(len-gap,0.5).toFixed(2)+' '+C.toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'"><title>'+esc(r.label+': '+r.value+' ('+Math.round(r.value/total*100)+'%)')+'</title></circle>'; off += len; return a; }).join('');
  return '<div class="ds-donut"><div class="ds-donut__plot"><svg viewBox="0 0 140 140" role="img" aria-label="'+esc(opts.label||'Share by group')+'"><circle class="ds-donut__track" cx="70" cy="70" r="'+R+'"/>'+arcs+'</svg><div class="ds-donut__center"><span class="ds-donut__total">'+total+'</span><span class="ds-donut__unit">'+esc(opts.unit||'total')+'</span></div></div>'+
    '<ul class="ds-donut__legend">'+rows.map(r=>'<li><span class="ds-donut__dot" style="background:'+r.color+'"></span><span class="ds-donut__name">'+esc(r.label)+'</span><span class="ds-donut__val">'+r.value+'<span class="ds-muted"> · '+Math.round(r.value/total*100)+'%</span></span></li>').join('')+'</ul></div>';
}
/* Columns: a measure over time. One colour, a hairline baseline, the figure above each non-zero column. */
function columnChart(rows, opts){
  opts = opts||{};
  const max = Math.max(1, ...rows.map(r=>r.value));
  if(!rows.length || rows.every(r=>!r.value)) return '<p class="ds-muted ds-small">'+esc(opts.empty||'No data in this range yet.')+'</p>';
  return '<div class="ds-cols" role="img" aria-label="'+esc(opts.label||'By month')+'">'+rows.map(r=>'<div class="ds-col" data-tip="'+esc(r.label+': '+r.valueText)+'" style="--h:'+(r.value?Math.max(Math.round(r.value/max*100),2):0)+'%"><span class="ds-col__track"><span class="ds-col__fill'+(opts.tone?' ds-col__fill--'+opts.tone:'')+'"></span>'+(r.value?'<span class="ds-col__val">'+esc(r.valueText)+'</span>':'')+'</span><span class="ds-col__name">'+esc(r.label.replace(/ \d{4}$/,''))+'</span></div>').join('')+'</div>';
}
const chartSeq = i=>'var(--t1m-chart-seq-'+i+')';
function panel(title, ic, inner, note, hint){ return '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+(ic?icon(ic):'')+esc(title)+'</h2>'+(hint?'<span class="ds-panel__hint">'+esc(hint)+'</span>':'')+'</div><div class="ds-panel__body">'+inner+(note?'<p class="ds-chart-note">'+icon('info')+'<span>'+esc(note)+'</span></p>':'')+'</div></section>'; }
function lastMonths(n){ const out = []; for(let k=n-1;k>=0;k--){ const d = new Date(TODAY.getFullYear(), TODAY.getMonth()-k, 1); out.push({ y:d.getFullYear(), m:d.getMonth(), label:MONTH_NAMES[d.getMonth()].slice(0,3)+' '+d.getFullYear() }); } return out; }
function monthOf(dmy){ const d = parseDMY(dmy); return d ? d.getFullYear()*12+d.getMonth() : null; }
function monthlyRows(list, dateFn, valFn, fmt){
  return lastMonths(6).map(mo=>{ const v = sumOf(list.filter(x=>monthOf(dateFn(x))===mo.y*12+mo.m), x=>valFn?valFn(x):1); return { label:mo.label, value:v, valueText: fmt?fmt(v):String(v) }; });
}
function countBy(list, keyFn, labels){ const m = {}; list.forEach(x=>[].concat(keyFn(x)).forEach(k=>{ if(k) m[k] = (m[k]||0)+1; })); return (labels||Object.keys(m)).map(k=>({ label:k, value:m[k]||0, valueText:String(m[k]||0) })); }
function isWon(i){ return i.closed==='won' || !!i.jobId; }

/* Revenue = the service fees on jobs handed to Finance (pass-through costs paid for the client are not revenue), counted in the month of the handover. */
const serviceFees = j=>sumOf(chargesOf(j).filter(c=>c.kind===CHARGE_KINDS[0]), c=>c.amount);
function revenuePanel(){
  const billed = dashJobs().filter(j=>j.handover && j.handover.readyOn), rows = monthlyRows(billed, j=>j.handover.readyOn, serviceFees, v=>'₱'+Math.round(v).toLocaleString('en-PH'));
  const thisMonth = rows[rows.length-1].value, total = sumOf(rows, r=>r.value);
  return panel('Revenue per month','chart', '<div class="ds-stats" style="margin-bottom:var(--t1m-space-4)">'+stat('This month', money(thisMonth), false, plural(billed.filter(j=>monthOf(j.handover.readyOn)===monthOf(todayDMY())).length,'job')+' handed to Finance')+stat('Last 6 months', money(total), false, plural(billed.length,'job')+' handed to Finance')+'</div>'+columnChart(rows, { tone:'success', label:'Revenue per month', empty:'No job has been handed to Finance yet.' }),
    'Service fees on jobs marked ready for Finance, in the month of the handover. Costs paid for the client at cost are not counted.', 'last 6 months');
}
function salesTab(){
  const inq = dashInq(), won = inq.filter(isWon), lost = inq.filter(i=>i.closed==='lost'), decided = won.length + lost.length;
  const quoted = inq.filter(i=>i.versions.some(v=>v.sent));
  const key = i=>inqStatus(i).key;
  const openInq = inq.filter(i=>!i.closed && !i.jobId);
  const awaiting = inq.filter(i=>key(i)==='awaiting');
  const stand = [
    ['Preparing the quote', inq.filter(i=>['preparing','revise','expired'].includes(key(i))).length],
    ['Waiting for manager approval', inq.filter(i=>key(i)==='approval').length],
    ['Waiting for the client', awaiting.length],
    ['Accepted, to be closed', inq.filter(i=>key(i)==='accepted').length],
    ['Won', won.length],
    ['Lost', lost.length]
  ].map(([l,n],k)=>({ label:l, value:n, valueText:String(n), color:k===5?'var(--t1m-danger)':chartSeq(k+1) }));
  const funnel = barRows([['Inquiries', inq.length],['Quoted', quoted.length],['Accepted', won.length]].map(([l,n])=>({ label:l, value:n, valueText:String(n)+(l!=='Inquiries'&&inq.length?' ('+Math.round(n/inq.length*100)+'%)':'') })), { empty:'No inquiries in this range.' });
  const custRows = CUSTOMERS.map(c=>{ const ci = inq.filter(i=>i.customerId===c.id); return { c, n:ci.length, w:ci.filter(isWon).length }; }).filter(r=>r.n).sort((a,b)=>b.n-a.n || b.w-a.w).slice(0,8);
  return '<div class="ds-stack">'+revenuePanel()+'<div class="ds-kpis">'+
      kpi('quote','Inquiries', inq.length, 'received in the selected range', null, "STATE.inqFilter='all'; go('#/inquiries')")+
      kpi('clock','Open now', openInq.length, 'still being worked on', null, "STATE.inqFilter='open'; go('#/inquiries')")+
      kpi('arrow-right','Waiting for client', awaiting.length, 'quote sent, no answer yet', awaiting.length?'warning':null, "STATE.inqFilter='awaiting'; go('#/inquiries')")+
      kpi('check','Win rate', decided ? Math.round(won.length/decided*100)+'%' : '—', won.length+' won · '+lost.length+' lost', null, "STATE.inqFilter='accepted'; go('#/inquiries')")+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Where inquiries stand','tasks', donutChart(stand, { unit:'inquiries', label:'Inquiries by stage', empty:'No inquiries in this range.' }), 'Every inquiry in the range, by where it is right now.')+
      panel('Conversion funnel','chart', funnel, 'How many requests turn into quotes, and quotes into wins.')+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Inquiries by month','calendar', columnChart(monthlyRows(inq, i=>i.createdOn), { label:'Inquiries by month' }), null, 'last 6 months')+
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
  const laneRows = LANES.map(l=>{ const n = lanes.filter(x=>x===l).length; return { label:l, value:n, valueText: lanes.length ? Math.round(n/lanes.length*100)+'% ('+n+')' : '0', color:'var(--t1m-'+LANE_TONE[l]+')' }; });
  const release = avg(jobs.map(j=>{ const rel = j.ms.find(m=>m.name==='BOC released' && m.done), arr = msByFlag(j,'arrival'); const start = arr && arr.done ? arr.date : (j.free && j.free.arrival); return rel && start ? daysBetween(start, rel.date) : null; }).filter(x=>x!=null));
  const cycle = avg(done.map(j=>daysBetween(j.createdOn, j.completed.on)));
  const stopped = [].concat(...jobs.map(j=>jobClocks(j).filter(c=>c.type==='port' && c.state==='stopped')));
  const within = stopped.filter(c=>!c.over).length, over = sumOf(stopped, c=>c.over);
  return '<div class="ds-stack"><div class="ds-kpis ds-kpis--3">'+
      kpi('box','Active jobs', active.length, 'not yet completed', null, "STATE.jobFilter='active'; go('#/jobs')")+
      kpi('lock','On hold', held.length, 'waiting for an exception to be approved', held.length?'danger':null, "STATE.jobFilter='hold'; go('#/jobs')")+
      kpi('clock','Overdue steps', active.filter(jobOverdue).length, 'past their due date', active.filter(jobOverdue).length?'warning':null, "STATE.jobFilter='overdue'; go('#/jobs')")+
      kpi('file','Missing documents', sumOf(active, j=>pendingDocs(j).length), 'pending or rejected', sumOf(active, j=>pendingDocs(j).length)?'warning':null, "STATE.jobFilter='active'; go('#/jobs')")+
      kpi('shield','Customs release time', fmtAvg(release,'days'), 'arrived → BOC released', null, "go('#/jobs')")+
      kpi('check','Job cycle time', fmtAvg(cycle,'days'), 'created → completed', null, "STATE.jobFilter='completed'; go('#/jobs')")+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Active jobs by stage','flag', barRows(stageRows, { empty:'No active jobs.' }), 'The service track each active job is on now. A long bar is a queue forming.')+
      panel('Customs lanes','shield', donutChart(laneRows, { unit:'jobs', label:'Jobs by customs lane', empty:'No lanes recorded yet.' }), 'Share of jobs per BOC lane. Red means physical inspection and the longest release.')+
    '</div>'+
    '<div class="ds-grid-2">'+
      panel('Free-time performance','clock', stopped.length ? '<div class="ds-stats">'+stat('Released within free time', Math.round(within/stopped.length*100)+'%', false, within+' of '+stopped.length+' jobs')+stat('Total days over', String(over), over>0, 'storage + demurrage days')+'</div>' : '<p class="ds-muted ds-small">No port clocks have stopped yet.</p>')+
      panel('Jobs completed by month','calendar', columnChart(monthlyRows(done, j=>j.completed.on), { label:'Jobs completed by month' }), null, 'last 6 months')+
    '</div>'+
    opsExtraPanels(active, jobs)+
    (held.length ? panel('On hold now','lock', '<ul class="ds-gate">'+held.map(j=>gateItemHtml({ label:j.id+' · '+cname(j.customerId), sub:openIssue(j).reason, met:false, blocked:true, act:act('Open',"go('#/jobs/"+j.id+"/issues')",'arrow-right') })).join('')+'</ul>') : '')+
  '</div>';
}
function opsExtraPanels(active, jobs){
  const late = active.map(j=>({ j, od:jobOverdue(j) })).filter(x=>x.od), acts = [].concat(...active.map(j=>j.issues.filter(excActionLate).map(x=>({ j, x }))));
  const overdueHtml = (late.length || acts.length) ? '<ul class="ds-gate">'+late.map(({j,od})=>gateItemHtml({ label:j.id+' · '+cname(j.customerId), sub:od.m.name+' · overdue by '+plural(od.days,'day')+' · '+opsFor(j, od.m.svc).join(', '), met:false, blocked:true, overdue:true, act:act('Open',"go('#/jobs/"+j.id+"')",'arrow-right') })).join('')+
    acts.map(({j,x})=>gateItemHtml({ label:j.id+' · corrective action', sub:x.action.text+' · '+x.action.owner+' · overdue by '+plural(-daysUntil(x.action.due),'day'), met:false, blocked:true, overdue:true, act:act('Open',"go('#/jobs/"+j.id+"/issues')",'arrow-right') })).join('')+'</ul>' : '<p class="ds-muted ds-small">Nothing is overdue.</p>';
  const missing = active.map(j=>({ j, docs:pendingDocs(j) })).filter(x=>x.docs.length).sort((a,b)=>b.docs.filter(d=>d.status==='Rejected').length - a.docs.filter(d=>d.status==='Rejected').length).slice(0,8);
  const missHtml = missing.length ? '<ul class="ds-gate">'+missing.map(({j,docs})=>gateItemHtml({ label:j.id+' · '+cname(j.customerId), sub:docs.map(d=>d.name+(d.status==='Rejected'?' (rejected)':'')).join(', '), met:false, act:act('Open',"goTab('"+j.id+"','documents')",'file') })).join('')+'</ul>' : '<p class="ds-muted ds-small">No documents are missing.</p>';
  const exc = [].concat(...active.map(j=>j.issues.filter(x=>x.status!=='Resolved')));
  return '<div class="ds-grid-2">'+panel('Overdue tasks','clock', overdueHtml, 'Steps and corrective actions past their due date. The owner is emailed, then a Manager.')+panel('Missing documents','file', missHtml, 'Pending or rejected documents on active jobs.')+'</div>'+
    '<div class="ds-grid-2">'+panel('Open exceptions','flag', barRows(countBy(exc, x=>x.category, EXC_CATEGORIES), { empty:'No open exceptions.' }), exc.filter(x=>x.status==='For approval'||x.status==='Returned').length+' waiting for approval · '+exc.filter(excActionOpen).length+' with a corrective action in progress.')+billingPanel(jobs)+'</div>';
}
function teamTab(){
  const staff = USERS.filter(u=>u.active && u.roles.some(r=>['Sales','Operations','Accounting'].includes(r)) && (!STATE.dashStaff || u.name===STATE.dashStaff));
  const rows = staff.map(u=>({ u,
    inq: INQUIRIES.filter(i=>i.staff.includes(u.name) && OPEN_INQ.includes(inqStatus(i).key)).length,
    jobs: JOBS.filter(j=>j.ops.includes(u.name) && j.status!=='Completed').length,
    fr: sumOf(JOBS, j=>j.funds.filter(f=>f.by===u.name && f.status!=='Verified').length) })).filter(r=>r.inq||r.jobs||r.fr||!STATE.dashStaff);
  const inq = dashInq(), jobs = dashJobs();
  const sales = USERS.filter(u=>u.roles.includes('Sales')).map(u=>{ const mine = inq.filter(i=>i.staff.includes(u.name)), w = mine.filter(isWon).length, l = mine.filter(i=>i.closed==='lost').length;
    return { u, n:mine.length, rate: w+l ? Math.round(w/(w+l)*100)+'%' : '—' }; }).filter(r=>r.n);
  const ops = USERS.filter(u=>u.roles.includes('Operations')).map(u=>{ const mine = jobs.filter(j=>j.ops.includes(u.name)); return { u, n:mine.length, cyc: avg(mine.filter(j=>j.completed).map(j=>daysBetween(j.createdOn, j.completed.on))) }; }).filter(r=>r.n);
  const tbl = (head, body, empty)=>body ? '<div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>' : '<div class="ds-panel__body ds-muted ds-small">'+esc(empty)+'</div>';
  return '<div class="ds-stack">'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('users')+'Workload per person</h2><span class="ds-panel__hint">open work right now</span></div>'+
      tbl('<th>Person</th><th>Roles</th><th class="ds-num">Open inquiries</th><th class="ds-num">Open jobs</th><th class="ds-num">Open fund requests</th>',
        rows.filter(r=>r.inq||r.jobs||r.fr).map(r=>'<tr><td data-label="Person"><span class="ds-row ds-row--tight">'+avatar(r.u.name,true)+esc(r.u.name)+'</span></td><td data-label="Roles">'+esc(rolesText(r.u))+'</td><td data-label="Inquiries" class="ds-num">'+r.inq+'</td><td data-label="Jobs" class="ds-num">'+r.jobs+'</td><td data-label="Fund requests" class="ds-num">'+r.fr+'</td></tr>').join(''), 'Nobody has open work yet.')+'</section>'+
    '<div class="ds-grid-2">'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('quote')+'Sales per person</h2></div>'+
        tbl('<th>Person</th><th class="ds-num">Inquiries</th><th class="ds-num">Win rate</th>', sales.map(r=>'<tr><td data-label="Person">'+esc(r.u.name)+'</td><td data-label="Inquiries" class="ds-num">'+r.n+'</td><td data-label="Win rate" class="ds-num">'+r.rate+'</td></tr>').join(''), 'No inquiries in this range.')+'</section>'+
      '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('box')+'Operations per person</h2></div>'+
        tbl('<th>Person</th><th class="ds-num">Jobs handled</th><th class="ds-num">Avg cycle time</th>', ops.map(r=>'<tr><td data-label="Person">'+esc(r.u.name)+'</td><td data-label="Jobs" class="ds-num">'+r.n+'</td><td data-label="Cycle time" class="ds-num">'+fmtAvg(r.cyc,'days')+'</td></tr>').join(''), 'No jobs in this range.')+'</section>'+
    '</div></div>';
}
function kpi(ic, label, value, hint, tone, js){
  return '<button class="ds-kpi'+(tone?' ds-kpi--'+tone:'')+'" onclick="'+js+'"><span class="ds-kpi__icon">'+icon(ic)+'</span><span class="ds-kpi__label">'+esc(label)+'</span><span class="ds-kpi__value">'+value+'</span><span class="ds-kpi__hint">'+esc(hint)+'</span></button>';
}
const DASH_TABS = { sales:'Sales & quotations', ops:'Operations', team:'Team' };
function renderDashboard(){
  const q = needsAttention();
  const sel = (id, label, key, opts)=>'<div style="min-width:180px">'+selectWrap('<select class="ds-select" id="'+id+'" aria-label="'+(label||'Date range')+'" onchange="STATE.'+key+'=this.value; render()">'+(label?'<option value="">'+label+'</option>':'')+options(opts, STATE[key])+'</select>')+'</div>';
  const staff = USERS.filter(u=>u.roles.some(r=>['Sales','Operations'].includes(r))).map(u=>u.name);
  const body = { sales:salesTab, ops:opsTab, team:teamTab }[STATE.dashTab]();
  const empty = !INQUIRIES.length && !JOBS.length;
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+esc(todayLong())+'. <strong>'+plural(q.length,'item')+'</strong> need'+(q.length===1?'s':'')+' attention.</p></div>'+
      '<div class="ds-page-head__actions no-print">'+
      '<button class="ds-btn ds-btn--secondary" id="dash-export" onclick="exportDashCSV()">'+icon('download')+'Export to Excel</button>'+(can('inquiry.create')?'<button class="ds-btn ds-btn--primary" onclick="openNewInquiry()">'+icon('plus')+'New inquiry</button>':'')+'</div></div>'+
    '<div class="ds-dash"><div class="ds-stack ds-dash__main">'+
    (empty ? '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>No data yet</strong>The figures below fill in as customers, inquiries and jobs are created in this session.<div class="ds-alert__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" id="load-sample" onclick="loadSampleData()">'+icon('download')+'Load sample data</button></div></div></div>' : '')+
    '<section class="ds-panel ds-panel--elevated no-print"><div class="ds-panel__body"><div class="ds-row" style="flex-wrap:wrap">'+icon('filter')+
      sel('dash-range','', 'dashRange', Object.keys(RANGES))+
      sel('dash-svc','All services','dashService', SERVICE_ORDER.map(k=>({value:k,label:SERVICES[k].label})))+
      sel('dash-scope','All scopes','dashScope', ['Domestic','International Import','International Export'])+
      sel('dash-cust','All customers','dashCustomer', CUSTOMERS.map(c=>({value:c.id,label:c.name})))+
      sel('dash-staff','All staff','dashStaff', staff)+
      ((STATE.dashService||STATE.dashScope||STATE.dashCustomer||STATE.dashStaff||STATE.dashRange!=='All time')?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="STATE.dashService=STATE.dashScope=STATE.dashCustomer=STATE.dashStaff=\'\'; STATE.dashRange=\'All time\'; render()">'+icon('x')+'Clear</button>':'')+
    '</div></div></section>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-tabs no-print" role="tablist">'+Object.entries(DASH_TABS).map(([k,l])=>'<button class="ds-tab" role="tab" aria-selected="'+(STATE.dashTab===k)+'" onclick="STATE.dashTab=\''+k+'\'; render()"><span class="ds-tab__label" data-text="'+l+'">'+l+'</span></button>').join('')+'</div>'+
      '<div class="ds-panel__body" id="dash-body">'+body+'</div></section></div>'+
    '<aside class="ds-dash__aside" aria-label="Needs attention"><section class="ds-panel ds-panel--elevated ds-panel--alert'+(q.length?'':' ds-panel--calm')+'" id="needs-attention"><div class="ds-panel__head"><h2>'+icon('flag')+'Needs attention</h2>'+(q.length?pill(String(q.length),'warning','alert','ds-pill--sm'):'')+'</div>'+
      '<p class="ds-dash__note">Most urgent first. Each row opens the record.</p><div class="ds-dash__scroll">'+queueHtml(q, 'Nothing needs you right now. Approvals, holds, overdue steps and free-time alerts appear here.')+'</div></section></aside></div>';
}
/* Excel export: the records behind the current tab, as CSV (opens in Excel). */
function exportDashCSV(){
  let head, rows;
  if(STATE.dashTab==='sales'){ head = ['Inquiry','Created','Customer','Scope','Services','Staff','Latest version','Amount','Currency','Status','Lost reason'];
    rows = dashInq().map(i=>{ const v = latestV(i); return [i.id, i.createdOn, cname(i.customerId), scopeText(i), servicesText(i.services), i.staff.join('; '), v?'v'+v.v:'', v?v.amount:'', v?v.currency:'', inqStatus(i).label, i.lostReason?i.lostReason.type:'']; }); }
  else if(STATE.dashTab==='ops'){ head = ['Job','Created','Customer','Scope','Services','Operations','Current step','Health','Lane','Completed'];
    rows = dashJobs().map(j=>[j.id, j.createdOn, cname(j.customerId), scopeText(j), servicesText(j.services), j.ops.join('; '), stageText(j), jobHealth(j).label, laneOf(j)||'', j.completed?j.completed.on:'']); }
  else { head = ['Person','Roles','Open inquiries','Open jobs','Open fund requests'];
    rows = USERS.filter(u=>u.active).map(u=>[u.name, rolesText(u), INQUIRIES.filter(i=>i.staff.includes(u.name) && OPEN_INQ.includes(inqStatus(i).key)).length, JOBS.filter(j=>j.ops.includes(u.name) && j.status!=='Completed').length, sumOf(JOBS, j=>j.funds.filter(f=>f.by===u.name && f.status!=='Verified').length)]); }
  const csv = [head].concat(rows).map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type:'text/csv' }));
  a.download = 'top1movers-'+STATE.dashTab+'-'+dmyToISO(todayDMY())+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  showToast('Exported '+plural(rows.length,'row')+' ('+DASH_TABS[STATE.dashTab]+').', 'success', 'download');
}
