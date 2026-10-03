"""Plays the mockup with Playwright and saves the screenshots used by build_user_manual.py.

    python docs/demo/manual/capture_user_manual.py

Screenshots go to docs/demo/manual/shots/ (recreated each run). The mockup is the real
apps/mockup/index.html, so the manual always matches the current build.
"""
import pathlib, shutil
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
APP = (ROOT / "apps/mockup/index.html").as_uri()
OUT = pathlib.Path(__file__).resolve().parent / "shots"

MARK_JS = """(marks) => {
  document.querySelectorAll('.__mk').forEach(e => e.remove());
  marks.forEach(([sel, n]) => {
    const el = document.querySelector(sel); if (!el) { console.warn('no marker target', sel); return; }
    const r = el.getBoundingClientRect(), sx = scrollX, sy = scrollY;
    const box = document.createElement('div'); box.className = '__mk';
    Object.assign(box.style, { position:'absolute', left:(r.left+sx-4)+'px', top:(r.top+sy-4)+'px', width:(r.width+8)+'px', height:(r.height+8)+'px',
      border:'2.5px solid #e5383b', borderRadius:'10px', zIndex: 99999, pointerEvents:'none' });
    const dot = document.createElement('div'); dot.className = '__mk'; dot.textContent = n;
    Object.assign(dot.style, { position:'absolute', left:(Math.max(2, r.left+sx-14))+'px', top:(Math.max(2, r.top+sy-14))+'px', width:'24px', height:'24px', borderRadius:'50%',
      background:'#e5383b', color:'#fff', font:'700 13px/24px Inter, Arial, sans-serif', textAlign:'center', zIndex: 100000, pointerEvents:'none', boxShadow:'0 0 0 2px #fff' });
    document.body.append(box, dot);
  });
}"""

# Helpers that move the session data along, so each screenshot shows a realistic moment.
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
  win(){ CONFIRM_OK = true; ackAccept(INQUIRIES[0].id); },
  convert(){
    const f = document.createElement('form');
    [['accreditation','Ben Santos'],['freight','Rico Domingo'],['customs','Jessa Aquino'],['trucking','Mike Salazar']].forEach(([k,n])=>{ const h = document.createElement('input'); h.type='hidden'; h.name='ops_'+k; h.value=n; f.appendChild(h); });
    const c = document.createElement('input'); c.name = 'cargoType'; c.value = 'FCL'; f.appendChild(c);
    CONFIRM_OK = true; convertToJob(INQUIRIES[0].id, f); return JOBS[0].id;
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


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=1.5)
        p = ctx.new_page()
        p.goto(APP + "#/login")
        p.wait_for_timeout(1800)
        p.evaluate(SEED)
        n = [0]

        def js(code):
            return p.evaluate(code)

        def as_(name, route="#/home"):
            js(f"signInAs('{name}', '{route}')"); p.wait_for_timeout(300)

        def go(route):
            js(f"location.hash='{route}'"); p.wait_for_timeout(350)

        def snap(name, marks=(), clip=None, pad=14, full=False, scroll=None):
            """Saves OUT/name.jpg. clip: selector to crop to. scroll: selector to scroll into view first."""
            p.wait_for_timeout(400)
            js("document.querySelectorAll('.ds-toast').forEach(t => t.remove())")
            if scroll:
                p.evaluate("s => { const el = document.querySelector(s); if (el) el.scrollIntoView({block:'center'}); }", scroll)
                p.wait_for_timeout(200)
            p.evaluate(MARK_JS, [list(m) for m in marks])
            path = OUT / f"{name}.jpg"
            if clip:
                el = p.locator(clip).first
                el.scroll_into_view_if_needed()
                bb = el.bounding_box()
                vw, vh = p.viewport_size["width"], p.viewport_size["height"]
                x0 = max(0, bb["x"] - pad); y0 = max(0, bb["y"] - pad)
                w = min(vw - x0, bb["width"] + 2 * pad); h = min(vh - y0, bb["height"] + 2 * pad)
                p.screenshot(path=str(path), type="jpeg", quality=88, animations="disabled", clip={"x": x0, "y": y0, "width": w, "height": h})
            else:
                p.screenshot(path=str(path), type="jpeg", quality=88, animations="disabled", full_page=full)
            js("document.querySelectorAll('.__mk').forEach(e => e.remove())")
            n[0] += 1

        # ---------------- Sign in ----------------
        go("#/login"); p.wait_for_timeout(2200)
        snap("01-login")
        p.click("#ms-signin"); p.wait_for_timeout(500)
        snap("02-account-picker")
        js("closeAcctPicker()")
        as_("Grace Tan", "#/home")

        # ---------------- Manager: first look ----------------
        snap("03-dashboard-empty", marks=[(".ds-nav", 1), ("#bell", 2)])
        js("D.cust()")
        js("openNewInquiry()"); p.wait_for_timeout(400)
        for s in ("accreditation", "freight", "customs", "trucking"):
            js(f"(()=>{{ const c = document.querySelector('#drawerRoot input[name=services][value={s}]'); if(c && !c.checked) c.click(); }})()")
        snap("04-new-inquiry", marks=[("#inq-cust", 1), ("#inq-services", 2), ("#inq-staff", 3)])
        js("closeDrawer()")
        js("D.inq()")
        go("#/inquiries")
        snap("05-inquiries-list")

        # ---------------- Sales: upload the quotation ----------------
        as_("Ana Cruz", "#/mywork")
        snap("06-sales-mywork")
        js("openReportInquiry()"); p.wait_for_timeout(400)
        snap("06b-report-inquiry")
        js("closeDrawer()")
        go("#/inquiries/INQ-2026-0001")
        snap("07-inquiry-preparing", marks=[("#next-primary", 1)])
        js("openUploadQuote('INQ-2026-0001')"); p.wait_for_timeout(400)
        p.click("#drawerRoot .ds-upload[data-upload-slot=quoteFile] + .ds-link"); p.wait_for_timeout(100)
        p.fill("#drawerRoot input[name=amount]", "480000")
        snap("08-upload-quote")
        js("closeDrawer()")

        # ---------------- Manager: approve ----------------
        js("D.quote()")
        as_("Grace Tan", "#/home")
        snap("09-manager-needs-attention")
        go("#/inquiries/INQ-2026-0001")
        js("openReviewQuote('INQ-2026-0001')"); p.wait_for_timeout(400)
        snap("10-review-quote", marks=[("#return-quote", 1), ("#approve-quote", 2)])
        p.click("#approve-quote"); p.wait_for_timeout(400)
        snap("11-confirm-approve")
        js("closeConfirm(); closeDrawer(); D.approve(); render()")
        p.wait_for_timeout(300)
        snap("12-inquiry-waiting-client", marks=[("#next-step", 1)])

        # ---------------- Client page ----------------
        js("CURRENT_USER = null; location.hash = '#/quote/INQ-2026-0001'"); p.wait_for_timeout(600)
        snap("13-client-page")
        js("document.querySelector('#client-form input[value=Renegotiate]').click()"); p.wait_for_timeout(200)
        p.fill("#cl-reason-text", "Can the price be lowered a bit for two units?")
        snap("14-client-renegotiate")
        js("document.querySelector('#client-form input[value=Accept]').click()"); p.wait_for_timeout(200)
        p.click("#client-send"); p.wait_for_timeout(400)
        snap("15-client-confirm")
        js("closeConfirm()")

        # ---------------- Accept, close, convert ----------------
        as_("Grace Tan", "#/inquiries/INQ-2026-0001")
        js("D.accept(); render()"); p.wait_for_timeout(300)
        snap("16-inquiry-accepted", marks=[("#next-primary", 1)])
        js("openAckAccept('INQ-2026-0001')"); p.wait_for_timeout(400)
        snap("17-acknowledge-close")
        js("closeDrawer(); D.win(); render()"); p.wait_for_timeout(300)
        js("openConvert('INQ-2026-0001')"); p.wait_for_timeout(400)
        snap("18-convert-to-job")
        js("closeDrawer(); D.convert(); go('#/jobs/SJ-2026-00001')"); p.wait_for_timeout(500)

        # ---------------- Job page ----------------
        snap("19-job-top", full=False)
        snap("20-job-nextstep", clip="#next-step", marks=[("#next-primary", 1)])

        # Accreditation (Ben Santos): the two documents come first, then the step that needs a document
        as_("Ben Santos", "#/mywork")
        snap("21a-ops-mywork")
        go("#/jobs/SJ-2026-00001")
        js("JOBS[0].docs.forEach(d=>{ if(d.step==='Requirements complete') Object.assign(d,{status:'Received',file:'sample-doc.pdf',by:'Ben Santos',on:todayDMY()}); }); D.advance(1); render()"); p.wait_for_timeout(300)
        js("openMilestone('SJ-2026-00001', nextMsIndex(JOBS[0]))"); p.wait_for_timeout(400)
        snap("21-milestone-required-doc")
        js("closeDrawer(); D.advance(3); render()")

        # Shipping (Rico Domingo): shipping line, then the D/O fund gate
        as_("Rico Domingo", "#/jobs/SJ-2026-00001")
        js("openMilestone('SJ-2026-00001', nextMsIndex(JOBS[0]))"); p.wait_for_timeout(400)
        snap("22-booked-shipping-line")
        js("closeDrawer(); D.advance(3); render()"); p.wait_for_timeout(300)
        snap("23-do-gate", clip="#next-step", scroll="#next-step")
        js("openFundRequest('SJ-2026-00001', null, 'Shipping line local charges')"); p.wait_for_timeout(400)
        p.fill("#fr-amount", "60000")
        p.fill("#fr-payee", "Maersk Philippines")
        snap("24-fund-request")
        js("closeDrawer(); D.fund('Shipping line local charges', 60000, 'Maersk Philippines', 'For approval'); JOBS[0].funds[0].by='Rico Domingo'; render()"); p.wait_for_timeout(300)
        snap("25-do-gate-submitted", clip="#next-step", scroll="#next-step")
        as_("Grace Tan", "#/jobs/SJ-2026-00001/money")
        snap("26-funds-tab-manager", clip="#job-tabs")
        js("openReviewFund('SJ-2026-00001', JOBS[0].funds[0].id)"); p.wait_for_timeout(400)
        snap("27-review-fund")
        js("closeDrawer(); JOBS[0].funds[0].status='Approved'; JOBS[0].funds[0].review={by:'Grace Tan',on:todayDMY(),decision:'Approved',comment:null}; render()")
        as_("Paolo Reyes", "#/home")
        snap("28-accounting-mywork")
        js("openReleaseFund('SJ-2026-00001', JOBS[0].funds[0].id)"); p.wait_for_timeout(400)
        snap("29-approve-release")
        js("closeDrawer(); Object.assign(JOBS[0].funds[0], { status:'Released', release:{ by:'Paolo Reyes', on:todayDMY(), mode:'Bank transfer', ref:'TRF-20261002-01', proof:null } }); render()")
        as_("Rico Domingo", "#/jobs/SJ-2026-00001/money")
        js("openLiquidate('SJ-2026-00001', JOBS[0].funds[0].id)"); p.wait_for_timeout(400)
        snap("30-liquidate")
        js("closeDrawer(); Object.assign(JOBS[0].funds[0], { status:'Liquidated', liq:{ by:'Rico Domingo', on:todayDMY(), actual:57500, receipts:'sample-liqreceipts.pdf', note:null } }); render()")
        as_("Paolo Reyes", "#/jobs/SJ-2026-00001/money")
        js("openVerify('SJ-2026-00001', JOBS[0].funds[0].id)"); p.wait_for_timeout(400)
        snap("31-review-liquidation")
        js("closeDrawer(); JOBS[0].funds[0].status='Verified'; render()")

        # Customs (Jessa Aquino): lane colour
        as_("Jessa Aquino", "#/jobs/SJ-2026-00001")
        js("D.advance(2); render()"); p.wait_for_timeout(300)
        js("openMilestone('SJ-2026-00001', nextMsIndex(JOBS[0]))"); p.wait_for_timeout(400)
        snap("32-lane-assigned")
        js("closeDrawer(); D.advance(1); render()"); p.wait_for_timeout(300)
        snap("32b-duties-gate", clip="#next-step", scroll="#next-step")
        js("D.advance(4); render()")

        # Trucking (Mike Salazar): driver and truck
        as_("Mike Salazar", "#/jobs/SJ-2026-00001")
        js("openMilestone('SJ-2026-00001', nextMsIndex(JOBS[0]))"); p.wait_for_timeout(400)
        snap("32c-truck-scheduled")
        js("closeDrawer()")
        go("#/jobs/SJ-2026-00001/documents")
        snap("33-documents-tab", clip="#job-tabs", scroll="#job-tabs")
        js("openFlagIssue('SJ-2026-00001')"); p.wait_for_timeout(400)
        snap("34-flag-issue")
        js("closeDrawer()")

        # Closing
        js("D.advance(20); JOBS[0].docs.forEach(d=>{ if(d.status!=='Received') Object.assign(d,{status:'Received',file:'sample-doc.pdf',by:'Mike Salazar',on:todayDMY()}); }); render()"); p.wait_for_timeout(300)
        snap("35-job-ready-to-close", clip="#next-step", scroll="#next-step", marks=[("#next-primary", 1)])
        js("JOBS[0].status='For closing'; JOBS[0].submitted={by:'Mike Salazar',on:todayDMY()}")
        as_("Grace Tan", "#/jobs/SJ-2026-00001")
        js("openConfirmComplete('SJ-2026-00001')"); p.wait_for_timeout(400)
        snap("35b-confirm-complete")
        js("closeDrawer()")
        js("CONFIRM_OK=true; confirmComplete('SJ-2026-00001'); render()"); p.wait_for_timeout(300)
        snap("35c-job-completed", full=False)
        as_("Ana Cruz", "#/home")
        js("openNotifications()"); p.wait_for_timeout(400)
        snap("36-notifications")
        js("closeDrawer()")
        js("openCmdk()"); p.wait_for_timeout(300)
        p.keyboard.type("acme"); p.wait_for_timeout(300)
        snap("37-search")
        p.keyboard.press("Escape")

        # ---------------- Admin / manager pages ----------------
        as_("Mark Villar", "#/home")
        snap("38-dashboard-admin")
        go("#/users"); snap("39-users")
        js("openEditRoles(USERS[0].id)"); p.wait_for_timeout(400); snap("40-edit-roles"); js("closeDrawer()")
        go("#/settings"); snap("41-settings")
        go("#/audit"); snap("42-audit")
        go("#/customers"); snap("43-customers")
        js(f"CURRENT_USER = null; location.hash = '#/track/' + JOBS[0].trackingCode"); p.wait_for_timeout(600)
        snap("44-tracking-page", full=False)
        b.close()
    print("saved", n[0], "screenshots to", OUT)


if __name__ == "__main__":
    main()
