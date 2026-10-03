/* ============================== BILLING READINESS & FINANCE HANDOVER (blueprint 5.6) ==============================
   After delivery the job gets a readiness checklist so Finance receives a clean file: delivery proven, documents in,
   exceptions resolved, fund requests closed and the charges to bill listed. Then the job is marked "Ready for Finance"
   and Finance marks it "Received". This is a handover record only: no invoices, no tax, no payments.
   The charges list is plain lines (what, how much, evidence); Finance records it in their own system. */
const CHARGE_KINDS = ['Extra charge'];
const chargesOf = j => j.charges || (j.charges = []);
/* The accepted quotation IS what the client agreed to pay, so it is the first line of the job's revenue. Charges added here are extras on top of it. */
function quoteLine(j){ const i = inqById(j.inquiryId), v = i ? acceptedVersion(i) : null; return v ? { id:'quote', desc:'Accepted quotation '+quoteNo(i)+' (v'+v.v+')', amount:toPHP(v), kind:'As quoted', file:v.file, by:v.by, on:v.on, fixed:true } : null; }
/* Total job amount = accepted quotation + extra charges (what the client pays overall).
   Paid out for the client = the verified fund requests (shipping line, duties, port charges...), which pass through to others.
   Revenue = what we keep = total job amount - paid out. */
const jobTotal = j=>sumOf(billLines(j), c=>c.amount);
const paidOutFunds = j=>j.funds.filter(f=>f.status==='Verified' && f.liq);
const paidOutFor = j=>sumOf(paidOutFunds(j), f=>f.liq.actual);
const jobRevenue = j=>jobTotal(j)-paidOutFor(j);
/* Rows that explain the numbers, shared by the Billing tab and the PDF. */
function moneyBreakdown(j){
  const q = quoteLine(j), ex = chargesOf(j), pf = paidOutFunds(j), out = [];
  out.push({ label:'Accepted quotation', sub:q?q.desc:'No accepted quotation on file', amount:q?q.amount:0, sign:'' });
  out.push({ label:'Extra charges', sub:ex.length ? ex.map(c=>c.desc).join(', ') : 'None added', amount:sumOf(ex, c=>c.amount), sign:'+' });
  out.push({ label:'Total job amount', sub:'What the client pays overall', amount:jobTotal(j), total:true });
  out.push({ label:'Paid out for the client', sub:pf.length ? pf.map(f=>f.id+' '+f.purpose+' ('+money(f.liq.actual)+')').join(', ') : 'No fund requests', amount:paidOutFor(j), sign:'−' });
  out.push({ label:'Revenue (what we keep)', sub:'Total job amount minus what was paid out for the client', amount:jobRevenue(j), total:true, strong:true });
  return out;
}
function billLines(j){ const q = quoteLine(j); return (q?[q]:[]).concat(chargesOf(j)); }
function readinessApplies(j){ return j.ms.some(m=>isDeliveryStep(m) && m.done) || j.status==='For closing' || j.status==='Completed'; }
function readinessItems(j){
  const del = j.ms.filter(isDeliveryStep), delivered = !del.length || del.every(m=>m.done), docs = pendingDocs(j), unres = unresolvedExc(j), open = j.funds.filter(f=>f.status!=='Verified'), ch = chargesOf(j);
  return [
    { key:'delivery', label:'Delivery confirmed with proof', ok:delivered, sub: delivered ? null : 'The cargo has not been delivered yet' },
    { key:'docs', label:'All documents received', ok:!docs.length, sub: docs.length ? docs.map(d=>d.name+(d.status==='Rejected'?' (rejected)':'')).join(', ') : null },
    { key:'exc', label:'Exceptions resolved', ok:!unres.length, sub: unres.length ? unres.map(x=>x.category+' ('+EXC_LABEL[x.status].toLowerCase()+')').join(', ') : null },
    { key:'funds', label:'Every fund request closed', ok:!open.length, sub: open.length ? open.map(f=>f.id+' ('+frLabel(f).toLowerCase()+')').join(', ') : null },
    { key:'charges', label:'Amount of the job is recorded', ok:billLines(j).length>0, sub: billLines(j).length ? null : 'No accepted quotation on file. Add the charges' }
  ];
}
function readinessStatus(j){
  if(!readinessApplies(j)) return { key:'na', label:'Starts after delivery', short:'—', tone:'neutral', icon:'circle' };
  if(j.handover && j.handover.receivedOn) return { key:'received', label:'Received by Finance', short:'Received by Finance', tone:'success', icon:'check' };
  if(j.handover && j.handover.readyOn) return { key:'ready', label:'Ready for Finance', short:'Ready for Finance', tone:'brand', icon:'arrow-right' };
  const miss = readinessItems(j).filter(i=>!i.ok);
  return miss.length ? { key:'missing', label:'Not ready · '+plural(miss.length,'item')+' missing', short:'Not ready', tone:'warning', icon:'alert', miss } : { key:'complete', label:'Checklist complete · not handed over yet', short:'Checklist complete', tone:'info', icon:'check', miss:[] };
}
function readinessPill(j, sm){ const r = readinessStatus(j); return pill(sm ? r.short : r.label, r.tone, r.icon, sm?'ds-pill--sm':''); }

function jobBillingTab(j){
  if(!canView('handover.view', j)) return emptyState('lock','Only a Manager or Accounting sees the Finance handover','');
  const rs = readinessStatus(j);
  if(rs.key==='na') return emptyState('receipt','The Finance handover starts after delivery','Once the cargo is delivered, this tab shows what is still missing before Finance can take the job over.');
  const items = readinessItems(j), ch = billLines(j), extras = chargesOf(j), locked = ['ready','received'].includes(rs.key), editCh = can('charge.edit') && !locked;
  const fixes = { delivery:act('Open milestones',"goTab('"+j.id+"','milestones')",'flag'), docs:act('Open documents',"goTab('"+j.id+"','documents')",'file'), exc:act('Open exceptions',"goTab('"+j.id+"','issues')",'flag'), funds:act('Open funds',"goTab('"+j.id+"','money')",'wallet'), charges:editCh ? act('Add a charge',"openAddCharge('"+j.id+"')",'plus') : null };
  const rows = ch.map(c=>'<tr><td data-label="Charge"><span class="ds-strong">'+esc(c.desc)+'</span><div class="ds-muted ds-xs">'+esc(c.by+' · '+c.on)+'</div></td><td data-label="Type">'+esc(c.kind)+'</td><td data-label="Evidence">'+(c.file?'<span class="ds-mono ds-xs">'+esc(c.file)+'</span>':'<span class="ds-muted3">—</span>')+'</td><td data-label="Amount" class="ds-num">'+money(c.amount)+'</td><td class="ds-num">'+(editCh && !c.fixed?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="removeCharge(\''+j.id+'\',\''+c.id+'\')" aria-label="Remove '+esc(c.desc)+'">Remove</button>':'')+'</td></tr>').join('');
  return '<div class="ds-stack"><section id="billing-readiness"><div class="ds-section-head"><h2>'+icon('receipt')+'Handover checklist</h2><span class="ds-row ds-row--tight">'+readinessPill(j)+'<button class="ds-btn ds-btn--ghost ds-btn--sm" id="billing-pdf" onclick="downloadBillingPdf(\''+j.id+'\')">'+icon('download')+'Download PDF</button></span></div>'+
    '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">What Finance needs before it takes this job. It is a handover checklist, not an invoice.</p>'+
    '<ul class="ds-gate">'+items.map(it=>gateItemHtml({ label:it.label, sub:it.sub, met:it.ok, act: !it.ok && fixes[it.key] ? fixes[it.key] : null })).join('')+'</ul>'+
    (j.handover ? '<div class="ds-alert ds-alert--'+(j.handover.receivedOn?'success':'info')+'" style="margin-top:var(--t1m-space-3)">'+icon(j.handover.receivedOn?'check':'arrow-right')+'<div><strong>'+(j.handover.receivedOn?'Received by Finance on '+esc(j.handover.receivedOn)+' ('+esc(j.handover.receivedBy)+')':'Marked ready for Finance on '+esc(j.handover.readyOn)+' by '+esc(j.handover.readyBy))+'</strong>'+(j.handover.ref?'Finance reference: '+esc(j.handover.ref)+'.':(j.handover.receivedOn?'':'Waiting for Finance to receive it.'))+'</div></div>' : '')+
    '<div class="ds-row" style="margin-top:var(--t1m-space-3)">'+
      (rs.key==='complete' && can('ready.mark') ? '<button class="ds-btn ds-btn--primary" id="mark-ready" onclick="markReadyForFinance(\''+j.id+'\')">'+icon('arrow-right')+'Mark ready for Finance</button>' : '')+
      (rs.key==='ready' && can('ready.receive') ? '<button class="ds-btn ds-btn--primary" id="receive-finance" onclick="openReceiveFinance(\''+j.id+'\')">'+icon('check')+'Mark received by Finance</button>' : '')+'</div></section>'+
    '<section id="charges"><div class="ds-section-head"><h2>'+icon('wallet')+'Money summary</h2>'+(editCh?'<span class="ds-row ds-row--tight">'+'<button class="ds-btn ds-btn--secondary ds-btn--sm" id="add-charge" onclick="openAddCharge(\''+j.id+'\')">'+icon('plus')+'Add extra charge</button></span>':'')+'</div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">The accepted quotation is what the client pays. Add a line only for something extra that was not in it. Money we paid out for the client is not ours, so it is taken off to show what we keep. This is a record for Finance, not a bill to the client.</p>'+
      '<div class="ds-stats" style="margin-bottom:var(--t1m-space-4)">'+stat('Total job amount', money(jobTotal(j)), false, 'quote + extra charges')+stat('Paid out for the client', money(paidOutFor(j)), false, plural(paidOutFunds(j).length,'fund request')+' (not ours)')+stat('Revenue (what we keep)', money(jobRevenue(j)), false, 'total minus paid out')+'</div>'+
      breakdownHtml(j)+'<h3 class="ds-subhead">Lines on this job</h3>'+(rows ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack"><thead><tr><th>Charge</th><th>Type</th><th>Evidence</th><th class="ds-num">Amount</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>' : '<p class="ds-muted">Nothing to bill yet.</p>')+'</section></div>';
}
function breakdownHtml(j){
  return '<h3 class="ds-subhead ds-subhead--first">How the numbers add up</h3><div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack"><tbody>'+moneyBreakdown(j).map(r=>'<tr'+(r.total?' class="ds-tr--total"':'')+'><td data-label="Item"><span class="'+(r.total?'ds-strong':'')+'">'+esc((r.sign?r.sign+' ':r.total?'= ':'')+r.label)+'</span><div class="ds-muted ds-xs">'+esc(r.sub)+'</div></td><td data-label="Amount" class="ds-num'+(r.strong?' ds-strong':'')+'">'+money(r.amount)+'</td></tr>').join('')+'</tbody></table></div>';
}
function openAddCharge(jobId){
  const j = jobById(jobId);
  if(!can('charge.edit')) return denied('Only a Manager or Accounting adds charges.');
  openDrawer({ title:'Add an extra charge', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="charge-form" novalidate onsubmit="event.preventDefault(); saveCharge(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="ch-desc">What is it for?</label><input class="ds-input" id="ch-desc" name="desc" placeholder="e.g. Customs brokerage fee, Trucking to Pasig">'+errorSlot('desc')+'</div>'+
      moneyField('ch-amount','amount','Amount')+
      '<div class="ds-field"><label>Evidence <span class="ds-opt">optional</span></label>'+uploadHtml('chargeFile','Receipt, quotation or rate sheet that supports it')+'</div></form>',
    foot: drawerFoot('Add charge','charge-form',{icon:'plus'}) });
}
function saveCharge(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), desc = String(fd.get('desc')||'').trim(), amount = Number(fd.get('amount'));
  if(fieldError(form,'desc', desc?'':'What is the charge for?') | fieldError(form,'amount', amount>0?'':'Enter the amount.')) return;
  chargesOf(j).push({ id:nextId('party'), desc, amount, kind:CHARGE_KINDS[0], file:UPLOADS.chargeFile||null, by:me(), on:todayDMY() });
  logTo(j, 'Charge added', desc+' '+money(amount)+'.');
  closeDrawer(); showToast('Charge added.', 'success', 'check'); render();
}
function removeCharge(jobId, id){
  const j = jobById(jobId); if(!can('charge.edit')) return denied();
  const c = chargesOf(j).find(x=>x.id===id);
  j.charges = chargesOf(j).filter(x=>x.id!==id); logTo(j, 'Charge removed', c.desc+' '+money(c.amount)+' removed.');
  showToast('Removed.', 'info', 'x'); render();
}
function markReadyForFinance(jobId){
  const j = jobById(jobId);
  if(!can('ready.mark')) return denied('Only a Manager or Accounting hands a job to Finance.');
  if(readinessStatus(j).key!=='complete') return denied('Finish the checklist first.');
  j.handover = { readyBy:me(), readyOn:todayDMY() };
  logTo(j, 'Ready for Finance', 'Checklist complete. '+plural(billLines(j).length,'line')+', total job amount '+money(jobTotal(j))+', revenue '+money(jobRevenue(j))+'.');
  notify({ roles:['Accounting'] }, 'Job '+j.id+' ('+cname(j.customerId)+') is ready for Finance.', '#/jobs/'+j.id+'/billing');
  showToast('Marked ready for Finance.', 'success', 'arrow-right'); render();
}
function openReceiveFinance(jobId){
  const j = jobById(jobId);
  if(!can('ready.receive')) return denied('Only Accounting marks a job as received.');
  openDrawer({ title:'Received by Finance', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="recv-form" novalidate onsubmit="event.preventDefault(); saveReceiveFinance(\''+jobId+'\', this)">'+dateField('rv-on','on','Received on', todayDMY())+
      '<div class="ds-field"><label for="rv-ref">Finance reference <span class="ds-opt">optional</span></label><input class="ds-input" id="rv-ref" name="ref" placeholder="Number from your own accounting system"><p class="ds-field__hint">So the portal job and your billing record can be matched. The portal creates no invoice.</p></div></form>',
    foot: drawerFoot('Mark received','recv-form',{icon:'check'}) });
}
function saveReceiveFinance(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), on = isoToDMY(fd.get('on'));
  if(fieldError(form,'on', on?'':'Pick the date.')) return;
  Object.assign(j.handover, { receivedBy:me(), receivedOn:on, ref:String(fd.get('ref')||'').trim() });
  logTo(j, 'Received by Finance', 'Taken over on '+on+(j.handover.ref?' (reference '+j.handover.ref+')':'')+'.');
  notify({ roles:['Manager'] }, 'Finance received job '+j.id+'.', '#/jobs/'+j.id+'/billing');
  closeDrawer(); showToast('Marked as received by Finance.', 'success', 'check'); render();
}

/* Dashboard: where every job stands in the handover. */
function billingPanel(jobs){
  const list = jobs.filter(readinessApplies), by = k=>list.filter(j=>readinessStatus(j).key===k);
  const notReady = list.filter(j=>['missing','complete'].includes(readinessStatus(j).key));
  const rows = [{ label:'Not ready', value:by('missing').length, tone:'warning' }, { label:'Checklist complete', value:by('complete').length }, { label:'Ready for Finance', value:by('ready').length }, { label:'Received by Finance', value:by('received').length, tone:'success' }].map(r=>Object.assign(r, { valueText:String(r.value) }));
  const open = notReady.slice(0,5).map(j=>{ const r = readinessStatus(j); return gateItemHtml({ label:j.id+' · '+cname(j.customerId), sub: r.miss&&r.miss.length ? 'Missing: '+r.miss.map(m=>m.label.toLowerCase()).join(', ') : 'Checklist complete. Mark it ready for Finance.', met:false, act:act('Open',"goTab('"+j.id+"','billing')",'arrow-right') }); }).join('');
  return panel('Finance handover','receipt', barRows(rows, { empty:'No job has been delivered yet.' })+(open?'<ul class="ds-gate" style="margin-top:var(--t1m-space-3)">'+open+'</ul>':''), 'Jobs after delivery, by how far they are in the handover to Finance.');
}
