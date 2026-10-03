/* ============================== SAMPLE DATA (demo only, opt-in) ==============================
   The session starts empty on purpose. This one-click loader fills it with an illustrative mix so a reviewer can see
   every screen working: inquiries at each stage, and jobs that are on hold, overdue, short of free time, delivered
   with damage, and ready for Finance. Names and numbers are mock; everything vanishes on refresh. */
function loadSampleData(){
  if(CUSTOMERS.length || INQUIRIES.length || JOBS.length){ showToast('Sample data only loads into an empty session.', 'info', 'info'); return; }
  const keep = CURRENT_USER, ago = n=>addDaysDMY(-n);
  const as = (name, fn)=>{ CURRENT_USER = userByName(name); try { return fn(); } finally { CURRENT_USER = keep; } };
  const party = x=>Object.assign({ id:nextId('party') }, x);

  const customers = [
    { name:'Sample Trading Co.', contact:'Juan Dela Cruz', phone:'+63 917 555 0101', email:'juan@sampletrading.example', address:'Unit 5, 123 Ortigas Ave, Pasig City', requirements:'Deliveries on weekdays only, before 3 PM. Call the guard first.',
      consignees:[{ name:'Sample Retail Inc.', contact:'Maria Reyes', phone:'+63 917 555 0111', address:'88 Rockwell Dr, Makati City' }], addresses:[{ label:'Main warehouse', address:'12 Industrial Rd, Valenzuela City' }] },
    { name:'Sample Motors Inc.', contact:'Leo Santos', phone:'+63 917 555 0102', email:'leo@samplemotors.example', address:'45 Commonwealth Ave, Quezon City', requirements:'', consignees:[], addresses:[{ label:'Showroom', address:'Showroom, EDSA, Quezon City' }] },
    { name:'Sample Foods Corp.', contact:'Ana Lim', phone:'+63 917 555 0103', email:'ana@samplefoods.example', address:'7 Bonifacio Way, Taguig City', requirements:'Cold-chain cargo: report any delay the same day.', consignees:[{ name:'Sample Supermart', contact:'Ben Tan', phone:'+63 917 555 0113', address:'Cubao, Quezon City' }], addresses:[] }
  ].map(c=>as('Lorna Bautista', ()=>{
    const o = { id:nextId('cust'), createdBy:'Lorna Bautista', createdOn:ago(40), name:c.name, contact:{ name:c.contact, email:c.email, phone:c.phone }, address:c.address, requirements:c.requirements, consignees:c.consignees.map(party), deliveryAddresses:c.addresses.map(party) };
    CUSTOMERS.push(o); adminLog('Customer created', o.name+' ('+o.id+').', o.id); return o; }));
  const [tr, mo, fo] = customers;

  const makeInq = (cust, o)=>as('Lorna Bautista', ()=>{
    const i = { id:nextId('inq'), createdBy:'Lorna Bautista', createdOn:ago(o.age), versions:[], closed:null, jobId:null, log:[], customerId:cust.id, scope:o.scope, direction:o.direction||null, services:o.services, staff:o.staff, channel:o.channel||'Email', truckLegs:o.truckLegs||null, request:o.request };
    INQUIRIES.push(i); logTo(i, 'Inquiry created', cust.name+'. '+scopeText(i)+': '+servicesText(i.services)+'. Assigned to '+i.staff.join(', ')+'.'); return i; });
  const quote = (i, amount, age)=>as(i.staff[0], ()=>{
    const prev = latestV(i), v = { v:prev ? prev.v+1 : 1, file:'quotation-'+quoteNo(i)+'.pdf', amount, currency:'PHP', validUntil:addDaysDMY(15-age), by:i.staff[0], on:ago(age), at:Date.now(), status:'For approval' };
    i.versions.push(v); logTo(i, 'Quote submitted', 'v'+v.v+' '+amountText(v)+', valid until '+v.validUntil+' ('+v.file+').'); return v; });
  const approve = (i, v, sentAgo)=>as('Grace Tan', ()=>{
    v.review = { by:'Grace Tan', on:ago(sentAgo), at:Date.now(), decision:'Approved', self:false }; v.status = 'Sent'; v.sent = { on:ago(sentAgo), channel:'Email', proof:null, auto:true };
    logTo(i, 'Quote approved', 'v'+v.v+' approved.'); logTo(i, 'Quote sent', 'v'+v.v+' emailed to the client automatically on '+ago(sentAgo)+'.'); });
  const accept = (i, v, onAgo)=>{ v.status = 'Accepted'; v.outcome = { type:'Accepted', reasonType:null, comment:null, proof:'Client page response', by:custById(i.customerId).name, on:ago(onAgo) }; logTo(i, 'Client accepted', 'v'+v.v+' accepted on '+ago(onAgo)+'.'); };
  const win = (i, v, onAgo)=>{ v.ack = { by:'Lorna Bautista', on:ago(onAgo) }; i.closed = 'won'; i.closedBy = 'Lorna Bautista'; i.closedOn = ago(onAgo); logTo(i, 'Inquiry closed (won)', 'Acceptance of v'+v.v+' acknowledged.'); };
  const importReq = (what, dest)=>({ commodity:what, origin:'Yokohama, JP', destination:'Manila, PH', cargoType:'FCL', deliveryAddress:dest, deliveryInstructions:'', notes:'' });
  const IMPORT = ['freight','customs','trucking'];
  const OPS = { freight:['Rico Domingo'], customs:['Jessa Aquino'], trucking:['Mike Salazar'] };

  /* Inquiries at every stage (none converted yet) */
  makeInq(mo, { age:2, scope:'Domestic', services:['trucking'], staff:['Cathy Lim'], channel:'Viber', request:{ commodity:'12 pallets of tiles', pickupAddress:'Batangas Port', deliveryAddress:'Showroom, EDSA, Quezon City', deliveryInstructions:'', notes:'' } });
  const iApproval = makeInq(fo, { age:4, scope:'International', direction:'Import', services:['customs'], staff:['Paolo Santiago'], request:{ commodity:'Frozen seafood, 1x20RF', port:'Manila International Container Port', cargoType:'FCL', notes:'' } }); quote(iApproval, 95000, 1);
  const iWaiting = makeInq(tr, { age:9, scope:'International', direction:'Export', services:['freight'], staff:['Mia Navarro'], channel:'WhatsApp', request:{ commodity:'Garments, 300 cartons', origin:'Manila, PH', destination:'Busan, KR', cargoType:'LCL', notes:'' } }); approve(iWaiting, quote(iWaiting, 120000, 6), 6);
  const iAccepted = makeInq(mo, { age:12, scope:'International', direction:'Import', services:IMPORT, staff:['Dennis Ocampo'], request:importReq('1 unit excavator', 'Showroom, EDSA, Quezon City') }); { const v = quote(iAccepted, 640000, 8); approve(iAccepted, v, 7); accept(iAccepted, v, 1); }
  const iWon = makeInq(tr, { age:14, scope:'International', direction:'Import', services:IMPORT, staff:['Rhea Mendoza'], request:importReq('Auto parts, 3 pallets', '12 Industrial Rd, Valenzuela City') }); { const v = quote(iWon, 310000, 10); approve(iWon, v, 9); accept(iWon, v, 3); win(iWon, v, 2); }
  const iLost = makeInq(fo, { age:20, scope:'Domestic', services:['trucking'], staff:['Ana Cruz'], request:{ commodity:'Dry goods', pickupAddress:'Cebu Port', deliveryAddress:'Cubao, Quezon City', notes:'' } });
  { const v = quote(iLost, 80000, 15); approve(iLost, v, 14); v.status = 'Rejected'; v.outcome = { type:'Rejected', reasonType:'Price too high', comment:'Found a cheaper trucker.', proof:'Client page response', by:fo.name, on:ago(10) };
    iLost.closed = 'lost'; iLost.closedBy = 'Lorna Bautista'; iLost.closedOn = ago(9); iLost.lostReason = { type:'Price too high', comment:'Found a cheaper trucker.' }; logTo(iLost, 'Inquiry closed (lost)', 'Price too high. Found a cheaper trucker.'); }
  INTAKE.push({ id:nextId('intake'), by:'Cathy Lim', on:nowStamp(), client:'Prime Logistics Inc.', note:'Asked for a quote on warehousing for 3 months. Called this morning.', file:'prime-email.pdf', status:'open' });

  /* Jobs: build from an accepted quote, then move them along */
  const jobFrom = (cust, o)=>{
    const i = makeInq(cust, { age:o.age, scope:'International', direction:'Import', services:IMPORT, staff:o.sales, request:importReq(o.what, o.dest) }); const v = quote(i, o.amount, o.age-1); approve(i, v, o.age-2); accept(i, v, o.age-3); win(i, v, o.age-3);
    const j = as('Lorna Bautista', ()=>createJob(i, v, OPS, 'FCL')); j.createdOn = ago(o.age-4); j.log.forEach(a=>{ a.ts = ago(o.age-4)+' 9:00 AM'; }); return j; };
  const advance = (j, n, firstAgo)=>{
    for(let k=0;k<n;k++){ const m = j.ms[k], by = opsFor(j, m.svc)[0], d = ago(Math.max(0, firstAgo-k));
      Object.assign(m, { done:true, date:d, by, remark:null, file:m.proof?'proof-'+m.name.toLowerCase().replace(/\W+/g,'-')+'.pdf':null, laneValue:m.lane?'Green':null, truck:m.name==='Truck scheduled'?{ driver:'Pedro Santos', plate:'ABC 1234', type:'10-wheeler' }:null, shippingLine:/^Booked/.test(m.name)?'Maersk':null });
      j.docs.forEach(x=>{ if(x.step===m.name && x.svc===m.svc && x.status!=='Received') Object.assign(x, { status:'Received', file:x.name.toLowerCase().replace(/\W+/g,'-')+'.pdf', by, on:d, review:null }); });
      j.log.push({ ts:d+' 9:00 AM', actor:by+' (Operations)', action:'Milestone done', detail:m.phase+' · '+m.name+' on '+d+'.', ref:null }); }
    if(j.ms[n]) j.ms[n].due = addDaysDMY(stepDays(j.ms[n]), j.ms[n-1].date); };
  const fund = (j, by, purpose, amount, payee, status, age, how)=>{
    const f = { id:nextId('fr'), by, on:ago(age), purpose, amount, payee, neededBy:ago(age-1), source:'Company funds', how:how||'cash', depositProof:null, support:null, status, review:null };
    if(status!=='For approval') f.review = { by:'Grace Tan', on:ago(age), decision:'Approved', comment:null };
    if(['Released','Liquidated','Verified'].includes(status)) f.release = { by:'Paolo Reyes', on:ago(age-1), mode:'Bank transfer', ref:'TRF-'+(1000+j.funds.length), proof:'voucher.pdf' };
    if(['Liquidated','Verified'].includes(status)) f.liq = { by, on:ago(age-2), actual:Math.round(amount*0.96), receipts:'receipts-'+f.id.toLowerCase()+'.pdf', note:null };
    if(status==='Verified') f.verify = { by:'Paolo Reyes', on:ago(age-3) };
    j.funds.push(f); return f; };

  /* A: free time running out, a duties request waiting for approval */
  const A = jobFrom(tr, { age:14, sales:['Ana Cruz'], what:'2 units pickup trucks', dest:'12 Industrial Rd, Valenzuela City', amount:480000 });
  advance(A, 6, 9); A.free.arrival = null; fund(A, 'Rico Domingo', 'Shipping line local charges', 60000, 'Maersk Philippines', 'Verified', 9); fund(A, 'Jessa Aquino', 'Duties & taxes', 185000, 'Bureau of Customs', 'For approval', 1);
  /* B: on hold, an exception waiting for a Manager */
  const B = jobFrom(mo, { age:10, sales:['Cathy Lim'], what:'Spare parts, 5 pallets', dest:'Showroom, EDSA, Quezon City', amount:260000 });
  advance(B, 5, 6); as('Jessa Aquino', ()=>raiseException(B, { category:'Customs inspection or hold', reason:'Red lane: physical inspection, FDA permit missing', impact:'Delay', evidence:'bochold-notice.pdf', stage:'Customs clearance · Lane assigned' }));
  /* C: a step is past its due date (the owner and a Manager were emailed on screen draw) */
  const C = jobFrom(fo, { age:9, sales:['Paolo Santiago'], what:'Packaging materials', dest:'Cubao, Quezon City', amount:150000 });
  advance(C, 3, 6); C.ms[3].due = ago(3);
  /* D: delivered with damage, everything done, handed to Finance */
  const D = jobFrom(tr, { age:30, sales:['Mia Navarro'], what:'Kitchen equipment, 8 crates', dest:'88 Rockwell Dr, Makati City', amount:390000 });
  advance(D, 14, 20); D.ms.filter(isDeliveryStep).forEach(m=>{ m.delivery = { time:'14:30', receivedBy:'Maria Reyes', condition:'Damaged', problem:'2 crates crushed at one corner', evidence:'damage-photo.jpg' }; });
  D.docs.forEach((x,k)=>{ x.status = 'Received'; x.file = x.file || 'doc-'+k+'.pdf'; x.by = x.by || 'Mike Salazar'; x.on = x.on || ago(12); x.review = k%2 ? { by:'Lorna Bautista', on:ago(11), decision:'Accepted' } : null; });
  as('Mike Salazar', ()=>{ const x = raiseException(D, { category:'Cargo damage or loss', reason:'Damaged: 2 crates crushed at one corner', impact:'Customer affected', evidence:'damage-photo.jpg', holds:false, stage:'Delivery to the consignee · Delivered' });
    x.status = 'Resolved'; x.review = { by:'Lorna Bautista', on:ago(9), decision:'Approved', comment:null }; x.action = { text:'File a damage claim with the carrier and credit the client', owner:'Mike Salazar', due:ago(6), done:{ by:'Mike Salazar', on:ago(7), note:'Claim filed; client credited', file:null } }; });
  fund(D, 'Rico Domingo', 'Shipping line local charges', 55000, 'Maersk Philippines', 'Verified', 18); fund(D, 'Jessa Aquino', 'Duties & taxes', 120000, 'Bureau of Customs', 'Verified', 15, 'cash');
  D.status = 'Completed'; D.completed = { by:'Lorna Bautista', on:ago(5) };
  chargesOf(D).push(party({ desc:'Extra storage days at the port', amount:8000, kind:CHARGE_KINDS[0], file:null, by:'Paolo Reyes', on:ago(4) }));
  D.handover = { readyBy:'Grace Tan', readyOn:ago(2) };
  logTo(D, 'Job completed', 'Confirmed by Lorna Bautista.'); logTo(D, 'Ready for Finance', 'Checklist complete.');
  notify({ roles:['Accounting'] }, 'Job '+D.id+' ('+tr.name+') is ready for Finance.', '#/jobs/'+D.id+'/billing');
  showToast('Sample data loaded: '+plural(customers.length,'customer')+', '+plural(INQUIRIES.length,'inquiry','inquiries')+' and '+plural(JOBS.length,'job')+'.', 'success', 'check'); render();
}
