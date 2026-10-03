/* ============================== BILLING READINESS & FINANCE HANDOVER (blueprint 5.6) ==============================
   After delivery the job gets a readiness checklist so Finance receives a clean file: delivery proven, documents in,
   exceptions resolved, fund requests closed and the charges to bill listed. Then the job is marked "Ready for Finance"
   and Finance marks it "Received". This is a handover record only: no invoices, no tax, no payments.
   The charges list is plain lines (what, how much, evidence); Finance bills from it in their own system. */
const CHARGE_KINDS = ['Service fee','Pass-through at cost'];
const chargesOf = j => j.charges || (j.charges = []);
function readinessApplies(j){ return j.ms.some(m=>isDeliveryStep(m) && m.done) || j.status==='For closing' || j.status==='Completed'; }
function readinessItems(j){
  const del = j.ms.filter(isDeliveryStep), delivered = !del.length || del.every(m=>m.done), docs = pendingDocs(j), unres = unresolvedExc(j), open = j.funds.filter(f=>f.status!=='Verified'), ch = chargesOf(j);
  return [
    { key:'delivery', label:'Delivery confirmed with proof', ok:delivered, sub: delivered ? null : 'The cargo has not been delivered yet' },
    { key:'docs', label:'All documents received', ok:!docs.length, sub: docs.length ? docs.map(d=>d.name+(d.status==='Rejected'?' (rejected)':'')).join(', ') : null },
    { key:'exc', label:'Exceptions resolved', ok:!unres.length, sub: unres.length ? unres.map(x=>x.category+' ('+EXC_LABEL[x.status].toLowerCase()+')').join(', ') : null },
    { key:'funds', label:'Every fund request closed', ok:!open.length, sub: open.length ? open.map(f=>f.id+' ('+frLabel(f).toLowerCase()+')').join(', ') : null },
    { key:'charges', label:'Charges to bill are listed', ok:ch.length>0, sub: ch.length ? null : 'Add at least the service fee' }
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
  const rs = readinessStatus(j);
  if(rs.key==='na') return emptyState('receipt','Billing readiness starts after delivery','Once the cargo is delivered, this tab shows what is still missing before Finance can take the job over.');
  const items = readinessItems(j), ch = chargesOf(j), total = sumOf(ch, c=>c.amount), fees = sumOf(ch.filter(c=>c.kind===CHARGE_KINDS[0]), c=>c.amount), atCost = total - fees, locked = ['ready','received'].includes(rs.key), editCh = can('charge.edit') && !locked;
  const i = inqById(j.inquiryId), v = i ? acceptedVersion(i) : null, quoted = v ? toPHP(v) : null;
  const fixes = { delivery:act('Open milestones',"goTab('"+j.id+"','milestones')",'flag'), docs:act('Open documents',"goTab('"+j.id+"','documents')",'file'), exc:act('Open exceptions',"goTab('"+j.id+"','issues')",'flag'), funds:act('Open funds',"goTab('"+j.id+"','money')",'wallet'), charges:editCh ? act('Add a charge',"openAddCharge('"+j.id+"')",'plus') : null };
  const rows = ch.map(c=>'<tr><td data-label="Charge"><span class="ds-strong">'+esc(c.desc)+'</span><div class="ds-muted ds-xs">'+esc(c.by+' · '+c.on)+'</div></td><td data-label="Type">'+esc(c.kind)+'</td><td data-label="Evidence">'+(c.file?'<span class="ds-mono ds-xs">'+esc(c.file)+'</span>':'<span class="ds-muted3">—</span>')+'</td><td data-label="Amount" class="ds-num">'+money(c.amount)+'</td><td class="ds-num">'+(editCh?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="removeCharge(\''+j.id+'\',\''+c.id+'\')" aria-label="Remove '+esc(c.desc)+'">Remove</button>':'')+'</td></tr>').join('');
  const fundsToAdd = j.funds.filter(f=>f.status==='Verified' && !ch.some(c=>c.fundId===f.id));
  return '<div class="ds-stack"><section id="billing-readiness"><div class="ds-section-head"><h2>'+icon('receipt')+'Billing readiness</h2><span class="ds-row ds-row--tight">'+readinessPill(j)+'<button class="ds-btn ds-btn--ghost ds-btn--sm" id="billing-pdf" onclick="downloadBillingPdf(\''+j.id+'\')">'+icon('download')+'Download PDF</button></span></div>'+
    '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">What Finance needs before it takes this job. It is a handover checklist, not an invoice.</p>'+
    '<ul class="ds-gate">'+items.map(it=>gateItemHtml({ label:it.label, sub:it.sub, met:it.ok, act: !it.ok && fixes[it.key] ? fixes[it.key] : null })).join('')+'</ul>'+
    (j.handover ? '<div class="ds-alert ds-alert--'+(j.handover.receivedOn?'success':'info')+'" style="margin-top:var(--t1m-space-3)">'+icon(j.handover.receivedOn?'check':'arrow-right')+'<div><strong>'+(j.handover.receivedOn?'Received by Finance on '+esc(j.handover.receivedOn)+' ('+esc(j.handover.receivedBy)+')':'Marked ready for Finance on '+esc(j.handover.readyOn)+' by '+esc(j.handover.readyBy))+'</strong>'+(j.handover.ref?'Finance reference: '+esc(j.handover.ref)+'.':(j.handover.receivedOn?'':'Waiting for Finance to receive it.'))+'</div></div>' : '')+
    '<div class="ds-row" style="margin-top:var(--t1m-space-3)">'+
      (rs.key==='complete' && can('ready.mark') ? '<button class="ds-btn ds-btn--primary" id="mark-ready" onclick="markReadyForFinance(\''+j.id+'\')">'+icon('arrow-right')+'Mark ready for Finance</button>' : '')+
      (rs.key==='ready' && can('ready.receive') ? '<button class="ds-btn ds-btn--primary" id="receive-finance" onclick="openReceiveFinance(\''+j.id+'\')">'+icon('check')+'Mark received by Finance</button>' : '')+'</div></section>'+
    '<section id="charges"><div class="ds-section-head"><h2>'+icon('wallet')+'Charges to bill</h2>'+(editCh?'<span class="ds-row ds-row--tight">'+(fundsToAdd.length?'<button class="ds-btn ds-btn--ghost ds-btn--sm" id="add-from-receipts" onclick="addChargesFromFunds(\''+j.id+'\')">Add '+plural(fundsToAdd.length,'closed fund request')+' at cost</button>':'')+'<button class="ds-btn ds-btn--secondary ds-btn--sm" id="add-charge" onclick="openAddCharge(\''+j.id+'\')">'+icon('plus')+'Add charge</button></span>':'')+'</div>'+
      '<p class="ds-muted ds-small" style="margin-bottom:var(--t1m-space-3)">Service fees and costs paid on the client’s behalf. Finance bills from this list in their own system.</p>'+
      '<div class="ds-stats" style="margin-bottom:var(--t1m-space-4)">'+stat('Service fees', money(fees), false, plural(ch.filter(c=>c.kind===CHARGE_KINDS[0]).length,'line'))+stat('Paid at cost', money(atCost), false, 'costs paid for the client')+stat('Charges listed', money(total), false, 'fees + at cost')+(quoted!=null?stat('Accepted quote', money(quoted), false, 'v'+v.v)+stat('Difference', money(total-quoted), false, (total>=quoted?'listed is above the quote':'listed is below the quote')+(atCost?' · '+money(atCost)+' of it is at cost':'')):'')+'</div>'+
      (rows ? '<div class="ds-table-wrap" style="margin:0 calc(var(--t1m-space-4) * -1)"><table class="ds-table ds-table--stack"><thead><tr><th>Charge</th><th>Type</th><th>Evidence</th><th class="ds-num">Amount</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>' : '<p class="ds-muted">No charges listed yet.</p>')+'</section></div>';
}
function openAddCharge(jobId){
  const j = jobById(jobId);
  if(!can('charge.edit')) return denied('Only a Manager or Accounting adds charges.');
  openDrawer({ title:'Add a charge', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="charge-form" novalidate onsubmit="event.preventDefault(); saveCharge(\''+jobId+'\', this)">'+
      '<div class="ds-field"><label for="ch-desc">What is it for?</label><input class="ds-input" id="ch-desc" name="desc" placeholder="e.g. Customs brokerage fee, Trucking to Pasig">'+errorSlot('desc')+'</div>'+
      moneyField('ch-amount','amount','Amount')+
      '<div class="ds-field"><span class="ds-field__label">Type</span>'+segControl('kind', CHARGE_KINDS, CHARGE_KINDS[0])+'<p class="ds-field__hint">Pass-through at cost is money paid for the client, such as duties or port charges.</p></div>'+
      '<div class="ds-field"><label>Evidence <span class="ds-opt">optional</span></label>'+uploadHtml('chargeFile','Receipt, quotation or rate sheet that supports it')+'</div></form>',
    foot: drawerFoot('Add charge','charge-form',{icon:'plus'}) });
}
function saveCharge(jobId, form){
  const j = jobById(jobId), fd = new FormData(form), desc = String(fd.get('desc')||'').trim(), amount = Number(fd.get('amount'));
  if(fieldError(form,'desc', desc?'':'What is the charge for?') | fieldError(form,'amount', amount>0?'':'Enter the amount.')) return;
  chargesOf(j).push({ id:nextId('party'), desc, amount, kind:String(fd.get('kind')), file:UPLOADS.chargeFile||null, by:me(), on:todayDMY() });
  logTo(j, 'Charge added', desc+' '+money(amount)+' ('+String(fd.get('kind')).toLowerCase()+').');
  closeDrawer(); showToast('Charge added.', 'success', 'check'); render();
}
function addChargesFromFunds(jobId){
  const j = jobById(jobId); if(!can('charge.edit')) return denied();
  const list = j.funds.filter(f=>f.status==='Verified' && !chargesOf(j).some(c=>c.fundId===f.id));
  list.forEach(f=>chargesOf(j).push({ id:nextId('party'), desc:f.purpose+' · '+f.payee, amount:f.liq.actual, kind:CHARGE_KINDS[1], fundId:f.id, file:f.liq.receipts, by:me(), on:todayDMY() }));
  if(list.length) logTo(j, 'Charge added', plural(list.length,'closed fund request')+' added at cost ('+money(sumOf(list, f=>f.liq.actual))+').');
  showToast(list.length ? 'Added '+plural(list.length,'charge')+' at cost.' : 'Nothing to add.', 'success', 'check'); render();
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
  logTo(j, 'Ready for Finance', 'Checklist complete. '+plural(chargesOf(j).length,'charge')+' totalling '+money(sumOf(chargesOf(j), c=>c.amount))+'.');
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
  return panel('Billing readiness','receipt', barRows(rows, { empty:'No job has been delivered yet.' })+(open?'<ul class="ds-gate" style="margin-top:var(--t1m-space-3)">'+open+'</ul>':''), 'Jobs after delivery, by how far they are in the handover to Finance.');
}
