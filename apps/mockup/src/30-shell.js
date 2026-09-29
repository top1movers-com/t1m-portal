/* ============================== SIGN IN ============================== */
function msLogo(){ return '<div class="ds-msbtn__logo"><span></span><span></span><span></span><span></span></div>'; }
function renderLogin(){
  const features = [
    ['flag','Always a next step','Every job shows what must happen before it can move on, and who has to do it.'],
    ['clock','Fees seen before they start','Free storage and detention days count down on every job, so nobody is surprised by port charges.'],
    ['shield','Nothing moves without proof','Stages are gated by documents, proof of delivery and approvals, and every action is in the audit trail.']
  ].map(([ic,t,s])=>'<div class="ds-login__feature">'+icon(ic)+'<div><strong>'+t+'</strong><span>'+s+'</span></div></div>').join('');
  const flow = ['Inquiry','Quote','Job','Customs','Delivery','Finance'].map(s=>'<span>'+s+'</span>').join(icon('arrow-right'));
  return '<div class="ds-login">'+
    '<div class="ds-login__brandpane">'+
      '<img src="'+LOGO_SRC+'" alt="Top1Movers">'+
      '<h1 class="ds-login__tagline">Every shipment, from first inquiry to billed, in one record.</h1>'+
      '<div class="ds-login__flow" aria-label="The workflow">'+flow+'</div>'+
      '<div class="ds-login__features">'+features+'</div>'+
    '</div>'+
    '<div class="ds-login__formpane"><div class="ds-login__card ds-stack--sm">'+
      '<div><h2>Sign in</h2><p class="ds-muted">Top1Movers Operations Portal</p></div>'+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Mockup with sample data</strong>Sign-in is simulated and nothing is saved. Refresh the page to start over.</div></div>'+
      '<button type="button" class="ds-msbtn" id="ms-signin" onclick="openAcctPicker()">'+msLogo()+'Sign in with Microsoft</button>'+
      '<p class="ds-muted ds-xs" style="text-align:center">Your work account, single sign-on. No separate password.</p>'+
      '<hr class="ds-divider">'+
      '<div class="ds-row" style="justify-content:space-between">'+
        '<div><div class="ds-strong">Are you a customer?</div><div class="ds-muted ds-small">Track a shipment, no account needed.</div></div>'+
        '<a class="ds-btn ds-btn--secondary" id="track-link" href="#/track">'+icon('search')+'Track a shipment</a>'+
      '</div>'+
      '<hr class="ds-divider">'+
      '<button type="button" class="ds-btn ds-btn--ghost" style="width:100%" onclick="openDemoGuide()">'+icon('book')+'Presenting? Open the demo guide</button>'+
    '</div></div>'+
  '</div>';
}
function emailForUser(name){ return name.toLowerCase().replace(/[^a-z ]/g,'').trim().split(' ').join('.')+'@top1movers.example'; }
/* Stands in for Microsoft's "Pick an account" step: a handful of known accounts, never a directory. */
function openAcctPicker(){
  const rows = USERS.map(u=>'<button type="button" class="ds-acct-row" '+(u.active?'':'disabled aria-disabled="true" ')+'onclick="pickAccount(\''+esc(u.name)+'\')">'+
      avatar(u.name)+'<span class="ds-acct-row__main"><span class="ds-acct-row__name">'+esc(u.name)+'</span><span class="ds-acct-row__email">'+esc(emailForUser(u.name))+'</span></span>'+
      '<span class="ds-acct-row__role">'+esc(u.role+(u.active?'':' · Deactivated'))+'</span></button>').join('');
  const el = document.getElementById('acctPickerRoot');
  el.innerHTML = '<div class="ds-acct-picker" role="dialog" aria-modal="true" aria-label="Pick an account">'+
    '<div class="ds-acct-picker__head">'+msLogo()+'<h2>Pick an account</h2><p class="ds-muted ds-small">to continue to Top1Movers Operations Portal</p></div>'+
    '<div class="ds-acct-picker__list">'+rows+
      '<button type="button" class="ds-acct-row" onclick="showToast(\'This mockup only has the demo accounts above.\',\'info\',\'info\')"><span class="ds-acct-row__addicon">'+icon('plus')+'</span><span class="ds-acct-row__main"><span class="ds-acct-row__name">Use another account</span></span></button>'+
    '</div><div class="ds-acct-picker__foot">Demo only. Illustrative accounts, not a real directory.</div></div>';
  el.classList.add('open');
}
function closeAcctPicker(){ const el=document.getElementById('acctPickerRoot'); el.classList.remove('open'); el.innerHTML=''; }
function pickAccount(name){
  const u = userByName(name);
  if(!u || !u.active){ showToast('That account is deactivated. An Admin can switch it back on.', 'danger', 'alert'); return; }
  closeAcctPicker(); signInAs(name);
}
function signInAs(name, route){
  const u = userByName(name);
  CURRENT_USER = { name:u.name, role:u.role };
  go(route || '#/home');
}
function signOut(){ CURRENT_USER = null; go('#/login'); }

/* ============================== SHELL ============================== */
function navItem(key, label, ic, parts, count, alert_, desktopOnly){
  const cur = parts[0]===key;
  return '<button class="ds-nav__item'+(desktopOnly?' ds-nav__item--desktop':'')+'" aria-current="'+(cur?'page':'false')+'" onclick="go(\'#/'+key+'\')" title="'+esc(label)+'">'+
    icon(ic)+'<span data-text="'+esc(label)+'">'+esc(label)+'</span>'+(count!=null&&count!==0?'<em class="ds-nav__count'+(alert_?' ds-nav__count--alert':'')+'">'+count+'</em>':'')+'</button>';
}
function navShortLabel(full, short){ return window.innerWidth<=640 ? short : full; }
function renderShell(parts){
  const r = role();
  const myCount = homeQueueCount();
  const adminGroup = can('User & Role Mgmt') || can('Audit Trail');
  const reports = ['Manager','Admin','Finance'].includes(r);
  const openInq = INQUIRIES.filter(i=>['New','Quoted','Approved'].includes(inquiryStage(i).key)).length;
  return '<div class="ds-shell">'+
    '<aside class="ds-sidebar">'+
      '<div class="ds-sidebar__brand"><img src="'+LOGO_SRC+'" alt="Top1Movers"></div>'+
      '<nav class="ds-nav" aria-label="Main">'+
        '<div class="ds-nav__group">Work</div>'+
        navItem('home', navShortLabel(r==='Finance'?'Finance desk':(['Dispatcher','Warehouse Crew'].includes(r)?'My work':'Command center'),'Home'), 'home', parts, myCount, true)+
        (can('Shipment Job') ? navItem('jobs', navShortLabel(isCrew()?'My shipments':'Shipments','Shipments'), 'box', parts, JOBS.filter(j=>canSeeJob(j) && j.statusIndex<8).length) : '')+
        (can('Inquiry & Quotation') ? navItem('inquiries', navShortLabel('Inquiries & quotes','Sales'), 'quote', parts, openInq) : '')+
        (can('Customer Mgmt') ? navItem('customers', 'Customers', 'building', parts, null, false, reports) : '')+
        (reports ? '<div class="ds-nav__group">Insight</div>'+navItem('reports','Reports','chart',parts) : '')+
        (adminGroup ? '<div class="ds-nav__group">Admin</div>' : '')+
        (can('User & Role Mgmt') ? navItem('users','Users & roles','users',parts,null,false,true) : '')+
        (can('Audit Trail') ? navItem('audit','Audit trail','clock',parts,null,false,r!=='Finance') : '')+
      '</nav>'+
      '<div class="ds-sidebar__foot"><span class="ds-mockbadge">'+icon('info')+'Sample data · today is 28 Sep 2026</span></div>'+
    '</aside>'+
    '<header class="ds-topbar">'+
      '<a class="ds-topbar__brand" href="#/home" aria-label="Home"><img src="'+LOGO_SRC+'" alt="Top1Movers"></a>'+
      '<div class="ds-search">'+icon('search')+'<input class="ds-input" id="top-search" placeholder="Search job, container, BL, customer" readonly onclick="openCmdk()" onfocus="this.blur(); openCmdk()"><kbd class="ds-kbd">'+(navigator.platform.includes('Mac')?'⌘K':'Ctrl K')+'</kbd></div>'+
      '<div class="ds-topbar__spacer"></div>'+
      '<button class="ds-topbar-btn ds-topbar-btn--phone" onclick="openCmdk()" aria-label="Search">'+icon('search')+'</button>'+
      '<button class="ds-btn ds-btn--ghost ds-btn--sm" id="guide-btn" onclick="openDemoGuide()" title="Demo guide">'+icon('book')+'<span class="ds-hide-phone">Demo guide</span></button>'+
      notificationsButton()+
      '<div class="ds-topbar__who"><strong>'+esc(CURRENT_USER.name)+'</strong><span>'+esc(CURRENT_USER.role)+'</span></div>'+
      avatarMenuHtml()+
    '</header>'+
    '<main class="ds-content" id="main">'+pageFor(parts)+'</main>'+
  '</div>';
}
function avatarMenuHtml(){
  const others = USERS.filter(u=>u.active && u.name!==CURRENT_USER.name).map(u=>'<button class="ds-menu__action" onclick="switchPerson(\''+esc(u.name)+'\')">'+avatar(u.name,true)+'<span>'+esc(u.name)+' <span class="ds-muted3 ds-xs">'+esc(u.role)+'</span></span></button>').join('');
  const phoneLinks = (can('Customer Mgmt')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/customers\')">'+icon('building')+'Customers</button>':'')+
    (can('User & Role Mgmt')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/users\')">'+icon('users')+'Users &amp; roles</button>':'')+
    (can('Audit Trail')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/audit\')">'+icon('clock')+'Audit trail</button>':'');
  return '<div class="ds-menu-trigger" id="avatar-menu">'+
    '<button class="ds-avatar" style="background:'+avatarBg(CURRENT_USER.name)+'" onclick="toggleAvatarMenu(event)" aria-haspopup="true" aria-label="Account menu">'+icon('user')+'</button>'+
    '<div class="ds-menu ds-menu--right" style="min-width:260px;max-height:none">'+
      '<div class="ds-menu__header"><strong>'+esc(CURRENT_USER.name)+'</strong><span>'+esc(CURRENT_USER.role)+' · '+esc(ROLE_BLURB[CURRENT_USER.role])+'</span></div>'+
      phoneLinks+
      '<div class="ds-menu__group">Demo: switch person</div>'+others+
      '<div class="ds-menu__sep"></div>'+
      '<button class="ds-menu__action ds-menu__action--danger" onclick="signOut()">'+icon('log-out')+'Sign out</button>'+
    '</div></div>';
}
function toggleAvatarMenu(ev){
  ev.stopPropagation();
  const el = document.getElementById('avatar-menu');
  const opening = !el.hasAttribute('data-open');
  closeAvatarMenu();
  if(opening){ el.setAttribute('data-open',''); setTimeout(()=>document.addEventListener('click', avatarOutside), 0); }
}
function avatarOutside(e){ const el = document.getElementById('avatar-menu'); if(el && !el.contains(e.target)) closeAvatarMenu(); }
function closeAvatarMenu(){ const el=document.getElementById('avatar-menu'); if(el) el.removeAttribute('data-open'); document.removeEventListener('click', avatarOutside); }
function switchPerson(name){
  const u = userByName(name);
  CURRENT_USER = { name:u.name, role:u.role };
  showToast('Now signed in as '+u.name+' ('+u.role+').', 'info', 'user');
  const parts = (location.hash||'').replace(/^#\//,'').split('/');
  const section = parts[0];
  const allowed = { home:true, jobs:can('Shipment Job'), inquiries:can('Inquiry & Quotation'), customers:can('Customer Mgmt'), reports:['Manager','Admin','Finance'].includes(u.role), users:can('User & Role Mgmt'), audit:can('Audit Trail') };
  if(section==='jobs' && parts[1]){ const j = jobById(parts[1]); if(j && !canSeeJob(j)){ go('#/home'); return; } }
  if(!allowed[section]) go('#/home'); else render();
}
function accessDenied(what, detail){
  return '<div class="ds-panel ds-panel--elevated" id="access-denied">'+emptyState('lock', 'Not available for '+role(), (detail||what+' is not part of the '+role()+' role.')+' Menus a role cannot use are hidden, and typing the address does not get around it.',
    '<a class="ds-btn ds-btn--secondary" href="#/home">'+icon('home')+'Back to Home</a>')+'</div>';
}

/* ============================== NOTIFICATIONS ==============================
   Overdue tasks escalate by email to their owner. Here the bell shows the same list, and the drawer
   previews exactly what that email says (nothing is actually sent). */
function myAlerts(){
  const out = [];
  JOBS.filter(canSeeJob).forEach(j=>j.tasks.forEach(t=>{
    if(taskStatus(j,t)==='Overdue' && (isManagerLike() || t.owner===CURRENT_USER.name)) out.push({ j, t });
  }));
  return out;
}
function notificationsButton(){
  const n = myAlerts().length;
  return '<button class="ds-topbar-btn" id="bell" onclick="openNotifications()" aria-label="Notifications'+(n?', '+n+' overdue':'')+'">'+icon('bell')+(n?'<span class="ds-topbar-btn__dot">'+n+'</span>':'')+'</button>';
}
function openNotifications(){
  const list = myAlerts();
  if(!list.length){ openDrawer({ title:'Notifications', body: emptyState('check','Nothing overdue','When a task passes its due date, its owner gets an email and it shows up here.') }); return; }
  const first = list[0];
  const c = custById(first.j.customerId);
  const late = -daysUntil(first.t.due);
  const body = '<div class="ds-stack--sm">'+
    '<p class="ds-muted ds-small">'+plural(list.length,'task')+' past due. Each owner was emailed automatically.</p>'+
    '<ul class="ds-queue ds-panel">'+list.map(({j,t},i)=>'<li class="ds-queue__item" data-tone="danger" style="--i:'+i+'"><span class="ds-queue__icon">'+icon('alert')+'</span><div><div class="ds-queue__title">'+esc(t.name)+'</div><div class="ds-queue__meta"><span class="ds-mono">'+j.id+'</span><span>'+esc(t.owner)+'</span><span class="ds-overdue">due '+shortDate(t.due)+'</span></div></div>'+
      '<div class="ds-queue__actions"><button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="closeDrawer(); goTab(\''+j.id+'\',\'tasks\')">Open</button></div></li>').join('')+'</ul>'+
    '<div class="ds-label" style="margin-top:var(--t1m-space-5)">The email '+esc(first.t.owner.split(' ')[0])+' received</div>'+
    '<div class="ds-email">'+
      '<div class="ds-email__head"><div><strong>From:</strong> Top1Movers Operations Portal &lt;no-reply@t1m-portal.example&gt;</div><div><strong>To:</strong> '+esc(emailForUser(first.t.owner))+'</div><div><strong>Subject:</strong> [Overdue] '+esc(first.t.name)+', '+first.j.id+' is '+plural(late,'day')+' late</div></div>'+
      '<div class="ds-email__body ds-stack--sm"><p>Hi '+esc(first.t.owner.split(' ')[0])+',</p><p>The task <strong>'+esc(first.t.name)+'</strong> on job <strong class="ds-mono">'+first.j.id+'</strong> for '+esc(c.name)+' was due <strong>'+esc(first.t.due)+'</strong>.</p>'+
      '<p>Please complete it or ask your manager to reassign it, so customs clearance is not delayed.</p><p class="ds-muted ds-xs">Illustration only. No email is sent from this mockup.</p></div>'+
    '</div></div>';
  openDrawer({ title:'Notifications', sub:'Overdue escalations', body });
}

/* ============================== DEMO GUIDE ==============================
   For whoever is presenting: each scenario from the Scenario Manual, one click to start it as the
   right person on the right screen. Data persists between scenarios until the page is refreshed. */
const SCENARIOS = [
  { title:'A new customer asks for a quote', who:'Ana Cruz', role:'Dispatcher', route:'#/customers', text:'Customer, inquiry, quotation, client approval and a new job, typed once.' },
  { title:'Keep the paperwork moving', who:'Ana Cruz', role:'Dispatcher', route:'#/jobs/SJ-2026-00095', text:'The gate lists what stops the job. Review, reject, upload, then move it on.' },
  { title:'Customs trouble', who:'Grace Tan', role:'Manager', route:'#/home', text:'A Red-lane inspection and an HS-code exception, both decided from Home.' },
  { title:'Delivery day (try it on a phone)', who:'Ben Santos', role:'Warehouse Crew', route:'#/home', text:'Confirm a delivery with receiver and proof, then return the empty container.' },
  { title:'Whose money is it?', who:'Grace Tan', role:'Manager', route:'#/jobs/SJ-2026-00120', text:'A duty is due but client funds fall short. Record the deposit, pay, move on.' },
  { title:'Hand over to Finance', who:'Grace Tan', role:'Manager', route:'#/jobs/SJ-2026-00070', text:'Decide a surprise storage fee, finish the checklist, mark ready for Finance.' },
  { title:'Finance reads the result', who:'Paolo Reyes', role:'Finance', route:'#/home', text:'Read-only desk: what is waiting, refunds due, balances to bill, the Billing Summary.' },
  { title:'People come and go', who:'Mark Villar', role:'Admin', route:'#/users', text:'Add a person, switch a leaver off and hand their open work to a colleague.' },
  { title:'What the customer sees', who:null, role:'Customer, no account', route:'#/track/SJ-2026-00065', text:'Plain words, a timeline, and only what the customer needs.' }
];
function openDemoGuide(){
  const rows = SCENARIOS.map((s,i)=>'<li class="ds-scenario"><span class="ds-scenario__n">'+(i+1)+'</span><div><div class="ds-scenario__title">'+esc(s.title)+'</div><div class="ds-scenario__who">'+esc(s.who ? s.who+' · '+s.role : s.role)+'</div><div class="ds-muted ds-xs" style="margin-top:2px">'+esc(s.text)+'</div></div>'+
    '<button class="ds-btn ds-btn--secondary ds-btn--sm" onclick="startScenario('+i+')">'+icon('play')+'Start</button></li>').join('');
  openDrawer({ title:'Demo guide', sub:'Scenarios from the Scenario Manual. Each one signs in as the right person and opens the right screen.',
    body:'<div class="ds-stack--sm"><ol class="ds-scenarios">'+rows+'</ol>'+
      '<div class="ds-alert ds-alert--info">'+icon('info')+'<div><strong>Changes carry over</strong>Scenarios build on each other. Reset whenever you want the original sample data back.</div></div></div>',
    foot:'<button class="ds-btn ds-btn--ghost" onclick="resetDemo()">'+icon('refresh')+'Reset demo data</button><button class="ds-btn ds-btn--primary" onclick="closeDrawer()">Close</button>' });
}
function startScenario(i){
  const s = SCENARIOS[i];
  closeDrawer();
  if(!s.who){ CURRENT_USER = null; go(s.route); return; }
  const u = userByName(s.who);
  if(!u.active){ showToast(s.who+' is deactivated in this session. Reset demo data first.', 'danger', 'alert'); return; }
  signInAs(s.who, s.route);
  showToast('Scenario '+(i+1)+': signed in as '+s.who+' ('+u.role+').', 'info', 'play');
}
function resetDemo(){ location.hash = '#/login'; location.reload(); }

/* ============================== PAGE ROUTER ============================== */
function pageFor(parts){
  const [section, id, sub] = parts;
  switch(section){
    case 'home': return renderHome();
    case 'jobs':
      if(!can('Shipment Job')) return accessDenied('Shipments');
      if(id && sub==='billing-summary') return renderBillingSummaryPage(id);
      return id ? renderJob(id, sub) : renderJobsList();
    case 'inquiries': return can('Inquiry & Quotation') ? (id ? renderInquiry(id) : renderInquiries()) : accessDenied('Inquiries & quotes');
    case 'customers': return can('Customer Mgmt') ? (id ? renderCustomer(id) : renderCustomers()) : accessDenied('Customers');
    case 'reports': return ['Manager','Admin','Finance'].includes(role()) ? renderReports() : accessDenied('Reports', isDispatcher() ? 'Your Home page already shows your own customers’ figures.' : null);
    case 'users': return can('User & Role Mgmt') ? renderUsers() : accessDenied('Users & roles');
    case 'audit': return can('Audit Trail') ? renderAudit() : accessDenied('Audit trail');
    default: return renderHome();
  }
}
