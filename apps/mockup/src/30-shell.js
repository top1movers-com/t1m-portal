/* ============================== SIGN IN ==============================
   Microsoft single sign-on. Clicking the button opens a stand-in for Microsoft's "Pick an account"
   step; a real build redirects to Microsoft and comes back with the person's work identity, so
   there are no passwords in the portal (Microsoft handles them). */
function msLogo(){ return '<div class="ds-msbtn__logo"><span></span><span></span><span></span><span></span></div>'; }
function renderLogin(){
  return '<div class="ds-login">'+
    '<div class="ds-login__brandpane">'+
      '<img src="'+LOGO_SRC+'" alt="Top1Movers">'+
      '<h1 class="ds-login__tagline">T1M Portal</h1>'+
      '<p class="ds-login__sub">Inquiries, jobs and deliveries, all in one place.</p>'+
      '<div class="ds-login__lines" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="ds-login__mark" aria-hidden="true">T1M</div>'+
      '<small class="ds-login__foot">Top1Movers Worldwide Inc.</small>'+
    '</div>'+
    '<div class="ds-login__formpane"><div class="ds-login__card ds-stack--sm">'+
      '<div><h2>Sign in</h2><p class="ds-muted">Top1Movers Operations Portal</p></div>'+
      '<button type="button" class="ds-msbtn" id="ms-signin" onclick="openAcctPicker()">'+msLogo()+'Sign in with Microsoft</button>'+
      '<p class="ds-muted ds-xs" style="text-align:center">Use your Top1Movers work account.</p>'+
      '<p class="ds-small" style="text-align:center">Are you a customer? <a href="#/inquire">Send an inquiry</a> · <a href="#/track">Track a shipment</a></p>'+
    '</div></div>'+
  '</div>';
}
/* Stands in for Microsoft's "Pick an account". The demo lists every seeded person (grouped by
   main role) so any role can be tried; a real chooser only lists accounts known to the device. */
function openAcctPicker(){
  const rows = ROLES.map(r=>{
    const people = USERS.filter(u=>u.roles[0]===r);
    if(!people.length) return '';
    return '<div class="ds-menu__group" style="padding:var(--t1m-space-2) var(--t1m-space-4)">'+esc(r)+'</div>'+people.map(u=>'<button type="button" class="ds-acct-row" '+(u.active?'':'disabled aria-disabled="true" ')+'onclick="pickAccount(\''+esc(u.name)+'\')">'+
      avatar(u.name)+'<span class="ds-acct-row__main"><span class="ds-acct-row__name">'+esc(u.name)+'</span><span class="ds-acct-row__email">'+esc(emailForUser(u.name))+'</span></span>'+
      '<span class="ds-acct-row__role">'+esc(rolesText(u)+(u.active?'':' · Deactivated'))+'</span></button>').join('');
  }).join('');
  const el = document.getElementById('acctPickerRoot');
  el.innerHTML = '<div class="ds-acct-picker" role="dialog" aria-modal="true" aria-label="Pick an account">'+
    '<div class="ds-acct-picker__head">'+msLogo()+'<h2>Pick an account</h2><p class="ds-muted ds-small">to continue to Top1Movers Operations Portal</p></div>'+
    '<div class="ds-acct-picker__list" style="max-height:60vh;overflow:auto">'+rows+
      '<button type="button" class="ds-acct-row" onclick="showToast(\'This mockup only has the demo accounts above.\',\'info\',\'info\')"><span class="ds-acct-row__addicon">'+icon('plus')+'</span><span class="ds-acct-row__main"><span class="ds-acct-row__name">Use another account</span></span></button>'+
    '</div><div class="ds-acct-picker__foot">Demo only. Illustrative accounts, not a real directory.</div></div>';
  el.classList.add('open');
}
function closeAcctPicker(){ const el = document.getElementById('acctPickerRoot'); el.classList.remove('open'); el.innerHTML=''; }
function pickAccount(name){
  const u = userByName(name);
  if(!u || !u.active){ showToast('That account is deactivated. An Admin can switch it back on.', 'danger', 'alert'); return; }
  closeAcctPicker(); signInAs(name);
}
function signInAs(name, route){ CURRENT_USER = userByName(name); adminLog('Signed in', name+' signed in with Microsoft.', name); go(route || '#/home'); }
function signOut(){ if(CURRENT_USER) adminLog('Signed out', CURRENT_USER.name+' signed out.', CURRENT_USER.name); CURRENT_USER = null; go('#/login'); }

/* ============================== SHELL ============================== */
function navItem(key, label, ic, parts, count, alert_, desktopOnly){
  const cur = parts[0]===key;
  return '<button class="ds-nav__item'+(desktopOnly?' ds-nav__item--desktop':'')+'" aria-current="'+(cur?'page':'false')+'" onclick="go(\'#/'+key+'\')" title="'+esc(label)+'">'+
    icon(ic)+'<span data-text="'+esc(label)+'">'+esc(label)+'</span>'+(count!=null&&count!==0?'<em class="ds-nav__count'+(alert_?' ds-nav__count--alert':'')+'">'+count+'</em>':'')+'</button>';
}
function navShortLabel(full, short){ return window.innerWidth<=640 ? short : full; }
function hasDash(){ return can('dash.view'); }
function hasMyWork(){ return can('mywork.view'); }
function renderShell(parts){
  const work = myWorkCount();
  const openInq = INQUIRIES.filter(i=>canView('inquiry.view', i) && OPEN_INQ.includes(inqStatus(i).key)).length;
  const activeJobs = JOBS.filter(j=>canView('job.view', j) && j.status!=='Completed').length;
  const adminGroup = can('users.manage') || can('perms.edit') || can('settings.edit') || can('audit.view');
  return '<div class="ds-shell">'+
    '<aside class="ds-sidebar">'+
      '<div class="ds-sidebar__brand"><img src="'+LOGO_SRC+'" alt="Top1Movers"></div>'+
      '<nav class="ds-nav" aria-label="Main">'+
        '<div class="ds-nav__group">Work</div>'+
        navItem('home', navShortLabel(hasDash()?'Dashboard':'My work','Home'), hasDash()?'dashboard':'home', parts, hasDash()?needsAttention().length:work, true)+
        (hasDash() && hasMyWork() ? navItem('mywork', navShortLabel('My work','My work'), 'tasks', parts, work, true) : '')+
        (canView('inquiry.view') ? navItem('inquiries', navShortLabel('Inquiries & quotes','Sales'), 'quote', parts, openInq) : '')+
        (canView('job.view') ? navItem('jobs', 'Jobs', 'box', parts, activeJobs) : '')+
        (canView('money.view') ? navItem('funds', 'Funds', 'wallet', parts, fundsWaitingCount()) : '')+
        (canView('customer.edit') ? navItem('customers', 'Customers', 'building', parts, null, false, true) : '')+
        (adminGroup ? '<div class="ds-nav__group">Admin</div>' : '')+
        (can('users.manage') || can('perms.edit') ? navItem('users','Users & roles','users',parts,null,false,true) : '')+
        (can('settings.edit') ? navItem('settings','Settings','settings',parts,null,false,true) : '')+
        (can('audit.view') ? navItem('audit','Audit log','clock',parts,null,false,true) : '')+
      '</nav>'+
    '</aside>'+
    '<header class="ds-topbar">'+
      '<a class="ds-topbar__brand" href="#/home" aria-label="Home"><img src="'+LOGO_SRC+'" alt="Top1Movers"></a>'+
      '<div class="ds-search">'+icon('search')+'<input class="ds-input" id="top-search" aria-label="Search" placeholder="Search job, inquiry, customer, BL" readonly onclick="openCmdk()" onfocus="this.blur(); openCmdk()"><kbd class="ds-kbd">'+(navigator.platform.includes('Mac')?'⌘K':'Ctrl K')+'</kbd></div>'+
      '<div class="ds-topbar__spacer"></div>'+
      '<button class="ds-topbar-btn ds-topbar-btn--phone" onclick="openCmdk()" aria-label="Search">'+icon('search')+'</button>'+
      (TODAY.getTime()!==REAL_TODAY.getTime() ? '<span class="ds-mockbadge" title="The calendar was moved ahead for the demo">'+icon('calendar')+'Demo date '+esc(shortDate(todayDMY()))+'</span>' : '')+
      notificationsButton()+
      '<div class="ds-topbar__who"><strong>'+esc(CURRENT_USER.name)+'</strong><span>'+esc(rolesText())+'</span></div>'+
      avatarMenuHtml()+
    '</header>'+
    '<main class="ds-content" id="main">'+pageFor(parts)+'</main>'+
  '</div>';
}
function avatarMenuHtml(){
  const phoneLinks = (canView('customer.edit')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/customers\')">'+icon('building')+'Customers</button>':'')+
    (can('users.manage')||can('perms.edit')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/users\')">'+icon('users')+'Users &amp; roles</button>':'')+
    (can('settings.edit')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/settings\')">'+icon('settings')+'Settings</button>':'')+
    (can('audit.view')?'<button class="ds-menu__action ds-show-phone" onclick="go(\'#/audit\')">'+icon('clock')+'Audit log</button>':'');
  return '<div class="ds-menu-trigger" id="avatar-menu">'+
    '<button class="ds-avatar" style="background:'+avatarBg(CURRENT_USER.name)+'" onclick="toggleAvatarMenu(event)" aria-haspopup="true" aria-label="Account menu">'+icon('user')+'</button>'+
    '<div class="ds-menu ds-menu--right" style="min-width:280px">'+
      '<div class="ds-menu__header"><strong>'+esc(CURRENT_USER.name)+'</strong><span>'+esc(rolesText())+'</span></div>'+
      phoneLinks+
      '<button class="ds-menu__action" onclick="closeAvatarMenu(); openAcctPicker()">'+icon('users')+'Switch person (demo)</button>'+
      (!CUSTOMERS.length && !INQUIRIES.length && !JOBS.length ? '<button class="ds-menu__action" onclick="closeAvatarMenu(); loadSampleData()">'+icon('download')+'Demo: load sample data</button>' : '')+
      '<div class="ds-menu__sep"></div>'+
      '<button class="ds-menu__action" onclick="demoJump(1)">'+icon('calendar')+'Demo: jump ahead 1 day</button>'+
      '<button class="ds-menu__action" onclick="demoJump(3)">'+icon('calendar')+'Demo: jump ahead 3 days</button>'+
      '<button class="ds-menu__action" onclick="demoJump(7)">'+icon('calendar')+'Demo: jump ahead 7 days</button>'+
      (TODAY.getTime()!==REAL_TODAY.getTime() ? '<button class="ds-menu__action" onclick="demoJump(0)">'+icon('refresh')+'Demo: back to today</button>' : '')+
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
function closeAvatarMenu(){ const el = document.getElementById('avatar-menu'); if(el) el.removeAttribute('data-open'); document.removeEventListener('click', avatarOutside); }
function accessDenied(what, detail){
  return '<div class="ds-panel ds-panel--elevated" id="access-denied">'+emptyState('lock', 'Not available for your role', (detail||what+' is not part of '+rolesText()+'.')+' Menus a role cannot use are hidden, and typing the address does not get around it.',
    '<a class="ds-btn ds-btn--secondary" href="#/home">'+icon('home')+'Back to Home</a>')+'</div>';
}

/* ============================== NOTIFICATIONS ==============================
   In-app bell. In the real build the same events also go out by email. */
function notificationsButton(){
  const n = unreadCount();
  return '<button class="ds-topbar-btn" id="bell" onclick="openNotifications()" aria-label="Notifications'+(n?', '+n+' unread':'')+'">'+icon('bell')+(n?'<span class="ds-topbar-btn__dot">'+n+'</span>':'')+'</button>';
}
function openNotifications(){
  const list = myNotifs();
  const body = list.length ? '<ul class="ds-queue ds-panel">'+list.map((n,i)=>{ const unread = !n.readBy.includes(me());
    return '<li class="ds-queue__item" data-tone="'+(unread?'brand':'')+'" style="--i:'+i+'"><span class="ds-queue__icon">'+icon(unread?'bell':'check')+'</span><div style="min-width:0;cursor:'+(n.link?'pointer':'default')+'"'+(n.link?' role="button" tabindex="0" onclick="openNotif(\''+n.id+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){ event.preventDefault(); openNotif(\''+n.id+'\'); }"':'')+'><div class="ds-queue__title">'+esc(n.text)+'</div><div class="ds-queue__meta"><span>'+esc(n.ts)+'</span>'+(n.email?'<span>Emailed</span>':'')+(unread?'<span class="ds-strong">New</span>':'')+(n.email?'<button class="ds-btn ds-btn--ghost ds-btn--sm" onclick="event.stopPropagation(); openEmail(\''+n.email+'\')">'+icon('file')+'View email</button>':'')+'</div></div>'+'</li>'; }).join('')+'</ul>'
    : emptyState('bell','No notifications','Assignments, approvals and client answers that involve you appear here.');
  openDrawer({ title:'Notifications', sub:'In-app now; also sent by email in the real build.', body,
    foot: list.length ? '<button class="ds-btn ds-btn--primary" onclick="closeDrawer()">Close</button>' : null });
  list.forEach(n=>{ if(!n.readBy.includes(me())) n.readBy.push(me()); });
  const bell = document.getElementById('bell'); if(bell) bell.outerHTML = notificationsButton();
}
function openNotif(id){ const n = NOTIFS.find(x=>x.id===id); if(!n || !n.link) return; closeDrawer(); go(n.link); }

/* ============================== PAGE ROUTER ============================== */
function pageFor(parts){
  const [section, id, sub] = parts;
  switch(section){
    case 'home': return hasDash() ? renderDashboard() : renderMyWork();
    case 'mywork': return hasMyWork() ? renderMyWork() : accessDenied('My work');
    case 'jobs': return canView('job.view') ? (id ? renderJob(id, sub) : renderJobsList()) : accessDenied('Jobs');
    case 'funds': return canView('money.view') ? renderFunds() : accessDenied('Funds');
    case 'inquiries': return canView('inquiry.view') ? (id ? renderInquiry(id) : renderInquiries()) : accessDenied('Inquiries & quotes');
    case 'customers': return canView('customer.edit') ? (id ? renderCustomer(id) : renderCustomers()) : accessDenied('Customers');
    case 'users': return can('users.manage') || can('perms.edit') ? renderUsers() : accessDenied('Users & roles');
    case 'settings': return can('settings.edit') ? renderSettings() : accessDenied('Settings');
    case 'audit': return can('audit.view') ? renderAudit() : accessDenied('Audit log');
    default: return hasDash() ? renderDashboard() : renderMyWork();
  }
}
