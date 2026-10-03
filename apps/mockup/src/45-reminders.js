/* ============================== DUE DATES, REMINDERS & ESCALATION (blueprint 5.4) ==============================
   Every step gets a due date (the previous step's date plus the days allowed). When the current step passes its
   date the owner is emailed; after SETTINGS.escalateDays a Manager is emailed too. Quotes awaiting the client and
   unliquidated funds get reminders as well. This mockup sends no real mail: each "email" is saved so it can be
   read from the notification bell, and runEscalations() fires them from the dates on screen.
   A demo control in the avatar menu jumps the calendar ahead so a reviewer can watch a step go overdue. */
const STEP_DAYS = { 'Under evaluation':7, 'Approved':3, 'Departed origin port':3, 'Arrived at port':14, 'Arrived at destination port':7, 'D/O released':2, 'Duties paid':1, 'Gate pass':1, 'Delivered':1 };
let EMAILS = [];
function stepDays(m){ return STEP_DAYS[m.name] ?? SETTINGS.stepDays; }
function dueInfo(m){
  if(!m || m.done || !m.due) return null;
  const d = daysUntil(m.due);
  return { days:d, late:d<0, today:d===0, text: d<0 ? 'Overdue by '+plural(-d,'day') : d===0 ? 'Due today' : d===1 ? 'Due tomorrow' : 'Due '+shortDate(m.due) };
}
/* The job's current step, when it is past due and nothing (a hold, closing) explains the delay. */
function jobOverdue(j){
  if(j.status!=='Active' || openIssue(j)) return null;
  const m = currentMs(j), di = dueInfo(m);
  return di && di.late ? { m, days:-di.days } : null;
}
function dueTone(m){ const di = dueInfo(m); return di && di.late ? 'danger' : di && di.today ? 'warning' : 'info'; }
function dueSuffix(m){ const di = dueInfo(m); return di ? ' · '+di.text : ''; }
function overdueAlert(j, m){
  const di = dueInfo(m); if(!di || !(di.late || di.today)) return '';
  const mails = [m.esc1 ? 'the owner was emailed on '+m.esc1 : '', m.esc2 ? 'a Manager was emailed on '+m.esc2 : ''].filter(Boolean).join(' and ');
  return '<div class="ds-alert ds-alert--'+(di.late?'danger':'warning')+'">'+icon(di.late?'alert':'clock')+'<div><strong>'+esc(di.text)+': '+esc(m.name)+'</strong>'+(di.late ? 'It was due '+esc(m.due)+'.'+(mails?' Automatically, '+esc(mails)+'.':'') : 'It is due today.')+'</div></div>';
}
function dueCell(j, m, isCurrent){
  const di = dueInfo(m); if(!di) return '<span class="ds-muted3">—</span>';
  const edit = isCurrent && j.status==='Active' && (canWork(j, m.svc) || can('exc.approve'));
  return '<span class="'+(di.late?'ds-overdue':'ds-small')+'">'+(di.late?icon('alert')+' ':'')+esc(di.text)+'</span>'+(edit ? ' <button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="openDueDate(\''+j.id+'\','+j.ms.indexOf(m)+')">Change</button>' : '');
}
function openDueDate(jobId, k){
  const j = jobById(jobId), m = j.ms[k];
  if(!(canWork(j, m.svc) || can('exc.approve'))) return denied('Only the assigned Operations staff or a Manager change a due date.');
  openDrawer({ title:'Change the due date', sub:'<span class="ds-mono">'+j.id+'</span> · '+esc(m.name),
    body:'<form class="ds-stack--sm" id="due-form" novalidate onsubmit="event.preventDefault(); saveDueDate(\''+jobId+'\','+k+', this)">'+dateField('due-date','due','New due date', m.due)+
      '<div class="ds-field"><label for="due-why">Why? <span class="ds-opt">optional</span></label><input class="ds-input" id="due-why" name="why" placeholder="e.g. Vessel delayed by 3 days"></div></form>',
    foot: drawerFoot('Save','due-form',{icon:'calendar'}) });
}
function saveDueDate(jobId, k, form){
  const j = jobById(jobId), m = j.ms[k], fd = new FormData(form), due = isoToDMY(fd.get('due')), why = String(fd.get('why')||'').trim();
  if(fieldError(form,'due', !due?'Pick the new date.':daysUntil(due)<0?'The new date cannot be in the past.':'')) return;
  logTo(j, 'Due date changed', m.name+': '+(m.due||'none')+' → '+due+(why?' ('+why+')':'')+'.');
  m.due = due; m.esc1 = null; m.esc2 = null;
  closeDrawer(); showToast('Due date changed to '+due+'.', 'success', 'calendar'); render();
}

/* ---------- the "emails" ---------- */
function sendEmail(toUsers, subject, lines, link, kind){
  const to = [...new Set(toUsers)].filter(Boolean); if(!to.length) return;
  const e = { id:nextId('email'), ts:nowStamp(), to, subject, lines, link, kind };
  EMAILS.unshift(e);
  NOTIFS.unshift({ id:nextId('notif'), ts:e.ts, to:{ roles:[], users:to }, text:subject, link, readBy:[], email:e.id });
}
function logSystem(rec, action, detail){ rec.log.push({ ts:nowStamp(), actor:'System (automatic email)', action, detail, ref:null }); }
function openEmail(id){
  const e = EMAILS.find(x=>x.id===id); if(!e) return;
  openDrawer({ title:'Automatic email', sub:'Shown here because this mockup does not send real mail.',
    body:'<div class="ds-email"><div class="ds-email__head"><span><strong>To:</strong> '+esc(e.to.map(emailForUser).join(', '))+'</span><span><strong>Subject:</strong> '+esc(e.subject)+'</span><span><strong>Sent:</strong> '+esc(e.ts)+'</span></div>'+
      '<div class="ds-email__body ds-stack--sm">'+e.lines.map(l=>'<p>'+esc(l)+'</p>').join('')+'<p><a class="ds-link" href="'+esc(e.link)+'" onclick="closeDrawer()">Open it in the portal</a></p><p class="ds-muted ds-xs">Top1Movers Operations Portal</p></div></div>',
    foot:'<button type="button" class="ds-btn ds-btn--primary" onclick="closeDrawer()">Close</button>' });
}

/* Called on every screen draw; safe to repeat because each reminder remembers when it was sent. */
function runEscalations(){
  const mgrs = usersWithRole('Manager').map(u=>u.name), acct = usersWithRole('Accounting').map(u=>u.name), limit = SETTINGS.escalateDays;
  JOBS.forEach(j=>{
    const href = '#/jobs/'+j.id, who = cname(j.customerId)+' · '+j.id, od = jobOverdue(j);
    if(od){
      const m = od.m, owners = opsFor(j, m.svc);
      if(!m.esc1){ m.esc1 = todayDMY(); sendEmail(owners, 'Overdue: “'+m.name+'” on '+j.id, [who, '“'+m.name+'” was due '+m.due+' and is now '+plural(od.days,'day')+' overdue.', 'Please finish it, or change the due date if the plan has moved.'], href, 'overdue'); logSystem(j, 'Reminder emailed', owners.join(', ')+' were emailed: “'+m.name+'” is overdue by '+plural(od.days,'day')+'.'); }
      if(od.days>=limit && !m.esc2){ m.esc2 = todayDMY(); sendEmail(mgrs, 'Escalation: “'+m.name+'” on '+j.id+' is '+plural(od.days,'day')+' overdue', [who, '“'+m.name+'” was due '+m.due+'. Owner: '+owners.join(', ')+'.', 'The owner was reminded '+m.esc1+' and has not finished it.'], href, 'escalation'); logSystem(j, 'Escalation emailed', 'Managers were emailed: “'+m.name+'” is '+plural(od.days,'day')+' overdue (owner: '+owners.join(', ')+').'); }
    }
    j.issues.filter(excActionLate).forEach(x=>{
      const days = -daysUntil(x.action.due);
      if(!x.esc1){ x.esc1 = todayDMY(); sendEmail([x.action.owner], 'Overdue corrective action on '+j.id, [who, x.category+': '+x.action.text, 'It was due '+x.action.due+' and is '+plural(days,'day')+' overdue.'], href+'/issues', 'overdue'); logSystem(j, 'Reminder emailed', x.action.owner+' was emailed: the corrective action for “'+x.category+'” is overdue.'); }
      if(days>=limit && !x.esc2){ x.esc2 = todayDMY(); sendEmail(mgrs, 'Escalation: corrective action on '+j.id+' is '+plural(days,'day')+' overdue', [who, x.category+': '+x.action.text, 'Owner: '+x.action.owner+'.'], href+'/issues', 'escalation'); logSystem(j, 'Escalation emailed', 'Managers were emailed: a corrective action is '+plural(days,'day')+' overdue.'); }
    });
    j.funds.filter(frLate).forEach(f=>{
      if(!f.esc1){ f.esc1 = todayDMY(); sendEmail([f.by].concat(acct), 'Receipts overdue for '+f.id+' ('+money(f.amount)+')', [who, money(f.amount)+' for '+f.purpose+' was released '+f.release.on+' and the receipts are '+plural(frDaysOut(f),'day')+' late.', 'Please submit them.'], href+'/money', 'receipts'); logSystem(j, 'Reminder emailed', f.by+' and Accounting were emailed: receipts for '+f.id+' are overdue.'); }
    });
  });
  INQUIRIES.forEach(i=>{
    if(inqStatus(i).key!=='awaiting') return;
    const v = latestV(i), d = awaitingDays(i);
    if(d>=SETTINGS.reminderEveryDays && (!v.lastReminder || daysBetween(v.lastReminder, todayDMY())>=SETTINGS.reminderEveryDays)){
      v.lastReminder = todayDMY();
      sendEmail(i.staff, 'Follow up: '+cname(i.customerId)+' has not answered '+quoteNo(i), [cname(i.customerId)+' · '+i.id, quoteNo(i)+' v'+v.v+' was sent '+v.sent.on+' and has had no answer for '+plural(d,'day')+'.', 'Please follow up and record their answer.'], '#/inquiries/'+i.id, 'reminder');
      logSystem(i, 'Reminder emailed', i.staff.join(', ')+' were emailed: no answer to v'+v.v+' after '+plural(d,'day')+'.');
    }
  });
}

/* ---------- demo only: move the calendar so overdue items can be shown ---------- */
function demoJump(n){
  TODAY = n===0 ? new Date(REAL_TODAY) : new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()+n);
  closeAvatarMenu(); showToast('Demo date is now '+todayDMY()+'.', 'info', 'calendar'); render();
}
