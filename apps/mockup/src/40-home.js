/* ============================== HOME ==============================
   Every role lands on Home and it answers the same question for each of them: what needs me today?
   Manager/Admin: a command center (decisions, money, deadlines across all jobs).
   Dispatcher: my tasks, my customers' shipments, my sales follow-ups.
   Warehouse Crew: today's deliveries and containers to return, touch-first.
   Finance: jobs waiting for Finance and how each one settles. */
const TONE_RANK = { danger:0, warning:1, brand:2, info:3, success:4 };
/* Consequence order: frozen jobs first, then late work, then money, then clocks, then good news. */
const QUEUE_PRIO = { exception:0, hold:1, damage:2, overdue:3, expired:4, funds:5, charge:6, clock:7, finance:8 };
function greeting(){ return 'Good morning, '+CURRENT_USER.name.split(' ')[0]+'.'; }
function todayLong(){ return 'Monday 28 September 2026'; }

function managerQueue(){
  const q = [];
  JOBS.forEach(j=>{
    const c = custById(j.customerId).name, id = j.id;
    const ex = openException(j);
    if(ex) q.push({ p:QUEUE_PRIO.exception, tone:'danger', icon:'flag', cat:'decisions', job:j, title:'Decide an exception: '+ex.category, why:ex.reason, whyTone:'danger',
      btn:{ label:'Review', js:"openReviewException('"+id+"','"+ex.id+"')" } });
    const hold = customsHold(j);
    if(hold) q.push({ p:QUEUE_PRIO.hold, tone:'danger', icon:'lock', cat:'decisions', job:j, title:'Customs hold: '+hold.type+' (lane '+j.customs.lane+')', why:hold.note, btn:{ label:'Open', js:"go('#/jobs/"+id+"')" } });
    if(j.delivery.confirmed && j.delivery.damage && !j.delivery.damageResolved) q.push({ p:QUEUE_PRIO.damage, tone:'danger', icon:'alert', cat:'decisions', job:j, title:'Damage reported at delivery', why:j.delivery.damageNote||'', btn:{ label:'Resolve', js:"openResolveDamage('"+id+"')" } });
    const gap = fundingGap(j);
    if(gap) q.push({ p:QUEUE_PRIO.funds, tone:'warning', icon:'wallet', cat:'money', job:j, title:'Short on client funds: '+gap.first.desc+' due '+shortDate(gap.first.dueDate), why:'Short by '+money(gap.short)+'. '+gap.storageText, whyTone:'warning', btn:{ label:'Add funds', js:"openAddFunds('"+id+"')" } });
    j.charges.filter(isUnresolved).forEach(ch=>q.push({ p:QUEUE_PRIO.charge, tone:'warning', icon:'receipt', cat:'money', job:j, title:'Extra charge not in the quote: '+ch.desc+' '+money(ch.amount), why:'Get client approval or absorb it before this job can go to Finance.', btn:{ label:'Decide', js:"openDecideCharge('"+id+"','"+ch.id+"')" } }));
    j.tasks.filter(t=>taskStatus(j,t)==='Overdue').forEach(t=>q.push({ p:QUEUE_PRIO.overdue, tone:'danger', icon:'alert', cat:'deadlines', job:j, title:'Overdue: '+t.name, why:t.owner+' · due '+shortDate(t.due)+', '+plural(-daysUntil(t.due),'day')+' late', whyTone:'danger', btn:{ label:'Reassign', js:"openReassignTask('"+id+"','"+t.id+"')" } }));
    const clk = deadlineInfo(j);
    if(clk && clk.days!=null && clk.days<=2) q.push({ p: clk.days<0?QUEUE_PRIO.expired:QUEUE_PRIO.clock, tone: clk.days<0?'danger':'warning', icon:'clock', cat:'deadlines', job:j, title:clk.label+': '+clockText(clk).toLowerCase(), why:(clk.days<0?'The '+clk.who+' is charging daily since ':'The '+clk.who+' starts charging after ')+shortDate(clk.deadline)+'.', whyTone:clk.days<0?'danger':'warning', btn:{ label:'Open', js:"go('#/jobs/"+id+"')" } });
    if(j.statusIndex===6 && billingChecklist(j).every(x=>x.ok)) q.push({ p:QUEUE_PRIO.finance, tone:'brand', icon:'receipt', cat:'money', job:j, title:'Ready to hand to Finance', why:'Every billing check is done.', btn:{ label:'Mark ready', js:"markBillingReady('"+id+"')" } });
  });
  return q.sort((a,b)=>a.p-b.p);
}
function dispatcherQueue(){
  const q = [];
  myJobs().forEach(j=>{
    const id = j.id;
    j.documents.forEach(d=>{
      if(d.status==='Pending Review') q.push({ tone:'info', icon:'eye', cat:'docs', job:j, title:'Review '+d.name, why:'Uploaded v'+d.version+'. Approve it or reject it with a reason.', btn:{ label:'Review', js:"openReviewDoc('"+id+"','"+d.id+"')" } });
      else if(docProblem(j,d)) q.push({ tone:'warning', icon:'upload', cat:'docs', job:j, title:(d.status==='Rejected'?'Replace ':'Upload ')+d.name, why: d.status==='Rejected' ? 'Rejected: '+d.rejectReason : 'Still missing. Chase the client or shipper for it.', btn:{ label:d.status==='Rejected'?'Replace':'Upload', js:"openUploadDoc('"+id+"','"+d.id+"')" } });
    });
    const n = nextStep(j);
    if(n && n.tone==='ready' && n.primary && n.primary.js.startsWith('advance')) q.push({ tone:'brand', icon:'arrow-right', cat:'moves', job:j, title:'Ready: '+n.primary.label, why:'Everything needed is done. One click moves it on.', btn:{ label:'Move on', js:n.primary.js } });
    const ex = openException(j);
    if(ex) q.push({ tone:'danger', icon:'lock', cat:'moves', job:j, title:'Blocked: '+ex.category, why:'Waiting for a Manager to review it. Nothing for you to do yet.', btn:{ label:'Open', js:"go('#/jobs/"+id+"')" } });
  });
  return q.sort((a,b)=>TONE_RANK[a.tone]-TONE_RANK[b.tone]);
}
function salesQueue(){
  return INQUIRIES.filter(i=>i.assignedTo===CURRENT_USER.name || isManagerLike()).map(i=>{
    const st = inquiryStage(i); if(!['New','Quoted','Approved'].includes(st.key)) return null;
    return { tone:'brand', icon:'quote', cat:'sales', inq:i, title:st.next+' · '+custById(i.customerId).name, why:i.cargo+', '+i.origin+' to '+i.destination, btn:{ label:'Open', js:"go('#/inquiries/"+i.id+"')" } };
  }).filter(Boolean);
}
function myTaskList(){
  const out = [];
  JOBS.filter(canSeeJob).forEach(j=>j.tasks.forEach(t=>{ if(!t.done && t.owner===CURRENT_USER.name) out.push({ j, t, st:taskStatus(j,t) }); }));
  const order = { 'Overdue':0, 'To do':1, 'Upcoming':2 };
  return out.sort((a,b)=>order[a.st]-order[b.st] || (parseDMY(a.t.due)-parseDMY(b.t.due)));
}
function crewDeliveries(){ return JOBS.filter(j=>canSeeJob(j) && j.statusIndex===5 && !j.delivery.confirmed); }
function homeQueueCount(){
  const r = role();
  if(r==='Manager'||r==='Admin') return managerQueue().filter(x=>x.tone==='danger'||x.tone==='warning'||x.tone==='brand').length;
  if(r==='Finance') return JOBS.filter(j=>j.statusIndex===7).length;
  if(r==='Warehouse Crew') return crewDeliveries().length + myTaskList().filter(x=>x.st!=='Upcoming').length;
  return myTaskList().filter(x=>x.st!=='Upcoming').length + dispatcherQueue().filter(x=>x.cat==='docs'||x.cat==='moves').length;
}

/* ---------- shared pieces ---------- */
function queueHtml(items, emptyText){
  if(!items.length) return '<div class="ds-queue__empty">'+icon('check')+'<span>'+esc(emptyText)+'</span></div>';
  return '<ul class="ds-queue">'+items.map((x,i)=>{
    const meta = x.job ? '<span class="ds-mono">'+x.job.id+'</span><span>'+esc(custById(x.job.customerId).name)+'</span><span>'+esc(STATUS_STEPS[x.job.statusIndex])+'</span>'
      : '<span class="ds-mono">'+x.inq.id+'</span><span>'+esc(x.inq.assignedTo)+'</span>';
    const href = x.job ? "go('#/jobs/"+x.job.id+"')" : "go('#/inquiries/"+x.inq.id+"')";
    return '<li class="ds-queue__item" data-tone="'+x.tone+'" style="--i:'+i+'"><span class="ds-queue__icon">'+icon(x.icon)+'</span>'+
      '<div style="min-width:0;cursor:pointer" onclick="'+href+'"><div class="ds-queue__title">'+esc(x.title)+'</div><div class="ds-queue__meta">'+meta+'</div>'+(x.why?'<div class="ds-queue__why'+(x.whyTone?' ds-queue__why--'+x.whyTone:'')+'">'+esc(x.why)+'</div>':'')+'</div>'+
      '<div class="ds-queue__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="event.stopPropagation(); '+x.btn.js+'">'+esc(x.btn.label)+'</button></div></li>';
  }).join('')+'</ul>';
}
function kpi(ic, label, value, hint, tone, js, id){
  return '<button class="ds-kpi'+(tone?' ds-kpi--'+tone:'')+'"'+(id?' id="'+id+'"':'')+' onclick="'+js+'"><span class="ds-kpi__icon">'+icon(ic)+'</span><span class="ds-kpi__label">'+esc(label)+'</span><span class="ds-kpi__value">'+value+'</span><span class="ds-kpi__hint">'+esc(hint)+'</span></button>';
}
function jobsFilterJs(filter, stage){ return "STATE.jobFilter='"+filter+"'; STATE.jobStage="+(stage==null?'null':stage)+"; STATE.jobQuery=''; go('#/jobs')"; }
function pipelineHtml(jobs){
  const stops = STATUS_STEPS.map((s,idx)=>{
    const here = jobs.filter(j=>j.statusIndex===idx);
    const blocked = here.filter(j=>jobHealth(j).tone==='danger').length;
    return '<li class="ds-pipeline__stop"'+(here.length?'':' data-empty')+'><button class="ds-pipeline__btn" onclick="'+jobsFilterJs('all', idx)+'" title="'+esc(s+': '+STAGE_HINT[idx])+'">'+
      '<span class="ds-pipeline__count">'+here.length+(blocked?'<span class="ds-pipeline__flag" title="'+blocked+' blocked">'+icon('lock')+blocked+'</span>':'')+'</span>'+
      '<span class="ds-pipeline__label">'+esc(s)+'</span></button></li>';
  }).join('');
  const phases = PHASES.map(p=>'<span class="ds-pipeline__phase" style="grid-column:span '+p.stages.length+'">'+esc(p.label)+'</span>').join('');
  return '<div class="ds-pipeline-wrap"><div><ol class="ds-pipeline" style="grid-template-columns:repeat(9,minmax(84px,1fr))">'+stops+'</ol><div class="ds-pipeline__phases" style="grid-template-columns:repeat(9,minmax(84px,1fr))">'+phases+'</div></div></div>';
}
function feeClocksPanel(jobs){
  const rows = jobs.map(j=>({ j, c:deadlineInfo(j) })).filter(x=>x.c && x.c.days!=null).sort((a,b)=>a.c.days-b.c.days);
  const body = rows.length ? '<div class="ds-stack--sm">'+rows.map(({j,c})=>{
    const tone = clockTone(c.days), pct = Math.max(0, Math.min(100, c.days/FREE_WINDOW_DAYS*100));
    return '<div class="ds-clock ds-clock--'+tone+'" style="cursor:pointer" onclick="go(\'#/jobs/'+j.id+'\')"><div class="ds-clock__row"><span><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-muted ds-xs"> · '+esc(c.label)+'</span></span><span class="ds-strong ds-small" style="color:var(--t1m-'+(tone==='neutral'?'ink':tone)+')">'+esc(clockText(c))+'</span></div>'+
      '<span class="ds-bar-track" role="img" aria-label="'+esc(clockText(c))+'"><span class="ds-bar-fill'+(tone==='neutral'?'':' ds-bar-fill--'+tone)+'" style="width:'+(c.days<0?100:pct)+'%"></span></span>'+
      '<div class="ds-muted ds-xs">'+esc(custById(j.customerId).name)+' · '+(c.days<0?'fees since ':'fees start after ')+shortDate(c.deadline)+'</div></div>';
  }).join('')+'</div>' : '<p class="ds-muted ds-small">No containers are on a free-time clock right now.</p>';
  return '<section class="ds-panel ds-panel--elevated" id="fee-clocks"><div class="ds-panel__head"><h2>'+icon('clock')+'Fee clocks</h2><span class="ds-panel__hint">free days before fees</span></div><div class="ds-panel__body">'+body+
    '<p class="ds-chart-note">'+icon('info')+'<span>Storage runs while the container sits at the port; detention runs until the empty container is returned to the shipping line. A full bar is '+FREE_WINDOW_DAYS+' or more free days.</span></p></div></section>';
}
function workloadPanel(jobs){
  const w = {};
  jobs.forEach(j=>j.tasks.forEach(t=>{ if(!t.done){ w[t.owner] = w[t.owner]||{open:0,overdue:0}; w[t.owner].open++; if(taskStatus(j,t)==='Overdue') w[t.owner].overdue++; } }));
  const max = Math.max(1, ...Object.values(w).map(x=>x.open));
  const rows = Object.entries(w).sort((a,b)=>b[1].open-a[1].open).map(([name,x])=>{
    const onTime = x.open - x.overdue;
    return '<div class="ds-bar-row" data-tip="'+esc(name+': '+x.open+' open, '+x.overdue+' overdue')+'"><span class="ds-bar-row__name">'+esc(name)+'</span><span class="ds-bar-track" style="background:transparent">'+
      '<span class="ds-bar-stack" style="width:'+Math.round(x.open/max*100)+'%">'+(onTime?'<span style="flex:'+onTime+';background:var(--t1m-navy-700);border-radius:'+(x.overdue?'0':'0 4px 4px 0')+'"></span>':'')+(x.overdue?'<span style="flex:'+x.overdue+';background:var(--t1m-danger);border-radius:0 4px 4px 0"></span>':'')+'</span></span>'+
      '<span class="ds-bar-row__value">'+x.open+(x.overdue?' <span class="ds-overdue">('+x.overdue+')</span>':'')+'</span></div>';
  }).join('');
  return '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('users')+'Team workload</h2><span class="ds-panel__hint">open tasks</span></div><div class="ds-panel__body">'+
    '<div class="ds-legend" style="margin-bottom:var(--t1m-space-4)"><span><i style="background:var(--t1m-navy-700)"></i>On time</span><span><i style="background:var(--t1m-danger)"></i>Overdue (count in brackets)</span></div>'+
    '<div class="ds-bars">'+(rows||'<p class="ds-muted">No open tasks.</p>')+'</div></div></section>';
}
function taskCard(x, i){
  const { j, t, st } = x;
  const c = custById(j.customerId);
  const btn = t.via==='delivery' ? '<button class="ds-btn ds-btn--secondary" onclick="openConfirmDelivery(\''+j.id+'\')">'+icon('truck')+'Confirm delivery</button>'
    : '<button class="ds-btn ds-btn--secondary" onclick="openCompleteTask(\''+j.id+'\',\''+t.id+'\')">'+icon('check')+'Complete</button>';
  return '<article class="ds-workcard" data-tone="'+(st==='Overdue'?'danger':'')+'" style="--i:'+i+'">'+
    '<div><div class="ds-workcard__title">'+esc(t.name)+'</div><div class="ds-workcard__meta">'+jobLink(j.id)+'<span>'+esc(c.name)+'</span>'+pill(st==='Overdue'?'Overdue since '+shortDate(t.due):(st==='To do'?'Due '+shortDate(t.due):'Later · '+shortDate(t.due)), TASK_TONE[st], TASK_ICON[st], 'ds-pill--sm')+(t.requiresEvidence?pill('Needs proof','neutral','file','ds-pill--sm'):'')+'</div></div>'+
    '<div class="ds-workcard__actions"><button class="ds-btn ds-btn--ghost" onclick="go(\'#/jobs/'+j.id+'\')">Open job</button>'+btn+'</div></article>';
}
function taskSections(list){
  const overdue = list.filter(x=>x.st==='Overdue'), todo = list.filter(x=>x.st==='To do'), later = list.filter(x=>x.st==='Upcoming');
  let i = 0;
  const sec = (title, items, ic, tone)=> items.length ? '<div class="ds-section-head" style="margin-top:var(--t1m-space-5)"><h2>'+icon(ic)+esc(title)+' '+pill(String(items.length), tone, null, 'ds-pill--sm')+'</h2></div><div class="ds-cards">'+items.map(x=>taskCard(x,i++)).join('')+'</div>' : '';
  return sec('Overdue', overdue, 'alert', 'danger') + sec('To do now', todo, 'clock', 'info') +
    (later.length ? (STATE.showUpcoming ? sec('Coming up later', later, 'circle', 'neutral') : '<button class="ds-btn ds-btn--ghost" style="margin-top:var(--t1m-space-4)" onclick="STATE.showUpcoming=true; render()">'+icon('chevron-down')+'Show '+plural(later.length,'task')+' coming up later</button>') : '') +
    (!list.length ? '<div class="ds-panel ds-panel--elevated">'+emptyState('check','No tasks assigned to you','New work appears here the moment a job reaches your step.')+'</div>' : '');
}

/* ---------- role pages ---------- */
function renderHome(){
  const r = role();
  if(r==='Manager'||r==='Admin') return renderManagerHome();
  if(r==='Finance') return renderFinanceHome();
  if(r==='Warehouse Crew') return renderCrewHome();
  return renderDispatcherHome();
}
function renderManagerHome(){
  const all = JOBS, active = all.filter(j=>j.statusIndex<8);
  const q = managerQueue();
  const f = STATE.queueFilter;
  const shown = f==='all' ? q : q.filter(x=>x.cat===f);
  const cnt = k => q.filter(x=>x.cat===k).length;
  const blocked = active.filter(j=>jobHealth(j).tone==='danger').length;
  const attention = active.filter(j=>jobHealth(j).tone==='warning').length;
  const clocks = active.filter(j=>{ const c = deadlineInfo(j); return c && c.days!=null && c.days<=2; }).length;
  const withFinance = active.filter(j=>j.statusIndex===7);
  const short = active.filter(j=>fundingGap(j)).length;
  const decisions = q.filter(x=>x.tone==='danger' || x.cat==='decisions').length;
  const chip = (k,label)=>'<button class="ds-chip" aria-pressed="'+(f===k)+'" onclick="STATE.queueFilter=\''+k+'\'; render()">'+label+'<span class="ds-chip__count">'+(k==='all'?q.length:cnt(k))+'</span></button>';
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+todayLong()+'. <strong>'+plural(q.length,'item')+'</strong> need'+(q.length===1?'s':'')+' a manager, <strong>'+decisions+'</strong> of them urgent.</p></div>'+
      '<div class="ds-page-head__actions"><button class="ds-btn ds-btn--secondary" onclick="go(\'#/reports\')">'+icon('chart')+'Reports</button></div></div>'+
    '<div class="ds-stack">'+
    '<div class="ds-kpis">'+
      kpi('box','Active shipments', active.length, 'every stage before Closed', null, jobsFilterJs('all'), 'kpi-active')+
      kpi('lock','Blocked', blocked, 'cannot move: exception or hold', blocked?'danger':null, jobsFilterJs('blocked'), 'kpi-blocked')+
      kpi('alert','Needs attention', attention, 'overdue, missing, short, fees', attention?'warning':null, jobsFilterJs('attention'), 'kpi-attention')+
      kpi('clock','Fees at risk', clocks, '2 free days or fewer', clocks?'warning':null, jobsFilterJs('clock'), 'kpi-clock')+
      kpi('wallet','Short on funds', short, 'bills due, client money short', short?'warning':null, jobsFilterJs('funds'), 'kpi-funds')+
      kpi('receipt','With Finance', withFinance.length, moneyShort(sumOf(withFinance,j=>jobCostMargin(j).billed))+' to bill', 'success', jobsFilterJs('all',7), 'kpi-finance')+
    '</div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('ship')+'Where every shipment is</h2><span class="ds-panel__hint">click a stage to open its jobs</span></div><div class="ds-panel__body">'+pipelineHtml(all)+'</div></section>'+
    '<div class="ds-split">'+
      '<section class="ds-panel ds-panel--elevated" id="needs-you"><div class="ds-panel__head"><h2>'+icon('flag')+'Needs you</h2><span class="ds-panel__hint">most urgent first · each row has the button that resolves it</span></div>'+
        '<div class="ds-panel__body" style="padding-bottom:var(--t1m-space-2)"><div class="ds-chips ds-chips--scroll">'+chip('all','All')+chip('decisions','Decisions')+chip('money','Money')+chip('deadlines','Deadlines')+'</div></div>'+
        queueHtml(shown, 'Nothing here. Every job in this group is moving on its own.')+'</section>'+
      '<div class="ds-stack">'+feeClocksPanel(active)+workloadPanel(active)+'</div>'+
    '</div></div>';
}
function renderDispatcherHome(){
  const tasks = myTaskList();
  const q = dispatcherQueue();
  const sales = salesQueue();
  const mine = myJobs();
  const overdue = tasks.filter(x=>x.st==='Overdue').length, todo = tasks.filter(x=>x.st==='To do').length;
  const docs = q.filter(x=>x.cat==='docs').length, moves = q.filter(x=>x.cat==='moves' && x.tone==='brand').length;
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+todayLong()+'. You have <strong>'+plural(overdue+todo,'task')+'</strong> to do and <strong>'+plural(q.length,'follow-up')+'</strong> on your customers’ shipments.</p></div>'+
    '<div class="ds-page-head__actions"><button class="ds-btn ds-btn--primary" onclick="openNewInquiry()">'+icon('plus')+'New inquiry</button></div></div>'+
    '<div class="ds-stack">'+
    '<div class="ds-kpis">'+
      kpi('alert','Overdue tasks', overdue, 'past their due date', overdue?'danger':null, "document.getElementById('my-tasks').scrollIntoView({behavior:'smooth'})")+
      kpi('clock','To do now', todo, 'the job has reached your step', null, "document.getElementById('my-tasks').scrollIntoView({behavior:'smooth'})")+
      kpi('file','Documents to chase', docs, 'review, upload or replace', docs?'warning':null, "document.getElementById('follow-ups').scrollIntoView({behavior:'smooth'})")+
      kpi('arrow-right','Ready to move on', moves, 'gate met, one click away', moves?'success':null, "document.getElementById('follow-ups').scrollIntoView({behavior:'smooth'})")+
    '</div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('ship')+'Your customers’ shipments</h2><span class="ds-panel__hint">'+plural(mine.length,'job')+' · click a stage</span></div><div class="ds-panel__body">'+pipelineHtml(mine)+'</div></section>'+
    '<div class="ds-split"><div id="my-tasks"><div class="ds-section-head"><h2>'+icon('tasks')+'Your tasks</h2><span class="ds-panel__hint">tasks you own, most urgent first</span></div>'+taskSections(tasks)+'</div>'+
    '<div class="ds-stack">'+
      '<section class="ds-panel ds-panel--elevated" id="follow-ups"><div class="ds-panel__head"><h2>'+icon('flag')+'Shipment follow-ups</h2></div>'+queueHtml(q, 'No documents to chase and nothing waiting on you.')+'</section>'+
      '<section class="ds-panel ds-panel--elevated" id="sales-follow-ups"><div class="ds-panel__head"><h2>'+icon('quote')+'Sales follow-ups</h2><a class="ds-link ds-small" href="#/inquiries">All inquiries'+icon('arrow-right')+'</a></div>'+queueHtml(sales, 'No inquiries waiting on you.')+'</section>'+
    '</div></div></div>';
}
function renderCrewHome(){
  const deliveries = crewDeliveries();
  const tasks = myTaskList().filter(x=>x.t.via!=='delivery');
  const returns = tasks.filter(x=>x.t.detention && x.st!=='Upcoming');
  const others = tasks.filter(x=>!returns.includes(x));
  const dCards = deliveries.map((j,i)=>{
    const c = custById(j.customerId);
    const clk = deadlineInfo(j);
    return '<article class="ds-workcard" style="--i:'+i+'"><div><div class="ds-workcard__title">'+esc(j.consignee)+'</div>'+
      '<div class="ds-workcard__meta">'+jobLink(j.id)+'<span>'+esc(j.destination)+'</span><span class="ds-mono">'+esc(j.containerNo)+'</span></div>'+
      '<div class="ds-alert ds-alert--info" style="margin-top:var(--t1m-space-3)">'+icon('info')+'<div><strong>Delivery instructions</strong>'+esc(c.instructions)+'</div></div>'+
      (clk?'<div class="ds-muted ds-xs" style="margin-top:var(--t1m-space-2)">'+icon('clock')+' '+esc(clk.label+': '+clockText(clk))+', return the empty container by '+shortDate(clk.deadline)+'.</div>':'')+'</div>'+
      '<div class="ds-workcard__actions"><button class="ds-btn ds-btn--'+(deliveries.length===1?'primary':'secondary')+' ds-btn--touch" onclick="openConfirmDelivery(\''+j.id+'\')">'+icon('truck')+'Confirm delivery</button></div></article>';
  }).join('');
  let i = deliveries.length;
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+todayLong()+'. <strong>'+plural(deliveries.length,'delivery','deliveries')+'</strong> to confirm'+(returns.length?' and <strong>'+plural(returns.length,'empty container')+'</strong> to return':'')+'.</p></div></div>'+
    '<div class="ds-stack">'+
    '<section><div class="ds-section-head"><h2>'+icon('truck')+'Deliveries to confirm</h2><span class="ds-panel__hint">receiver name + proof of delivery</span></div>'+
      (dCards ? '<div class="ds-cards">'+dCards+'</div>' : '<div class="ds-panel ds-panel--elevated">'+emptyState('check','No deliveries waiting','A job appears here when it goes out for delivery.')+'</div>')+'</section>'+
    (returns.length ? '<section><div class="ds-section-head"><h2>'+icon('refresh')+'Empty containers to return</h2><span class="ds-panel__hint">detention fees start after the free days</span></div><div class="ds-cards">'+returns.map(x=>taskCard(x,i++)).join('')+'</div></section>' : '')+
    '<section><div class="ds-section-head"><h2>'+icon('tasks')+'Your other tasks</h2></div>'+taskSections(others)+'</section>'+
    '</div>';
}
function renderFinanceHome(){
  const ready = JOBS.filter(j=>j.statusIndex===7);
  const settled = JOBS.filter(j=>j.statusIndex>=6);
  const refunds = settled.filter(j=>jobFunds(j).settlement>0), toBill = settled.filter(j=>jobFunds(j).settlement<0);
  const short = JOBS.filter(j=>fundingGap(j));
  const value = sumOf(ready, j=>jobCostMargin(j).billed);
  const rows = settled.map(j=>{
    const f = jobFunds(j), s = f.settlement;
    const pending = j.charges.some(isUnresolved);
    const outcome = s>0 ? pill('Refund '+money(s),'info','arrow-out') : s<0 ? pill('Bill client '+money(-s),'warning','receipt') : pill('Fully settled','success','check');
    return '<tr data-href onclick="go(\'#/jobs/'+j.id+'/money\')"><td data-label="Job"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(custById(j.customerId).name)+'</span></span></td>'+
      '<td data-label="Stage">'+stagePill(j)+'</td><td data-label="Billed" class="ds-num">'+money(jobCostMargin(j).billed)+'</td><td data-label="Outcome">'+outcome+(pending?' '+pill('Provisional','neutral','clock','ds-pill--sm'):'')+'</td>'+
      '<td data-label="" class="ds-num">'+(j.statusIndex>=7?'<a class="ds-btn ds-btn--secondary ds-btn--sm" href="#/jobs/'+j.id+'/billing-summary" onclick="event.stopPropagation()">'+icon('file')+'Billing Summary</a>':'<span class="ds-muted ds-xs">Not handed over yet</span>')+'</td></tr>';
  }).join('');
  const q = ready.map(j=>({ tone:'brand', icon:'receipt', job:j, title:'Ready for Finance · '+money(jobCostMargin(j).billed), why:(()=>{ const s = jobFunds(j).settlement; return (s>0?'Refund due to client: '+money(s):s<0?'Balance to bill client: '+money(-s):'Fully settled')+' · waiting '+plural(j.billingReadyDays||0,'day'); })(), btn:{ label:'Billing Summary', js:"go('#/jobs/"+j.id+"/billing-summary')" } }));
  return '<div class="ds-page-head"><div class="ds-hello"><h1>'+esc(greeting())+'</h1><p>'+todayLong()+'. <strong>'+plural(ready.length,'job')+'</strong> handed to Finance, worth <strong>'+money(value)+'</strong>.</p></div><span class="ds-readonly">'+icon('eye')+'Read only</span></div>'+
    '<div class="ds-stack">'+
    '<div class="ds-kpis">'+
      kpi('receipt','Waiting on Finance', ready.length, moneyShort(value)+' billed to clients', null, jobsFilterJs('all',7))+
      kpi('arrow-out','Refunds due', refunds.length, moneyShort(sumOf(refunds,j=>jobFunds(j).settlement))+' back to clients', null, "document.getElementById('settlements').scrollIntoView({behavior:'smooth'})")+
      kpi('receipt','Balances to bill', toBill.length, moneyShort(-sumOf(toBill,j=>jobFunds(j).settlement))+' still owed', toBill.length?'warning':null, "document.getElementById('settlements').scrollIntoView({behavior:'smooth'})")+
      kpi('wallet','Short on funds', short.length, 'operations is chasing deposits', short.length?'warning':null, jobsFilterJs('funds'))+
    '</div>'+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__head"><h2>'+icon('receipt')+'Handed to Finance</h2><span class="ds-panel__hint">oldest first</span></div>'+queueHtml(q.sort((a,b)=>(b.job.billingReadyDays||0)-(a.job.billingReadyDays||0)), 'Nothing waiting for Finance.')+'</section>'+
    '<section class="ds-panel ds-panel--elevated" id="settlements"><div class="ds-panel__head"><h2>'+icon('wallet')+'How each delivered job settles</h2><span class="ds-panel__hint">client money in, minus money spent and our fees</span></div>'+
      '<div class="ds-table-wrap"><table class="ds-table ds-table--stack"><thead><tr><th>Job</th><th>Stage</th><th class="ds-num">Billed to client</th><th>Final balance</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
    '</div>';
}
