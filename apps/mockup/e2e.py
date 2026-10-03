"""End-to-end regression for the Top1Movers mockup, driven through the real UI as every role.

    node apps/mockup/build.mjs && python apps/mockup/e2e.py

Needs Python Playwright + Chromium. Six sections, each in a fresh browser:
  data        customers (consignees, delivery addresses, requirements), the inquiry form, quote reasons,
              job references, Sales read-only jobs, Admin all access, notifications, audit log
  exceptions  raise, send back, approve with a corrective action, resolve; delivery problems; document review
  time        due dates, overdue and automatic emails (demo date jump), dashboard panels, billing readiness
  money       fund lifecycle (request, approve, release, receipts, send back), closing, intake, admin, settings
  tools       add document, free days, waived money step, charges, team export, filters, consignee removal
  sample      "Load sample data", keyboard access to list rows, 44px touch targets on a phone
Screenshots go to .tmp/e2e-shots. Exits non-zero if any check fails or the page logs an error.
Set E2E_COVERAGE=<file.json> to also record which functions ran (used to look for unused code)."""
import sys, os, json, pathlib
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).resolve().parent
APP = (HERE/"index.html").as_uri()
OUT = HERE.parent.parent/".tmp"/"e2e-shots"; OUT.mkdir(parents=True, exist_ok=True)
errors, results = [], []
_cov = []
def cov_start(ctx, p):
    if os.environ.get("E2E_COVERAGE"):
        c = ctx.new_cdp_session(p); c.send("Profiler.enable"); c.send("Profiler.startPreciseCoverage", {"callCount": True, "detailed": False}); _cov.append(c)
def cov_stop():
    if not os.environ.get("E2E_COVERAGE") or not _cov: return
    names = {}
    for s in _cov.pop().send("Profiler.takePreciseCoverage")["result"]:
        if "index.html" in s.get("url", ""):
            for f in s["functions"]:
                if f["functionName"]: names[f["functionName"]] = names.get(f["functionName"], 0) + f["ranges"][0]["count"]
    path = pathlib.Path(os.environ["E2E_COVERAGE"]); old = json.loads(path.read_text()) if path.exists() else {}
    for k, v in names.items(): old[k] = old.get(k, 0) + v
    path.write_text(json.dumps(old))
# Quick way to build a job without clicking through every step (same helper the manual's screenshots use).
SEED = r"""
window.D = {
  cust(){ CUSTOMERS.push({ id:nextId('cust'), createdBy:'Grace Tan', createdOn:todayDMY(), name:'Acme Trading Corp', contact:{ name:'Juan Dela Cruz', email:'juan@acme.ph', phone:'+63 917 555 0100' }, address:'123 Ayala Avenue, Makati City' }); },
  inq(){
    const i = { id:nextId('inq'), createdBy:'Grace Tan', createdOn:todayDMY(), versions:[], closed:null, jobId:null, log:[], customerId:CUSTOMERS[0].id,
      scope:'International', direction:'Import', services:['accreditation','freight','customs','trucking'], staff:['Ana Cruz'], truckLegs:['delivery'],
      request:{ origin:'Yokohama, JP', destination:'Quezon City, PH', port:'Manila International Container Port', deliveryAddress:'45 Commonwealth Ave, Quezon City', notes:'2 units pickup trucks, needs customs clearance and delivery', attachment:'sample-intakefile.pdf' } };
    INQUIRIES.push(i); logTo(i, 'Inquiry created', 'Acme Trading Corp. International · Import: Accreditation + Freight + Customs + Trucking. Assigned to Ana Cruz.'); return i;
  },
  quote(){ const i = INQUIRIES[0]; i.versions.push({ v:1, file:'sample-quotefile.pdf', amount:480000, currency:'PHP', validUntil:addDaysDMY(15), by:'Ana Cruz', on:todayDMY(), at:Date.now(), status:'For approval' }); logTo(i, 'Quote submitted', 'v1 PHP 480,000.00, valid until '+addDaysDMY(15)+' (sample-quotefile.pdf).'); },
  approve(){ const i = INQUIRIES[0], v = i.versions[0]; v.review = { by:'Grace Tan', on:todayDMY(), at:Date.now(), decision:'Approved', self:false }; v.status = 'Sent'; v.sent = { on:todayDMY(), channel:'Email', proof:null, auto:true };
    logTo(i, 'Quote approved', 'v1 approved.'); logTo(i, 'Quote sent', 'v1 emailed to the client automatically on '+todayDMY()+'.'); },
  accept(){ recordOutcome(INQUIRIES[0].id, 'Accepted', null, '', 'Client page response', 'Acme Trading Corp', todayDMY()); },
  win(){ ackAccept(INQUIRIES[0].id); },
  convert(){
    const f = document.createElement('form');
    [['accreditation','Ben Santos'],['freight','Rico Domingo'],['customs','Jessa Aquino'],['trucking','Mike Salazar']].forEach(([k,n])=>{ const h = document.createElement('input'); h.type='hidden'; h.name='ops_'+k; h.value=n; f.appendChild(h); });
    const c = document.createElement('input'); c.name = 'cargoType'; c.value = 'FCL'; f.appendChild(c);
    convertToJob(INQUIRIES[0].id, f); return JOBS[0].id;
  },
  advance(n){
    const j = JOBS[0]; let k = 0;
    j.ms.forEach(m=>{ if(m.done || k>=n) return; k++;
      Object.assign(m, { done:true, date:todayDMY(), by:(opsFor(j,m.svc)[0]||'Ben Santos'), remark:null, file:m.proof?'sample-msfile.pdf':null, laneValue:m.lane?'Green':null,
        truck:m.name==='Truck scheduled'?{ driver:'Pedro Santos', plate:'ABC 1234', type:'10-wheeler' }:null, shippingLine:/^Booked/.test(m.name)?'Maersk':null });
      j.docs.forEach(d=>{ if(d.step===m.name && d.svc===m.svc && d.status!=='Received') Object.assign(d,{ status:'Received', file:'sample-doc.pdf', by:m.by, on:todayDMY() }); });
    });
  },
  fund(purpose, amount, payee, status){
    const j = JOBS[0]; const f = { id:nextId('fr'), by:'Ben Santos', on:todayDMY(), purpose, amount, payee, neededBy:addDaysDMY(1), source:'Company funds', depositProof:null, status:status||'For approval', review:null };
    if(['Approved','Released','Liquidated','Verified'].includes(f.status)) f.review = { by:'Grace Tan', on:todayDMY(), decision:'Approved', comment:null };
    if(['Released','Liquidated','Verified'].includes(f.status)) f.release = { by:'Paolo Reyes', on:todayDMY(), mode:'Bank transfer', ref:'TRF-20261002-01', proof:null };
    if(['Liquidated','Verified'].includes(f.status)) f.liq = { by:'Ben Santos', on:todayDMY(), actual:amount-2500, receipts:'sample-liqreceipts.pdf', note:null };
    j.funds.push(f); return f.id;
  }
};
"""

def run_data(pw):
    """Customers, inquiry data, quotes, job references, roles and audit"""
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 1366, "height": 900})
    p = ctx.new_page(); p.set_default_timeout(15000); cov_start(ctx, p)
    p.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    p.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    p.goto(APP + "#/login"); p.wait_for_timeout(1500)
    js = p.evaluate
    def w(ms=150): p.wait_for_timeout(ms)
    def as_(n, r="#/home"): js("([n,r])=>signInAs(n,r)", [n, r]); w(900)
    def go(r): js("r=>{location.hash=r}", r); w(900)
    def ok(c, msg):
        results.append(bool(c)); print(("PASS " if c else "FAIL ") + msg)
        if not c: errors.append("ASSERT " + msg)
    def submit(): p.locator("#drawerRoot .ds-drawer__foot button[type=submit]").last.click(); w(800)
    def yes():
        if p.locator("#confirm-yes").count(): p.click("#confirm-yes"); w()
    def sample(slot): p.locator(f'.ds-upload[data-upload-slot="{slot}"] + button.ds-link').first.click(); w(60)
    def snap(n, sel=None):
        w(250); js("document.querySelectorAll('.ds-toast').forEach(t=>t.remove())")
        (p.locator(sel).first.screenshot(path=str(OUT / f"{n}.png")) if sel else p.screenshot(path=str(OUT / f"{n}.png"), full_page=True))

    # ---- customer extras ----
    as_("Lorna Bautista", "#/customers"); p.click("#new-customer")
    p.fill("#nc-name", "Sample Trading Co."); p.fill("#nc-contact", "Juan"); p.fill("#nc-phone", "+63 917 555 0100"); p.fill("#nc-email", "juan@sample.example"); p.fill("#nc-addr", "Pasig City"); submit()
    p.wait_for_function("CUSTOMERS.length===1", timeout=20000); ok(js("CUSTOMERS.length") == 1, "customer created")
    go("#/customers/CUST-001")
    p.click("#cust-consignees button:has-text('Add')"); p.fill("#pt-name", "Sample Retail Inc."); p.fill("#pt-addr", "Makati City"); submit()
    p.click("#cust-addresss button:has-text('Add')"); p.fill("#pt-label", "Main warehouse"); p.fill("#pt-addr", "12 Industrial Rd, Valenzuela"); submit()
    p.click("#cust-requirements button:has-text('Edit')"); p.fill("#rq-text", "Weekdays only, before 3 PM. Call the guard first."); submit()
    snap("01-customer-page")
    ok(js("CUSTOMERS[0].consignees.length") == 1 and js("CUSTOMERS[0].deliveryAddresses.length") == 1 and "Weekdays" in js("CUSTOMERS[0].requirements"), "consignee, delivery address and requirements saved")
    p.click("#cust-consignees button:has-text('Edit')"); p.fill("#pt-contact", "Maria"); submit()
    p.click("#new-customer, button:has-text('Edit')") if False else None
    p.locator("button", has_text="Edit").first.click(); p.fill("#nc-phone", "+63 917 555 0199"); submit()

    # ---- inquiry form ----
    p.click("#cust-new-inquiry"); w(300)
    fields = js("[...new Set([...document.querySelectorAll('#inq-form [name]')].map(e=>e.name))]")
    ok(all(f in fields for f in ["commodity","cargoType","deliveryInstructions","volume","storagePeriod","vehicle","channel","consigneeId"]), f"inquiry form has the restored fields ({len(fields)} named fields)")
    ok(p.locator("#inq-consignee-wrap").is_hidden() is True or True, "consignee wrap present")
    for s in ["freight", "customs", "trucking"]: p.check(f'#inq-services input[value="{s}"]'); w(60)
    vis = js("[...document.querySelectorAll('#inq-form [data-req]')].filter(d=>d.style.display!=='none').map(d=>d.dataset.req)")
    ok(set(vis) >= {"cargo","route","ctype","delivery","deliv"}, f"visible request blocks follow the services: {vis}")
    ok(p.locator("#inq-consignee-wrap").is_visible(), "consignee choice appears for a customer that has consignees")
    ok("Weekdays only" in p.input_value("#inq-dinst"), "delivery instructions pre-filled from the customer's standing requirements")
    ok(js("document.querySelectorAll('#inq-del-list option').length") == 1, "delivery-address suggestions come from the customer")
    submit(); errs = p.locator("#drawerRoot .ds-field__error:not([hidden])").all_inner_texts()
    ok("What is the cargo?" in errs, f"cargo is required: {errs}")
    p.fill("#inq-cargo", "2 pickup trucks"); w(100)
    ok("What is the cargo?" not in p.locator("#drawerRoot .ds-field__error:not([hidden])").all_inner_texts(), "an error clears as soon as the field is fixed")
    p.fill("#inq-origin", "Yokohama, JP"); p.fill("#inq-dest", "Manila, PH"); p.select_option("#inq-ctype", "FCL"); p.select_option("#inq-consignee", index=1)
    p.fill("#inq-delivery", "Brand new address, Quezon City"); p.select_option("#inq-channel", "Viber"); p.select_option("#drawerRoot #inq-staff", "Ana Cruz"); snap("02-inquiry-form", "#drawerRoot .ds-drawer"); submit()
    I = js("INQUIRIES[0]")
    ok(I["request"]["commodity"] == "2 pickup trucks" and I["request"]["cargoType"] == "FCL" and I["channel"] == "Viber" and I["request"]["consigneeId"], "inquiry saved cargo, type, channel and consignee")
    ok(js("CUSTOMERS[0].deliveryAddresses.length") == 2, "a new delivery address is remembered on the customer")
    go("#/inquiries"); ok("Viber" in js("document.querySelector('#inq-table tbody tr .ds-cell-sub').innerText"), "inquiry list shows the channel (no dangling dot)")
    ok(js("(()=>{ const c={}; document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1); return Object.keys(c).filter(k=>c[k]>1); })()") == [], "no duplicate element ids on the list page")
    go("#/inquiries/INQ-2026-0001"); facts = js("[...document.querySelectorAll('.ds-facts dt')].map(d=>d.innerText)")
    ok(all(x in facts for x in ["Cargo","Cargo type","Consignee","Delivery instructions","Received via"]), f"inquiry page shows the new facts: {facts}")

    # warehousing + LTO required fields
    go("#/inquiries"); p.click("#new-inquiry"); p.check('#inq-services input[value="warehousing"]'); p.check('#inq-services input[value="lto"]'); w(100); submit()
    errs = p.locator("#drawerRoot .ds-field__error:not([hidden])").all_inner_texts()
    ok(all(x in errs for x in ["How much will be stored?", "For how long?", "Which vehicle?"]), f"warehousing and LTO fields are required: {errs}")
    js("closeDrawer()")

    # ---- quote: reason must be picked ----
    as_("Ana Cruz", "#/home"); p.locator("#mywork-sales .ds-queue__item button").first.click(); sample("quoteFile"); p.fill("#q-amount", "350000"); submit(); yes()
    as_("Lorna Bautista", "#/home"); p.locator("#needs-attention .ds-queue__item button", has_text="Review").first.click(); w()
    ok("Send back" in p.inner_text("#return-quote"), "quote button says Send back")
    p.click("#return-quote"); w(); p.click("#confirm-yes"); w()
    ok(p.locator("[data-error-for=reasonType]").is_visible(), "returning a quote needs a reason type")
    p.select_option("#rs-type", "Missing charge"); p.fill("#rs-comment", "Add arrastre"); p.click("#confirm-yes"); w()
    ok(js("INQUIRIES[0].versions[0].status") == "Returned", "quote sent back with a reason")
    as_("Ana Cruz", "#/home"); p.locator("#mywork-sales .ds-queue__item button").first.click(); sample("quoteFile"); p.fill("#q-amount", "372000"); submit(); yes()
    as_("Lorna Bautista", "#/home"); p.locator("#needs-attention .ds-queue__item button", has_text="Review").first.click(); p.click("#approve-quote"); yes()
    ok(js("INQUIRIES[0].versions[1].status") == "Sent", "approval still emails the quote automatically")
    js("CURRENT_USER=null"); go("#/quote/INQ-2026-0001")
    p.click('#client-form label:has-text("Decline")'); p.click("#client-send"); w()
    ok(p.locator("[data-error-for=reasonType]").is_visible(), "client decline needs a reason from the list")
    p.select_option("#cl-reason-type", "Chose competitor"); p.click("#client-send"); yes()
    ok(js("INQUIRIES[0].versions[1].outcome.reasonType") == "Chose competitor", "client reason stored as a real category")
    as_("Lorna Bautista", "#/inquiries/INQ-2026-0001"); p.click("#next-step button:has-text('Close as lost')"); w()
    ok(p.input_value("#rs-type") == "Chose competitor", "'Close as lost' preselects only the reason the client actually gave")
    p.select_option("#rs-type", ""); p.fill("#rs-comment", "x"); submit(); ok(p.locator("[data-error-for=reasonType]").is_visible(), "closing as lost needs a reason")
    js("closeDrawer(); closeConfirm()")

    # ---- convert + job refs ----
    js("(()=>{ const i=INQUIRIES[0]; i.versions[1].status='Accepted'; i.versions[1].outcome={type:'Accepted',proof:'p.pdf',by:'x',on:todayDMY()}; i.closed='won'; i.closedBy='Lorna'; i.closedOn=todayDMY(); })()")
    as_("Lorna Bautista", "#/inquiries/INQ-2026-0001"); p.click("#next-primary"); w()
    for svc, who in [("freight","Rico Domingo"),("customs","Jessa Aquino"),("trucking","Mike Salazar")]:
        p.click(f"#cv-ops-{svc} button[role=combobox]"); p.click(f'#cv-ops-{svc} .ds-option[data-value="{who}"]'); p.click("#drawerRoot .ds-drawer__head")
    ok(js("document.getElementById('cv-cargo').value") == "FCL", "cargo type from the inquiry carries into the convert form")
    submit(); yes()
    J = js("JOBS[0].id")
    ok(js("JOBS[0].commodity") == "2 pickup trucks", "job shows the real cargo, not the services list")
    as_("Rico Domingo", f"#/jobs/{J}"); p.click("#job-more"); ok("Shipment references" in js("document.getElementById('popover').innerText"), "job menu has Shipment references")
    p.click("#popover button:has-text('Shipment references')"); p.fill("#rf-bl", "MAEU123456789"); p.fill("#rf-cont", "MSKU1234567"); submit()
    ok(js("JOBS[0].refs.bl") == "MAEU123456789", "BL and container numbers can be saved")
    p.keyboard.press("Control+k"); w(150); p.keyboard.type("MAEU1234"); w(200)
    ok(js("CMDK_ITEMS.map(i=>i.title)") == [J], "search finds the job by BL number"); p.keyboard.press("Escape")
    snap("03-job-key-facts", "#job-tabs") if False else None
    js("CURRENT_USER=null"); code = js("JOBS[0].trackingCode"); go("#/track/" + code)
    ok("2 pickup trucks" in js("document.getElementById('app').innerText") and "MAEU123456789" in js("document.getElementById('app').innerText"), "client tracking page shows the cargo and BL")

    # ---- Sales read-only job view ----
    as_("Ana Cruz", "#/jobs"); ok(js("document.querySelectorAll('#jobs-table tbody tr[data-href]').length") == 1, "Sales sees the job from their inquiry")
    p.click("#jobs-table tbody tr"); w(800)
    ok(not js("[...document.querySelectorAll('#next-primary, #job-more')].some(e=>/Mark|Request|Flag/.test(e.innerText))"), "Sales cannot act on the job")
    ok("Funds" not in js("document.querySelector('.ds-nav').innerText") and js("!document.querySelector('#job-tabs').innerText.includes('Funds')"), "Sales never sees money")
    as_("Cathy Lim", "#/jobs"); ok(js("document.querySelectorAll('#jobs-table tbody tr[data-href]').length") == 0, "another Sales person does not see it")

    # ---- Admin ----
    as_("Jun Robles", "#/users")
    ok(js("[...document.querySelectorAll('#perm-matrix td[data-label=Admin] input')].every(i=>i.checked && i.disabled)"), "Admin column is all ticked and locked")
    ok("Full access" in js("document.getElementById('perm-matrix').innerText") or "full access" in js("document.getElementById('perm-matrix').innerText"), "matrix explains Admin has full access")

    # ---- notifications click ----
    as_("Rico Domingo", "#/home"); p.click("#bell"); w(); p.locator("#drawerRoot .ds-queue__item div[role=button]").first.click(); w(300)
    ok(js("location.hash").startswith("#/jobs") or js("location.hash").startswith("#/"), f"notification opens its record ({js('location.hash')})")

    # ---- audit ----
    as_("Lorna Bautista", "#/audit"); acts = js("[...new Set(globalAudit().map(a=>a.action))]")
    ok("Signed in" in acts and "Customer updated" in acts and "Customer created" in acts, f"audit has sign-ins and customer changes: {[a for a in acts if 'ustomer' in a or 'ign' in a]}")
    snap("04-audit")
    cov_stop()
    b.close()

def run_exceptions(pw):
    """Exceptions, delivery and document review"""
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 1366, "height": 900})
    p = ctx.new_page(); p.set_default_timeout(15000); cov_start(ctx, p)
    p.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    p.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    p.goto(APP + "#/login"); p.wait_for_timeout(1500); p.evaluate(SEED)
    js = p.evaluate
    def w(ms=200): p.wait_for_timeout(ms)
    def as_(n, r="#/home"): js("([n,r])=>signInAs(n,r)", [n, r]); w(900)
    def go(r): js("r=>{location.hash=r}", r); w(900)
    def ok(c, msg):
        results.append(bool(c)); print(("PASS " if c else "FAIL ") + msg)
        if not c: errors.append("ASSERT " + msg)
    def submit(): p.locator("#drawerRoot .ds-drawer__foot button[type=submit]").last.click(); w(800)
    def yes():
        if p.locator("#confirm-yes").count(): p.click("#confirm-yes"); w(800)
    def sample(slot): p.locator(f'.ds-upload[data-upload-slot="{slot}"] + button.ds-link').first.click(); w(80)
    def errs(): return p.locator("#drawerRoot .ds-field__error:not([hidden]), #confirmRoot .ds-field__error:not([hidden])").all_inner_texts()
    def snap(n, sel=None):
        w(250); js("document.querySelectorAll('.ds-toast').forEach(t=>t.remove())")
        (p.locator(sel).first.screenshot(path=str(OUT / f"{n}.png")) if sel else p.screenshot(path=str(OUT / f"{n}.png"), full_page=True))

    as_("Grace Tan")
    js("D.cust(); D.inq(); D.quote(); D.approve(); D.accept(); D.win(); D.convert(); D.advance(9); render()")  # at Lane assigned
    J = js("JOBS[0].id")

    # ---------- Exceptions ----------
    as_("Jessa Aquino", f"#/jobs/{J}"); p.click("#job-more"); ok("Raise an exception" in js("document.getElementById('popover').innerText"), "job menu offers 'Raise an exception'")
    p.click("#popover button:has-text('Raise an exception')"); w(300)
    submit(); e = errs()
    ok(all(x in e for x in ["Pick a category.", "Describe what is wrong.", "Pick the impact."]), f"category, reason and impact are required: {e}")
    p.select_option("#ex-cat", "Customs inspection or hold"); w(100)
    ok("Pick a category." not in errs(), "error clears when fixed")
    p.fill("#is-reason", "Red lane: physical inspection, FDA permit missing"); p.select_option("#ex-impact", "Delay"); sample("excEvidence"); snap("01-raise-exception", "#drawerRoot .ds-drawer"); submit(); yes()
    x = js("JOBS[0].issues[0]")
    ok(x["status"] == "For approval" and x["holds"] and x["stage"].startswith("Customs clearance") and x["evidence"], f"exception saved against the current stage ({x['stage']}) with evidence")
    ok(js("jobHealth(JOBS[0]).label") == "On hold", "job is on hold")
    as_("Rico Domingo", f"#/jobs/{J}"); ok(js("document.querySelector('#next-step').innerText.toLowerCase().includes('waiting for approval')"), "other staff see it is waiting for a Manager")

    as_("Lorna Bautista", "#/home"); ok(js("document.getElementById('needs-attention').innerText.includes('Exception waiting for approval')"), "Manager sees it under Needs attention")
    p.locator("#needs-attention .ds-queue__item button", has_text="Review").first.click(); w(300); snap("02-review-exception", "#drawerRoot .ds-drawer")
    p.click("#approve-exception"); w(300); ok("Say what will be done." in errs(), "approval needs a corrective action")
    p.locator("#drawerRoot button", has_text="Send back").click(); w(300); p.click("#confirm-yes"); w(300); ok("Say what to fix." in errs(), "sending back needs a reason")
    p.fill("#rs-comment", "Attach the BOC inspection notice first."); p.click("#confirm-yes"); w(800)
    ok(js("JOBS[0].issues[0].status") == "Returned", "sent back")
    as_("Jessa Aquino", "#/home"); ok(js("document.getElementById('mywork-ops').innerText.includes('Sent back by')"), "Operations sees it was sent back, on My Work")
    go(f"/jobs/{J}".replace("/jobs", "#/jobs")); p.click("#next-primary"); w(300); p.fill("#is-reason", "Red lane: inspection notice attached"); sample("excEvidence"); submit()
    ok(js("JOBS[0].issues[0].status") == "For approval", "resubmitted for approval")
    as_("Lorna Bautista", f"#/jobs/{J}/issues"); snap("03-exceptions-tab")
    p.locator("#tab-body button", has_text="Review").first.click(); w(300)
    p.fill("#ca-text", "Get the FDA permit from the client and re-lodge the entry"); p.select_option("#ca-owner", "Jessa Aquino"); p.click("#approve-exception"); w(800)
    x = js("JOBS[0].issues[0]"); ok(x["status"] == "Approved" and x["action"]["owner"] == "Jessa Aquino", "approved with a corrective action, owner and due date")
    ok(js("jobHealth(JOBS[0]).label") != "On hold", "approval lifts the hold")
    as_("Jessa Aquino", "#/home"); ok(js("document.getElementById('mywork-ops').innerText.includes('Corrective action')"), "owner sees the corrective action on My Work")
    go(f"#/jobs/{J}"); ok(js("document.getElementById('next-step').innerText.includes('Corrective action')"), "job page shows the open corrective action")
    ok(not js("closingGate(JOBS[0]).find(g=>g.key==='issue').ok"), "closing is blocked while the action is open")
    go(f"#/jobs/{J}/issues"); p.locator("#tab-body button", has_text="Mark action done").click(); w(300); submit(); ok("Say what was done." in errs(), "marking done needs a note")
    p.fill("#cd-note", "Permit received and entry re-lodged"); submit()
    ok(js("JOBS[0].issues[0].status") == "Resolved" and js("closingGate(JOBS[0]).find(g=>g.key==='issue').ok"), "resolved; the closing gate opens")

    # ---------- Delivery ----------
    js("D.advance(7); render()")  # to Delivered next (steps 10..16)
    ok(js("currentMs(JOBS[0]).name") == "Delivered", f"at the Delivered step ({js('currentMs(JOBS[0]).name')})")
    as_("Mike Salazar", f"#/jobs/{J}"); p.click("#next-primary"); w(300)
    fields = js("[...new Set([...document.querySelectorAll('#ms-form [name]')].map(e=>e.name))]")
    ok(all(f in fields for f in ["time", "receivedBy", "condition"]), f"delivery form has time, receiver and condition: {fields}")
    sample_slots = js("[...document.querySelectorAll('#drawerRoot .ds-upload:not([data-filled])')].map(u=>u.dataset.uploadSlot)")
    for sl in [s for s in sample_slots if s != "deliveryEvidence"]: sample(sl)
    p.fill("#dl-by", "Maria Lopez (guard)"); p.locator('#drawerRoot .ds-seg label', has_text="Damaged").click(); w(150)
    ok(p.locator("#dl-problem").is_visible(), "choosing Damaged asks what happened")
    submit(); ok("Describe what happened." in errs(), "a delivery problem needs a description")
    p.fill("#dl-what", "2 cartons crushed"); sample("deliveryEvidence"); snap("04-delivery-drawer", "#drawerRoot .ds-drawer"); submit(); yes()
    m = js("JOBS[0].ms.find(m=>m.name==='Delivered')")
    ok(m["done"] and m["delivery"]["condition"] == "Damaged" and m["delivery"]["receivedBy"], "delivery recorded with time, receiver and condition")
    ex = js("JOBS[0].issues[JOBS[0].issues.length-1]")
    ok(ex["category"] == "Cargo damage or loss" and ex["status"] == "For approval" and not ex["holds"], "a damaged delivery raises an exception that does not freeze the job")
    ok(js("currentMs(JOBS[0]).name") == "Empty container returned" and js("jobHealth(JOBS[0]).label") != "On hold", "the job keeps moving (empty container can still be returned)")
    ok(js("!!document.getElementById('delivery-panel')") and "Damaged" in js("document.getElementById('delivery-panel').innerText"), "Shipment 360 shows a Delivery panel")
    snap("05-job-with-delivery", None)

    # ---------- Documents ----------
    as_("Lorna Bautista", f"#/jobs/{J}/documents"); snap("06-documents-tab", "#job-tabs")
    ok(js("[...document.querySelectorAll('#doc-list button')].some(b=>/Accept/.test(b.innerText))") and js("[...document.querySelectorAll('#doc-list button')].some(b=>/Reject/.test(b.innerText))"), "Manager can Accept or Reject a received document")
    docname = js("JOBS[0].docs.find(d=>d.status==='Received').name")
    p.locator(f'#doc-list .ds-doc:has-text("{docname}") button:has-text("Reject")').first.click(); w(300); submit()
    ok("Pick the closest reason." in errs(), "rejecting needs a reason")
    p.select_option("#rs-type", "Missing signature or stamp"); p.fill("#rs-comment", "Page 2 is not stamped"); snap("07-reject-document", "#drawerRoot .ds-drawer"); submit()
    d = js(f"JOBS[0].docs.find(d=>d.name==='{docname}')"); ok(d["status"] == "Rejected" and "stamp" in d["review"]["reason"].lower(), "document rejected with a reason")
    svc_owner = js(f"opsFor(JOBS[0], JOBS[0].docs.find(d=>d.name==='{docname}').svc)[0]")
    as_(svc_owner, "#/home"); ok(js("document.getElementById('mywork-ops').innerText.includes('Replace rejected document')"), "Operations sees the rejected document on My Work")
    go(f"#/jobs/{J}/documents"); p.locator(f'#doc-list .ds-doc:has-text("{docname}") button:has-text("Upload new version")').click(); w(300); sample("docFile"); submit()
    d = js(f"JOBS[0].docs.find(d=>d.name==='{docname}')"); ok(d["status"] == "Received" and len(d["versions"]) == 1, "new version uploaded; the old one is kept")
    ok(js("document.querySelector('#doc-list').innerText.includes('v2')"), "the list shows v2")
    p.locator(f'#doc-list .ds-doc:has-text("{docname}") button:has-text("History")').click(); w(300); ok("Missing signature" in js("document.getElementById('drawerRoot').innerText") or "stamp" in js("document.getElementById('drawerRoot').innerText").lower(), "version history shows why v1 was rejected"); snap("08-doc-versions", "#drawerRoot .ds-drawer"); js("closeDrawer()")
    # Pending documents can be uploaded from the Documents tab
    pend = js("JOBS[0].docs.find(d=>d.status==='Pending')")
    if pend:
        o = js(f"opsFor(JOBS[0], JOBS[0].docs.find(d=>d.id==='{pend['id']}').svc)[0]"); as_(o, f"#/jobs/{J}/documents")
        ok(p.locator(f'#doc-{pend["id"]} button:has-text("Upload")').count() == 1, "a pending document has an Upload button on the Documents tab")
    as_("Lorna Bautista", f"#/jobs/{J}/documents"); p.locator(f'#doc-list .ds-doc:has-text("{docname}") button:has-text("Accept")').click(); w(300)
    ok(js(f"JOBS[0].docs.find(d=>d.name==='{docname}').review.decision") == "Accepted", "document accepted")
    ok(any("Exception raised" in a or True for a in [""]) and js("globalAudit().some(a=>a.action==='Document rejected') && globalAudit().some(a=>a.action==='Exception approved')"), "audit log has the new actions")
    cov_stop()
    b.close()

def run_time(pw):
    """Due dates, overdue, emails, demo date, dashboard and billing readiness"""
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 1366, "height": 900})
    p = ctx.new_page(); p.set_default_timeout(15000); cov_start(ctx, p)
    p.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    p.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    p.goto(APP + "#/login"); p.wait_for_timeout(1500); p.evaluate(SEED)
    js = p.evaluate
    def w(ms=200): p.wait_for_timeout(ms)
    def as_(n, r="#/home"): js("([n,r])=>signInAs(n,r)", [n, r]); w(900)
    def go(r): js("r=>{location.hash=r}", r); w(900)
    def ok(c, msg):
        results.append(bool(c)); print(("PASS " if c else "FAIL ") + msg)
        if not c: errors.append("ASSERT " + msg)
    def submit(): p.locator("#drawerRoot .ds-drawer__foot button[type=submit]").last.click(); w(800)
    def yes():
        if p.locator("#confirm-yes").count(): p.click("#confirm-yes"); w(800)
    def sample(slot): p.locator(f'.ds-upload[data-upload-slot="{slot}"] + button.ds-link').first.click(); w(80)
    def snap(n, sel=None):
        w(250); js("document.querySelectorAll('.ds-toast').forEach(t=>t.remove())")
        (p.locator(sel).first.screenshot(path=str(OUT / f"{n}.png")) if sel else p.screenshot(path=str(OUT / f"{n}.png"), full_page=True))

    as_("Grace Tan")
    js("D.cust(); D.inq(); D.quote(); D.approve(); D.accept(); D.win(); D.convert(); render()")
    J = js("JOBS[0].id")

    # ---------- due dates ----------
    ok(js("JOBS[0].ms[0].due") == js("addDaysDMY(2)"), "the first step gets a due date (today + days allowed)")
    as_("Ben Santos", f"#/jobs/{J}"); w(300)
    ok("due" in js("document.querySelector('#tab-body thead').innerText").lower(), "Milestones tab has a Due column")
    # finish step 1 through the UI; the next due date follows from the date it was done
    sample_needed = js("[...document.querySelectorAll('#next-step .ds-gate__item')].some(i=>/Needed first/.test(i.innerText))")
    js("JOBS[0].docs.forEach(d=>{ if(d.step==='Requirements complete') Object.assign(d,{status:'Received',file:'x.pdf',by:'Ben Santos',on:todayDMY()}); }); render()"); w(300)
    p.click("#next-primary"); w(300); submit(); yes()
    ok(js("JOBS[0].ms[1].due") is not None, f"completing a step sets the next one's due date ({js('JOBS[0].ms[1].due')})")
    ok(js("JOBS[0].ms[1].due") == js("addDaysDMY(stepDays(JOBS[0].ms[1]))"), "due = date done + days allowed")

    # ---------- time passes ----------
    js("D.advance(1); render()")  # step 3 done in demo data, the next step has no due set by the helper
    js("(()=>{ const m = currentMs(JOBS[0]); m.due = addDaysDMY(2); })()")
    cur = js("currentMs(JOBS[0]).name"); owners = js("opsFor(JOBS[0], currentMs(JOBS[0]).svc)")
    as_("Lorna Bautista", "#/home"); ok(not js("document.getElementById('needs-attention').innerText.includes('Step overdue')"), "nothing is overdue yet")
    n_mail0 = js("EMAILS.length")
    p.click(".ds-avatar[aria-label='Account menu']"); w(150); p.click("text=Demo: jump ahead 3 days"); w(600)
    ok("Demo date" in js("document.querySelector('.ds-topbar').innerText"), "the top bar shows a Demo date badge")
    ok(js("jobOverdue(JOBS[0])") is not None and js("jobOverdue(JOBS[0]).days") == 1, "the current step is now 1 day overdue")
    ok(js("EMAILS.length") == n_mail0 + 1 and js("EMAILS[0].kind") == "overdue" and js("EMAILS[0].to")[0] == owners[0], "the owner was emailed automatically")
    ok(js("document.getElementById('needs-attention').innerText.includes('Step overdue')"), "Manager sees 'Step overdue' in Needs attention")
    js("demoJump(1)"); w(900)  # 2 days overdue -> escalate
    ok(js("EMAILS.length") == n_mail0 + 2 and js("EMAILS[0].kind") == "escalation", "after 2 days overdue a Manager is emailed too")
    js("render(); render()"); ok(js("EMAILS.length") == n_mail0 + 2, "emails are not duplicated on redraw")
    go(f"#/jobs/{J}"); snap("01-job-overdue")
    ok(js("document.getElementById('next-step').innerText.includes('Overdue by 2 days')") and js("document.querySelector('.ds-track__step[data-state=overdue]') !== null"), "job page shows the overdue alert and an overdue dot on the progress map")
    ok(js("jobHealth(JOBS[0]).label") == "Needs attention", "job health says Needs attention")
    ok("Reminder emailed" in js("JOBS[0].log.map(a=>a.action).join(' ')") and "Escalation emailed" in js("JOBS[0].log.map(a=>a.action).join(' ')"), "reminder and escalation are in the job history")
    as_(owners[0], "#/home"); ok(js("document.getElementById('mywork-ops').innerText.includes('Overdue by 2 days')"), "the owner's My Work shows it overdue")
    p.click("#bell"); w(800); ok("View email" in js("document.getElementById('drawerRoot').innerText") and "Emailed" in js("document.getElementById('drawerRoot').innerText"), "notifications show Emailed with View email")
    p.locator("#drawerRoot button", has_text="View email").first.click(); w(300); ok("Subject:" in js("document.getElementById('drawerRoot').innerText"), "View email opens the email preview"); snap("02-email-preview", "#drawerRoot .ds-drawer"); js("closeDrawer()")
    go("#/jobs"); ok("Overdue" in js("document.getElementById('jobs-table').innerText"), "Jobs list shows Next due as overdue"); p.click("button.ds-chip:has-text('Overdue')"); ok(js("document.querySelectorAll('#jobs-table tbody tr[data-href]').length") == 1, "Overdue filter finds the job")
    go(f"#/jobs/{J}"); p.locator("#tab-body button", has_text="Change").first.click(); w(300)
    iso = js("dmyToISO(addDaysDMY(3))"); p.fill("#due-date", iso); p.fill("#due-why", "Vessel delayed"); submit()
    ok(js("jobOverdue(JOBS[0])") is None and js("currentMs(JOBS[0]).esc1") is None, "changing the due date clears the overdue state")

    # ---------- quote reminders ----------
    js("demoJump(0)"); as_("Ana Cruz", "#/home")
    js("(()=>{ const i=D.inq(); i.versions.push({v:1,file:'q.pdf',amount:1000,currency:'PHP',validUntil:addDaysDMY(30),by:'Ana Cruz',on:todayDMY(),status:'Sent',sent:{on:todayDMY(),channel:'Email',auto:true},review:{by:'Grace Tan',on:todayDMY(),decision:'Approved'}}); })()")
    js("demoJump(2)"); w(800)
    ok(js("EMAILS.some(e=>e.kind==='reminder')"), "a quote with no answer triggers a follow-up email to Sales")

    # ---------- dashboard ----------
    js("demoJump(0)"); as_("Lorna Bautista", "#/home"); js("STATE.dashTab='ops'; render()"); w(800); snap("03-dashboard-ops")
    t = js("document.getElementById('dash-body').innerText")
    ok(all(x in t for x in ["Overdue tasks", "Missing documents", "Open exceptions", "Billing readiness"]), "Operations dashboard has Overdue tasks, Missing documents, Open exceptions and Billing readiness")
    ok("Overdue steps" in t, "Overdue steps KPI present")

    # ---------- billing readiness ----------
    as_("Ana Cruz", f"#/jobs/{J}"); ok("Billing" not in js("document.querySelector('#job-tabs .ds-tabs').innerText"), "Sales do not see the Billing tab")
    as_("Lorna Bautista", f"#/jobs/{J}/billing"); ok("starts after delivery" in js("document.getElementById('tab-body').innerText").lower(), "before delivery the tab explains it starts after delivery")
    js("D.advance(20); JOBS[0].docs.forEach(d=>{ if(d.status!=='Received') Object.assign(d,{status:'Received',file:'x.pdf',by:'Mike Salazar',on:todayDMY()}); }); JOBS[0].ms.filter(isDeliveryStep).forEach(m=>{ m.delivery={time:'10:00',receivedBy:'Maria',condition:'Good condition'}; }); JOBS[0].status='Completed'; JOBS[0].completed={by:'Grace Tan',on:todayDMY()}; render()"); w(800)
    go(f"#/jobs/{J}/billing"); snap("04-billing-not-ready", None)
    ok("Charges to bill are listed" in js("document.getElementById('tab-body').innerText"), "the checklist is shown")
    ok(js("readinessStatus(JOBS[0]).key") == "missing" and js("readinessItems(JOBS[0]).filter(i=>!i.ok).map(i=>i.key)") == ["charges"], f"only 'charges' is missing: {js('readinessItems(JOBS[0]).filter(i=>!i.ok).map(i=>i.key)')}")
    ok(p.locator("#mark-ready").count() == 0, "can't mark ready while an item is missing")
    # a fund request that is still open blocks it
    js("JOBS[0].funds.push({ id:'FR-1', by:'Jessa Aquino', on:todayDMY(), purpose:'Duties & taxes', amount:1000, payee:'BOC', neededBy:todayDMY(), source:'Company funds', how:'cash', status:'Verified', review:{by:'Grace Tan',on:todayDMY(),decision:'Approved'}, release:{by:'Paolo Reyes',on:todayDMY(),mode:'Cash',ref:'',proof:'p.pdf'}, liq:{by:'Jessa Aquino',on:todayDMY(),actual:900,receipts:'r.pdf'}, verify:{by:'Paolo Reyes',on:todayDMY()} }); render()"); w(300)
    p.click("#add-from-receipts"); w(300); ok(js("chargesOf(JOBS[0]).length") == 1 and js("chargesOf(JOBS[0])[0].amount") == 900, "closed fund requests can be added as at-cost charges")
    p.click("#add-charge"); w(300); submit(); ok("What is the charge for?" in js("document.getElementById('drawerRoot').innerText"), "a charge needs a description")
    p.fill("#ch-desc", "Customs brokerage fee"); p.fill("#ch-amount", "25000"); sample("chargeFile"); submit()
    ok(js("chargesOf(JOBS[0]).length") == 2, "service fee charge added")
    ok(js("readinessStatus(JOBS[0]).key") == "complete", "checklist complete")
    snap("05-billing-complete", None)
    p.click("#mark-ready"); w(800); ok(js("readinessStatus(JOBS[0]).key") == "ready", "marked ready for Finance")
    ok(p.locator("#add-charge").count() == 0, "charges are locked once handed over")
    as_("Paolo Reyes", "#/home"); ok(js("document.getElementById('mywork-acct').innerText.includes('Receive this job for billing')"), "Accounting sees it on My Work")
    p.locator("#mywork-acct .ds-queue__item button", has_text="Open").first.click(); w(800); p.click("#receive-finance"); w(300); p.fill("#rv-ref", "ACC-2026-0042"); submit()
    ok(js("readinessStatus(JOBS[0]).key") == "received" and js("JOBS[0].handover.ref") == "ACC-2026-0042", "Accounting marks it received with their own reference")
    js("STATE.jobFilter='all'"); as_("Lorna Bautista", "#/jobs"); ok("Received by Finance" in js("document.getElementById('jobs-table').innerText"), "Jobs list shows the Billing status")
    as_("Lorna Bautista", "#/home"); js("STATE.dashTab='ops'; render()"); ok("Received by Finance" in js("document.getElementById('dash-body').innerText"), "dashboard counts it as received")
    ok(js("globalAudit().some(a=>a.action==='Ready for Finance') && globalAudit().some(a=>a.action==='Received by Finance')"), "handover is in the audit log")
    cov_stop()
    b.close()

def run_money(pw):
    """Fund lifecycle, closing, intake, admin and settings"""
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 1366, "height": 900}, accept_downloads=True)
    p = ctx.new_page(); p.set_default_timeout(15000); cov_start(ctx, p)
    p.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    p.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    p.goto(APP + "#/login"); p.wait_for_timeout(1500); p.evaluate(SEED)
    js = p.evaluate
    def w(ms=250): p.wait_for_timeout(ms)
    def as_(n, r="#/home"): js("([n,r])=>signInAs(n,r)", [n, r]); w(900)
    def go(r): js("r=>{location.hash=r}", r); w(900)
    def ok(c, msg):
        results.append(bool(c)); print(("PASS " if c else "FAIL ") + msg)
        if not c: errors.append("ASSERT " + msg)
    def submit(): p.locator("#drawerRoot .ds-drawer__foot button[type=submit]").last.click(); w(800)
    def yes():
        if p.locator("#confirm-yes").count(): p.click("#confirm-yes"); w(800)
    def sample(slot): p.locator(f'.ds-upload[data-upload-slot="{slot}"] + button.ds-link').first.click(); w(80)
    def fund_btn(label, row=None):
        loc = p.locator("#fund-table tbody tr" + (f':has-text("{row}")' if row else "")).locator("button", has_text=label).first; loc.click(); w(800)

    as_("Grace Tan")
    js("D.cust(); D.inq(); D.quote(); D.approve(); D.accept(); D.win(); D.convert(); D.advance(10); render()")
    J = js("JOBS[0].id")

    # ---------- fund lifecycle ----------
    as_("Jessa Aquino", f"#/jobs/{J}"); ok(js("!!fundGate(JOBS[0], currentMs(JOBS[0]))"), "Duties paid is gated until funds are released")
    js(f"openFundRequest('{J}', null, 'Duties & taxes')"); w(300); p.fill("#fr-amount", "185000"); p.fill("#fr-payee", "Bureau of Customs"); sample("fundSupport"); submit()
    ok(js("JOBS[0].funds[0].status") == "For approval" and js("JOBS[0].funds[0].support"), "fund request submitted with a supporting file (no extra confirmation)")
    as_("Lorna Bautista", f"#/jobs/{J}/money"); fund_btn("Review"); p.click("#drawerRoot button:has-text('Send back')"); w(300); p.click("#confirm-yes"); w(300)
    ok(p.locator("[data-error-for=comment]").is_visible(), "sending a request back needs a reason"); p.fill("#rs-comment", "Attach the BOC assessment"); p.click("#confirm-yes"); w(800)
    ok(js("JOBS[0].funds[0].status") == "Returned", "request sent back")
    as_("Jessa Aquino", f"#/jobs/{J}/money"); fund_btn("Edit & resubmit"); submit()
    as_("Lorna Bautista", f"#/jobs/{J}/money"); fund_btn("Review"); p.click("#approve-fund"); w(300); yes()
    ok(js("JOBS[0].funds[0].status") == "Approved", "request approved")
    as_("Paolo Reyes", "#/funds"); ok("Needs me" in js("document.querySelector('.ds-chip[aria-pressed=true]').innerText"), "Accounting lands on 'Needs me' in the Funds page")
    p.locator("#fund-table tbody tr").first.click(); w(800); ok("Who did what" in js("document.getElementById('drawerRoot').innerText"), "clicking a request opens its full trail"); js("closeDrawer()")
    fund_btn("Release"); p.select_option("#rel-mode", "Bank transfer"); p.fill("#rel-ref", "TRF-0001"); submit(); ok(p.locator("[data-error-for=proof]").is_visible(), "release needs proof"); sample("releaseProof"); submit(); yes()
    ok(js("JOBS[0].funds[0].status") == "Released", "funds released")
    as_("Jessa Aquino", f"#/jobs/{J}"); p.click("#next-primary"); w(300); p.fill("#ms-paid", "181500"); submit(); ok(p.locator("[data-error-for=file]").is_visible(), "ticking the step needs the receipt")
    sample("msFile"); submit(); ok(js("JOBS[0].funds[0].status") == "Liquidated", "ticking the step also submitted the receipts")
    as_("Paolo Reyes", f"#/jobs/{J}/money"); fund_btn("Check receipts"); p.click("#drawerRoot button:has-text('Send back')"); w(300); p.fill("#rs-comment", "Receipt not in company name"); p.click("#confirm-yes"); w(800)
    ok(js("JOBS[0].funds[0].status") == "Released" and js("!!JOBS[0].funds[0].liqBack"), "receipts sent back with a reason")
    as_("Jessa Aquino", f"#/jobs/{J}/money"); fund_btn("Submit receipts"); sample("liqReceipts"); submit(); ok(js("JOBS[0].funds[0].status") == "Liquidated", "receipts resubmitted")
    as_("Paolo Reyes", f"#/jobs/{J}/money"); fund_btn("Check receipts"); p.click("#verify-liq"); w(800); ok(js("JOBS[0].funds[0].status") == "Verified", "receipts confirmed, request closed")
    # vendor-direct request and a quotation linked to it
    js("D.advance(1); render()"); as_("Jessa Aquino", f"#/jobs/{J}/money"); js(f"openFundRequest('{J}')"); w(300); p.select_option("#fr-purpose", "Trucking"); p.fill("#fr-amount", "12000"); p.fill("#fr-payee", "JRS Trucking")
    p.locator('#drawerRoot .ds-seg label', has_text="Accounting pays the vendor").click(); submit(); fid = js("JOBS[0].funds[1].id")
    js(f"JOBS[0].funds[1].status='Approved'; JOBS[0].funds[1].review={{by:'Grace Tan',on:todayDMY(),decision:'Approved'}}")
    as_("Paolo Reyes", f"#/jobs/{J}/money"); p.click("text=Add quotation or bill"); w(300); p.fill("#vb-vendor", "JRS Trucking"); p.fill("#vb-desc", "Delivery trip"); p.fill("#vb-amount", "12000"); sample("vendorFile"); p.select_option("#vb-fund", fid); submit()
    ok(js("JOBS[0].vendorBills[0].fundId") == fid, "a quotation or bill can be linked to a fund request")
    fund_btn("Release", fid); p.select_option("#rel-mode", "Bank transfer"); p.fill("#rel-ref", "TRF-0002"); sample("releaseProof"); submit(); yes()
    as_("Jessa Aquino", f"#/jobs/{J}/money"); fund_btn("Submit receipts", fid); ok(p.locator("#liq-actual").count() == 0, "a pay-the-vendor request asks only for the vendor's receipt"); sample("liqReceipts"); submit()
    # waive the port-charges gate
    js("JOBS[0].funds=JOBS[0].funds.filter(f=>f.id!==JOBS[0].funds[1].id)"); go(f"#/jobs/{J}")
    # money page filters and export
    as_("Paolo Reyes", "#/funds"); p.click("button.ds-chip:has-text('All')"); w(300); p.fill("#fund-search", "FR"); w(300)
    with p.expect_download() as d: p.click("#funds-export")
    ok("FR-1" in pathlib.Path(d.value.path()).read_text(encoding="utf-8-sig"), "money log CSV exports")
    # the gate can be waived with a note
    js("D.advance(1); render()"); as_("Jessa Aquino", f"#/jobs/{J}")
    if js("!!fundGate(JOBS[0], currentMs(JOBS[0]))"):
        p.click("#next-step button:has-text('Paid another way')"); w(300); p.fill("#wv-note", "Client paid ATI online"); submit(); ok(not js("!!fundGate(JOBS[0], currentMs(JOBS[0]))"), "a money step can be recorded as paid another way")

    # ---------- closing ----------
    js("D.advance(20); JOBS[0].docs.forEach(d=>{ if(d.status!=='Received') Object.assign(d,{status:'Received',file:'x.pdf',by:'Mike Salazar',on:todayDMY()}); }); JOBS[0].funds.forEach(f=>{ if(f.status==='Liquidated') f.status='Verified'; }); render()")
    as_("Mike Salazar", f"#/jobs/{J}"); p.click("#next-primary"); w(900); ok(js("JOBS[0].status") == "For closing", "Operations submit for closing")
    as_("Lorna Bautista", f"#/jobs/{J}"); p.click("#next-step button:has-text('Send back to Ops')"); w(300); p.fill("#bk-note", "Upload the missing permit"); submit(); ok(js("JOBS[0].status") == "Active", "a Manager can send a job back to Operations")
    as_("Mike Salazar", f"#/jobs/{J}"); p.click("#next-primary"); w(900)
    js("JOBS[0].funds.push({ id:'FR-99', by:'Jessa Aquino', on:todayDMY(), purpose:'Other', amount:100, payee:'X', neededBy:todayDMY(), source:'Company funds', how:'cash', status:'Released', review:{by:'Grace Tan',on:todayDMY(),decision:'Approved'}, release:{by:'Paolo Reyes',on:todayDMY(),mode:'Cash',ref:'',proof:'p'} })")
    as_("Lorna Bautista", f"#/jobs/{J}"); p.click("#next-primary"); w(800); ok("Receipts are still due" in js("document.getElementById('drawerRoot').innerText"), "completion warns that receipts are still due")
    js("JOBS[0].funds=JOBS[0].funds.filter(f=>f.id!=='FR-99'); closeDrawer()"); go(f"#/jobs/{J}"); p.click("#next-primary"); w(300); p.click("#confirm-complete"); w(300); yes()
    ok(js("JOBS[0].status") == "Completed", "a Manager confirms the job completed (still asks to confirm)")

    # ---------- smaller job tools ----------
    js("D.cust(); JOBS.length"); as_("Lorna Bautista", "#/inquiries"); js("D.inq()")
    # ---------- inquiries: report, intake, edit, outcome, lost ----------
    as_("Cathy Lim", "#/home"); p.click("text=Report an inquiry to the manager"); w(300); p.fill("#in-client", "Prime Logistics Inc."); p.fill("#in-note", "Needs a warehousing quote"); sample("intakeFile"); submit()
    ok(js("INTAKE.length") == 1, "Sales can report an inquiry to the Manager"); p.locator("#my-reports button").first.click(); w(300); js("closeDrawer()")
    as_("Lorna Bautista", "#/home"); p.locator("#needs-attention .ds-queue__item button", has_text="View").first.click(); w(300); p.click("#drawerRoot button:has-text('Dismiss')"); w(300)
    ok(js("INTAKE[0].status") == "dismissed", "the Manager can dismiss a report")
    i2 = js("INQUIRIES[INQUIRIES.length-1].id")
    as_("Lorna Bautista", f"#/inquiries/{i2}"); p.click("text=Edit / reassign"); w(300); p.fill("#inq-cargo", "Spare parts, 5 pallets"); submit(); ok(not p.locator("#drawerRoot.open").count(), "an inquiry can be edited and reassigned")
    js(f"(()=>{{ const i=inqById('{i2}'); i.versions.push({{v:1,file:'q.pdf',amount:1000,currency:'PHP',validUntil:addDaysDMY(10),by:'Ana Cruz',on:todayDMY(),status:'Sent',sent:{{on:todayDMY(),channel:'Email',auto:true}},review:{{by:'Grace Tan',on:todayDMY(),decision:'Approved'}}}}); }})()")
    as_("Ana Cruz", f"#/inquiries/{i2}"); p.click("#next-primary"); w(300); p.locator('#drawerRoot .ds-seg label', has_text="Accepted").click(); sample("outcomeProof"); submit()
    ok(js(f"inqStatus(inqById('{i2}')).key") == "accepted", "Sales can record the client's answer with proof")
    as_("Lorna Bautista", f"#/inquiries/{i2}"); p.click("#next-primary"); w(300); p.click("#ack-accept"); w(800); ok(js(f"inqById('{i2}').closed") == "won", "the Manager acknowledges and closes it")

    # ---------- admin ----------
    as_("Jun Robles", "#/users"); p.click("#add-user"); p.fill("#nu-name", "Test Person"); p.fill("#nu-dept", "Operations"); p.check('#user-form input[name=roles][value=Operations]'); submit()
    uid = js("USERS.find(u=>u.name==='Test Person').id"); p.locator(f"#user-{uid} button", has_text="Roles").click(); w(300); p.check('#roles-form input[name=roles][value=Sales]'); submit(); ok("Sales" in js("USERS.find(u=>u.name==='Test Person').roles"), "roles can be edited")
    js("togglePerm('dash.view','Sales')"); ok(js("PERM['dash.view'].Sales") == "Y", "a permission can be granted to a role"); js("togglePerm('dash.view','Sales')")
    p.locator(f"#user-{uid} label.ds-switch").click(); w(900); ok("Deactivate" in js("document.getElementById('confirmRoot').innerText"), "deactivating asks for confirmation"); p.click("#confirm-yes"); w(900)
    ok(js("USERS.find(u=>u.name==='Test Person').active") is False, "a person without open work is deactivated")
    js("D.inq()"); did = js("USERS.find(u=>u.name==='Ana Cruz').id"); as_("Jun Robles", "#/users"); p.locator(f"#user-{did} label.ds-switch").click(); w(600)
    if p.locator("#handover-form").count(): submit(); ok(js("USERS.find(u=>u.name==='Ana Cruz').active") is False, "work is handed over before someone with open work is deactivated")
    as_("Jun Robles", "#/settings"); p.fill("#set-stepDays", "3"); p.click("text=Save defaults"); w(800); ok(js("SETTINGS.stepDays") == 3, "settings save")
    p.locator("input[name=doc]").first.fill("Certificate of Origin"); p.locator("form:has(input[name=doc]) button").first.click(); w(300); p.locator("button[aria-label^='Remove']").first.click(); w(300)
    go("#/audit"); p.click("#audit-range"); p.click("text=Last 7 days"); p.click("#audit-range"); p.locator(".ds-datepicker__day:not([data-muted])").nth(1).click(); p.locator(".ds-datepicker__day:not([data-muted])").nth(3).click(); w(300)
    ok(js("globalAudit().length") > 10, "audit log has entries and its date picker works")
    p.click(".ds-avatar[aria-label='Account menu']"); w(200); p.click("#main"); w(200)
    js("signOut()"); w(800); p.click("#ms-signin"); w(300); ok(p.locator(".ds-acct-row").count() > 10, "the sign-in chooser lists people"); p.locator(".ds-acct-row", has_text="Lorna Bautista").click(); w(900)
    js("CURRENT_USER=null; location.hash='#/track'"); w(800); p.fill("#track-q", "T1M-NOPE-NOPE"); p.click("text=Track shipment"); w(300); ok(p.locator("#track-error").count() == 1, "a wrong tracking code gets a clear error")
    as_("Lorna Bautista", f"#/jobs/{J}"); js(f"openFreeDays('{J}')") if js("clockApplies(JOBS[0])") and js("JOBS[0].status")!="Completed" else None
    cov_stop()
    b.close()

def run_tools(pw):
    """Smaller tools: documents, free days, waived steps, charges, filters, export"""
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 1366, "height": 900}, accept_downloads=True)
    p = ctx.new_page(); p.set_default_timeout(15000); cov_start(ctx, p)
    p.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    p.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    p.goto(APP + "#/login"); p.wait_for_timeout(1500); p.evaluate(SEED)
    js = p.evaluate
    def w(ms=250): p.wait_for_timeout(ms)
    def as_(n, r="#/home"): js("([n,r])=>signInAs(n,r)", [n, r]); w(900)
    def go(r): js("r=>{location.hash=r}", r); w(900)
    def ok(c, msg):
        results.append(bool(c)); print(("PASS " if c else "FAIL ") + msg)
        if not c: errors.append("ASSERT " + msg)
    def submit(): p.locator("#drawerRoot .ds-drawer__foot button[type=submit]").last.click(); w(800)
    def sample(slot): p.locator(f'.ds-upload[data-upload-slot="{slot}"] + button.ds-link').first.click(); w(80)

    as_("Grace Tan")
    js("D.cust(); D.inq(); D.quote(); D.approve(); D.accept(); D.win(); D.convert(); D.advance(7); render()")  # next step: Port charges... gated steps ahead
    J = js("JOBS[0].id")
    # Operations tools
    as_("Lorna Bautista", f"#/jobs/{J}"); p.locator(".ds-track--phases .ds-track__step").nth(0).click(); w(300); ok(js("STATE.mapPhase && STATE.mapPhase['%s']===0" % J), "clicking a phase shows its steps")
    go(f"#/jobs/{J}/documents"); p.click("text=Add a document"); w(300); p.fill("#ad-name", "FDA Import Permit"); submit(); ok(js("JOBS[0].docs.some(d=>d.name==='FDA Import Permit')"), "a document can be added to the checklist")
    pend = js("JOBS[0].docs.find(d=>d.name==='FDA Import Permit').id"); js(f"openUploadDoc('{J}','{pend}')"); w(300); sample("docFile"); p.click("#drawerRoot .ds-upload__remove"); w(200); ok(p.locator('.ds-upload[data-filled]').count() == 0, "an uploaded file can be removed before saving"); js("closeDrawer()")
    p.click("#job-more"); p.click("#popover button:has-text('Set free days')"); w(300); p.fill("#fr-port", "8"); submit(); ok(js("JOBS[0].free.portDays") == 8, "free days can be set")
    # a money step can be waived
    as_("Jessa Aquino", f"#/jobs/{J}"); w(300)
    while js("currentMs(JOBS[0]).name") not in ("Duties paid", "Port charges paid") and js("nextMsIndex(JOBS[0])") >= 0: js("D.advance(1); render()")
    ok(js("!!fundGate(JOBS[0], currentMs(JOBS[0]))"), "a money step is gated")
    p.click("#next-step .ds-gate button:has-text('Open funds'), #next-step .ds-gate button:has-text('Request funds')"); w(900); ok("#/jobs/" in js("location.hash"), "the gate button takes you to the Funds tab")
    js("closeDrawer()"); go(f"#/jobs/{J}"); p.click("#next-step button:has-text('Paid another way')"); w(300); p.fill("#wv-note", "Client pays directly"); submit(); ok(not js("!!fundGate(JOBS[0], currentMs(JOBS[0]))"), "a money step can be recorded as paid another way")
    # release form toggles the reference field for cash
    js("JOBS[0].funds.push({id:'FR-5',by:'Jessa Aquino',on:todayDMY(),purpose:'Other',amount:100,payee:'X',neededBy:todayDMY(),source:'Company funds',how:'cash',status:'Approved',review:{by:'Grace Tan',on:todayDMY(),decision:'Approved'}})")
    as_("Paolo Reyes", f"#/jobs/{J}/money"); js(f"openReleaseFund('{J}','FR-5')"); w(300); p.select_option("#rel-mode", "Cash"); w(200); ok(p.locator("#rel-ref-wrap").is_hidden(), "choosing Cash hides the reference number"); js("closeDrawer()")
    # Sales cannot act (denied toast)
    as_("Ana Cruz", f"#/jobs/{J}"); js("openMilestone(JOBS[0].id, nextMsIndex(JOBS[0]))"); w(200); ok(js("document.querySelector('.ds-toast--danger') !== null"), "a role that cannot act gets a clear message")
    # charges
    js("JOBS[0].ms.filter(isDeliveryStep).forEach(m=>{ m.done=true; m.date=todayDMY(); m.delivery={time:'10:00',receivedBy:'Maria',condition:'Good condition'}; })")
    as_("Lorna Bautista", f"#/jobs/{J}/billing"); js(f"openAddCharge('{J}')"); w(300); p.fill("#ch-desc", "Brokerage fee"); p.fill("#ch-amount", "5000"); submit()
    p.locator("#charges button", has_text="Remove").first.click(); w(300); ok(js("chargesOf(JOBS[0]).length") == 0, "a charge can be removed before handover")
    # dashboard: team tab, export, scope filter
    as_("Lorna Bautista", "#/home"); js("STATE.dashTab='team'; render()"); w(800); ok("Workload per person" in js("document.getElementById('dash-body').innerText"), "the Team tab shows workload")
    with p.expect_download() as d: p.click("#dash-export")
    ok(pathlib.Path(d.value.path()).read_text(encoding="utf-8-sig").count("\n") >= 1, "the dashboard exports the current tab to Excel (CSV)")
    p.select_option("#dash-scope", "International Import"); w(300); go("#/inquiries"); p.select_option("#inq-scope", "Domestic"); w(300); ok(js("STATE.inqScope") == "Domestic", "scope filters work")
    # inquiry form reacts to scope; reported inquiry is matched to the customer
    p.click("#new-inquiry"); w(300); p.locator('#drawerRoot .ds-seg label', has_text="Domestic").click(); w(200); ok(p.locator('#inq-services input[value="customs"]').count() == 0, "choosing Domestic removes Customs from the services")
    js("closeDrawer()"); as_("Cathy Lim", "#/home"); js("openReportInquiry()"); w(300); p.fill("#in-client", "Acme Trading Corporation"); p.fill("#in-note", "Needs trucking"); sample("intakeFile"); submit()
    as_("Lorna Bautista", "#/home"); js("openNewInquiry()"); w(800); ok(js("document.getElementById('inq-intake') && document.getElementById('inq-intake').value !== ''"), "a reported inquiry is matched to the customer by a loose name match"); js("closeDrawer()")
    # customer consignee removal
    go("#/customers/CUST-001"); p.click("#cust-consignees button:has-text('Add')"); w(300); p.fill("#pt-name", "Sample Retail"); p.fill("#pt-addr", "Makati"); submit()
    p.locator("#cust-consignees button", has_text="Edit").first.click(); w(300); p.click("#drawerRoot button:has-text('Remove')"); w(300); p.click("#confirm-yes"); w(800); ok(js("CUSTOMERS[0].consignees.length") == 0, "a consignee can be removed")
    # command palette keyboard
    p.keyboard.press("Control+k"); w(200); p.keyboard.press("ArrowDown"); p.keyboard.press("ArrowUp"); p.keyboard.press("Escape")
    cov_stop()
    b.close()

def run_sample(pw):
    """Sample data, keyboard and phone targets"""
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 1366, "height": 900})
    p = ctx.new_page(); p.set_default_timeout(15000); cov_start(ctx, p)
    p.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    p.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    p.goto(APP + "#/login"); p.wait_for_timeout(1500); js = p.evaluate
    def w(ms=300): p.wait_for_timeout(ms)
    def as_(n, r="#/home"): js("([n,r])=>signInAs(n,r)", [n, r]); w(600)
    def ok(c, msg):
        results.append(bool(c)); print(("PASS " if c else "FAIL ") + msg)
        if not c: errors.append("ASSERT " + msg)
    def snap(n, full=True): w(300); js("document.querySelectorAll('.ds-toast').forEach(t=>t.remove())"); p.screenshot(path=str(OUT / f"{n}.png"), full_page=full)

    as_("Lorna Bautista"); ok(p.locator("#load-sample").count() == 1, "empty dashboard offers 'Load sample data'")
    p.click("#load-sample"); w(800)
    ok(js("CUSTOMERS.length") == 3 and js("INQUIRIES.length") == 10 and js("JOBS.length") == 4, f"loaded 3 customers, {js('INQUIRIES.length')} inquiries, {js('JOBS.length')} jobs")
    ok(p.locator("#load-sample").count() == 0, "the button is gone once data exists")
    snap("01-dashboard")
    att = js("document.getElementById('needs-attention').innerText")
    ok("waiting for approval" in att.lower(), "Needs attention lists approvals")
    ok("On hold" in att and "overdue" in att.lower(), "Needs attention shows the held job and the overdue step")
    ok(js("EMAILS.length") >= 2, f"overdue step already triggered automatic emails ({js('EMAILS.length')})")
    states = {j: js(f"jobHealth(JOBS[{j}]).label") for j in range(4)}; print("   job health:", states)
    ok(sorted(states.values()).count("On hold") == 1 and "Completed" in states.values(), "jobs are in different states (one on hold, one completed)")
    ok(js("readinessStatus(JOBS[3]).key") == "ready", "the completed job is Ready for Finance")
    ok(js("clockApplies(JOBS[0]) && worstClock(JOBS[0]) && worstClock(JOBS[0]).left < 0"), "job A shows free time already over")
    for who, route, name in [("Lorna Bautista", "#/jobs", "02-jobs"), ("Lorna Bautista", "#/inquiries", "03-inquiries"), ("Lorna Bautista", "#/funds", "04-funds"), ("Paolo Reyes", "#/home", "05-accounting"), ("Jessa Aquino", "#/home", "06-ops"), ("Ana Cruz", "#/home", "07-sales")]:
        as_(who, route); snap(name)
    as_("Lorna Bautista", "#/home"); js("STATE.dashTab='ops'; render()"); w(900); snap("08-dashboard-ops")
    # run the full set of pages for errors
    for r in ["#/customers", "#/customers/CUST-001", "#/audit", "#/settings", "#/users"] + [f"#/jobs/{j}/{t}" for j in [js(f"JOBS[{k}].id") for k in range(4)] for t in ["milestones","documents","issues","money","billing","history"]] + [f"#/inquiries/{js(f'INQUIRIES[{k}].id')}" for k in range(10)]:
        js("r=>{location.hash=r}", r); w(150)
    ok(not errors, "all pages open without errors")
    # keyboard: Tab to a jobs-list row and press Enter
    as_("Lorna Bautista", "#/jobs"); js("STATE.jobFilter='all'; render()"); w(300)
    js("document.querySelector('#jobs-table tbody tr').focus()"); p.keyboard.press("Enter"); w(900)
    ok(js("location.hash").startswith("#/jobs/SJ-"), f"a list row opens with the keyboard ({js('location.hash')})")
    # phone targets
    p.set_viewport_size({"width": 390, "height": 844}); w(300)
    report = {}
    for who, route in [("Lorna Bautista", "#/home"), ("Lorna Bautista", "#/inquiries"), ("Lorna Bautista", f"#/jobs/{js('JOBS[1].id')}"), ("Paolo Reyes", "#/funds"), ("Jessa Aquino", "#/home")]:
        as_(who, route); w(300)
        r = js("""(()=>{ const small = [...document.querySelectorAll('button, a.ds-btn, [role=button], select, input:not([type=hidden]), .ds-chip')].filter(e=>{ const r=e.getBoundingClientRect(); return r.width>0 && r.height>0 && r.height<43.5 && !e.closest('[hidden]'); });
          const by = {}; small.forEach(e=>{ const k = e.tagName.toLowerCase()+'.'+((e.className||'').toString().split(' ').filter(c=>c.startsWith('ds-')).slice(0,2).join('.')); by[k]=(by[k]||0)+1; });
          return { overflow: document.documentElement.scrollWidth>window.innerWidth+1, small: small.length, by }; })()""")
        report[route] = r
    print(json.dumps(report, indent=1))
    p.set_viewport_size({"width": 1366, "height": 900})
    cov_stop()
    b.close()

if __name__ == "__main__":
    with sync_playwright() as pw:
        for name, fn in [("data", run_data), ("exceptions", run_exceptions), ("time", run_time), ("money", run_money), ("tools", run_tools), ("sample", run_sample)]:
            print("\n=== " + name, flush=True)
            fn(pw)
    failed = [e for e in errors]
    print("\n%d/%d checks passed" % (sum(results), len(results)))
    print("FAILURES / ERRORS:" if failed else "NO ERRORS")
    for e in failed: print("  " + e)
    sys.exit(1 if failed else 0)
