/* ============================== EXCEPTIONS & DELIVERY (blueprint 5.6) ==============================
   Operations raises an exception against the CURRENT stage: category, reason, impact and optional evidence.
   A Manager approves it, assigning a corrective action (what, who, by when), or sends it back with a reason.
   While it waits for approval the job is ON HOLD; approval lifts the hold and the corrective action is tracked
   as a task until it is done. Exceptions raised by a delivery problem (damaged / short) never freeze the job.
   A job cannot close while any exception is unresolved. */
const EXC_CATEGORIES = ['Customs inspection or hold','Missing or wrong document','Permit or compliance','Cargo damage or loss','Shortage or overage','Carrier or port delay','Payment or funding','Other'];
const EXC_IMPACT = ['Delay','Extra cost','Cargo damage or loss','Customer affected','No impact yet'];
const EXC_TONE = { 'For approval':'warning', Returned:'warning', Approved:'info', Resolved:'success' };
const EXC_ICON = { 'For approval':'clock', Returned:'refresh', Approved:'flag', Resolved:'check' };
const EXC_LABEL = { 'For approval':'Waiting for approval', Returned:'Sent back', Approved:'Action in progress', Resolved:'Resolved' };
const DELIVERY_CONDITIONS = ['Good condition','Damaged','Incomplete (short)'];
const DELIVERY_STEPS = ['Delivered','Delivered to warehouse','Released to consignee'];

function excHeld(x){ return !!x.holds && ['For approval','Returned'].includes(x.status); }
function excActionOpen(x){ return x.status==='Approved' && !!x.action && !x.action.done; }
function excActionLate(x){ return excActionOpen(x) && daysUntil(x.action.due)<0; }
function openActions(j){ return j.issues.filter(excActionOpen); }
function unresolvedExc(j){ return j.issues.filter(x=>x.status!=='Resolved'); }
function isDeliveryStep(m){ return DELIVERY_STEPS.includes(m.name); }
function fmtTime(t){ const m = String(t||'').match(/^(\d{1,2}):(\d{2})$/); if(!m) return ''; const h = +m[1]; return ((h%12)||12)+':'+m[2]+' '+(h>=12?'PM':'AM'); }
function excOwners(j){ return [...new Set(j.ops.concat(usersWithRole('Manager').map(u=>u.name)))]; }

/* One place that creates an exception, whether Operations raised it or a delivery problem did. */
function raiseException(j, data){
  const x = Object.assign({ id:nextId('issue'), by:me(), on:todayDMY(), stage:stageText(j), holds:true, status:'For approval', review:null, action:null, evidence:null }, data);
  j.issues.push(x);
  logTo(j, 'Exception raised', x.category+' · '+x.reason+' (impact: '+x.impact+', stage: '+x.stage+').');
  notify({ roles:['Manager'], users:j.sales }, 'Exception on '+j.id+' ('+x.category+') needs approval'+(x.holds?': the job is on hold.':'.'), '#/jobs/'+j.id+'/issues');
  return x;
}

/* ---------- The Exceptions tab ---------- */
function jobExceptionsTab(j){
  const mine = can('job.issue', j) && j.status==='Active';
  const cards = j.issues.slice().reverse().map(x=>{
    const late = excActionLate(x);
    const review = x.review && (x.review.decision==='Approved' || x.status==='Returned') ? (x.review.decision==='Approved'
      ? '<div class="ds-alert ds-alert--info">'+icon('check')+'<div><strong>Approved by '+esc(x.review.by)+', '+esc(x.review.on)+'</strong>The hold is lifted. The corrective action below must be done before the job can close.</div></div>'
      : '<div class="ds-alert ds-alert--warning">'+icon('refresh')+'<div><strong>Sent back by '+esc(x.review.by)+', '+esc(x.review.on)+'</strong>'+esc(x.review.comment)+'</div></div>') : '';
    const action = x.action ? '<div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><div class="ds-row--between"><strong class="ds-strong">Corrective action</strong>'+(x.action.done ? pill('Done','success','check','ds-pill--sm') : late ? pill('Overdue by '+plural(-daysUntil(x.action.due),'day'),'danger','alert','ds-pill--sm') : pill('Due '+x.action.due,'info','clock','ds-pill--sm'))+'</div>'+
      '<p>'+esc(x.action.text)+'</p><p class="ds-muted ds-xs">Owner: '+esc(x.action.owner)+(x.action.done ? ' · done by '+esc(x.action.done.by)+', '+esc(x.action.done.on)+': '+esc(x.action.done.note) : '')+'</p>'+
      (x.action.done&&x.action.done.file ? fileRow(x.action.done.file,'Proof of the fix') : '')+
      (excActionOpen(x) && (can('exc.approve') || x.action.owner===me()) ? '<div><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openCompleteAction(\''+j.id+'\',\''+x.id+'\')">'+icon('check')+'Mark action done</button></div>' : '')+'</div></div>' : '';
    const buttons = (x.status==='For approval' && can('exc.approve') ? '<button class="ds-btn ds-btn--primary ds-btn--sm" onclick="openReviewException(\''+j.id+'\',\''+x.id+'\')">'+icon('eye')+'Review</button>' : '')+
      (x.status==='Returned' && mine ? '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="openFlagException(\''+j.id+'\',\''+x.id+'\')">'+icon('refresh')+'Edit &amp; resubmit</button>' : '');
    return '<article class="ds-panel" style="margin-bottom:var(--t1m-space-3)"><div class="ds-panel__body ds-stack--sm"><div class="ds-row--between"><strong class="ds-strong">'+esc(x.category)+'</strong><span class="ds-row ds-row--tight">'+(excHeld(x)?pill('Job on hold','danger','lock','ds-pill--sm'):'')+pill(EXC_LABEL[x.status], EXC_TONE[x.status], EXC_ICON[x.status])+'</span></div>'+
      '<p class="ds-muted ds-xs">Raised by '+esc(x.by)+' on '+esc(x.on)+' · stage: '+esc(x.stage)+' · impact: '+esc(x.impact)+'</p><p>'+esc(x.reason)+'</p>'+(x.evidence?fileRow(x.evidence,'Evidence from '+x.by):'')+review+action+(buttons?'<div class="ds-row">'+buttons+'</div>':'')+'</div></article>';
  }).join('');
  return '<div class="ds-row--between" style="margin-bottom:var(--t1m-space-4)"><p class="ds-muted ds-small" style="max-width:60ch">Anything that deviates from the plan: a red lane, a missing permit, a short or damaged delivery. Operations raises it against the current stage, a Manager approves how it will be handled, and the corrective action is tracked until it is done.</p>'+
    (mine && !openIssue(j) ? '<button class="ds-btn ds-btn--secondary" id="raise-exception" onclick="openFlagException(\''+j.id+'\')">'+icon('flag')+'Raise an exception</button>' : '')+'</div>'+
    (cards || emptyState('shield','No exceptions on this job','Everything has gone to plan so far.'));
}

/* ---------- Raise / resubmit ---------- */
function openFlagException(jobId, editId){
  const j = jobById(jobId), x = editId ? j.issues.find(y=>y.id===editId) : null;
  if(!can('job.issue', j)) return denied();
  openDrawer({ title: x ? 'Edit and resubmit the exception' : 'Raise an exception', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(x ? x.stage : stageText(j)),
    body:'<form class="ds-stack--sm" id="issue-form" novalidate onsubmit="event.preventDefault(); saveException(\''+jobId+'\', this, '+(x?'\''+x.id+'\'':'null')+')">'+
      (x && x.review ? '<div class="ds-alert ds-alert--warning">'+icon('refresh')+'<div><strong>Sent back by '+esc(x.review.by)+'</strong>'+esc(x.review.comment)+'</div></div>'
        : '<div class="ds-alert ds-alert--warning">'+icon('lock')+'<div><strong>This puts the job on hold</strong>Milestones freeze until a Manager approves how it will be handled.</div></div>')+
      '<div class="ds-field"><label for="ex-cat">Category</label>'+selectWrap('<select class="ds-select" id="ex-cat" name="category"><option value="">Select a category</option>'+options(EXC_CATEGORIES, x?x.category:'')+'</select>')+errorSlot('category')+'</div>'+
      '<div class="ds-field"><label for="is-reason">What is wrong?</label><textarea class="ds-textarea" id="is-reason" name="reason" placeholder="e.g. Red lane: physical inspection, FDA permit missing">'+esc(x?x.reason:'')+'</textarea>'+errorSlot('reason')+'</div>'+
      '<div class="ds-field"><label for="ex-impact">Impact</label>'+selectWrap('<select class="ds-select" id="ex-impact" name="impact"><option value="">Select the impact</option>'+options(EXC_IMPACT, x?x.impact:'')+'</select>')+errorSlot('impact')+'</div>'+
      '<div class="ds-field"><label>Evidence <span class="ds-opt">optional</span></label>'+uploadHtml('excEvidence','A photo, email or document that shows the problem')+'</div></form>',
    foot: drawerFoot(x?'Resubmit for approval':'Raise exception','issue-form',{icon:'flag', danger:!x}) });
}
function saveException(jobId, form, editId){
  const j = jobById(jobId), fd = new FormData(form), v = k=>String(fd.get(k)||'').trim(), x = editId ? j.issues.find(y=>y.id===editId) : null;
  if(fieldError(form,'category', v('category')?'':'Pick a category.') | fieldError(form,'reason', v('reason')?'':'Describe what is wrong.') | fieldError(form,'impact', v('impact')?'':'Pick the impact.')) return;
  if(!x && needConfirm('Raise this exception?', 'The job goes on hold until a Manager approves how it will be handled.', 'Raise exception', "saveException('"+jobId+"',document.getElementById('"+form.id+"'),null)", true)) return;
  if(x){
    Object.assign(x, { category:v('category'), reason:v('reason'), impact:v('impact'), evidence:UPLOADS.excEvidence||x.evidence, status:'For approval' });
    logTo(j, 'Exception raised', 'Resubmitted: '+x.category+' · '+x.reason+'.');
    notify({ roles:['Manager'] }, 'Exception on '+j.id+' was resubmitted for approval ('+x.category+').', '#/jobs/'+j.id+'/issues');
  } else raiseException(j, { category:v('category'), reason:v('reason'), impact:v('impact'), evidence:UPLOADS.excEvidence||null });
  closeDrawer(); STATE.justNext = j.id; showToast(x?'Resubmitted for approval.':'Exception raised. The job is on hold.', 'warning', 'flag'); render();
}

/* ---------- Manager: approve with a corrective action, or send back ---------- */
function openReviewException(jobId, id){
  const j = jobById(jobId), x = j.issues.find(y=>y.id===id);
  if(!can('exc.approve')) return denied('Only a Manager approves exceptions.');
  openDrawer({ title:'Review exception', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(custById(j.customerId).name),
    body:'<form class="ds-stack--sm" id="exc-form" novalidate onsubmit="event.preventDefault(); approveException(\''+jobId+'\',\''+id+'\', this)">'+
      '<dl class="ds-facts"><dt>Category</dt><dd>'+esc(x.category)+'</dd><dt>Stage</dt><dd>'+esc(x.stage)+'</dd><dt>Impact</dt><dd>'+esc(x.impact)+'</dd><dt>Raised by</dt><dd>'+esc(x.by+', '+x.on)+'</dd></dl>'+
      '<p>'+esc(x.reason)+'</p>'+(x.evidence?fileRow(x.evidence,'Evidence from '+x.by):'')+
      '<div class="ds-label" style="margin-top:var(--t1m-space-2)">Approve by assigning a corrective action</div>'+
      '<div class="ds-field"><label for="ca-text">What will be done to correct it?</label><textarea class="ds-textarea" id="ca-text" name="text" style="min-height:72px" placeholder="e.g. Get the FDA permit from the client and re-lodge the entry"></textarea>'+errorSlot('text')+'</div>'+
      '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="ca-owner">Owner</label>'+selectWrap('<select class="ds-select" id="ca-owner" name="owner">'+options(excOwners(j), x.by)+'</select>')+'</div>'+dateField('ca-due','due','Due by', addDaysDMY(3))+'</div></form>',
    foot:'<button type="button" class="ds-btn ds-btn--ghost" onclick="closeDrawer()">Close</button><button type="button" class="ds-btn ds-btn--secondary" onclick="openExceptionBack(\''+jobId+'\',\''+id+'\')">'+icon('refresh')+'Send back</button><button type="submit" form="exc-form" class="ds-btn ds-btn--primary" id="approve-exception">'+icon('check')+'Approve</button>' });
}
function approveException(jobId, id, form){
  const j = jobById(jobId), x = j.issues.find(y=>y.id===id), fd = new FormData(form), text = String(fd.get('text')||'').trim(), due = isoToDMY(fd.get('due'));
  if(fieldError(form,'text', text?'':'Say what will be done.') | fieldError(form,'due', !due?'Pick a due date.':daysUntil(due)<0?'The due date is already past.':'')) return;
  x.status = 'Approved'; x.review = { by:me(), on:todayDMY(), decision:'Approved', comment:null }; x.action = { text, owner:String(fd.get('owner')), due, done:null };
  logTo(j, 'Exception approved', x.category+': action “'+text+'” for '+x.action.owner+', due '+due+'.'+(x.holds?' The hold is lifted.':''));
  notify({ users:[x.action.owner, x.by] }, 'Exception on '+j.id+' was approved by '+me()+'. '+x.action.owner+' must: '+text+' (due '+due+').', '#/jobs/'+j.id+'/issues');
  closeDrawer(); STATE.justNext = j.id; showToast('Approved. '+(x.holds?'The job can move again.':'The action is assigned.'), 'success', 'check'); render();
}
function openExceptionBack(jobId, id){
  confirmAction('Send this exception back?', 'Operations gets your reason and can fix the details and resubmit. The job stays on hold.', 'Send back', "submitExceptionBack('"+jobId+"','"+id+"')", false,
    '<form class="ds-stack--sm" id="reject-form" novalidate onsubmit="event.preventDefault()"><div class="ds-field"><label for="rs-comment">What is missing or wrong?</label><textarea class="ds-textarea" id="rs-comment" name="comment" style="min-height:72px" placeholder="e.g. Attach the inspection notice first"></textarea>'+errorSlot('comment')+'</div></form>');
}
function submitExceptionBack(jobId, id){
  const form = document.getElementById('reject-form'), comment = String(new FormData(form).get('comment')||'').trim();
  if(fieldError(form,'comment', comment?'':'Say what to fix.')) return;
  const j = jobById(jobId), x = j.issues.find(y=>y.id===id);
  x.status = 'Returned'; x.review = { by:me(), on:todayDMY(), decision:'Returned', comment };
  logTo(j, 'Exception sent back', x.category+': '+comment);
  notify({ users:[x.by].concat(j.ops) }, 'Exception on '+j.id+' was sent back by '+me()+': '+comment, '#/jobs/'+j.id+'/issues');
  closeConfirm(); closeDrawer(); showToast('Sent back to '+x.by+'.', 'warning', 'refresh'); render();
}

/* ---------- The corrective action ---------- */
function openCompleteAction(jobId, id){
  const j = jobById(jobId), x = j.issues.find(y=>y.id===id);
  if(!(can('exc.approve') || x.action.owner===me())) return denied('Only '+x.action.owner+' or a Manager can mark this done.');
  openDrawer({ title:'Corrective action done', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(x.category),
    body:'<form class="ds-stack--sm" id="done-form" novalidate onsubmit="event.preventDefault(); saveCompleteAction(\''+jobId+'\',\''+id+'\', this)"><div class="ds-alert ds-alert--info">'+icon('flag')+'<div><strong>'+esc(x.action.text)+'</strong>Due '+esc(x.action.due)+'</div></div>'+
      '<div class="ds-field"><label for="cd-note">What was done?</label><textarea class="ds-textarea" id="cd-note" name="note"></textarea>'+errorSlot('note')+'</div>'+
      '<div class="ds-field"><label>Proof <span class="ds-opt">optional</span></label>'+uploadHtml('actionProof','A photo, email or document showing it is fixed')+'</div></form>',
    foot: drawerFoot('Mark done','done-form',{icon:'check'}) });
}
function saveCompleteAction(jobId, id, form){
  const note = String(new FormData(form).get('note')||'').trim();
  if(fieldError(form,'note', note?'':'Say what was done.')) return;
  const j = jobById(jobId), x = j.issues.find(y=>y.id===id);
  x.action.done = { by:me(), on:todayDMY(), note, file:UPLOADS.actionProof||null }; x.status = 'Resolved';
  logTo(j, 'Exception resolved', x.category+' → '+note);
  notify({ roles:['Manager'], users:[x.by] }, 'Exception on '+j.id+' ('+x.category+') is resolved: '+note, '#/jobs/'+j.id+'/issues');
  closeDrawer(); STATE.justNext = j.id; showToast('Resolved.', 'success', 'check'); render();
}

/* ---------- Delivery (blueprint: delivery confirmation, POD, damage or incomplete delivery) ---------- */
function deliveryFieldsHtml(){
  const d = new Date(), hh = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  return '<div class="ds-grid-2" style="gap:var(--t1m-space-3)"><div class="ds-field"><label for="dl-time">Time delivered</label><input class="ds-input" type="time" id="dl-time" name="time" value="'+hh+'">'+errorSlot('time')+'</div>'+
      '<div class="ds-field"><label for="dl-by">Received by</label><input class="ds-input" id="dl-by" name="receivedBy" placeholder="Who signed for it" autocomplete="off">'+errorSlot('receivedBy')+'</div></div>'+
    '<div class="ds-field"><span class="ds-field__label">Condition on delivery</span>'+segControl('condition', DELIVERY_CONDITIONS, DELIVERY_CONDITIONS[0], "document.getElementById('dl-problem').hidden = this.value===DELIVERY_CONDITIONS[0]")+'</div>'+
    '<div id="dl-problem" hidden class="ds-stack--sm"><div class="ds-alert ds-alert--warning">'+icon('alert')+'<div><strong>This raises an exception</strong>A Manager reviews it and assigns a corrective action. The job keeps moving.</div></div>'+
      '<div class="ds-field"><label for="dl-what">What happened?</label><textarea class="ds-textarea" id="dl-what" name="problem" style="min-height:64px" placeholder="e.g. 2 cartons crushed, 1 carton missing"></textarea>'+errorSlot('problem')+'</div>'+
      '<div class="ds-field"><label>Photo or document <span class="ds-opt">optional</span></label>'+uploadHtml('deliveryEvidence','Photo of the damage or the signed shortage note')+'</div></div>';
}
function deliveryPanel(j){
  const done = j.ms.filter(m=>isDeliveryStep(m) && m.done && m.delivery);
  if(!done.length) return '';
  return '<section class="ds-panel ds-panel--elevated" id="delivery-panel"><div class="ds-panel__head"><h3>'+icon('truck')+'Delivery</h3></div><div class="ds-panel__body ds-stack--sm">'+done.map(m=>{
    const d = m.delivery, ok = d.condition===DELIVERY_CONDITIONS[0];
    return '<div><div class="ds-row--between"><strong class="ds-strong">'+esc(m.name)+'</strong>'+pill(ok?'Complete':d.condition.split(' (')[0], ok?'success':'danger', ok?'check':'alert','ds-pill--sm')+'</div>'+
      '<p class="ds-muted ds-xs">'+esc(m.date+(d.time?' at '+fmtTime(d.time):'')+' · received by '+d.receivedBy)+'</p>'+(d.problem?'<p class="ds-small">'+esc(d.problem)+'</p>':'')+(m.file?'<p class="ds-muted ds-xs">Proof of delivery: <span class="ds-mono">'+esc(m.file)+'</span></p>':'')+'</div>'; }).join('')+'</div></section>';
}
