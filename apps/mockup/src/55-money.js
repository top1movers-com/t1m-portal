/* ============================== MONEY TAB ==============================
   One question per block: Is there enough client money for what is due? (shortfall banner) · Where
   did the client's money go? (notebook) · What is not agreed yet? (extra charges) · What do we
   bill? (charges) · Did we make money? (margin) · Can Finance have it? (checklist). */
function stat(label, value, danger, sub){ return '<div class="ds-stat"><div class="ds-label">'+esc(label)+'</div><div class="ds-stat__value'+(danger?' ds-stat__value--danger':'')+'">'+value+'</div>'+(sub?'<div class="ds-muted ds-xs">'+sub+'</div>':'')+'</div>'; }
function dueText(dueDate){
  const d = daysUntil(dueDate);
  if(d===null) return { text:'No due date', tone:'neutral' };
  if(d<0) return { text:'Overdue by '+plural(-d,'day'), tone:'danger' };
  if(d===0) return { text:'Due today', tone:'danger' };
  return { text:'Due in '+plural(d,'day'), tone:d<=2?'warning':'neutral' };
}
function fundingGapBanner(j){
  const g = fundingGap(j);
  if(!g) return '';
  return '<div class="ds-alert ds-alert--warning ds-alert--enter" role="alert" id="funding-gap">'+icon('wallet')+'<div><strong>Short on client funds</strong>'+esc(g.text)+(g.storageText?' '+esc(g.storageText):'')+
    (canManageFunds() ? '<div class="ds-alert__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openAddFunds(\''+j.id+'\')">'+icon('wallet')+'Add funds received</button></div>' : '')+'</div></div>';
}
function settlementHtml(j, f){
  if(j.statusIndex < 6) return '<p class="ds-muted ds-small">'+icon('info')+' The final balance is worked out after delivery, when every cost is known.</p>';
  const s = f.settlement, pending = j.charges.some(isUnresolved);
  const [tone, ic, title] = s>0 ? ['info','arrow-out','Refund due to client: '+money(s)] : s<0 ? ['warning','receipt','Balance to bill client: '+money(-s)] : ['success','check','Fully settled'];
  return '<div class="ds-alert ds-alert--'+tone+'" id="settlement">'+icon(ic)+'<div><strong>'+esc(title)+(pending?' (provisional)':'')+'</strong>Money in '+money(f.received)+', minus money spent '+money(f.disbursed)+' and our fees '+money(f.ourFees)+'.'+(pending?' Not final: an extra charge still needs a decision.':'')+'</div></div>';
}
function ledgerHtml(j, f){
  const upcoming = j.charges.filter(c=>isReimbursable(c) && !c.paidDate && !isAbsorbed(c)).sort((a,b)=>(parseDMY(a.dueDate)||0)-(parseDMY(b.dueDate)||0));
  if(!f.ledger.length && !upcoming.length) return emptyState('wallet','Nothing recorded yet','Add the client’s deposit to start this job’s notebook.');
  let i = 0;
  const rows = f.ledger.map(r=>{
    const isIn = r.kind==='in';
    const proof = r.evidence ? '<span class="ds-ledger__proof">'+icon('file')+'<span class="ds-mono ds-xs">'+esc(r.evidence)+'</span></span>' : pill(isIn?'Proof missing':'Receipt missing','warning','alert','ds-pill--sm');
    const flag = (!isIn && isUnresolved(r.ref)) ? ' '+pill('Not in quote','warning','alert','ds-pill--sm') : '';
    return '<tr style="--i:'+(i++)+'"><td data-label="Date">'+esc(shortDate(r.date))+'</td><td data-label="What"><span class="ds-ledger__proof">'+icon(isIn?'arrow-in':'arrow-out')+esc(r.label)+flag+'</span></td><td data-label="Proof">'+proof+'</td>'+
      '<td data-label="Money in" class="ds-num'+(isIn?' ds-ledger__in':'')+'">'+(isIn?'+'+money(r.amount):'')+'</td><td data-label="Money spent" class="ds-num">'+(isIn?'':'−'+money(r.amount))+'</td>'+
      '<td data-label="Left over" class="ds-num ds-ledger__bal'+(r.balance<0?' ds-ledger__neg':'')+'">'+moneySigned(r.balance)+'</td></tr>';
  }).join('');
  const coming = upcoming.map(c=>{ const d = dueText(c.dueDate); return '<tr style="--i:'+(i++)+'"><td data-label="Date">'+esc(shortDate(c.dueDate)||'—')+'</td><td data-label="What"><span class="ds-ledger__proof">'+icon('clock')+esc(c.desc)+' <span class="ds-muted">(not paid yet)</span></span></td><td data-label="When">'+pill(d.text,d.tone,'clock','ds-pill--sm')+'</td><td class="ds-num"></td><td data-label="Due" class="ds-num ds-muted">'+money(c.amount)+' due</td><td class="ds-num"></td></tr>'; }).join('');
  return '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack ds-ledger" id="funds-ledger"><thead><tr><th>Date</th><th>What</th><th>Proof</th><th class="ds-num">Money in</th><th class="ds-num">Money spent</th><th class="ds-num">Left over</th></tr></thead><tbody>'+rows+coming+'</tbody></table></div>';
}
function jobMoneyTab(j){
  if(!canSeeFunds()) return accessDenied('Money');
  const f = jobFunds(j), cm = jobCostMargin(j);
  const pct = f.received>0 ? Math.min(100, Math.round(f.disbursed/f.received*100)) : (f.disbursed>0?100:0);
  const meterTone = f.disbursed>f.received ? 'danger' : pct>=80 ? 'warning' : 'success';
  const ro = !canManageFunds();
  const unresolved = j.charges.filter(isUnresolved);
  const checklist = billingChecklist(j), ready = checklist.every(c=>c.ok);
  const chargeRows = j.charges.map(c=>{
    const reimb = isReimbursable(c);
    const pay = !reimb ? '<span class="ds-muted">Billed to client</span>' : c.paidDate ? 'Paid '+esc(shortDate(c.paidDate)) : (()=>{ const d = dueText(c.dueDate); return pill(d.text, d.tone, 'clock','ds-pill--sm'); })();
    const tag = isUnresolved(c) ? pill('Not in quote','warning','alert','ds-pill--sm') : c.approval ? pill(c.approval.status==='Absorbed'?'Absorbed by us':'Client approved', c.approval.status==='Absorbed'?'info':'success', c.approval.status==='Absorbed'?'shield':'check','ds-pill--sm') : '';
    const detail = c.approval ? '<div class="ds-muted ds-xs">'+esc(c.approval.status)+' by '+esc(c.approval.by)+', '+esc(c.approval.on)+(c.approval.reason?': '+esc(c.approval.reason):'')+(c.approval.clientContact?' (client: '+esc(c.approval.clientContact)+')':'')+'</div>' : '';
    return '<tr><td data-label="Charge" style="white-space:normal"><span class="ds-strong">'+esc(c.desc)+'</span> '+tag+(c.markup?' <span class="ds-muted ds-xs">(+'+money(c.markup)+' markup)</span>':'')+detail+'</td><td data-label="Type">'+(reimb?'Reimbursable':'Service fee')+'<div class="ds-muted ds-xs">'+esc(categoryOf(c))+'</div></td><td data-label="Payment">'+pay+'</td>'+
      '<td data-label="Receipt">'+(c.evidence?'<span class="ds-mono ds-xs">'+esc(c.evidence)+'</span>':(reimb&&c.paidDate?pill('Receipt missing','warning','alert','ds-pill--sm'):'<span class="ds-muted3">—</span>'))+'</td><td data-label="Amount" class="ds-num">'+money(c.amount)+'</td></tr>';
  }).join('');
  const sub = (label, val, strong)=>'<tr><td colspan="4" style="text-align:right'+(strong?';font-weight:600':'')+'">'+label+'</td><td class="ds-num"'+(strong?' style="font-weight:600"':'')+'>'+money(val)+'</td></tr>';
  const maxCat = Math.max(1, ...cm.byCategory.map(c=>c.amount));
  const overQuote = cm.quoted>0 && cm.billed>cm.quoted;
  return '<div class="ds-stack">'+
    (ro ? '<span class="ds-readonly">'+icon('eye')+'Read only for '+esc(role())+'</span>' : '')+
    fundingGapBanner(j)+
    '<section id="client-funds"><div class="ds-section-head"><h2>'+icon('wallet')+'Client money for this job</h2>'+(canManageFunds()?'<button class="ds-btn ds-btn--secondary ds-btn--sm" id="add-funds-btn" onclick="openAddFunds(\''+j.id+'\')">'+icon('plus')+'Add funds received</button>':'')+'</div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-4)">Top1Movers pays duties, freight and port fees for the client first. This notebook shows what the client sent, what we spent for them, and what is left.</p>'+
      '<div class="ds-stats" style="margin-bottom:var(--t1m-space-4)">'+stat('Money in', money(f.received))+stat('Money spent', money(f.disbursed))+stat('Left over', moneySigned(f.balance), f.balance<0, f.balance<0?'Top1Movers has advanced '+money(-f.balance):'')+'</div>'+
      '<div class="ds-stack--sm"><div class="ds-row--between"><span class="ds-label">Spent so far</span><span class="ds-muted ds-xs">'+money(f.disbursed)+' of '+money(f.received)+' received</span></div>'+
      '<span class="ds-bar-track" role="img" aria-label="'+pct+' percent spent" style="display:block;height:8px"><span class="ds-bar-fill ds-bar-fill--'+meterTone+'" style="width:'+pct+'%"></span></span>'+settlementHtml(j, f)+'</div>'+
      '<div style="margin-top:var(--t1m-space-4)">'+ledgerHtml(j, f)+'</div></section>'+
    (unresolved.length ? '<section class="ds-alert ds-alert--warning" id="needs-approval">'+icon('receipt')+'<div style="flex:1"><strong>Extra charge'+(unresolved.length>1?'s':'')+' not in the approved quote</strong>The client did not agree to '+(unresolved.length>1?'these':'this')+' in the quotation. Record the client’s approval, or absorb the cost with a reason. Finance cannot have the job until this is decided.'+
      '<div class="ds-stack--sm" style="margin-top:var(--t1m-space-3)">'+unresolved.map(c=>'<div class="ds-row--between"><span class="ds-strong">'+esc(c.desc)+' · '+money(c.amount)+'</span>'+(canManageFunds()?'<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openDecideCharge(\''+j.id+'\',\''+c.id+'\')">Decide</button>':'<span class="ds-muted ds-xs">Waiting on a Manager</span>')+'</div>').join('')+'</div></div></section>' : '')+
    '<section><div class="ds-section-head"><h2>'+icon('receipt')+'Charges</h2>'+(canManageFunds()?'<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openAddCharge(\''+j.id+'\')">'+icon('plus')+'Add charge</button>':'')+'</div>'+
      '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack" id="charges-table"><thead><tr><th>Charge</th><th>Type</th><th>Payment</th><th>Receipt</th><th class="ds-num">Amount</th></tr></thead><tbody>'+
      (chargeRows||'<tr><td colspan="5" class="ds-muted">No charges recorded yet.</td></tr>')+
      (j.charges.length ? sub('Pass-through costs (billed at cost)', cm.reimbursable)+sub('Our service fees', cm.serviceFees)+(cm.markup?sub('Markup', cm.markup):'')+(cm.absorbedCost?sub('Absorbed by Top1Movers (not billed)', cm.absorbedCost):'')+sub('Total billed to client', cm.billed, true) : '')+'</tbody></table></div></section>'+
    '<section id="cost-margin"><div class="ds-section-head"><h2>'+icon('chart')+'Cost and margin</h2>'+pill(overQuote?'Over the quote':'Within the quote', overQuote?'warning':'success', overQuote?'alert':'check')+'</div>'+
      '<div class="ds-stats" style="margin-bottom:var(--t1m-space-4)">'+stat('Quoted', money(cm.quoted), false, cm.hasQuotation?'':'estimated (no quote in sample data)')+stat('Billed to client', money(cm.billed))+stat('Our margin', moneySigned(cm.margin), cm.margin<0, cm.marginPct.toFixed(1)+'% of billed'+(cm.absorbedCost?' · after '+money(cm.absorbedCost)+' absorbed':''))+'</div>'+
      '<div class="ds-bars">'+cm.byCategory.map(c=>'<div class="ds-bar-row" data-tip="'+esc(c.category+': '+money(c.amount)+' ('+c.pct.toFixed(0)+'% of all charges)')+'"><span class="ds-bar-row__name">'+esc(c.category)+'</span><span class="ds-bar-track"><span class="ds-bar-fill" style="width:'+(cm.actual?Math.round(c.amount/maxCat*100):0)+'%"></span></span><span class="ds-bar-row__value">'+moneyShort(c.amount)+'</span></div>').join('')+'</div>'+
      '<p class="ds-chart-note">'+icon('info')+'<span>Margin is our service fees plus any markup, less any cost we absorb. Pass-through costs (freight, duties) are billed at cost, so they are never counted as margin.</span></p></section>'+
    (j.statusIndex<6 ? '<p class="ds-muted ds-small">'+icon('info')+' The handoff checklist for Finance appears once the goods are delivered.</p>' :
    '<section id="billing-checklist-panel"><div class="ds-section-head"><h2>'+icon('tasks')+'Handoff to Finance</h2>'+(j.statusIndex>=7?pill('With Finance','brand','receipt'):pill(ready?'Ready':'Not ready', ready?'success':'neutral', ready?'check':'clock'))+'</div>'+
      '<ul class="ds-gate" id="billing-checklist">'+checklist.map(c=>gateItemHtml({ label:c.label, sub:c.ok?null:c.sub, met:c.ok, act:c.ok?null:{ label:'Open', js:"goTab('"+j.id+"','"+c.tab+"')" } })).join('')+'</ul>'+
      '<div class="ds-row" style="margin-top:var(--t1m-space-4)">'+
        (j.statusIndex===6 && ready && canManageFunds() ? '<button class="ds-btn ds-btn--secondary" onclick="markBillingReady(\''+j.id+'\')">'+icon('receipt')+'Mark ready for Finance</button>' : '')+
        (j.statusIndex>=7 ? '<a class="ds-btn ds-btn--secondary" href="#/jobs/'+j.id+'/billing-summary">'+icon('file')+'Open Billing Summary</a>' : '')+
      '</div></section>')+
    '<p class="ds-muted ds-xs">'+icon('info')+' A per-job notebook for a cleaner Finance handoff, not accounting software: no ledger, tax or payment system behind it. Sample figures.</p>'+
  '</div>';
}

/* ---------- Money actions (Manager / Admin) ---------- */
function denyFunds(){ if(canManageFunds()) return false; showToast('Only a Manager or Admin can change client money and charges.', 'danger', 'lock'); return true; }
function openAddFunds(jobId){
  if(denyFunds()) return;
  const j = jobById(jobId), g = fundingGap(j);
  openDrawer({ title:'Add funds received', sub:'<span class="ds-mono">'+j.id+'</span> · a deposit from '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="funds-form" onsubmit="event.preventDefault(); saveFunds(\''+jobId+'\', this)">'+
      (g?'<div class="ds-alert ds-alert--warning">'+icon('wallet')+'<div><strong>Short by '+money(g.short)+'</strong>'+esc(g.first.desc)+' is due '+esc(shortDate(g.first.dueDate))+'.</div></div>':'')+
      '<div class="ds-field"><label for="fd-amount">Amount</label><div class="ds-input-group"><span class="ds-affix">PHP</span><input class="ds-input" id="fd-amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00"'+(g?' value="'+Math.ceil(g.short)+'"':'')+'></div>'+errorSlot('amount')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="fd-date">Date received</label><input class="ds-input" id="fd-date" name="date" value="'+todayDMY()+'">'+errorSlot('date')+'</div>'+
      '<div class="ds-field"><label for="fd-method">Method</label>'+selectWrap('<select class="ds-select" id="fd-method" name="method">'+options(['Bank transfer','Online banking','Check','Cash deposit'])+'</select>')+'</div></div>'+
      '<div class="ds-field"><label for="fd-ref">Bank reference <span class="ds-opt">optional</span></label><input class="ds-input" id="fd-ref" name="reference" placeholder="e.g. BT-781200"></div>'+
      '<div class="ds-field"><label>Deposit slip</label>'+uploadHtml('fundsProof','Deposit slip or bank confirmation')+'</div></form>',
    foot: drawerFoot('Save deposit','funds-form',{icon:'wallet'}) });
}
function saveFunds(jobId, form){
  if(denyFunds()) return;
  const j = jobById(jobId), fd = new FormData(form);
  const amount = Number(fd.get('amount')), date = String(fd.get('date')||'').trim();
  if(fieldError(form,'date', parseDMY(date)?'':'Enter the date like 28 Sep 2026.') | fieldError(form,'amount', amount>0?'':'Enter an amount greater than zero.')) return;
  const ref = String(fd.get('reference')||'').trim();
  j.fundsReceived.push({ id:'F'+(j.fundsReceived.length+1), date, amount, method:fd.get('method'), reference:ref, evidence:UPLOADS.fundsProof||null, forDuty:awaitingClientDuty(j) });
  log(j, 'Funds received', money(amount)+' by '+String(fd.get('method')).toLowerCase()+(ref?' (ref '+ref+')':'')+'.', true);
  closeDrawer(); STATE.justNext = j.id;
  showToast(money(amount)+' added. '+(fundingGap(j)?'Still short.':'The job is covered.'), 'success', 'wallet'); render();
}
function openDecideCharge(jobId, chargeId){
  if(denyFunds()) return;
  const j = jobById(jobId), c = j.charges.find(x=>x.id===chargeId), cust = custById(j.customerId);
  openDrawer({ title:'Decide an extra charge', sub:esc(c.desc)+' · '+money(c.amount)+' · <span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="decide-form" onsubmit="event.preventDefault(); saveDecideCharge(\''+jobId+'\',\''+chargeId+'\', this)">'+
      '<p>This cost was not in the quotation the client signed. Who pays it?</p>'+
      '<label class="ds-check" style="align-items:flex-start"><input type="radio" name="d" value="client" checked onchange="document.getElementById(\'dc-client\').hidden=false; document.getElementById(\'dc-absorb\').hidden=true"> <span><strong class="ds-strong">The client agreed to pay it</strong><br><span class="ds-muted ds-xs">It is billed to the client like any other cost</span></span></label>'+
      '<div id="dc-client" class="ds-field" style="margin-left:26px"><label for="dc-who">Who at the client approved it?</label><input class="ds-input" id="dc-who" name="who" value="'+esc(cust.contact.name)+'">'+errorSlot('who')+'</div>'+
      '<label class="ds-check" style="align-items:flex-start"><input type="radio" name="d" value="absorb" onchange="document.getElementById(\'dc-client\').hidden=true; document.getElementById(\'dc-absorb\').hidden=false"> <span><strong class="ds-strong">Top1Movers absorbs it</strong><br><span class="ds-muted ds-xs">Not billed. It comes out of our margin</span></span></label>'+
      '<div id="dc-absorb" class="ds-field" style="margin-left:26px" hidden><label for="dc-reason">Why are we absorbing it?</label><textarea class="ds-textarea" id="dc-reason" name="reason" placeholder="e.g. Our late lodgement caused the storage days"></textarea>'+errorSlot('reason')+'</div></form>',
    foot: drawerFoot('Save decision','decide-form',{icon:'check'}) });
}
function saveDecideCharge(jobId, chargeId, form){
  if(denyFunds()) return;
  const j = jobById(jobId), c = j.charges.find(x=>x.id===chargeId), fd = new FormData(form);
  if(fd.get('d')==='client'){
    const who = String(fd.get('who')||'').trim();
    if(fieldError(form,'who', who?'':'Name the person at the client who approved it.')) return;
    c.approval = { status:'Client approved', by:CURRENT_USER.name, on:todayDMY(), clientContact:who };
    log(j, 'Extra charge approved by client', c.desc+' ('+money(c.amount)+') approved by '+who+'.', true);
    showToast(c.desc+' marked client approved.', 'success', 'check');
  } else {
    const reason = String(fd.get('reason')||'').trim();
    if(fieldError(form,'reason', reason?'':'A reason is required to absorb a cost.')) return;
    c.approval = { status:'Absorbed', by:CURRENT_USER.name, on:todayDMY(), reason };
    log(j, 'Extra charge absorbed', c.desc+' ('+money(c.amount)+') absorbed by Top1Movers: '+reason, true);
    showToast(c.desc+' absorbed by Top1Movers.', 'info', 'shield');
  }
  closeDrawer(); STATE.justNext = j.id; render();
}
function openAddCharge(jobId){
  if(denyFunds()) return;
  const j = jobById(jobId);
  openDrawer({ title:'Add charge', sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="charge-form" onsubmit="event.preventDefault(); saveCharge(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="ch-desc">Description</label><input class="ds-input" id="ch-desc" name="desc" placeholder="e.g. Warehousing fee">'+errorSlot('desc')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="ch-type">Type</label>'+selectWrap('<select class="ds-select" id="ch-type" name="type">'+options([{value:'Reimbursable',label:'Reimbursable (billed at cost)'},{value:'Service fee',label:'Service fee (our income)'}])+'</select>')+'</div>'+
      '<div class="ds-field"><label for="ch-cat">Category</label>'+selectWrap('<select class="ds-select" id="ch-cat" name="category">'+options(CHARGE_CATEGORIES)+'</select>')+'</div></div>'+
      '<div class="ds-field"><label for="ch-amount">Amount</label><div class="ds-input-group"><span class="ds-affix">PHP</span><input class="ds-input" id="ch-amount" name="amount" type="number" step="0.01" placeholder="0.00"></div>'+errorSlot('amount')+'</div>'+
      '<div class="ds-field"><label for="ch-quoted">In the approved quotation?</label>'+selectWrap('<select class="ds-select" id="ch-quoted" name="quoted">'+options([{value:'yes',label:'Yes'},{value:'no',label:'No, needs a decision'}])+'</select>')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="ch-paid">Payment</label>'+selectWrap('<select class="ds-select" id="ch-paid" name="paid">'+options([{value:'paid',label:'Already paid'},{value:'unpaid',label:'Not paid yet'}])+'</select>')+'</div>'+
      '<div class="ds-field"><label for="ch-date">Date paid or due</label><input class="ds-input" id="ch-date" name="date" value="'+todayDMY()+'">'+errorSlot('date')+'</div></div>'+
      '<div class="ds-field"><label>Receipt</label>'+uploadHtml('chargeEvidence')+'</div></form>',
    foot: drawerFoot('Add charge','charge-form',{icon:'plus'}) });
}
function saveCharge(jobId, form){
  if(denyFunds()) return;
  const j = jobById(jobId), fd = new FormData(form);
  const type = fd.get('type'), amount = Number(fd.get('amount'))||0, reimb = type!=='Service fee', date = String(fd.get('date')||'').trim(), desc = String(fd.get('desc')||'').trim();
  if(fieldError(form,'desc', desc?'':'Describe the charge.') | fieldError(form,'amount', amount>0?'':'Enter an amount greater than zero.') | fieldError(form,'date', (!reimb||parseDMY(date))?'':'Enter the date like 28 Sep 2026.')) return;
  const paid = reimb && fd.get('paid')==='paid';
  const c = { id:'C'+(j.charges.length+1), desc, category:fd.get('category'), amount, type, quoted:fd.get('quoted')==='yes', paidDate: paid?date:null, dueDate:(reimb&&!paid)?date:null, evidence:UPLOADS.chargeEvidence||null };
  j.charges.push(c);
  log(j, 'Charge recorded', desc+' ('+money(amount)+', '+type.toLowerCase()+(c.quoted?'':', not in quotation')+').', true);
  closeDrawer(); STATE.justNext = j.id; showToast('Charge added.', 'success', 'check'); render();
}
function markBillingReady(jobId){
  if(denyFunds()) return;
  const j = jobById(jobId);
  const missing = billingChecklist(j).filter(c=>!c.ok);
  if(missing.length){ showToast('Not ready: '+missing[0].label.toLowerCase()+'.', 'danger', 'lock'); return; }
  j.statusIndex = 7; j.billingReadyDays = 0;
  log(j, 'Ready for Finance', 'Billing checklist complete. Handed to Finance.');
  STATE.justAdvanced = { id:j.id, idx:7 }; STATE.justNext = j.id;
  showToast(j.id+' is with Finance now.', 'success', 'receipt'); render();
}

/* ============================== BILLING SUMMARY ==============================
   A printable Finance handoff. Never called an invoice anywhere, so the mockup never implies it
   produces one. */
function renderBillingSummaryPage(jobId){
  const j = jobById(jobId);
  if(!j) return emptyState('search','Job not found','');
  if(!canSeeFunds()) return accessDenied('Billing Summary');
  if(j.statusIndex<7) return '<div class="ds-panel ds-panel--elevated">'+emptyState('lock','Not handed to Finance yet','The Billing Summary exists once the job is marked ready for Finance.','<a class="ds-btn ds-btn--secondary" href="#/jobs/'+j.id+'/money">Back to the job</a>')+'</div>';
  const c = custById(j.customerId), cm = jobCostMargin(j), f = jobFunds(j);
  const rows = j.charges.map(ch=>{
    const note = isUnresolved(ch)?' <span class="ds-muted ds-xs">(not in quotation, awaiting decision)</span>':isAbsorbed(ch)?' <span class="ds-muted ds-xs">(absorbed, not billed)</span>':(ch.approval?' <span class="ds-muted ds-xs">(client approved)</span>':'');
    return '<tr><td style="white-space:normal">'+esc(ch.desc)+note+'</td><td>'+esc(categoryOf(ch))+'</td><td>'+(isReimbursable(ch)?'Reimbursable':'Service fee')+'</td><td class="ds-num">'+money(ch.amount)+'</td></tr>';
  }).join('');
  const line = (l, v, strong)=>'<div class="ds-row--between"><span class="ds-label">'+l+'</span><span class="ds-mono"'+(strong?' style="font-weight:600;color:var(--t1m-ink)"':'')+'>'+v+'</span></div>';
  const s = f.settlement;
  const exportBtn = j.id==='SJ-2026-00101' ? '<a class="ds-btn ds-btn--primary ds-btn--sm" href="assets/sample-invoice-SJ-2026-00101.pdf" download="billing-summary-SJ-2026-00101.pdf">'+icon('download')+'Download PDF</a>' : '<button type="button" class="ds-btn ds-btn--primary ds-btn--sm" onclick="window.print()">'+icon('download')+'Print / Export</button>';
  return '<div class="ds-billing-summary"><div class="ds-billing-summary__toolbar no-print"><a class="ds-btn ds-btn--ghost ds-btn--sm" href="#/jobs/'+j.id+'/money">'+icon('chevron-right','ds-flip')+'Back to the job</a>'+exportBtn+'</div>'+
    '<div class="ds-billing-summary__doc">'+
      '<div class="ds-alert ds-alert--warning no-print" style="margin-bottom:var(--t1m-space-5)">'+icon('info')+'<div><strong>Mock document</strong>An internal Finance handoff, not an invoice. Figures are illustrative.</div></div>'+
      '<div class="ds-billing-summary__brand"><img src="'+LOGO_SRC+'" alt="Top1Movers"><div class="ds-billing-summary__title"><h1>Billing Summary</h1><span class="ds-mockbadge" id="mock-doc-label">Mock document</span><div class="ds-muted ds-small" style="margin-top:4px">Job '+esc(j.id)+' · issued '+todayDMY()+'</div></div></div><hr>'+
      '<div class="ds-billing-summary__grid"><div><span class="ds-label">Customer</span><div class="ds-strong">'+esc(c.name)+'</div><div class="ds-muted ds-small">'+esc(j.consignee)+'</div></div><div><span class="ds-label">Shipment</span><div>'+esc(j.origin+' → '+j.portOfEntry+' → '+j.destination)+'</div><div class="ds-muted ds-small">Container '+esc(j.containerNo)+' · BL '+esc(j.blNo)+'</div></div></div>'+
      '<span class="ds-label" style="display:block;margin-bottom:var(--t1m-space-2)">Charges</span>'+
      '<div class="ds-table-wrap" style="margin-bottom:var(--t1m-space-6)"><table class="ds-table"><thead><tr><th>Description</th><th>Category</th><th>Type</th><th class="ds-num">Amount</th></tr></thead><tbody>'+rows+'<tr><td colspan="3" style="text-align:right;font-weight:600">Total recorded charges</td><td class="ds-num" style="font-weight:600">'+money(cm.actual)+'</td></tr></tbody></table></div>'+
      '<div class="ds-billing-summary__totals" id="bs-split">'+line('Reimbursable costs', money(cm.reimbursable))+line('Service fees', money(cm.serviceFees))+(cm.markup?line('Markup', money(cm.markup)):'')+(cm.absorbedCost?line('Absorbed by Top1Movers', money(cm.absorbedCost)):'')+line('Total billed to client', money(cm.billed), true)+line('Quoted amount', money(cm.quoted))+line('Margin', moneySigned(cm.margin)+' ('+cm.marginPct.toFixed(1)+'%)')+'</div><hr>'+
      '<span class="ds-label" style="display:block;margin-bottom:var(--t1m-space-3)">Client funds</span>'+
      '<div class="ds-billing-summary__totals" id="bs-funds">'+line('Money in', money(f.received))+line('Money spent', money(f.disbursed))+line('Left over', moneySigned(f.balance))+line('Our fees', money(f.ourFees))+line(s>0?'Refund due to client':s<0?'Balance to bill client':'Fully settled', money(Math.abs(s)), true)+'</div><hr>'+
      '<p class="ds-muted ds-xs">Generated from sample data in the Top1Movers Operations Portal mockup. A Finance handoff summary, not a client-facing invoice or an accounting record.</p>'+
    '</div></div>';
}
