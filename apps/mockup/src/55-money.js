/* ============================== MONEY (Stage 3) ==============================
   Money as it relates to a job, not accounting software.
   Fund request: Ops requests → Manager approves → Accounting releases → Ops liquidates (receipts) →
   Accounting verifies. Liquidated amounts are pass-through job costs. Vendor bills are our own costs.
   Billing: Accounting uploads the SOA in their own format (+ total + due date) → Manager approves →
   Accounting sends it and records payments (with withholding tax). No official BIR invoices here. */
function stat(label, value, danger, sub){ return '<div class="ds-stat"><div class="ds-label">'+esc(label)+'</div><div class="ds-stat__value'+(danger?' ds-stat__value--danger':'')+'">'+value+'</div>'+(sub?'<div class="ds-muted ds-xs">'+sub+'</div>':'')+'</div>'; }
const FUND_PURPOSES = ['Duties & taxes','Port charges (arrastre, wharfage, storage)','Shipping line local charges','BOC fees','Trucking','LTO fees','Warehouse fees','Other'];

/* What on this job is waiting on ME, money-wise (used for the tab count and My Work). */
function fundActions(j, f){
  const out = [];
  if(f.status==='For approval' && can('fund.approve')) out.push(act('Review',"openReviewFund('"+j.id+"','"+f.id+"')",'eye'));
  if(f.status==='Returned' && can('fund.request', j)) out.push(act('Edit & resubmit',"openFundRequest('"+j.id+"','"+f.id+"')",'refresh'));
  if(f.status==='Approved' && can('fund.release')) out.push(act('Release',"openReleaseFund('"+j.id+"','"+f.id+"')",'arrow-out'));
  if(f.status==='Released' && can('fund.liquidate', j)) out.push(act('Liquidate',"openLiquidate('"+j.id+"','"+f.id+"')",'receipt'));
  if(f.status==='Liquidated' && can('fund.verify')) out.push(act('Verify',"openVerify('"+j.id+"','"+f.id+"')",'check'));
  return out;
}
function billActions(j){
  const bs = billingStatus(j).key, out = [];
  if(['tobill','returned'].includes(bs) && can('bill.submit')) out.push(act(bs==='tobill'?'Upload SOA':'Upload revised SOA',"openUploadSOA('"+j.id+"')",'upload'));
  if(bs==='approval' && can('bill.approve')) out.push(act('Review SOA',"openReviewBill('"+j.id+"')",'eye'));
  if(bs==='ready' && can('bill.send')) out.push(act('Mark as sent',"openSendBill('"+j.id+"')",'arrow-right'));
  if(['sent','partial','overdue'].includes(bs) && can('bill.send')) out.push(act('Record payment',"openPayment('"+j.id+"')",'arrow-in'));
  return out;
}
function moneyWaitingCount(j){ return sumOf(j.funds, f=>fundActions(j,f).length?1:0) + (billActions(j).filter(a=>a.label!=='Record payment').length?1:0); }
function btn(a, primary){ return '<button class="ds-btn ds-btn--'+(primary?'primary':'secondary')+' ds-btn--sm" onclick="'+a.js+'">'+icon(a.icon)+esc(a.label)+'</button>'; }

function jobMoneyTab(j){
  const parts = [];
  if(canView('money.view', j)){
    const rows = j.funds.slice().reverse().map(f=>{
      const detail = [f.release?'Released '+f.release.on+' · '+f.release.mode+(f.release.ref?' '+f.release.ref:''):'', f.liq?'Spent '+money(f.liq.actual)+(f.liq.actual!==f.amount?' ('+(f.amount>f.liq.actual?'excess '+money(f.amount-f.liq.actual)+' to return':'shortfall '+money(f.liq.actual-f.amount)+' to reimburse')+')':'')+' · '+f.liq.receipts:'', f.review&&f.review.decision==='Returned'?'Returned: '+f.review.comment:''].filter(Boolean).join(' · ');
      return '<tr><td data-label="Request"><span class="ds-cell-name"><span class="ds-mono ds-cell-primary">'+f.id+'</span><span class="ds-cell-sub">'+esc(f.by+' · '+f.on)+'</span></span></td>'+
        '<td data-label="Purpose" style="white-space:normal"><span class="ds-strong">'+esc(f.purpose)+'</span>'+(f.purpose==='Duties & taxes'?'<div class="ds-muted ds-xs">Required for the “Duties paid” step</div>':'')+'<div class="ds-muted ds-xs">Pay to '+esc(f.payee)+' · needed by '+esc(f.neededBy)+' · '+esc(f.source)+'</div>'+(detail?'<div class="ds-muted ds-xs">'+esc(detail)+'</div>':'')+'</td>'+
        '<td data-label="Amount" class="ds-num">'+money(f.amount)+'</td><td data-label="Status">'+pill(f.status, FR_TONE[f.status], FR_ICON[f.status], 'ds-pill--sm')+'</td>'+
        '<td class="ds-num">'+fundActions(j,f).map(a=>btn(a)).join(' ')+'</td></tr>';
    }).join('');
    parts.push('<section id="fund-requests"><div class="ds-section-head"><h2>'+icon('wallet')+'Fund requests</h2>'+(can('fund.request', j) && j.status!=='Completed' ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" id="new-fund" onclick="openFundRequest(\''+j.id+'\')">'+icon('plus')+'New fund request</button>' : '')+'</div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">Cash needed during the job. Manager approves, Accounting releases, Operations liquidates with receipts, Accounting verifies.</p>'+
      (rows ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack"><thead><tr><th>Request</th><th>Purpose</th><th class="ds-num">Amount</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>' : '<p class="ds-muted">No fund requests yet.</p>')+'</section>');
    const vb = j.vendorBills.map(b=>'<tr><td data-label="Vendor"><span class="ds-strong">'+esc(b.vendor)+'</span><div class="ds-muted ds-xs">'+esc(b.desc)+'</div></td><td data-label="Date">'+esc(b.date)+'</td><td data-label="File"><span class="ds-mono ds-xs">'+esc(b.file)+'</span></td><td data-label="Amount" class="ds-num">'+money(b.amount)+'</td></tr>').join('');
    parts.push('<section id="vendor-bills"><div class="ds-section-head"><h2>'+icon('receipt')+'Vendor bills</h2>'+(can('vendor.record') ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openVendorBill(\''+j.id+'\')">'+icon('plus')+'Record vendor bill</button>' : '')+'</div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">What shipping lines, truckers and others bill Top1Movers for this job (our own costs). Payment of these is tracked in your accounting tool.</p>'+
      (vb ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack"><thead><tr><th>Vendor</th><th>Date</th><th>File</th><th class="ds-num">Amount</th></tr></thead><tbody>'+vb+
        '<tr><td colspan="3" style="text-align:right;font-weight:600">Total own costs</td><td class="ds-num" style="font-weight:600">'+money(ownCosts(j))+'</td></tr></tbody></table></div>' : '<p class="ds-muted">No vendor bills recorded.</p>')+'</section>');
  }
  if(canView('bill.view')) parts.push(billingSection(j));
  if(can('profit.view') && j.status==='Completed'){
    const p = jobProfit(j);
    parts.push('<section id="job-profit"><div class="ds-section-head"><h2>'+icon('chart')+'Job profit</h2><span class="ds-panel__hint">Manager only</span></div>'+
      '<div class="ds-stats">'+stat('Billed to client', money(p.billed), false, p.billed?'':'no approved SOA yet')+stat('Pass-through costs', money(p.reimb), false, 'liquidated fund requests')+stat('Service revenue', money(p.service))+stat('Own costs', money(p.own), false, 'vendor bills')+stat('Job profit', money(p.profit), p.profit<0, p.billed?p.pct.toFixed(1)+'% of billed':'')+'</div>'+
      '<p class="ds-chart-note">'+icon('info')+'<span>Billed − pass-through = service revenue; − vendor bills = job profit. Pass-through costs (duties, port charges) are billed at cost and never count as profit.</span></p></section>');
  }
  parts.push('<p class="ds-muted ds-xs">'+icon('info')+' Job money for a cleaner handover, not accounting software: no ledger, tax filing or official invoices.</p>');
  return '<div class="ds-stack">'+parts.join('')+'</div>';
}

/* ---------- Fund requests ---------- */
function openFundRequest(jobId, editId, preset){
  const j = jobById(jobId), f = editId ? j.funds.find(x=>x.id===editId) : null;
  if(!can('fund.request', j)) return denied('Only the assigned Operations staff (or a Manager) request funds.');
  openDrawer({ title: f ? 'Edit and resubmit '+f.id : 'New fund request', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="fund-form" novalidate onsubmit="event.preventDefault(); saveFundRequest(\''+jobId+'\', this, '+(f?'\''+f.id+'\'':'null')+')">'+
      (f && f.review ? '<div class="ds-alert ds-alert--warning">'+icon('refresh')+'<div><strong>Returned by '+esc(f.review.by)+'</strong>'+esc(f.review.comment)+'</div></div>' : '')+
      '<div class="ds-field"><label for="fr-purpose">Purpose</label>'+selectWrap('<select class="ds-select" id="fr-purpose" name="purpose">'+options(FUND_PURPOSES, f?f.purpose:(preset||''))+'</select>')+'</div>'+
      moneyField('fr-amount','amount','Amount', 'PHP', f?f.amount:null)+
      '<div class="ds-field"><label for="fr-payee">Pay to</label><input class="ds-input" id="fr-payee" name="payee" value="'+esc(f?f.payee:'')+'" placeholder="e.g. Bureau of Customs, port operator, trucker">'+errorSlot('payee')+'</div>'+
      dateField('fr-need','neededBy','Needed by', f?f.neededBy:addDaysDMY(1))+
      '<div class="ds-field"><span class="ds-field__label">Funding source</span>'+segControl('source', ['Company funds','Client deposit'], f?f.source:'Company funds', "document.getElementById('fr-dep').style.display = this.value==='Client deposit' ? '' : 'none'")+'</div>'+
      '<div class="ds-field" id="fr-dep"'+(f&&f.source==='Client deposit'?'':' style="display:none"')+'><label>Client deposit proof</label>'+uploadHtml('depositProof','The client’s deposit slip or transfer confirmation')+errorSlot('deposit')+'<p class="ds-field__hint">Recorded so the client is not billed again for money they already sent.</p></div></form>',
    foot: drawerFoot(f?'Resubmit for approval':'Submit for approval','fund-form',{icon:'wallet'}) });
}
function saveFundRequest(jobId, form, editId){
  const j = jobById(jobId), fd = new FormData(form), amount = Number(fd.get('amount')), payee = String(fd.get('payee')||'').trim(), need = isoToDMY(fd.get('neededBy')), source = String(fd.get('source'));
  const existing = editId ? j.funds.find(x=>x.id===editId) : null;
  const deposit = UPLOADS.depositProof || (existing && existing.depositProof);
  const bad = fieldError(form,'amount', amount>0?'':'Enter the amount needed.') | fieldError(form,'payee', payee?'':'Who will be paid?') | fieldError(form,'neededBy', need?'':'When is it needed?') |
    fieldError(form,'deposit', source==='Client deposit' && !deposit ? 'Attach the client’s deposit proof.' : '');
  if(bad) return;
  if(needConfirm('Submit fund request?', money(amount)+' for '+String(fd.get('purpose'))+' goes to a manager for approval.', 'Submit request', "saveFundRequest('"+jobId+"',document.getElementById('"+form.id+"'),"+(editId?"'"+editId+"'":'null')+")")) return;
  const data = { purpose:String(fd.get('purpose')), amount, payee, neededBy:need, source, depositProof: source==='Client deposit' ? deposit : null, status:'For approval', review:null };
  let f;
  if(existing){ f = Object.assign(existing, data); logTo(j, 'Fund request', f.id+' resubmitted: '+f.purpose+' '+money(amount)+'.'); }
  else { f = Object.assign({ id:nextId('fr'), by:me(), on:todayDMY() }, data); j.funds.push(f); logTo(j, 'Fund request', f.id+': '+f.purpose+' '+money(amount)+' to '+payee+' ('+source+').'); }
  notify({ roles:['Manager'] }, me()+' requested '+money(amount)+' on '+j.id+' ('+f.purpose+').', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast(f.id+' sent for approval.', 'success', 'wallet'); render();
}
function fundSummary(f){ return '<dl class="ds-facts"><dt>Purpose</dt><dd>'+esc(f.purpose)+'</dd><dt>Amount</dt><dd>'+money(f.amount)+'</dd><dt>Pay to</dt><dd>'+esc(f.payee)+'</dd><dt>Needed by</dt><dd>'+esc(f.neededBy)+'</dd><dt>Source</dt><dd>'+esc(f.source)+(f.depositProof?' · '+esc(f.depositProof):'')+'</dd><dt>Requested</dt><dd>'+esc(f.by+', '+f.on)+'</dd></dl>'; }
function openReviewFund(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!can('fund.approve')) return denied('Only a Manager approves fund requests.');
  openDrawer({ title:'Review '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="rf-form" novalidate onsubmit="event.preventDefault(); confirmDecision(\'fund\', \''+jobId+'\', \'Approved\', \''+fid+'\')">'+fundSummary(f)+
      '</form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Close</button><button type="button" class="ds-btn ds-btn--secondary" onclick="confirmDecision(\'fund\', \''+jobId+'\', \'Returned\', \''+fid+'\')">'+icon('x')+'Reject</button><button type="submit" form="rf-form" class="ds-btn ds-btn--primary" id="approve-fund">'+icon('check')+'Approve</button>' });
}
function decideFund(jobId, fid, decision, form){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), comment = String(new FormData(form).get('comment')||'').trim();
  if(decision==='Returned' && fieldError(form,'comment', comment?'':'Say why it is returned.')) return;
  f.status = decision; f.review = { by:me(), on:todayDMY(), decision, comment:comment||null };
  if(decision==='Approved'){
    logTo(j, 'Fund request approved', f.id+' '+money(f.amount)+' approved.');
    notify({ roles:['Accounting'] }, f.id+' on '+j.id+' approved: release '+money(f.amount)+' to '+f.payee+'.', '#/jobs/'+j.id+'/money');
    notify({ users:[f.by] }, f.id+' ('+money(f.amount)+') was approved. Accounting will release it.', '#/jobs/'+j.id+'/money');
  } else {
    logTo(j, 'Fund request returned', f.id+': '+comment);
    notify({ users:[f.by] }, f.id+' was returned by '+me()+': '+comment, '#/jobs/'+j.id+'/money');
  }
  closeDrawer(); showToast(f.id+' '+decision.toLowerCase()+'.', decision==='Approved'?'success':'warning', decision==='Approved'?'check':'refresh'); render();
}
function openReleaseFund(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!can('fund.release')) return denied('Only Accounting releases funds.');
  const same = f.review && f.review.by===me();
  openDrawer({ title:'Release '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · approved by '+esc(f.review.by),
    body:'<form class="ds-stack--sm" id="rel-form" novalidate onsubmit="event.preventDefault(); saveRelease(\''+jobId+'\',\''+fid+'\', this)">'+fundSummary(f)+
      (same?'<div class="ds-alert ds-alert--info">'+icon('user')+'<div><strong>You also approved this</strong>Allowed because you hold both roles. Both actions are logged under your name.</div></div>':'')+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="rel-mode">Mode</label>'+selectWrap('<select class="ds-select" id="rel-mode" name="mode">'+options(PAY_MODES, 'Bank transfer')+'</select>')+'</div>'+
        '<div class="ds-field"><label for="rel-ref">Reference <span class="ds-opt">optional</span></label><input class="ds-input" id="rel-ref" name="ref" placeholder="Check or transfer no."></div></div>'+
      dateField('rel-on','on','Released on', todayDMY())+
      '<div class="ds-field"><label>Proof <span class="ds-opt">optional</span></label>'+uploadHtml('releaseProof','Voucher, check copy or transfer slip')+'</div></form>',
    foot: drawerFoot('Release funds','rel-form',{icon:'arrow-out'}) });
}
function saveRelease(jobId, fid, form){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), fd = new FormData(form), on = isoToDMY(fd.get('on'));
  if(fieldError(form,'on', on?'':'Pick the date.')) return;
  if(needConfirm('Release funds?', money(f.amount)+' is recorded as released. Operations can then pay and liquidate.', 'Release funds', "saveRelease('"+jobId+"','"+fid+"',document.getElementById('"+form.id+"'))")) return;
  f.status = 'Released'; f.release = { by:me(), on, mode:String(fd.get('mode')), ref:String(fd.get('ref')||'').trim(), proof:UPLOADS.releaseProof||null };
  logTo(j, 'Funds released', f.id+' '+money(f.amount)+' by '+f.release.mode.toLowerCase()+(f.release.ref?' ('+f.release.ref+')':'')+'.');
  notify({ users:[f.by].concat(j.ops) }, f.id+' ('+money(f.amount)+') released on '+j.id+'. Liquidate it with receipts after paying.', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast('Released. Operations liquidates after paying.', 'success', 'arrow-out'); render();
}
function openLiquidate(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!can('fund.liquidate', j)) return denied();
  openDrawer({ title:'Liquidate '+f.id, sub:'<span class="ds-mono">'+j.id+'</span> · '+money(f.amount)+' released '+esc(f.release.on),
    body:'<form class="ds-stack--sm" id="liq-form" novalidate onsubmit="event.preventDefault(); saveLiquidate(\''+jobId+'\',\''+fid+'\', this)">'+
      moneyField('liq-actual','actual','Actual amount spent','PHP', f.amount)+
      '<div class="ds-field"><label>Official receipts</label>'+uploadHtml('liqReceipts','Receipts for everything paid')+errorSlot('receipts')+'</div>'+
      '<div class="ds-field"><label for="liq-note">Note <span class="ds-opt">optional</span></label><textarea class="ds-textarea" id="liq-note" name="note" style="min-height:64px" placeholder="e.g. Excess returned to cashier"></textarea></div>'+
      '<p class="ds-muted ds-xs">'+icon('info')+' If you spent less, return the excess; if more, Accounting reimburses the shortfall. Accounting checks it when verifying.</p></form>',
    foot: drawerFoot('Submit liquidation','liq-form',{icon:'receipt'}) });
}
function saveLiquidate(jobId, fid, form){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), fd = new FormData(form), actual = Number(fd.get('actual'));
  if(fieldError(form,'actual', actual>0?'':'Enter what was actually spent.') | fieldError(form,'receipts', UPLOADS.liqReceipts?'':'Attach the receipts.')) return;
  if(needConfirm('Submit liquidation?', 'You are reporting '+money(actual)+' spent, with receipts. Accounting will verify it.', 'Submit liquidation', "saveLiquidate('"+jobId+"','"+fid+"',document.getElementById('"+form.id+"'))")) return;
  f.status = 'Liquidated'; f.liq = { by:me(), on:todayDMY(), actual, receipts:UPLOADS.liqReceipts, note:String(fd.get('note')||'').trim()||null };
  const diff = f.amount - actual;
  logTo(j, 'Liquidated', f.id+': spent '+money(actual)+(diff>0?', excess '+money(diff)+' to return':diff<0?', shortfall '+money(-diff)+' to reimburse':'')+' ('+f.liq.receipts+').');
  notify({ roles:['Accounting'] }, f.id+' on '+j.id+' was liquidated: verify '+money(actual)+'.', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast('Liquidation submitted for verification.', 'success', 'receipt'); render();
}
function openVerify(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid), diff = f.amount - f.liq.actual;
  if(!can('fund.verify')) return denied('Only Accounting verifies liquidations.');
  openDrawer({ title:'Verify liquidation '+f.id, sub:'<span class="ds-mono">'+j.id+'</span>',
    body:'<div class="ds-stack--sm"><div class="ds-stats">'+stat('Released', money(f.amount))+stat('Spent', money(f.liq.actual))+stat(diff>=0?'Excess to return':'Shortfall to reimburse', money(Math.abs(diff)), diff<0)+'</div>'+
      '<div class="ds-panel">'+fileRow(f.liq.receipts, 'Receipts from '+f.liq.by+', '+f.liq.on)+'</div>'+(f.liq.note?'<p class="ds-small">'+esc(f.liq.note)+'</p>':'')+
      (diff!==0?'<div class="ds-alert ds-alert--info">'+icon('wallet')+'<div><strong>Settle the difference</strong>'+(diff>0?'Confirm the excess of '+money(diff)+' was returned.':'Reimburse the shortfall of '+money(-diff)+' to '+esc(f.liq.by)+'.')+'</div></div>':'')+
      '<p class="ds-small">Verified amounts are this job’s pass-through costs.</p></div>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Cancel</button><button type="button" class="ds-btn ds-btn--primary" id="verify-liq" onclick="saveVerify(\''+jobId+'\',\''+fid+'\')">'+icon('check')+'Verify'+(diff!==0?' and settle':'')+'</button>' });
}
function saveVerify(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(needConfirm('Verify this liquidation?', 'You confirm the receipts match the amount spent.', 'Verify', "saveVerify('"+jobId+"','"+fid+"')")) return;
  f.status = 'Verified'; f.verify = { by:me(), on:todayDMY() };
  logTo(j, 'Liquidation verified', f.id+' verified ('+money(f.liq.actual)+').');
  closeDrawer(); showToast(f.id+' verified.', 'success', 'check'); render();
}

/* ---------- Vendor bills ---------- */
function openVendorBill(jobId){
  const j = jobById(jobId);
  if(!can('vendor.record')) return denied('Accounting records vendor bills.');
  openDrawer({ title:'Record vendor bill', sub:'<span class="ds-mono">'+j.id+'</span> · our own cost on this job',
    body:'<form class="ds-stack--sm" id="vb-form" novalidate onsubmit="event.preventDefault(); saveVendorBill(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="vb-vendor">Vendor</label><input class="ds-input" id="vb-vendor" name="vendor" placeholder="e.g. shipping line, trucker">'+errorSlot('vendor')+'</div>'+
      '<div class="ds-field"><label for="vb-desc">For</label><input class="ds-input" id="vb-desc" name="desc" placeholder="e.g. Ocean freight, delivery trip">'+errorSlot('desc')+'</div>'+
      moneyField('vb-amount','amount','Amount')+dateField('vb-date','date','Bill date', todayDMY())+
      '<div class="ds-field"><label>Bill file</label>'+uploadHtml('vendorFile','The vendor’s bill or invoice')+errorSlot('file')+'</div></form>',
    foot: drawerFoot('Record bill','vb-form',{icon:'receipt'}) });
}
function saveVendorBill(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), v = k=>String(fd.get(k)||'').trim(), amount = Number(fd.get('amount')), date = isoToDMY(fd.get('date'));
  if(fieldError(form,'vendor', v('vendor')?'':'Who billed us?') | fieldError(form,'desc', v('desc')?'':'What is it for?') | fieldError(form,'amount', amount>0?'':'Enter the amount.') | fieldError(form,'date', date?'':'Pick the date.') | fieldError(form,'file', UPLOADS.vendorFile?'':'Attach the bill.')) return;
  j.vendorBills.push({ id:nextId('vb'), vendor:v('vendor'), desc:v('desc'), amount, date, file:UPLOADS.vendorFile, by:me() });
  logTo(j, 'Vendor bill recorded', v('vendor')+' · '+v('desc')+' '+money(amount)+'.');
  closeDrawer(); showToast('Vendor bill recorded.', 'success', 'receipt'); render();
}

/* ---------- Billing (SOA) ---------- */
function reimbSummaryHtml(j){
  const list = j.funds.filter(f=>f.liq);
  if(!list.length) return '<p class="ds-muted ds-small">No liquidated fund requests yet.</p>';
  return '<div class="ds-table-wrap"><table class="ds-table ds-table--compact ds-table--stack"><thead><tr><th>Cost</th><th>Receipts</th><th>Status</th><th class="ds-num">Amount</th></tr></thead><tbody>'+
    list.map(f=>'<tr><td data-label="Cost">'+esc(f.purpose)+'<div class="ds-muted ds-xs">'+esc(f.payee)+'</div></td><td data-label="Receipts"><span class="ds-mono ds-xs">'+esc(f.liq.receipts)+'</span></td><td data-label="Status">'+pill(f.status, FR_TONE[f.status], FR_ICON[f.status], 'ds-pill--sm')+'</td><td data-label="Amount" class="ds-num">'+money(f.liq.actual)+'</td></tr>').join('')+
    '<tr><td colspan="3" style="text-align:right;font-weight:600">Total pass-through to bill at cost</td><td class="ds-num" style="font-weight:600">'+money(reimbursable(j))+'</td></tr></tbody></table></div>';
}
function billingSection(j){
  if(j.status!=='Completed') return '<section id="billing"><div class="ds-section-head"><h2>'+icon('receipt')+'Billing</h2>'+pill('Not billable yet','neutral','circle')+'</div><p class="ds-muted ds-small">Billing starts once a manager confirms the job completed.</p></section>';
  const bs = billingStatus(j), b = latestBill(j), acts = billActions(j);
  const versions = j.billing.versions.slice().reverse().map(x=>'<tr><td data-label="Version"><strong class="ds-strong">v'+x.v+'</strong></td><td data-label="Uploaded">'+esc(x.by)+'<div class="ds-muted ds-xs">'+esc(x.on)+'</div></td><td data-label="File"><span class="ds-mono ds-xs">'+esc(x.file)+'</span></td>'+
    '<td data-label="Amount" class="ds-num">'+money(x.amount)+'</td><td data-label="Due">'+esc(x.dueDate)+'</td><td data-label="Status">'+pill(x.status, V_TONE[x.status]||'info', V_ICON[x.status]||'clock','ds-pill--sm')+(x.review&&x.review.decision==='Approved'?'<div class="ds-muted ds-xs">by '+esc(x.review.by)+(x.review.self?' (self-approved)':'')+'</div>':'')+'</td>'+
    '<td data-label="Reason" style="white-space:normal">'+(x.review&&x.review.decision==='Returned'?'<strong class="ds-strong">'+esc(x.review.reasonType)+'</strong><div class="ds-small">'+esc(x.review.comment)+'</div>':(x.sent?'Sent '+esc(x.sent.on)+(x.sent.invoiceNo?' · official invoice '+esc(x.sent.invoiceNo):''):'<span class="ds-muted3">—</span>'))+'</td></tr>').join('');
  const pays = j.billing.payments.map(p=>'<tr><td data-label="Date">'+esc(p.date)+'</td><td data-label="Mode">'+esc(p.mode)+(p.ref?' · '+esc(p.ref):'')+'</td><td data-label="Proof"><span class="ds-mono ds-xs">'+esc(p.proof)+'</span></td><td data-label="Received" class="ds-num">'+money(p.amount)+'</td><td data-label="Withholding" class="ds-num">'+(p.wht?money(p.wht):'—')+'</td></tr>').join('');
  const paid = paidTotal(j), due = b && ['Sent'].includes(b.status) ? b.amount - paid : 0;
  return '<section id="billing"><div class="ds-section-head"><h2>'+icon('receipt')+'Billing</h2>'+pill(bs.label, bs.tone, bs.icon)+'</div>'+
    '<div class="ds-stack--sm">'+
      '<div class="ds-panel"><div class="ds-panel__head"><h3>Reimbursable costs summary</h3><span class="ds-panel__hint">copy these into your SOA</span></div><div class="ds-panel__body">'+reimbSummaryHtml(j)+'</div></div>'+
      (versions ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack" id="billing-versions"><thead><tr><th>Ver.</th><th>Uploaded</th><th>File</th><th class="ds-num">Amount</th><th>Due</th><th>Status</th><th>Note</th></tr></thead><tbody>'+versions+'</tbody></table></div>' : '<p class="ds-muted">No Statement of Account uploaded yet.</p>')+
      (b && b.status==='Sent' ? '<div class="ds-stats">'+stat('Billed', money(b.amount))+stat('Received + withheld', money(paid))+stat('Balance', money(Math.max(0,due)), daysUntil(b.dueDate)<0 && due>0.005, 'due '+esc(b.dueDate))+'</div>' : '')+
      (pays ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack" id="payments"><thead><tr><th>Date</th><th>Mode</th><th>Proof</th><th class="ds-num">Received</th><th class="ds-num">Withholding tax</th></tr></thead><tbody>'+pays+'</tbody></table></div>' : '')+
      (acts.length ? '<div class="ds-row">'+acts.map(a=>btn(a)).join('')+'</div>' : '')+
      (financiallyClosed(j) ? '<div class="ds-alert ds-alert--success">'+icon('check')+'<div><strong>Financially closed</strong>Paid in full and every fund request verified.</div></div>' : '')+
    '</div></section>';
}
function openUploadSOA(jobId){
  const j = jobById(jobId), prev = latestBill(j);
  if(!can('bill.submit')) return denied('Accounting uploads the SOA.');
  openDrawer({ title:'Upload Statement of Account', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name)+' · v'+((prev?prev.v:0)+1),
    body:'<form class="ds-stack--sm" id="soa-form" novalidate onsubmit="event.preventDefault(); saveSOA(\''+jobId+'\', this)">'+
      (prev&&prev.status==='Returned'?'<div class="ds-alert ds-alert--warning">'+icon('refresh')+'<div><strong>v'+prev.v+' returned: '+esc(prev.review.reasonType)+'</strong>'+esc(prev.review.comment)+'</div></div>':'')+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Pass-through costs on file: '+money(reimbursable(j))+'</strong>From liquidated fund requests, with receipts. See the summary on the Money tab.</div></div>'+
      '<div class="ds-field"><label>SOA file</label>'+uploadHtml('soaFile','Your Statement of Account, in your usual format')+errorSlot('file')+'</div>'+
      moneyField('soa-amount','amount','Total amount', 'PHP', prev?prev.amount:null)+
      dateField('soa-due','dueDate','Due date', addDaysDMY(SETTINGS.paymentTermsDays))+
      '<p class="ds-muted ds-xs">Official invoices stay in your BIR-registered system; record the invoice no. when you send.</p></form>',
    foot: drawerFoot('Submit for approval','soa-form',{icon:'upload'}) });
}
function saveSOA(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), amount = Number(fd.get('amount')), due = isoToDMY(fd.get('dueDate'));
  if(fieldError(form,'file', UPLOADS.soaFile?'':'Attach the SOA.') | fieldError(form,'amount', amount>0?'':'Enter the total.') | fieldError(form,'dueDate', due?'':'Pick the due date.')) return;
  if(needConfirm('Submit SOA for approval?', 'The SOA for '+money(amount)+' goes to a manager. It can’t be sent until approved.', 'Submit SOA', "saveSOA('"+jobId+"',document.getElementById('"+form.id+"'))")) return;
  const prev = latestBill(j);
  const b = { v:(prev?prev.v:0)+1, file:UPLOADS.soaFile, amount, dueDate:due, by:me(), on:todayDMY(), status:'For approval' };
  j.billing.versions.push(b);
  logTo(j, 'Billing submitted', 'SOA v'+b.v+' '+money(amount)+', due '+due+'.');
  notify({ roles:['Manager'] }, 'SOA v'+b.v+' for '+j.id+' ('+money(amount)+') needs approval.', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast('SOA submitted for approval.', 'success', 'upload'); render();
}
function openReviewBill(jobId){
  const j = jobById(jobId), b = latestBill(j);
  if(!can('bill.approve')) return denied('Only a Manager approves billing.');
  const q = inqById(j.inquiryId), v = q ? acceptedVersion(q) : null;
  openDrawer({ title:'Review SOA v'+b.v, sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="rb-form" novalidate onsubmit="event.preventDefault(); confirmDecision(\'bill\', \''+jobId+'\', \'Approved\')">'+
      '<div class="ds-panel">'+fileRow(b.file, 'Uploaded by '+b.by+' · '+b.on)+'</div>'+
      '<div class="ds-stats">'+stat('SOA total', money(b.amount))+stat('Accepted quote', v?amountText(v):'—')+stat('Pass-through on file', money(reimbursable(j)))+'</div>'+
      '</form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Close</button><button type="button" class="ds-btn ds-btn--secondary" onclick="confirmDecision(\'bill\', \''+jobId+'\', \'Returned\')">'+icon('x')+'Reject</button><button type="submit" form="rb-form" class="ds-btn ds-btn--primary" id="approve-bill">'+icon('check')+'Approve</button>' });
}
function decideBill(jobId, decision, form){
  const j = jobById(jobId), b = latestBill(j), fd = new FormData(form), comment = String(fd.get('comment')||'').trim();
  if(decision==='Returned' && fieldError(form,'comment', comment?'':'Say what to fix.')) return;
  b.status = decision; b.review = { by:me(), on:todayDMY(), decision, self:b.by===me(), reasonType: decision==='Returned'?String(fd.get('reasonType')):null, comment: decision==='Returned'?comment:null };
  logTo(j, decision==='Approved'?'Billing approved':'Billing returned', 'SOA v'+b.v+(decision==='Returned'?': '+b.review.reasonType+'. '+comment:' approved.'));
  notify({ roles:['Accounting'] }, 'SOA v'+b.v+' for '+j.id+' was '+decision.toLowerCase()+' by '+me()+'.', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast('SOA v'+b.v+' '+decision.toLowerCase()+'.', decision==='Approved'?'success':'warning', decision==='Approved'?'check':'refresh'); render();
}
function openSendBill(jobId){
  const j = jobById(jobId), b = latestBill(j);
  openDrawer({ title:'Mark SOA v'+b.v+' as sent', sub:'<span class="ds-mono">'+j.id+'</span> · '+money(b.amount)+' due '+esc(b.dueDate),
    body:'<form class="ds-stack--sm" id="sb-form" novalidate onsubmit="event.preventDefault(); saveSendBill(\''+jobId+'\', this)">'+dateField('sb-on','on','Sent on', todayDMY())+
      '<div class="ds-field"><label for="sb-inv">Official invoice no. <span class="ds-opt">optional</span></label><input class="ds-input" id="sb-inv" name="invoiceNo" placeholder="From your BIR-registered invoicing"></div></form>',
    foot: drawerFoot('Mark as sent','sb-form',{icon:'arrow-right'}) });
}
function saveSendBill(jobId, form){
  const j = jobById(jobId), b = latestBill(j), fd = new FormData(form), on = isoToDMY(fd.get('on'));
  if(fieldError(form,'on', on?'':'Pick the date.')) return;
  if(needConfirm('Mark SOA as sent?', 'The client counts as billed from the date you picked.', 'Mark sent', "saveSendBill('"+jobId+"',document.getElementById('"+form.id+"'))")) return;
  b.status = 'Sent'; b.sent = { by:me(), on, invoiceNo:String(fd.get('invoiceNo')||'').trim() };
  logTo(j, 'Billing sent', 'SOA v'+b.v+' sent on '+on+(b.sent.invoiceNo?' (official invoice '+b.sent.invoiceNo+')':'')+'.');
  closeDrawer(); showToast('SOA marked as sent.', 'success', 'arrow-right'); render();
}
function openPayment(jobId){
  const j = jobById(jobId), b = latestBill(j), bal = Math.max(0, b.amount - paidTotal(j));
  openDrawer({ title:'Record payment', sub:'<span class="ds-mono">'+j.id+'</span> · balance '+money(bal),
    body:'<form class="ds-stack--sm" id="pay-form" novalidate onsubmit="event.preventDefault(); savePayment(\''+jobId+'\', this)">'+
      dateField('pay-date','date','Date received', todayDMY())+
      moneyField('pay-amount','amount','Amount received')+
      moneyField('pay-wht','wht','Withholding tax (if any)')+
      '<p class="ds-field__hint" style="margin-top:calc(var(--t1m-space-2) * -1)">Corporate clients often withhold 2% on services and give a BIR Form 2307. Enter it so the payment does not look short.</p>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="pay-mode">Mode</label>'+selectWrap('<select class="ds-select" id="pay-mode" name="mode">'+options(PAY_MODES, 'Bank transfer')+'</select>')+'</div>'+
        '<div class="ds-field"><label for="pay-ref">Reference <span class="ds-opt">optional</span></label><input class="ds-input" id="pay-ref" name="ref"></div></div>'+
      '<div class="ds-field"><label>Proof</label>'+uploadHtml('payProof','Deposit slip, transfer confirmation or check copy')+errorSlot('proof')+'</div></form>',
    foot: drawerFoot('Record payment','pay-form',{icon:'arrow-in'}) });
}
function savePayment(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), amount = Number(fd.get('amount'))||0, wht = Number(fd.get('wht'))||0, date = isoToDMY(fd.get('date'));
  if(fieldError(form,'amount', amount>0?'':'Enter the amount received.') | fieldError(form,'date', date?'':'Pick the date.') | fieldError(form,'proof', UPLOADS.payProof?'':'Attach proof of payment.')) return;
  if(needConfirm('Record this payment?', money(amount)+(wht?' plus '+money(wht)+' withheld':'')+' is added to the job’s billing.', 'Record payment', "savePayment('"+jobId+"',document.getElementById('"+form.id+"'))")) return;
  j.billing.payments.push({ id:nextId('pay'), date, amount, wht, mode:String(fd.get('mode')), ref:String(fd.get('ref')||'').trim(), proof:UPLOADS.payProof, by:me() });
  logTo(j, 'Payment recorded', money(amount)+(wht?' + '+money(wht)+' withheld':'')+' on '+date+'.');
  const bs = billingStatus(j);
  if(bs.key==='paid') notify({ roles:['Manager'] }, j.id+' is paid in full'+(financiallyClosed(j)?' and financially closed':'')+'.', '#/jobs/'+j.id+'/money');
  closeDrawer(); showToast(bs.key==='paid'?'Paid in full.':'Payment recorded.', 'success', 'arrow-in'); render();
}
