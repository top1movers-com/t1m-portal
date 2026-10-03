/* ============================== CUSTOMER INQUIRY PORTAL (public, no sign-in) ==============================
   #/inquire. A client describes what they need; it lands in the same INTAKE queue as staff reports, so the
   Manager sees it on the dashboard and creates the real inquiry (customer, scope, services, staff). */
const seg = (...a)=>segControl(...a).replace('class="ds-seg"','class="ds-seg ds-seg--slide" style="--n:'+a[1].length+'"');
const svcGrid = h=>h.replace('class="ds-stack--sm"','class="ds-grid-2" style="gap:var(--t1m-space-3)"');
function portalServices(){
  const f = document.getElementById('portal-form'); if(!f) return;
  const fd = new FormData(f), scope = fd.get('scope'), dir = scope==='International' ? fd.get('direction') : null;
  document.getElementById('portal-dir').style.display = scope==='International' ? '' : 'none';
  document.getElementById('portal-services').innerHTML = svcGrid(checkList('services', SERVICE_ORDER.filter(k=>serviceAllowed(k, scope, dir)).map(k=>({ value:k, label:SERVICES[k].label })), fd.getAll('services')));
}
function renderInquirePage(sub, ref){
  if(sub==='sent'){
    const t = INTAKE.find(x=>x.id===ref);
    if(!t) return renderInquirePage();
    return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><p class="ds-label">Inquiry received</p><h1 class="ds-public__status">Thank you, we have your request</h1><p class="ds-public__meta">A Top1Movers coordinator will review it and reach out with a quotation.</p></div>','Send an inquiry')+
      '<div class="ds-public__body"><div class="ds-panel"><div class="ds-panel__body ds-stack--sm"><div><span class="ds-label">Your reference</span><div class="ds-mono ds-strong" id="portal-ref">'+esc(t.id)+'</div></div>'+
      '<p class="ds-muted ds-small">Quote this reference if you contact us about this request.</p>'+
      '<div class="ds-row" style="flex-wrap:wrap"><a class="ds-btn ds-btn--primary" href="#/inquire">'+icon('plus')+'Send another inquiry</a><a class="ds-btn ds-btn--secondary" href="#/track">'+icon('search')+'Track a shipment</a></div></div></div></div></div>';
  }
  const fld = (id, name, label, ph, type, opt)=>'<div class="ds-field"><label for="'+id+'">'+label+(opt?' <span class="ds-opt">optional</span>':'')+'</label><input class="ds-input" id="'+id+'" name="'+name+'" type="'+(type||'text')+'" placeholder="'+esc(ph||'')+'">'+errorSlot(name)+'</div>';
  const two = (x, y)=>'<div class="ds-grid-2" style="gap:var(--t1m-space-3)">'+x+y+'</div>';
  return '<div class="ds-public">'+trackHero('<div class="ds-public__headline"><p class="ds-label">Customer inquiry</p><h1 class="ds-public__status">What do you need moved?</h1><p class="ds-public__meta">Tell us about your shipment or transaction. No account needed.</p></div>','Send an inquiry')+
    '<div class="ds-public__body"><form class="ds-stack--sm" id="portal-form" novalidate onsubmit="event.preventDefault(); submitPortalInquiry(this)">'+
      '<div class="ds-panel"><div class="ds-panel__head"><h2>About you</h2></div><div class="ds-panel__body ds-stack--sm">'+
        two(fld('pi-name','name','Your name','Full name'), fld('pi-company','company','Company','Sample Trading Co.'))+
        two(fld('pi-email','email','Email','name@company.example','email'), fld('pi-phone','phone','Mobile number','09XX XXX XXXX','tel'))+'</div></div>'+
      '<div class="ds-panel"><div class="ds-panel__head"><h2>What you need</h2></div><div class="ds-panel__body ds-stack--sm">'+
        '<div class="ds-field"><span class="ds-field__label">Shipment type</span>'+seg('scope', SCOPES, 'International', 'portalServices()')+'</div>'+
        '<div class="ds-field" id="portal-dir"><span class="ds-field__label">Direction</span>'+seg('direction', DIRECTIONS, 'Import', 'portalServices()')+'</div>'+
        '<div class="ds-field"><span class="ds-field__label">Services (pick any)</span><div id="portal-services">'+svcGrid(checkList('services', SERVICE_ORDER.map(k=>({ value:k, label:SERVICES[k].label })), []))+'</div>'+errorSlot('services')+'</div>'+
        two(fld('pi-from','origin','From','e.g. Yokohama, JP',null,true), fld('pi-to','destination','To','e.g. Quezon City, PH',null,true))+
        '<div class="ds-field"><label for="pi-note">Describe your cargo or request</label><textarea class="ds-textarea" id="pi-note" name="note" placeholder="What are you shipping, how much, and when do you need it?"></textarea>'+errorSlot('note')+'</div>'+
        '<div class="ds-field"><label>Supporting document <span class="ds-opt">optional</span></label>'+uploadHtml('portalFile','Packing list, invoice or anything that helps')+'</div></div></div>'+
      '<button class="ds-btn ds-btn--primary" type="submit">'+icon('arrow-right')+'Send inquiry</button>'+
      '<p class="ds-small" style="text-align:center"><a href="#/track">Track a shipment</a> · <a href="#/login">Top1Movers staff sign in</a></p></form></div></div>';
}
function submitPortalInquiry(form){
  const fd = new FormData(form), g = k=>String(fd.get(k)||'').trim(), services = fd.getAll('services');
  const email = g('email'), phone = g('phone');
  if(fieldError(form,'name', g('name')?'':'Tell us your name.') | fieldError(form,'company', g('company')?'':'Tell us your company.') |
     fieldError(form,'email', /^\S+@\S+\.\S+$/.test(email)?'':'Enter a valid email address.') | fieldError(form,'phone', phone?'':'Enter a mobile number we can reach.') |
     fieldError(form,'services', services.length?'':'Pick at least one service.') | fieldError(form,'note', g('note')?'':'Describe what you need.')) return;
  const scope = fd.get('scope')==='International' ? 'International '+fd.get('direction') : 'Domestic';
  const note = [g('note'), 'Type: '+scope, 'Services: '+servicesText(services), g('origin')||g('destination') ? 'Route: '+(g('origin')||'?')+' to '+(g('destination')||'?') : '', 'Contact: '+g('name')+' · '+email+' · '+phone].filter(Boolean).join('\n');
  const t = { id:nextId('intake'), by:'Customer portal', on:nowStamp(), client:g('company'), note, file:UPLOADS.portalFile||null, status:'open', source:'portal' };
  INTAKE.push(t); delete UPLOADS.portalFile;
  notify({ roles:['Manager'] }, 'New customer inquiry from '+t.client+' (portal).', '#/home');
  go('#/inquire/sent/'+t.id);
}
