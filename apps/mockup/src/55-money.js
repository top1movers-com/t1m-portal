/* ============================== FUNDS (Stage 3) ==============================
   The money that moves on a job, and who has to act next:
     Operations asks -> Manager approves -> Accounting releases -> Operations submits the receipts -> Accounting checks them.
   Two ways to use the money: "Staff gets the money" (the requester receives it, pays the vendor, then hands back receipts
   and any excess) or "Accounting pays the vendor" (Accounting pays the payee; the requester only submits the vendor's receipt).
   How the money is handed over (cash, check or bank transfer) is a separate choice made by Accounting when releasing.
   Every step is saved in the job history under the person's name. No ledger, tax or invoices here.
   Billing readiness (the handover to Finance) lives in 53-readiness.js. */
function stat(label, value, danger, sub){ return '<div class="ds-stat"><div class="ds-label">'+esc(label)+'</div><div class="ds-stat__value'+(danger?' ds-stat__value--danger':'')+'">'+value+'</div>'+(sub?'<div class="ds-muted ds-xs">'+sub+'</div>':'')+'</div>'; }
const FUND_PURPOSES = ['Duties & taxes','Port charges (arrastre, wharfage, storage)','Shipping line local charges','BOC fees','Trucking','LTO fees','Warehouse fees','Other'];
const FUND_FLOW = 'Operations asks, a Manager approves, Accounting releases the money, Operations submits the receipts, Accounting checks them. Click a request to see who did what and when.';
const WAIVE_HOW = ['The client pays directly','The vendor bills us later','Another way'];

/* What on this job is waiting on ME, money-wise (used for the tab count, My Work and the Funds page). */
function fundActions(j, f){
  const out = [];
  if(f.status==='For approval' && can('fund.approve')) out.push(act('Review',"openReviewFund('"+j.id+"','"+f.id+"')",'eye'));
  if(f.status==='Returned' && can('fund.request', j)) out.push(act('Edit & resubmit',"openFundRequest('"+j.id+"','"+f.id+"')",'refresh'));
  if(f.status==='Approved' && can('fund.release')) out.push(act('Release',"openReleaseFund('"+j.id+"','"+f.id+"')",'arrow-out'));
  if(f.status==='Released' && f.by===me() && can('fund.liquidate', j)) out.push(act('Submit receipts',"openLiquidate('"+j.id+"','"+f.id+"')",'receipt'));
  if(f.status==='Liquidated' && can('fund.verify')) out.push(act('Check receipts',"openVerify('"+j.id+"','"+f.id+"')",'check'));
  return out;
}
function moneyWaitingCount(j){ return sumOf(j.funds, f=>fundActions(j,f).length?1:0); }
function btn(a, primary){ return '<button class="ds-btn ds-btn--'+(primary?'primary':'secondary')+' ds-btn--sm" onclick="event.stopPropagation(); '+a.js+'">'+icon(a.icon)+esc(a.label)+'</button>'; }

/* ---------- Totals and the fund table (job tab and Funds page share them) ---------- */
function fundTotals(funds){
  const by = (st, fn)=>sumOf(funds.filter(f=>st.includes(f.status)), fn);
  const amt = f=>f.amount;
  return { waiting:by(['For approval','Approved'],amt), out:by(['Released','Liquidated','Verified'],amt), spent:by(['Liquidated','Verified'],f=>f.liq.actual), due:by(['Released'],amt), late:funds.filter(frLate).length };
}
function fundStats(funds){
  const t = fundTotals(funds);
  return '<div style="margin-bottom:var(--t1m-space-4)"><div class="ds-stats">'+stat('Waiting to be released', money(t.waiting), false, 'asked for, not paid yet')+stat('Paid out', money(t.out), false, 'released by Accounting')+
    stat('Receipts in', money(t.spent), false, 'what was actually spent')+stat('Receipts still due', money(t.due), t.late>0, t.late ? plural(t.late,'request')+' overdue' : 'from Operations')+'</div></div>';
}
function fundWhat(f){
  const step = Object.keys(FUND_STEPS).find(k=>FUND_STEPS[k].purpose===f.purpose);
  const sub = ['Pay to '+f.payee, 'needed by '+f.neededBy, frDirect(f) ? 'Accounting pays the vendor' : 'money goes to '+f.by].join(' · ');
  return '<span class="ds-strong">'+esc(f.purpose)+'</span><div class="ds-muted ds-xs">'+esc(sub)+'</div>'+
    (step?'<div class="ds-muted ds-xs">For the “'+esc(step)+'” step</div>':'')+
    (f.status==='Returned'&&f.review?'<div class="ds-small"><strong class="ds-strong">Sent back:</strong> '+esc(f.review.comment)+'</div>':'')+
    (f.status==='Released'&&f.liqBack?'<div class="ds-small"><strong class="ds-strong">Receipts sent back:</strong> '+esc(f.liqBack.comment)+'</div>':'');
}
function fundStatusCell(f){
  return pill(frLabel(f), frTone(f), frIcon(f), 'ds-pill--sm')+
    (frLate(f) ? '<div class="ds-overdue ds-xs">'+plural(frDaysOut(f),'day')+' since release</div>' : f.status==='Released' ? '<div class="ds-muted ds-xs">released '+esc(shortDate(f.release.on))+'</div>' : '');
}
function fundTable(items, showJob, flush){
  const rows = items.map(({j,f})=>'<tr data-href onclick="openFundDetail(\''+j.id+'\',\''+f.id+'\')">'+
    '<td data-label="Request"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+f.id+'</span><span class="ds-cell-sub">'+esc(f.by+' · '+f.on)+'</span></span></td>'+
    (showJob?'<td data-label="Job"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+j.id+'</span><span class="ds-cell-sub">'+esc(custById(j.customerId).name)+'</span></span></td>':'')+
    '<td data-label="What it is for" style="white-space:normal">'+fundWhat(f)+'</td>'+
    '<td data-label="Amount" class="ds-num">'+money(f.amount)+(f.liq?'<div class="ds-muted ds-xs">spent '+money(f.liq.actual)+'</div>':'')+'</td>'+
    '<td data-label="Status">'+fundStatusCell(f)+'</td>'+
    '<td data-label="Waiting on">'+(frWaiting(f)?esc(frWaiting(f)):'<span class="ds-muted3">—</span>')+'</td>'+
    '<td class="ds-num">'+fundActions(j,f).map(a=>btn(a)).join(' ')+'</td></tr>').join('');
  return '<div class="ds-table-wrap"'+(flush?'':' style="margin:0 calc(var(--t1m-space-4) * -1)"')+'><table class="ds-table ds-table--stack" id="fund-table"><thead><tr><th>Request</th>'+(showJob?'<th>Job</th>':'')+'<th>What it is for</th><th class="ds-num">Amount</th><th>Status</th><th>Waiting on</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function jobMoneyTab(j){
  const parts = [];
  if(canView('money.view', j)){
    parts.push('<section id="fund-requests"><div class="ds-section-head"><h2>'+icon('wallet')+'Fund requests</h2>'+(can('fund.request', j) && j.status!=='Completed' ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" id="new-fund" onclick="openFundRequest(\''+j.id+'\')">'+icon('plus')+'New fund request</button>' : '')+'</div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">'+FUND_FLOW+'</p>'+
      (j.funds.length ? fundStats(j.funds)+fundTable(j.funds.slice().reverse().map(f=>({j,f})), false) : '<p class="ds-muted">No fund requests yet.</p>')+'</section>');
    const vb = j.vendorBills.slice().reverse().map(b=>'<tr><td data-label="Vendor"><span class="ds-strong">'+esc(b.vendor)+'</span><div class="ds-muted ds-xs">'+esc(b.desc)+'</div></td><td data-label="Date">'+esc(b.date)+'</td><td data-label="Request">'+(b.fundId?'<span class="ds-mono ds-xs">'+esc(b.fundId)+'</span>':'<span class="ds-muted3">—</span>')+'</td><td data-label="File"><span class="ds-mono ds-xs">'+esc(b.file)+'</span></td><td data-label="Amount" class="ds-num">'+money(b.amount)+'</td><td data-label="PDF" class="ds-num"><button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="downloadBillPdf(\''+j.id+'\',\''+b.id+'\')" aria-label="Download PDF of the bill from '+esc(b.vendor)+'">'+icon('download')+'PDF</button></td></tr>').join('');
    parts.push('<section id="vendor-bills"><div class="ds-section-head"><h2>'+icon('receipt')+'Quotations &amp; bills'+'</h2><div class="ds-row">'+(vb ? '<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="downloadBillsPdf(\''+j.id+'\')">'+icon('download')+'Download all as PDF</button>' : '')+(can('vendor.record') ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openVendorBill(\''+j.id+'\')">'+icon('plus')+'Add quotation or bill'+'</button>' : '')+'</div></div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">'+'The vendor’s own paper for this job (shipping line, trucker, broker), kept as proof of the cost. It is a record only: it does not pay anything.'+'</p>'+
      (vb ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack"><thead><tr><th>Vendor</th><th>Date</th><th>Request</th><th>File</th><th class="ds-num">Amount</th><th></th></tr></thead><tbody>'+vb+
        '</tbody></table></div>' : '<p class="ds-muted">'+'No quotations or bills yet.'+'</p>')+'</section>');
  }
  parts.push('<p class="ds-muted ds-xs">'+icon('info')+' Every action here is saved in the History tab with who did it and when. Nothing can be edited or deleted afterwards.</p>');
  return '<div class="ds-stack">'+parts.join('')+'</div>';
}

/* ---------- One request, in full ---------- */
function fundSummary(f){
  return '<dl class="ds-facts"><dt>Purpose</dt><dd>'+esc(f.purpose)+'</dd><dt>Amount</dt><dd>'+money(f.amount)+'</dd><dt>Pay to</dt><dd>'+esc(f.payee)+'</dd><dt>How</dt><dd>'+esc(FR_HOW[f.how||'cash'])+'</dd><dt>Needed by</dt><dd>'+esc(f.neededBy)+'</dd><dt>Source</dt><dd>'+esc(f.source)+'</dd><dt>Requested</dt><dd>'+esc(f.by+', '+f.on)+'</dd></dl>'+
    (f.depositProof?fileRow(f.depositProof,'Client deposit proof'):'')+(f.support?fileRow(f.support,'Supporting file from '+f.by):'');
}
function fundTrail(f){
  const t = [{ action:'Fund request', detail:money(f.amount)+' for '+f.purpose+' to '+f.payee+'. '+FR_HOW[f.how||'cash']+' · '+f.source+'.', ts:f.on, actor:f.by }];
  if(f.review) t.push({ action:f.review.decision==='Approved'?'Fund request approved':'Fund request returned', detail:f.review.comment||'Approved.', ts:f.review.on, actor:f.review.by });
  if(f.release) t.push({ action:'Funds released', detail:f.release.mode+(f.release.ref?' ('+f.release.ref+')':'')+(f.release.proof?' · '+f.release.proof:''), ts:f.release.on, actor:f.release.by });
  if(f.liq) t.push({ action:'Receipts submitted', detail:'Spent '+money(f.liq.actual)+' · '+f.liq.receipts+(f.liq.note?' · '+f.liq.note:''), ts:f.liq.on, actor:f.liq.by });
  if(f.liqBack) t.push({ action:'Receipts sent back', detail:f.liqBack.comment, ts:f.liqBack.on, actor:f.liqBack.by });
  if(f.verify) t.push({ action:'Receipts confirmed', detail:'Request closed.', ts:f.verify.on, actor:f.verify.by });
  return t.reverse();
}
function openFundDetail(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!canView('money.view', j)) return denied();
  const acts = fundActions(j, f);
  openDrawer({ title:f.id+' · '+money(f.amount), sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<div class="ds-stack--sm"><div class="ds-row">'+pill(frLabel(f), frTone(f), frIcon(f))+(frWaiting(f)?'<span class="ds-muted ds-small">Waiting on '+esc(frWaiting(f))+'</span>':'')+'</div>'+fundSummary(f)+
      (f.release&&f.release.proof?fileRow(f.release.proof,'Proof of release · '+f.release.by):'')+(f.liq?fileRow(f.liq.receipts,'Receipts · '+f.liq.by+', '+f.liq.on):'')+
      '<h4 class="ds-strong">Who did what</h4>'+historyList(fundTrail(f))+'</div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Close</button><a class="ds-btn ds-btn--ghost" href="#/jobs/'+j.id+'/money" onclick="closeDrawer()">Open job</a><button type="button" class="ds-btn ds-btn--secondary" id="fund-pdf" onclick="downloadFundPdf(\''+j.id+'\',\''+f.id+'\')">'+icon('download')+'Download PDF</button>'+acts.map((a,x)=>btn(a, x===0)).join('') });
}

/* ---------- Fund requests ---------- */
function openFundRequest(jobId, editId, preset){
  const j = jobById(jobId), f = editId ? j.funds.find(x=>x.id===editId) : null;
  if(!can('fund.request', j)) return denied('Only the assigned Operations staff (or a Manager) request funds.');
  openDrawer({ title: f ? 'Edit and resubmit '+f.id : 'New fund request', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="fund-form" novalidate onsubmit="event.preventDefault(); saveFundRequest(\''+jobId+'\', this, '+(f?'\''+f.id+'\'':'null')+')">'+
      (f && f.review ? '<div class="ds-alert ds-alert--warning">'+icon('refresh')+'<div><strong>Sent back by '+esc(f.review.by)+'</strong>'+esc(f.review.comment)+'</div></div>' : '')+
      '<div class="ds-field"><label for="fr-purpose">What is it for?</label>'+selectWrap('<select class="ds-select" id="fr-purpose" name="purpose">'+options(FUND_PURPOSES, f?f.purpose:(preset||''))+'</select>')+'</div>'+
      moneyField('fr-amount','amount','Amount', 'PHP', f?f.amount:null)+
      '<div class="ds-field"><label for="fr-payee">Pay to</label><input class="ds-input" id="fr-payee" name="payee" value="'+esc(f?f.payee:'')+'" placeholder="e.g. Bureau of Customs, port operator, trucker">'+errorSlot('payee')+'</div>'+
      dateField('fr-need','neededBy','Needed by', f?f.neededBy:addDaysDMY(1))+
      '<div class="ds-field"><span class="ds-field__label">How will it be paid?</span>'+segControl('how', [FR_HOW.cash, FR_HOW.vendor], FR_HOW[f&&f.how||'cash'])+
        '<p class="ds-field__hint">Staff gets the money: you receive it (cash, check or a transfer to you), pay the vendor, then submit the receipts and return any excess. Accounting pays the vendor: Accounting pays them directly and you only submit their receipt afterwards.</p></div>'+
      '<div class="ds-field"><span class="ds-field__label">Where does the money come from?</span>'+segControl('source', ['Company funds','Client deposit'], f?f.source:'Company funds', "document.getElementById('fr-dep').style.display = this.value==='Client deposit' ? '' : 'none'")+'</div>'+
      '<div class="ds-field" id="fr-dep"'+(f&&f.source==='Client deposit'?'':' style="display:none"')+'><label>Client deposit proof</label>'+uploadHtml('depositProof','The client’s deposit slip or transfer confirmation')+errorSlot('deposit')+'<p class="ds-field__hint">Shows the money came from the client, not from company funds.</p></div>'+
      '<div class="ds-field"><label>Supporting file <span class="ds-opt">optional</span></label>'+uploadHtml('fundSupport','Quotation, bill or assessment from the payee')+'</div></form>',
    foot: drawerFoot(f?'Resubmit for approval':'Submit for approval','fund-form',{icon:'wallet'}) });
}
function saveFundRequest(jobId, form, editId){
  const j = jobById(jobId), fd = new FormData(form), amount = Number(fd.get('amount')), payee = String(fd.get('payee')||'').trim(), need = isoToDMY(fd.get('neededBy')), source = String(fd.get('source'));
  const existing = editId ? j.funds.find(x=>x.id===editId) : null, how = String(fd.get('how'))===FR_HOW.vendor ? 'vendor' : 'cash';
  const deposit = UPLOADS.depositProof || (existing && existing.depositProof);
  const bad = fieldError(form,'amount', amount>0?'':'Enter the amount needed.') | fieldError(form,'payee', payee?'':'Who will be paid?') | fieldError(form,'neededBy', need?'':'When is it needed?') |
    fieldError(form,'deposit', source==='Client deposit' && !deposit ? 'Attach the client’s deposit proof.' : '');
  if(bad) return;
  const data = { purpose:String(fd.get('purpose')), amount, payee, neededBy:need, source, how, depositProof: source==='Client deposit' ? deposit : null, support:UPLOADS.fundSupport || (existing && existing.support) || null, status:'For approval', review:null };
  let f;
  if(existing){ f = Object.assign(existing, data); logTo(j, 'Fund request', f.id+' resubmitted: '+f.purpose+' '+money(amount)+'.'); }
  else { f = Object.assign({ id:nextId('fr'), by:me(), on:todayDMY() }, data); j.funds.push(f); logTo(j, 'Fund request', f.id+': '+f.purpose+' '+money(amount)+' to '+payee+' ('+FR_HOW[how].toLowerCase()+', '+source+').'); }
  notify({ roles:['Manager'] }, me()+' requested '+money(amount)+' on '+j.id+' ('+f.purpose+').', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast(f.id+' sent for approval.', 'success', 'wallet'); render();
}
function openReviewFund(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!can('fund.approve')) return denied('Only a Manager approves fund requests.');
  openDrawer({ title:'Review '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="rf-form" novalidate onsubmit="event.preventDefault(); confirmDecision(\'fund\', \''+jobId+'\', \'Approved\', \''+fid+'\')">'+fundSummary(f)+
      '</form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Close</button><button type="button" class="ds-btn ds-btn--secondary" onclick="confirmDecision(\'fund\', \''+jobId+'\', \'Returned\', \''+fid+'\')">'+icon('refresh')+'Send back</button><button type="submit" form="rf-form" class="ds-btn ds-btn--primary" id="approve-fund">'+icon('check')+'Approve</button>' });
}
function decideFund(jobId, fid, decision, form){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), comment = String(new FormData(form).get('comment')||'').trim();
  if(decision==='Returned' && fieldError(form,'comment', comment?'':'Say why it is sent back.')) return;
  f.status = decision; f.review = { by:me(), on:todayDMY(), decision, comment:comment||null };
  if(decision==='Approved'){
    logTo(j, 'Fund request approved', f.id+' '+money(f.amount)+' approved.');
    notify({ roles:['Accounting'] }, f.id+' on '+j.id+' approved: release '+money(f.amount)+' to '+(frDirect(f)?f.payee+' (Accounting pays them directly)':f.by+' (they hold it and bring back receipts)')+'.', '#/jobs/'+j.id+'/money');
    notify({ users:[f.by] }, f.id+' ('+money(f.amount)+') was approved. Accounting will release it.', '#/jobs/'+j.id+'/money');
  } else {
    logTo(j, 'Fund request returned', f.id+': '+comment);
    notify({ users:[f.by] }, f.id+' was sent back by '+me()+': '+comment, '#/jobs/'+j.id+'/money');
  }
  closeDrawer(); showToast(f.id+(decision==='Approved'?' approved.':' sent back.'), decision==='Approved'?'success':'warning', decision==='Approved'?'check':'refresh'); render();
}
function toggleRelRef(sel){ document.getElementById('rel-ref-wrap').hidden = sel.value==='Cash'; }
function openReleaseFund(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!can('fund.release')) return denied('Only Accounting releases funds.');
  const same = f.review && f.review.by===me();
  openDrawer({ title:'Release '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · approved by '+esc(f.review.by),
    body:'<form class="ds-stack--sm" id="rel-form" novalidate onsubmit="event.preventDefault(); saveRelease(\''+jobId+'\',\''+fid+'\', this)">'+fundSummary(f)+
      '<div class="ds-alert ds-alert--info">'+icon('wallet')+'<div><strong>'+(frDirect(f)?'Pay '+esc(f.payee)+' directly':'Give '+esc(f.by)+' the money')+'</strong>'+(frDirect(f)?'Record below how you paid, with the proof.':esc(f.by.split(' ')[0])+' pays the vendor and brings back the receipts. Record below how you handed it over, with the proof.')+'</div></div>'+
      (same?'<div class="ds-alert ds-alert--info">'+icon('user')+'<div><strong>You also approved this</strong>Allowed because you hold both roles. Both actions are logged under your name.</div></div>':'')+
      '<div class="ds-field"><label for="rel-mode">'+(frDirect(f)?'How do you pay '+esc(f.payee)+'?':'How do you give '+esc(f.by.split(' ')[0])+' the money?')+'</label>'+selectWrap('<select class="ds-select" id="rel-mode" name="mode" onchange="toggleRelRef(this)">'+options(PAY_MODES, frDirect(f)?'Bank transfer':'Cash')+'</select>')+(frDirect(f)?'':'<p class="ds-field__hint">Cash, a check, or a transfer to their own account.</p>')+'</div>'+
        '<div class="ds-field" id="rel-ref-wrap"'+(frDirect(f)?'':' hidden')+'><label for="rel-ref">Reference no.</label><input class="ds-input" id="rel-ref" name="ref" placeholder="Check or transfer no.">'+errorSlot('ref')+'</div>'+
      dateField('rel-on','on','Released on', todayDMY())+
      '<div class="ds-field"><label>Proof</label>'+uploadHtml('releaseProof','Voucher, check copy or transfer slip')+errorSlot('proof')+'</div></form>',
    foot: drawerFoot('Release funds','rel-form',{icon:'arrow-out'}) });
}
function saveRelease(jobId, fid, form){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), fd = new FormData(form), on = isoToDMY(fd.get('on'));
  const cash = String(fd.get('mode'))==='Cash';
  if(fieldError(form,'on', on?'':'Pick the date.') | fieldError(form,'ref', cash || String(fd.get('ref')||'').trim() ? '' : 'Enter the reference number.') | fieldError(form,'proof', UPLOADS.releaseProof?'':'Attach the voucher, check copy or transfer slip.')) return;
  if(needConfirm('Release funds?', money(f.amount)+(frDirect(f)?' is paid to '+f.payee+'.':' is given to '+f.by+'.')+' It is recorded under your name.', 'Release funds', "saveRelease('"+jobId+"','"+fid+"',document.getElementById('"+form.id+"'))")) return;
  f.status = 'Released'; f.release = { by:me(), on, mode:String(fd.get('mode')), ref:String(fd.get('mode'))==='Cash' ? '' : String(fd.get('ref')||'').trim(), proof:UPLOADS.releaseProof||null };
  logTo(j, 'Funds released', f.id+' '+money(f.amount)+' by '+f.release.mode.toLowerCase()+(f.release.ref?' ('+f.release.ref+')':'')+'.');
  notify({ users:[f.by].concat(j.ops) }, f.id+' ('+money(f.amount)+') released on '+j.id+'. '+(frDirect(f)?'Submit '+f.payee+'’s receipt when you have it.':'Submit your receipts after paying.'), '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast('Released. Operations submits the receipts next.', 'success', 'arrow-out'); render();
}

/* ---------- Receipts (what used to be "liquidation") ---------- */
function submitReceipts(j, f, actual, receipts, note, on){
  f.status = 'Liquidated'; f.liq = { by:me(), on:on||todayDMY(), actual, receipts, note:note||null }; f.liqBack = null;
  const diff = f.amount - actual;
  logTo(j, 'Receipts submitted', f.id+': spent '+money(actual)+(diff>0?', excess '+money(diff)+' to return':diff<0?', shortfall '+money(-diff)+' to reimburse':'')+' ('+receipts+').');
  notify({ roles:['Accounting'] }, f.id+' on '+j.id+': receipts submitted ('+money(actual)+'). Please check them.', '#/jobs/'+j.id+'/money');
}
/* The released fund request a step is paid from (ticking the step then also submits its receipts). */
function stepFund(j, m){
  const rule = FUND_STEPS[m.name]; if(!rule) return null;
  return j.funds.find(f=>f.purpose===rule.purpose && f.status==='Released' && f.by===me()) || null;
}
function openLiquidate(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), direct = frDirect(f);
  if(f.by!==me()) return denied('Only '+f.by+', who requested these funds, can submit the receipts.');
  if(!can('fund.liquidate', j)) return denied();
  openDrawer({ title:'Submit receipts for '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · '+money(f.amount)+' released '+esc(f.release.on),
    body:'<form class="ds-stack--sm" id="liq-form" novalidate onsubmit="event.preventDefault(); saveLiquidate(\''+jobId+'\',\''+fid+'\', this)">'+
      (f.liqBack?'<div class="ds-alert ds-alert--warning">'+icon('refresh')+'<div><strong>Sent back by '+esc(f.liqBack.by)+'</strong>'+esc(f.liqBack.comment)+'</div></div>':'')+
      (direct ? '<p class="ds-small ds-muted">Accounting paid '+esc(f.payee)+' '+money(f.amount)+'. Attach their receipt.</p>' : moneyField('liq-actual','actual','Actual amount spent','PHP', f.amount))+
      '<div class="ds-field"><label>'+(direct?'Vendor’s receipt':'Official receipts')+'</label>'+uploadHtml('liqReceipts',direct?'The receipt or invoice from the vendor':'Receipts for everything paid')+errorSlot('receipts')+'</div>'+
      '<div class="ds-field"><label for="liq-note">Note <span class="ds-opt">optional</span></label><textarea class="ds-textarea" id="liq-note" name="note" style="min-height:64px" placeholder="e.g. Excess returned to cashier"></textarea></div>'+
      (direct?'':'<p class="ds-muted ds-xs">'+icon('info')+' If you spent less, return the excess; if more, Accounting reimburses the shortfall. Accounting checks it.</p>')+'</form>',
    foot: drawerFoot('Submit receipts','liq-form',{icon:'receipt'}) });
}
function saveLiquidate(jobId, fid, form){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), fd = new FormData(form), actual = frDirect(f) ? f.amount : Number(fd.get('actual'));
  if(f.by!==me()) return denied('Only '+f.by+', who requested these funds, can submit the receipts.');
  if(fieldError(form,'actual', actual>0?'':'Enter what was actually spent.') | fieldError(form,'receipts', UPLOADS.liqReceipts?'':'Attach the receipts.')) return;
  submitReceipts(j, f, actual, UPLOADS.liqReceipts, String(fd.get('note')||'').trim());
  closeDrawer(); showToast('Receipts sent to Accounting.', 'success', 'receipt'); render();
}
function openVerify(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), diff = f.amount - f.liq.actual;
  if(!can('fund.verify')) return denied('Only Accounting checks receipts.');
  openDrawer({ title:'Check receipts for '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(f.purpose),
    body:'<div class="ds-stack--sm"><div class="ds-stats">'+stat('Released', money(f.amount))+stat('Spent', money(f.liq.actual))+(frDirect(f)?'':stat(diff>=0?'Excess to return':'Shortfall to reimburse', money(Math.abs(diff)), diff<0))+'</div>'+
      '<div class="ds-panel">'+fileRow(f.liq.receipts, 'Receipts from '+f.liq.by+', '+f.liq.on)+'</div>'+(f.liq.note?'<p class="ds-small">'+esc(f.liq.note)+'</p>':'')+
      (diff!==0?'<div class="ds-alert ds-alert--info">'+icon('wallet')+'<div><strong>Settle the difference</strong>'+(diff>0?'Confirm the excess of '+money(diff)+' was returned.':'Reimburse the shortfall of '+money(-diff)+' to '+esc(f.liq.by)+'.')+'</div></div>':'')+
      '<p class="ds-small">Once confirmed, this request is closed.</p></div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--secondary" onclick="openReceiptsBack(\''+jobId+'\',\''+fid+'\')">'+icon('refresh')+'Send back</button><button type="button" class="ds-btn ds-btn--primary" id="verify-liq" onclick="saveVerify(\''+jobId+'\',\''+fid+'\')">'+icon('check')+'Confirm receipts'+(diff!==0?' and settle':'')+'</button>' });
}
function saveVerify(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  f.status = 'Verified'; f.verify = { by:me(), on:todayDMY() };
  logTo(j, 'Receipts confirmed', f.id+' closed ('+money(f.liq.actual)+').');
  closeDrawer(); showToast(f.id+' closed.', 'success', 'check'); render();
}
function openReceiptsBack(jobId, fid){
  confirmAction('Send the receipts back?', 'Operations gets your reason and submits them again.', 'Send back', "submitReceiptsBack('"+jobId+"','"+fid+"')", false,
    '<form class="ds-stack--sm" id="reject-form" novalidate onsubmit="event.preventDefault()"><div class="ds-field"><label for="rs-comment">What is wrong?</label><textarea class="ds-textarea" id="rs-comment" name="comment" style="min-height:72px" placeholder="e.g. Receipt is not in the company name"></textarea>'+errorSlot('comment')+'</div></form>');
}
function submitReceiptsBack(jobId, fid){
  const form = document.getElementById('reject-form'), comment = String(new FormData(form).get('comment')||'').trim();
  if(fieldError(form,'comment', comment?'':'Say what is wrong.')) return;
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  f.liqBack = { by:me(), on:todayDMY(), comment }; f.status = 'Released'; f.liq = null;
  logTo(j, 'Receipts sent back', f.id+': '+comment);
  notify({ users:[f.by] }, f.id+' receipts were sent back by '+me()+': '+comment, '#/jobs/'+j.id+'/money');
  closeConfirm(); closeDrawer(); showToast('Sent back to '+f.by+'.', 'warning', 'refresh'); render();
}

/* ---------- A money step paid another way (no fund request needed) ---------- */
function openWaiveGate(jobId, step){
  const j = jobById(jobId), m = j.ms.find(x=>x.name===step), fg = fundGate(j, m);
  if(!canWork(j, m.svc)) return denied();
  openDrawer({ title:'“'+step+'” is not paid from our funds', sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<form class="ds-stack--sm" id="waive-form" novalidate onsubmit="event.preventDefault(); saveWaiveGate(\''+jobId+'\',\''+step+'\', this)">'+
      '<p class="ds-small ds-muted">Use this when no fund request is needed. The step still needs its proof when you mark it done.</p>'+
      '<div class="ds-field"><span class="ds-field__label">Who pays?</span>'+segControl('how', WAIVE_HOW, WAIVE_HOW[0], null, true)+'</div>'+
      '<div class="ds-field"><label for="wv-note">Details</label><textarea class="ds-textarea" id="wv-note" name="note" style="min-height:72px" placeholder="e.g. Client paid BOC online on 03 Oct, receipt to follow"></textarea>'+errorSlot('note')+'</div></form>',
    foot: drawerFoot('Save','waive-form',{icon:'check'}) });
}
function saveWaiveGate(jobId, step, form){
  const j = jobById(jobId), fd = new FormData(form), note = String(fd.get('note')||'').trim(), how = String(fd.get('how'));
  if(fieldError(form,'note', note?'':'Say who pays and how.')) return;
  j.waivers = j.waivers || {}; j.waivers[step] = { how, note, by:me(), on:todayDMY() };
  logTo(j, 'Paid another way', '“'+step+'”: '+how.toLowerCase()+'. '+note);
  notify({ roles:['Manager'] }, me()+' recorded that “'+step+'” on '+j.id+' is not paid from our funds ('+how.toLowerCase()+').', '#/jobs/'+j.id);
  closeDrawer(); showToast('Saved. You can mark the step done now.', 'success', 'check'); render();
}

/* ---------- Quotations and bills (Accounting keeps the vendor papers for the job) ---------- */
function openVendorBill(jobId){
  const j = jobById(jobId);
  if(!can('vendor.record')) return denied('Accounting records quotations and bills.');
  openDrawer({ title:'Add quotation or bill', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="vb-form" novalidate onsubmit="event.preventDefault(); saveVendorBill(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="vb-vendor">Vendor</label><input class="ds-input" id="vb-vendor" name="vendor" placeholder="e.g. shipping line, trucker">'+errorSlot('vendor')+'</div>'+
      '<div class="ds-field"><label for="vb-desc">For</label><input class="ds-input" id="vb-desc" name="desc" placeholder="e.g. Ocean freight, delivery trip">'+errorSlot('desc')+'</div>'+
      moneyField('vb-amount','amount','Amount')+dateField('vb-date','date','Date on the paper', todayDMY())+
      '<div class="ds-field"><label>File</label>'+uploadHtml('vendorFile','The vendor’s quotation or bill')+errorSlot('file')+'</div>'+
      '<div class="ds-field"><label for="vb-fund">Fund request <span class="ds-opt">optional</span></label>'+selectWrap('<select class="ds-select" id="vb-fund" name="fundId"><option value="">Not linked to a request</option>'+options(j.funds.map(f=>({value:f.id,label:f.id+' · '+f.purpose+' · '+money(f.amount)})))+'</select>')+'</div></form>',
    foot: drawerFoot('Save','vb-form',{icon:'receipt'}) });
}
function saveVendorBill(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), v = k=>String(fd.get(k)||'').trim(), amount = Number(fd.get('amount')), date = isoToDMY(fd.get('date'));
  if(fieldError(form,'vendor', v('vendor')?'':'Who is it from?') | fieldError(form,'desc', v('desc')?'':'What is it for?') | fieldError(form,'amount', amount>0?'':'Enter the amount.') | fieldError(form,'date', date?'':'Pick the date.') | fieldError(form,'file', UPLOADS.vendorFile?'':'Attach the file.')) return;
  j.vendorBills.push({ id:nextId('vb'), vendor:v('vendor'), desc:v('desc'), amount, date, file:UPLOADS.vendorFile, by:me(), fundId:v('fundId')||null });
  logTo(j, 'Vendor bill recorded', v('vendor')+' · '+v('desc')+' '+money(amount)+(v('fundId')?' (for '+v('fundId')+')':'')+'.');
  closeDrawer(); showToast('Saved.', 'success', 'receipt'); render();
}

/* ============================== FUNDS PAGE (all jobs) ==============================
   One place for Accounting and Managers to see every fund request, who it waits on, and where the cash is.
   Operations see only their own jobs. The CSV is the money log an accountant can copy into their books. */
const FUND_FILTERS = [
  ['action','Needs me', (f,j)=>fundActions(j,f).length>0],
  ['open','Open', f=>f.status!=='Verified'],
  ['due','Receipts due', f=>f.status==='Released'],
  ['closed','Closed', f=>f.status==='Verified'],
  ['all','All', ()=>true]
];
function allFunds(){ return [].concat(...JOBS.filter(j=>canView('money.view', j)).map(j=>j.funds.map(f=>({ j, f })))); }
function fundsWaitingCount(){ return allFunds().filter(x=>fundActions(x.j,x.f).length).length; }
function renderFunds(){
  const base = allFunds(), waiting = base.filter(x=>fundActions(x.j,x.f).length).length;
  const sel = STATE.fundFilter || (waiting ? 'action' : 'open'), flt = FUND_FILTERS.find(x=>x[0]===sel) || FUND_FILTERS[1];
  const q = STATE.fundQuery.trim().toLowerCase();
  const rows = base.filter(x=>flt[2](x.f,x.j) && (!q || [x.f.id,x.j.id,custById(x.j.customerId).name,x.f.payee,x.f.purpose,x.f.by].some(v=>String(v).toLowerCase().includes(q)))).reverse().sort((a,b)=>frLate(b.f)-frLate(a.f));
  const chip = ([k,l,fn])=>'<button class="ds-chip" aria-pressed="'+(sel===k)+'" onclick="STATE.fundFilter=\''+k+'\'; render()">'+l+'<span class="ds-chip__count">'+base.filter(x=>fn(x.f,x.j)).length+'</span></button>';
  const mgr = hasRole('Manager') || hasRole('Accounting') || hasRole('Admin');
  return '<div class="ds-page-head"><div><h1>Funds</h1><p class="ds-page-head__sub">'+(mgr?'Every fund request on every job: who asked, who approved, how it was paid and where the receipts are.':'Fund requests on your jobs.')+'</p></div>'+
      (mgr&&base.length?'<button class="ds-btn ds-btn--secondary" id="funds-export" onclick="exportFundsCSV()">'+icon('download')+'Export money log</button>':'')+'</div>'+
    (base.length ? fundStats(base.map(x=>x.f)) : '')+
    '<section class="ds-panel ds-panel--elevated"><div class="ds-panel__body ds-stack--sm"><div class="ds-chips ds-chips--scroll">'+FUND_FILTERS.map(chip).join('')+'</div>'+
      '<div class="ds-row" style="flex-wrap:wrap"><div class="ds-search" style="flex:1;min-width:220px;max-width:420px">'+icon('search')+'<input class="ds-input" id="fund-search" placeholder="Request, job, customer, payee or person" value="'+esc(STATE.fundQuery)+'" oninput="STATE.fundQuery=this.value; render()"></div>'+
      '<span class="ds-muted ds-small" style="margin-left:auto">'+plural(rows.length,'request')+'</span></div></div>'+
    (rows.length ? fundTable(rows, true, true) : '<div class="ds-panel__body">'+(base.length ? emptyState('search','Nothing here','Try another group above, or clear the search.') : emptyState('wallet','No fund requests yet','Operations create them from a job when money is needed.'))+'</div>')+'</section>';
}
function exportFundsCSV(){
  const head = ['Request','Job','Customer','Purpose','Pay to','Amount','How paid','Source','Requested by','Requested on','Status','Approved by','Approved on','Released by','Released on','Mode','Reference','Spent','Receipts file','Confirmed by','Confirmed on'];
  const rows = allFunds().map(({j,f})=>[f.id, j.id, custById(j.customerId).name, f.purpose, f.payee, f.amount, FR_HOW[f.how||'cash'], f.source, f.by, f.on, frLabel(f),
    f.review&&f.review.decision==='Approved'?f.review.by:'', f.review&&f.review.decision==='Approved'?f.review.on:'', f.release?f.release.by:'', f.release?f.release.on:'', f.release?f.release.mode:'', f.release?f.release.ref:'', f.liq?f.liq.actual:'', f.liq?f.liq.receipts:'', f.verify?f.verify.by:'', f.verify?f.verify.on:'']);
  const csv = [head].concat(rows).map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type:'text/csv' }));
  a.download = 'top1movers-money-log-'+dmyToISO(todayDMY())+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  showToast('Exported '+plural(rows.length,'fund request')+'.', 'success', 'download');
}

