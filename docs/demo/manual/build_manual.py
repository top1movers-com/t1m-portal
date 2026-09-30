"""Builds docs/demo/Scenario-Manual-v3.pdf.

It plays every scenario in the real mockup (apps/mockup/index.html) with Playwright, captures each screen
with red numbered markers on what to click, and lays the pages out as a printable A4 manual. Because the
screenshots are taken from the live build, the manual cannot drift from the mockup: rebuild after any change.

    python docs/demo/manual/build_manual.py
"""
import base64, html, pathlib, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
APP = (ROOT / "apps/mockup/index.html").as_uri()
OUT = ROOT / "docs/demo/Scenario-Manual-v3.pdf"
IMG = pathlib.Path(tempfile.mkdtemp(prefix="t1m-manual-"))
FONT = (ROOT / "packages/design-system/fonts/Inter-latin-wght.woff2").as_uri()

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

class Shooter:
    def __init__(self, page):
        self.p = page; self.n = 0
    def js(self, code): return self.p.evaluate(code)
    def as_(self, name, route):
        self.js(f"signInAs('{name}', '{route}')"); self.p.wait_for_timeout(250)
    def go(self, route): self.js(f"location.hash='{route}'"); self.p.wait_for_timeout(250)
    def click(self, sel): self.p.click(sel); self.p.wait_for_timeout(250)
    def fill(self, sel, v): self.p.fill(sel, v)
    def sample(self, slot): self.p.click(f"#drawerRoot .ds-upload[data-upload-slot={slot}] + .ds-link"); self.p.wait_for_timeout(60)
    def submit(self): self.p.click("#drawerRoot button[type=submit]"); self.p.wait_for_timeout(300)
    def shot(self, marks=(), clip=None, pad=16, full=False, toast=False):
        """clip: a selector (or list) to crop to; default is the whole viewport."""
        self.p.wait_for_timeout(350)
        if not toast: self.js("document.querySelectorAll('.ds-toast').forEach(t => t.remove())")
        if clip:
            sels = [clip] if isinstance(clip, str) else clip
            self.p.evaluate("s => { const el = document.querySelector(s); if (el) el.scrollIntoView({block:'center'}); }", sels[0])
            self.p.wait_for_timeout(150)
        self.p.evaluate(MARK_JS, [list(m) for m in marks])
        self.n += 1; path = IMG / f"s{self.n:03d}.jpg"
        if clip:
            boxes = [self.p.locator(s).first.bounding_box() for s in sels]
            boxes = [b for b in boxes if b]
            x0 = max(0, min(b["x"] for b in boxes) - pad); y0 = max(0, min(b["y"] for b in boxes) - pad)
            x1 = max(b["x"] + b["width"] for b in boxes) + pad; y1 = max(b["y"] + b["height"] for b in boxes) + pad
            vw, vh = self.p.viewport_size["width"], self.p.viewport_size["height"]
            self.p.screenshot(path=str(path), type="jpeg", quality=85, animations="disabled",
                              clip={"x": x0, "y": y0, "width": min(x1, vw) - x0, "height": min(y1, vh) - y0})
        else:
            self.p.screenshot(path=str(path), type="jpeg", quality=85, animations="disabled", full_page=full)
        self.js("document.querySelectorAll('.__mk').forEach(e => e.remove())")
        return path

# ------------------------------------------------------------------ content helpers
def img(path, caption=None, narrow=False):
    data = base64.b64encode(path.read_bytes()).decode()
    cap = f'<figcaption>{caption}</figcaption>' if caption else ''
    return f'<figure class="{"narrow" if narrow else ""}"><img src="data:image/jpeg;base64,{data}">{cap}</figure>'
def see(text): return f'<p class="see"><b>You should see:</b> {text}</p>'
def step(n, title, body): return f'<div class="step"><h3><span>{n}</span>{title}</h3>{body}</div>'
def scenario(n, title, situation, who, end):
    return (f'<section class="scenario"><div class="sc-head"><div class="sc-n">SCENARIO {n}</div><h2>{title}</h2></div>'
            f'<div class="sc-box"><div><b>The situation</b><p>{situation}</p></div><div class="sc-meta"><div><b>Who does the work</b><p>{who}</p></div><div><b>You end up with</b><p>{end}</p></div></div></div>')
def why(text): return f'<p class="why"><b>Why it works this way:</b> {text}</p>'

# ------------------------------------------------------------------ capture
def capture():
    S = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 820}, device_scale_factor=1.5)
        p = ctx.new_page(); sh = Shooter(p)
        p.goto(APP + "#/login"); p.wait_for_timeout(400)

        # ---- Before you begin
        S["login"] = sh.shot([("#ms-signin", 1), ("#track-link", 2)])
        sh.click("#ms-signin"); S["picker"] = sh.shot([(".ds-acct-row", 1)], clip=".ds-acct-picker")
        p.keyboard.press("Escape"); sh.js("closeAcctPicker()")
        sh.as_("Grace Tan", "#/home")
        S["topbar"] = sh.shot([(".ds-topbar .ds-search", 1), ("#bell", 2), ("#avatar-menu .ds-avatar", 3), (".ds-nav", 4)])

        # ---- The big idea: anatomy of a job page
        sh.go("#/jobs/SJ-2026-00065")
        S["anatomy"] = sh.shot([(".ds-jobhead h1 .ds-pill", 1), (".ds-jobhead__actions .ds-pill--stage", 2), ("#journey", 3), ("#next-step", 4), ("#fee-clock", 5)])
        sh.p.evaluate("window.scrollTo(0, document.getElementById('job-tabs').offsetTop - 120)")
        S["tabs"] = sh.shot([("#job-tabs .ds-tabs", 1)], clip="#job-tabs .ds-tabs", pad=24)

        # ---- Scenario 1: Ana, new customer to job
        sh.as_("Ana Cruz", "#/customers")
        S["s1_customers"] = sh.shot([(".ds-page-head .ds-btn--primary", 1)])
        sh.click(".ds-page-head .ds-btn--primary"); sh.fill("#nc-name", "Sample Trading"); p.wait_for_timeout(100)
        S["s1_dup"] = sh.shot([("#dup-warning", 1)], clip=".ds-drawer")
        sh.fill("#nc-name", "Test Freight Co."); sh.p.evaluate("checkDuplicate('Test Freight Co.')")
        sh.fill("#nc-contact", "Lea Ramos"); sh.fill("#nc-phone", "+63 917 555 0123"); sh.fill("#nc-email", "lea@testfreight.ph"); sh.fill("#nc-city", "Pasig, PH"); sh.fill("#nc-addr", "Unit 5, Pasig Industrial Park, Pasig City, PH")
        sh.fill("#nc-instr", "Deliver weekdays only. Call Lea 1 hour before arrival.")
        S["s1_newcust"] = sh.shot([("#nc-name", 1), ("#nc-phone", 2), ("#nc-email", 3), ("#nc-instr", 4), ("#drawerRoot button[type=submit]", 5)], clip=".ds-drawer")
        sh.submit()
        S["s1_custpage"] = sh.shot([("#cust-new-inquiry", 1)])
        sh.click("#cust-new-inquiry"); sh.fill("#inq-cargo", "Insured goods, 1 container"); sh.fill("#inq-origin", "Shanghai, CN"); sh.fill("#inq-dest", "Pasig, PH")
        S["s1_inq"] = sh.shot([("#inq-cargo", 1), ("#inq-ctype", 2), ("#drawerRoot button[type=submit]", 3)], clip=".ds-drawer")
        sh.submit()
        S["s1_deal"] = sh.shot([("#next-step .ds-gate", 1), ("#next-primary", 2)])
        sh.click("#next-primary"); p.select_option("#inq-ctype", "20ft dry"); sh.fill("#inq-pickup", "2026-10-05")
        S["s1_fill"] = sh.shot([("#inq-ctype", 1), ("#inq-pickup", 2)], clip=".ds-drawer")
        sh.submit(); sh.click("#next-primary")
        S["s1_quote"] = sh.shot([("#qt-total", 1), ("#drawerRoot button[type=submit]", 2)], clip=".ds-drawer")
        sh.submit()
        S["s1_waiting"] = sh.shot([("#next-step .ds-next__eyebrow", 1), ("#next-primary", 2)], clip="#next-step")
        sh.click("#next-primary")
        S["s1_conforme"] = sh.shot([("#cf-who", 1), ("#drawerRoot button[type=submit]", 2)], clip=".ds-drawer")
        sh.submit()
        S["s1_ready"] = sh.shot([("#next-primary", 1)], clip="#next-step")
        sh.click("#next-primary")
        S["s1_convert"] = sh.shot([("#create-job", 1)], clip=".ds-drawer")
        sh.click("#create-job"); p.wait_for_timeout(300)
        S["s1_job"] = sh.shot([("#journey", 1), ("#next-step", 2), ("#job-tabs .ds-tab:nth-child(2)", 3)])

        # ---- Scenario 2: Ana, paperwork on 00095, then 00088
        sh.go("#/jobs/SJ-2026-00095")
        S["s2_gate"] = sh.shot([("#gate li:nth-child(2) .ds-btn", 1), ("#gate li:nth-child(3) .ds-btn", 2), ("#gate li:nth-child(4) .ds-btn", 3), ("#gate li:nth-child(5) .ds-btn", 4)], clip="#next-step")
        sh.js("openReviewDoc('SJ-2026-00095','D3')"); sh.click("#reject-doc")
        S["s2_reject"] = sh.shot([("[data-error-for=reason]", 1), ("#reject-doc", 2), ("#approve-doc", 3)], clip=".ds-drawer")
        sh.click("#approve-doc")
        sh.js("openUploadDoc('SJ-2026-00095','D4')"); sh.sample("docUpload")
        S["s2_upload"] = sh.shot([(".ds-drawer .ds-alert--danger", 1), (".ds-upload", 2), ("#drawerRoot button[type=submit]", 3)], clip=".ds-drawer")
        sh.submit()
        for d in ["D5"]:
            sh.js(f"openUploadDoc('SJ-2026-00095','{d}')"); sh.sample("docUpload"); sh.submit()
        S["s2_after_upload"] = sh.shot([("#gate", 1)], clip="#next-step")
        for d in ["D4", "D5"]:
            sh.js(f"openReviewDoc('SJ-2026-00095','{d}')"); sh.click("#approve-doc")
        sh.js("openCompleteTask('SJ-2026-00095','T1')"); sh.submit()
        S["s2_proof"] = sh.shot([("[data-error-for=evidence]", 1), (".ds-upload + .ds-link", 2)], clip=".ds-drawer")
        sh.sample("taskEvidence"); sh.submit()
        S["s2_ready"] = sh.shot([("#next-primary", 1)], clip="#next-step")
        sh.click("#next-primary")
        S["s2_moved"] = sh.shot([("#journey", 1), (".ds-toast", 2)], toast=True)
        sh.go("#/jobs/SJ-2026-00088/history")
        sh.click("#next-primary")
        S["s2_088"] = sh.shot([("#journey [data-just]", 1), ("#fee-clock", 2)])
        sh.go("#/jobs/SJ-2026-00088/history"); p.evaluate("window.scrollTo(0, document.getElementById('job-tabs').offsetTop - 80)")
        S["s2_history"] = sh.shot([("#tab-body .ds-activity li:first-child", 1)], clip="#job-tabs")
        sh.go("#/track/SJ-2026-00088")
        S["s2_track"] = sh.shot([("#track-status", 1)])

        # ---- Scenario 3: Grace, customs trouble
        sh.as_("Grace Tan", "#/home")
        S["s3_home"] = sh.shot([(".ds-kpis", 1), (".ds-pipeline-wrap", 2), ("#needs-you .ds-chips", 3), ("#fee-clocks", 4)])
        S["s3_queue"] = sh.shot([("#needs-you .ds-queue__item:nth-child(1) .ds-btn", 1), ("#needs-you .ds-queue__item:nth-child(2) .ds-btn", 2)], clip="#needs-you")
        sh.go("#/jobs/SJ-2026-00130")
        S["s3_hold"] = sh.shot([("#next-step .ds-next__title", 1), ("#next-step .ds-pill--danger", 2), ("#next-primary", 3)], clip="#next-step")
        sh.click("#next-primary")
        S["s3_cleared"] = sh.shot([("#next-step .ds-small", 1), ("#next-primary", 2)], clip="#next-step")
        sh.click("#next-primary"); sh.click("#next-primary")
        p.check("input[value=Client]")
        S["s3_party"] = sh.shot([("input[value=Client]", 1), ("#drawerRoot button[type=submit]", 2)], clip=".ds-drawer")
        sh.submit()
        S["s3_waiting"] = sh.shot([("#next-step .ds-next__eyebrow", 1), ("#gate li:first-child", 2)], clip="#next-step")
        sh.click("#next-primary"); sh.sample("clientPaidProof")
        S["s3_paid"] = sh.shot([(".ds-drawer .ds-alert--warning", 1), (".ds-upload", 2), ("#drawerRoot button[type=submit]", 3)], clip=".ds-drawer")
        sh.submit()
        sh.go("#/jobs/SJ-2026-00065")
        S["s3_ex"] = sh.shot([("#journey [data-state=blocked]", 1), ("#next-primary", 2)])
        sh.click("#next-primary"); sh.fill("#rex-task", "Reissue commercial invoice with the correct HS code")
        S["s3_review"] = sh.shot([("#rex-task", 1), ("#rex-owner", 2), ("#rex-due", 3), ("#approve-ex", 4)], clip=".ds-drawer")
        sh.submit()
        S["s3_fixed"] = sh.shot([("#gate", 1)], clip="#next-step")
        sh.go("#/reports")
        S["s3_reports"] = sh.shot([(".ds-grid-2 .ds-panel:first-child", 1)])

        # ---- Scenario 4: Ben on a phone
        ctx2 = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        q = ctx2.new_page(); ph = Shooter(q); ph.n = sh.n + 500
        q.goto(APP + "#/login"); q.wait_for_timeout(300)
        # carry the Scenario 1-3 changes across: replay is not needed for Ben's jobs (00077 is untouched)
        ph.as_("Ben Santos", "#/home")
        S["s4_home"] = ph.shot([(".ds-workcard .ds-btn", 1), (".ds-nav", 2)])
        ph.click(".ds-workcard .ds-btn"); ph.submit()
        S["s4_err"] = ph.shot([("[data-error-for=receiver]", 1), ("[data-error-for=pod]", 2)])
        ph.fill("#pod-receiver", "G. Tan (Receiving)"); ph.sample("podFile")
        q.evaluate("document.querySelector('.ds-drawer__body').scrollTop = 1000")
        S["s4_sheet"] = ph.shot([("#pod-receiver", 1), (".ds-upload", 2), (".ds-switch", 3), ("#drawerRoot button[type=submit]", 4)])
        ph.submit()
        ph.go("#/jobs/SJ-2026-00077")
        S["s4_done"] = ph.shot([("#journey", 1), ("#next-step", 2)])
        ph.go("#/jobs/SJ-2026-00077/delivery"); q.evaluate("window.scrollTo(0, document.getElementById('job-tabs').offsetTop - 70)")
        S["s4_return"] = ph.shot([("#tab-body .ds-doc:last-child .ds-btn", 1)])
        ctx2.close()

        # ---- Scenario 5: Grace, short on funds (00120)
        sh.as_("Grace Tan", "#/jobs/SJ-2026-00120")
        S["s5_job"] = sh.shot([("#gate li:first-child", 1), ("#next-primary", 2), ("#fee-clock", 3)])
        sh.js("openCompleteTask('SJ-2026-00120','T3')")
        S["s5_blocked"] = sh.shot([("#complete-blocked", 1), ("#drawerRoot button[type=submit]", 2)], clip=".ds-drawer")
        sh.js("closeDrawer()"); sh.go("#/jobs/SJ-2026-00120/money"); p.evaluate("window.scrollTo(0, document.getElementById('job-tabs').offsetTop - 70)")
        S["s5_money"] = sh.shot([("#funding-gap", 1), ("#client-funds .ds-stats", 2), ("#funds-ledger", 3)])
        sh.click("#funding-gap .ds-btn"); sh.sample("fundsProof")
        S["s5_funds"] = sh.shot([("#fd-amount", 1), (".ds-upload", 2), ("#drawerRoot button[type=submit]", 3)], clip=".ds-drawer")
        sh.submit(); p.evaluate("window.scrollTo(0, document.getElementById('job-tabs').offsetTop - 70)")
        S["s5_covered"] = sh.shot([("#client-funds .ds-stats", 1), ("#funds-ledger tbody tr:nth-child(3)", 2)])
        sh.go("#/jobs/SJ-2026-00120")
        sh.js("openCompleteTask('SJ-2026-00120','T3')"); sh.sample("taskEvidence"); sh.submit()
        S["s5_next"] = sh.shot([("#next-primary", 1)], clip="#next-step")
        sh.click("#next-primary")

        # ---- Scenario 6: Grace, hand over to Finance (00070)
        sh.go("#/jobs/SJ-2026-00070")
        S["s6_gate"] = sh.shot([("#gate li:nth-child(1) .ds-btn", 1), ("#gate li:nth-child(5) .ds-btn", 2)], clip="#next-step")
        sh.js("openDecideCharge('SJ-2026-00070','C4')"); p.check("input[value=absorb]"); sh.fill("#dc-reason", "Our late lodgement caused the extra storage days")
        S["s6_decide"] = sh.shot([("input[value=client]", 1), ("input[value=absorb]", 2), ("#dc-reason", 3)], clip=".ds-drawer")
        sh.submit()
        sh.js("openCompleteTask('SJ-2026-00070','T7')"); sh.submit()
        S["s6_ready"] = sh.shot([("#gate", 1), ("#next-primary", 2)], clip="#next-step")
        sh.click("#next-primary")
        S["s6_done"] = sh.shot([("#journey", 1), (".ds-jobhead h1 .ds-pill", 2)])

        # ---- Scenario 7: Paolo, Finance
        sh.as_("Paolo Reyes", "#/home")
        S["s7_home"] = sh.shot([(".ds-kpis", 1), (".ds-queue", 2), (".ds-readonly", 3)])
        S["s7_settle"] = sh.shot([("#settlements .ds-table", 1)], clip="#settlements")
        sh.go("#/jobs/SJ-2026-00060/billing-summary")
        S["s7_summary"] = sh.shot([(".ds-billing-summary__toolbar .ds-btn--primary", 1), ("#mock-doc-label", 2)])
        S["s7_funds"] = sh.shot([("#bs-funds", 1)], clip=["#bs-split", "#bs-funds"], pad=40)

        # ---- Scenario 8: Mark, people
        sh.as_("Mark Villar", "#/users")
        S["s8_users"] = sh.shot([("#add-user", 1), ("#user-U3 td:nth-child(4)", 2), ("#user-U3 .ds-switch", 3)])
        sh.click("#add-user"); sh.fill("#nu-name", "Nina Lopez"); sh.fill("#nu-dept", "Finance"); p.select_option("#nu-role", "Finance")
        S["s8_add"] = sh.shot([("#nu-name", 1), ("#nu-role", 2), ("#nu-blurb", 3)], clip=".ds-drawer")
        sh.submit(); sh.click("#user-U3 .ds-switch"); p.wait_for_timeout(200); p.select_option("#deact-to", "Ana Cruz")
        S["s8_handover"] = sh.shot([(".ds-drawer .ds-gate", 1), ("#deact-to", 2), ("#deact-confirm", 3)], clip=".ds-drawer")
        sh.click("#deact-confirm")
        S["s8_after"] = sh.shot([("#user-U3", 1)], clip="#users-table")
        sh.p.evaluate("window.scrollTo(0, document.getElementById('perm-matrix').offsetTop - 70)")
        S["s8_matrix"] = sh.shot([("#perm-matrix .ds-mockbadge", 1)], clip="#perm-matrix")
        sh.as_("Ana Cruz", "#/home")
        S["s8_ana"] = sh.shot([("#my-tasks .ds-workcard[data-tone=danger]", 1)], clip="#my-tasks")
        sh.go("#/audit")
        S["s8_denied"] = sh.shot([("#access-denied h3", 1), (".ds-nav", 2)])
        sh.as_("Grace Tan", "#/audit")
        S["s8_audit"] = sh.shot([("#audit-range", 1), ("#audit-search", 2), ("#audit-table tbody tr:first-child", 3)])

        # ---- Scenario 9: the customer
        sh.js("CURRENT_USER=null"); sh.go("#/track")
        sh.fill("#track-q", "bl-2026-04188")
        S["s9_lookup"] = sh.shot([("#track-q", 1), (".ds-public form .ds-btn", 2)])
        sh.click(".ds-public form .ds-btn")
        S["s9_page"] = sh.shot([("#track-status", 1), ("#action-needed", 2), (".ds-timeline", 3)])
        b.close()
    return S

# ------------------------------------------------------------------ document
def build(S):
    who = [("Ana Cruz","Dispatcher","My work","Runs customers, inquiries, quotes, jobs, documents and tasks. Sees no money."),
           ("Cathy Lim","Dispatcher","My work","A second dispatcher. Leaves the company in Scenario 8."),
           ("Ben Santos","Warehouse Crew","My work","Field work on a phone: deliveries with proof, returning containers. Sees only his jobs."),
           ("Grace Tan","Manager","Command center","Decisions: exceptions, customs holds, client money, handing jobs to Finance."),
           ("Mark Villar","Admin","Command center","Everything a Manager does, plus users, roles and access."),
           ("Paolo Reyes","Finance","Finance desk","Read only: jobs waiting for Finance, how each settles, the Billing Summary."),
           ("Customer","No account","Tracking page","Shipment status in plain words. Never money, staff or internal detail.")]
    who_rows = "".join(f"<tr><td><b>{a}</b></td><td>{b_}</td><td>{c}</td><td>{d}</td></tr>" for a,b_,c,d in who)
    stages = ["Booked","Documentation","Sailed","Arrived at Port","Customs Clearance","Out for Delivery","Delivered","Billing Ready","Closed"]
    gates = ["Vessel and voyage booked","All 5 documents approved + task: Verify shipment documents complete","Confirm the vessel arrived","Start customs (free storage is running)",
             "Seven customs steps, each with its own task (lodge entry, pay duties with enough client funds, delivery order, book truck)","Only by confirming delivery with receiver + proof","All tasks done, documents approved, no open exceptions, extra charges decided, a charge recorded, no unresolved damage","Manager closes the job","Nothing left"]
    stage_rows = "".join(f"<tr><td class='num'>{i+1}</td><td><b>{s}</b></td><td>{g}</td></tr>" for i,(s,g) in enumerate(zip(stages,gates)))

    changes = [
      ("Home", "Managers landed on a wall of eight tables; field roles landed on a separate My Tasks page.", "Every role lands on Home, which answers one question: what needs me today? Managers get a Command center (KPI doors, the pipeline, a Needs you queue sorted by consequence, fee clocks). Dispatchers and crew get task cards. Finance gets a Finance desk."),
      ("Moving a job", "“Update status” opened a dropdown where every option but one was disabled, and the reason was in a warning box.", "A Next step panel on every job says what happens now, lists the gate (what must be true first), puts the fix beside each missing item, and offers exactly one primary button."),
      ("Customs", "A second stepper, a lane dropdown, a hold link and an “Advance customs stage” button in a separate panel.", "Customs is one inner meter on the main track and a strip in the Next step panel. Each of the seven steps has its own gate (lodge entry, enough funds, pay duties…)."),
      ("Colour", "Every stage was a blue “info” pill, so colour carried no meaning.", "Stage is a neutral navy outline (where it is). Health is the only coloured signal (On track, Needs attention, Blocked, With Finance)."),
      ("Sales", "Inquiry, quotation and “convert” were three pages you hopped between.", "One inquiry page: a checklist toward “becomes a job”, then the four steps (inquiry, quotation versions, client approval, job) on one scroll."),
      ("Shipment 360", "The tabs where you do the work were below four read-only panels; Overview repeated them.", "Work is above the fold (next step, fee clock, key facts); the record is in tabs below, and the page opens on the tab the next step needs."),
      ("Money", "Short on funds was a warning; paying the duty was still allowed.", "Paying duties is blocked while client funds are short, and the job page makes “Add funds received” the primary action. Money is also part of the customs gate."),
      ("People leaving", "Switch someone off, then find their tasks job by job.", "Switching someone off opens a hand-over: see their open work, hand all of it to a colleague in one step, logged on every job."),
      ("Damage", "A damaged delivery blocked billing forever (no way to resolve it).", "A Manager records how the damage was settled; billing can then proceed."),
      ("Phones", "Tables overflowed; the bottom bar had unlabelled icons.", "Lists become cards; drawers become bottom sheets with a sticky confirm button; the bottom bar has labels."),
    ]
    change_rows = "".join(f"<tr><td><b>{a}</b></td><td>{b_}</td><td>{c}</td></tr>" for a,b_,c in changes)

    design = [
      ("Navy for action, red only as a mark", "Navy is Top1Movers’ own colour, lifted for screen readability. The brand red appears only on the logo, the 3px top rule and the selected tab underline, so red never competes with real danger."),
      ("Status colour = meaning, never decoration", "Green, amber and red appear only when something is OK, needs attention or is blocked, always with an icon and a word, so colour-blind users and printed pages lose nothing."),
      ("One primary button per screen", "The single solid navy button is always the next thing to do. Everything else is tonal or ghost, so the eye finds the action in under a second."),
      ("Numbers are doors", "Every KPI tile opens the list behind it. A number you cannot act on is decoration. There are no invented “+2 vs last week” trends: sample data cannot back them."),
      ("Motion only marks change", "A stage connector fills once when a job moves; the Next step panel eases in with its new state; lists stagger so the eye reads top-down; bars grow from zero. The current stage breathes to show “in progress”. All motion stops for users who ask their system for reduced motion."),
      ("Cards float, tables do not", "Panels that hold decisions have a soft lift; dense tables stay flat with hairlines, because hours of scanning rows needs calm, not shadows."),
      ("Monospace for IDs", "Job, container and BL numbers use a monospace face so 0/O and 1/l never get confused when read over the phone."),
      ("Plain words for customers", "The tracking page uses seven customer-friendly steps (“On the water”), never internal status names, money or staff names."),
    ]
    design_rows = "".join(f"<tr><td><b>{a}</b></td><td>{b_}</td></tr>" for a,b_ in design)

    H = []
    H.append(f"""<section class="cover"><div class="cover-bar"></div>
      <p class="eyebrow">Top1Movers Operations Portal · Mockup v3</p>
      <h1>Scenario manual</h1>
      <p class="lead">How a shipment moves through the portal, told as nine situations. Written for presenting the mockup and for checking that it behaves as described.</p>
      <table class="toc"><tr><th>#</th><th>Scenario</th><th>Who</th><th>Main sample jobs</th></tr>
      <tr><td>1</td><td>A new customer asks for a quote</td><td>Dispatcher · Ana Cruz</td><td>creates SJ-2026-00123</td></tr>
      <tr><td>2</td><td>Keep the paperwork moving</td><td>Dispatcher · Ana Cruz</td><td>SJ-2026-00095, 00088</td></tr>
      <tr><td>3</td><td>Customs trouble</td><td>Manager · Grace Tan</td><td>SJ-2026-00130, 00065</td></tr>
      <tr><td>4</td><td>Delivery day, on a phone</td><td>Warehouse Crew · Ben Santos</td><td>SJ-2026-00077</td></tr>
      <tr><td>5</td><td>Whose money is it?</td><td>Manager · Grace Tan</td><td>SJ-2026-00120</td></tr>
      <tr><td>6</td><td>Hand over to Finance</td><td>Manager · Grace Tan</td><td>SJ-2026-00070</td></tr>
      <tr><td>7</td><td>Finance reads the result</td><td>Finance · Paolo Reyes</td><td>SJ-2026-00060, 00101</td></tr>
      <tr><td>8</td><td>People come and go</td><td>Admin · Mark Villar, then Ana</td><td>SJ-2026-00082</td></tr>
      <tr><td>9</td><td>What the customer sees</td><td>Customer, no account</td><td>SJ-2026-00065</td></tr></table>
      <p class="note">Every screenshot in this manual is taken automatically from the current build of the mockup, with red numbered markers on what to look at or click, in order. All names, numbers and files are fictional sample data.</p></section>""")

    H.append(f"""<section><h2 class="part">The idea in one page</h2>
      <p>Before v3 the portal showed everything but told you nothing about what to do. v3 is built on three rules you will see on every screen.</p>
      <div class="three">
        <div><b>1 · Home answers “what needs me?”</b><p>Every person lands on Home. It lists only their work, most urgent first, and each item carries the button that resolves it.</p></div>
        <div><b>2 · Every job answers “what now?”</b><p>The Next step panel on a job shows the one thing that happens next, the checklist (the <i>gate</i>) that must be true first, and the fix beside each missing item.</p></div>
        <div><b>3 · Where it is and whether it is OK are separate</b><p>The stage (a navy outline pill) says where a job is. The health pill (green, amber, red) says whether it is OK. Only health is coloured.</p></div>
      </div>
      <h3 class="sub">The nine stages, and what lets a job leave each one</h3>
      <table class="grid"><tr><th>#</th><th>Stage</th><th>The gate (what must be true to move on)</th></tr>{stage_rows}</table>
      <p class="small">A Manager or Admin can override the order (real jobs are not always tidy), but must give a reason, which goes to the audit trail. An open exception or a customs hold freezes the job until a Manager acts.</p>
      <h3 class="sub">Anatomy of a job page</h3>
      {img(S["anatomy"], "(1) Health: is it OK? (2) Stage: where is it? (3) The journey; customs shows its seven inner steps as a small meter. (4) Next step: what happens now, the gate, and the one primary button. (5) The fee clock: free days before the port or shipping line starts charging.")}
      {img(S["tabs"], "(1) The record itself sits in tabs below the work. A number on a tab is work waiting there; amber or red means it matters.")}
    </section>""")

    H.append(f"""<section><h2 class="part">Before you begin</h2>
      <p>Open <code>apps/mockup/index.html</code> in Chrome or Edge (double-click it). Nothing is installed or saved. The portal’s clock is fixed at <b>Monday 28 September 2026</b>, so every “overdue” and “days left” assumes that date.</p>
      {step(1, "Sign in", "<p>Sign-in is simulated: <b>Sign in with Microsoft</b> (1), then pick a person. Customers use <b>Track a shipment</b> (2) and need no account.</p>" + img(S["login"]) + img(S["picker"], "The account chooser lists the demo people, each with their role. A deactivated person cannot be picked.", narrow=True))}
      {step(2, "Find your way around", "<p>(1) Search anything: job, container, BL, customer or inquiry (Ctrl K). (2) Overdue alerts: the escalation emails the portal would send. (3) Your avatar: switch person without losing data, or sign out. (4) The menu shows only what your role may use.</p>" + img(S["topbar"]))}
      <h3 class="sub">Who is who</h3><table class="grid"><tr><th>Person</th><th>Role</th><th>Lands on</th><th>In one line</th></tr>{who_rows}</table>
    </section>""")

    # Scenario 1
    H.append(scenario(1, "A new customer asks for a quote",
      "Test Freight Co. has never worked with Top1Movers. Its contact, Lea Ramos, wants one container of insured goods brought from Shanghai to Pasig. Ana has to set the customer up, log the request, send a price, record the client’s signed approval and open the shipment job, typing each detail only once.",
      "Dispatcher: Ana Cruz", "Shipment job SJ-2026-00123 at Booked, with its documents, tasks and history set up automatically."))
    H.append(step(1, "Add the customer", "<p>Open <b>Customers</b> and choose <b>New customer</b> (1).</p>" + img(S["s1_customers"]) +
      "<p>Start typing the name. If a similar company already exists, the portal warns you (1) and offers to open it, so nobody creates a second record by accident.</p>" + img(S["s1_dup"], narrow=True) +
      "<p>The company name (1), contact phone (2) and contact email (3) are required. Delivery instructions (4) are worth filling: they are shown to the crew on every delivery for this customer. Save (5).</p>" + img(S["s1_newcust"], narrow=True) +
      see("the customer page, with the instructions shown on the right.")))
    H.append(step(2, "Log the inquiry", "<p>On the customer page choose <b>New inquiry</b> (1). The customer is fixed to this one.</p>" + img(S["s1_custpage"]) +
      "<p>Only cargo (1) and route are needed to start. Leave the container type (2) empty for now, as a real first call often does, and register (3).</p>" + img(S["s1_inq"], narrow=True) +
      see("inquiry INQ-2026-0045, and a checklist saying what is still needed before it can become a job (1). The primary button (2) is the first thing to fix.") + img(S["s1_deal"]) +
      why("you can price a request before every detail is known, but a job cannot run without them. The gap is visible from the first minute instead of surfacing at the port.")))
    H.append(step(3, "Fill the gaps and send a price", "<p><b>Fill in</b> opens the details; choose the container type (1) and pick the pickup date from the calendar (2).</p>" + img(S["s1_fill"], narrow=True) +
      "<p>The primary button becomes <b>Create quotation</b>. Enter the total (1) and create version 1 (2). Every later revision becomes v2, v3… and earlier versions are kept.</p>" + img(S["s1_quote"], narrow=True) +
      see("“Waiting on the client” (1): the only item left is the client’s signed approval, the conforme. The button to record it is ready (2).") + img(S["s1_waiting"])))
    H.append(step(4, "Record the client’s approval and create the job", "<p>Record who approved (1) and save (2). A signed copy can be attached.</p>" + img(S["s1_conforme"], narrow=True) +
      "<p>With everything agreed, the primary button is <b>Create shipment job</b> (1).</p>" + img(S["s1_ready"]) +
      "<p>The confirmation lists exactly what carries over, so nothing is retyped. Create it (1).</p>" + img(S["s1_convert"], narrow=True) +
      see("job SJ-2026-00123 at stage 1 of 9 (1). The Next step (2) already says what comes next, and the five required documents wait on the Documents tab (3).") + img(S["s1_job"])))

    # Scenario 2
    H.append(scenario(2, "Keep the paperwork moving",
      "Golden Harvest’s job SJ-2026-00095 is stuck in Documentation: one document waits for review, one was rejected, one is missing. Pacific Rim’s ship on job SJ-2026-00088 has just reached Manila. Ana has to get the paperwork approved, move both jobs on, and keep the customer’s page truthful.",
      "Dispatcher: Ana Cruz", "SJ-2026-00095 sailed with every document approved; SJ-2026-00088 arrived at port, with the customer page already showing it."))
    H.append(step(1, "Read the gate", "<p>Open SJ-2026-00095. The Next step panel says “4 things left before Sailed” and lists them, each with its fix: (1) review the Bill of Lading, (2) replace the rejected Certificate of Origin (the reason is right there), (3) upload the missing Import Permit, (4) complete the verification task.</p>" + img(S["s2_gate"]) +
      why("instead of remembering the rules, the rule is on the screen. The primary button is simply the first fix you are allowed to do.")))
    H.append(step(2, "Review, reject with a reason, or approve", "<p><b>Review</b> opens the document with the customer’s requirements beside it. Trying to <b>Reject</b> (2) without a reason is refused (1): whoever replaces it must know what to fix. If it is correct, <b>Approve</b> (3).</p>" + img(S["s2_reject"], narrow=True)))
    H.append(step(3, "Replace and upload", "<p><b>Replace</b> shows why the last version was rejected (1). Attach the file (2); in the mockup, “Use a sample file” works too. Upload (3). The document becomes v3 and goes back to review.</p>" + img(S["s2_upload"], narrow=True) +
      see("the gate updating as you go (1): uploaded documents move to “waiting for review”, approved ones collapse into the summary line.") + img(S["s2_after_upload"])))
    H.append(step(4, "Complete a task that needs proof", "<p>Some tasks cannot be done without a file. Mark it done without one and the portal says <i>Attach the completion evidence first</i> (1). Attach it (2) and confirm.</p>" + img(S["s2_proof"], narrow=True) +
      "<p>With every line ticked, the primary button becomes <b>Confirm vessel sailed</b> (1).</p>" + img(S["s2_ready"]) +
      see("the journey fill in to Sailed (1) and a confirmation (2).") + img(S["s2_moved"])))
    H.append(step(5, "Move a ship to port, and check what the customer sees", "<p>On SJ-2026-00088 the only step is <b>Confirm arrival at port</b>. After it, the new stage animates in (1) and the free storage clock starts (2).</p>" + img(S["s2_088"]) +
      "<p>The History tab records who did it and when (1).</p>" + img(S["s2_history"]) +
      see("the customer’s tracking page already headed “Arrived at port” (1), with no phone call or email.") + img(S["s2_track"])))

    # Scenario 3
    H.append(scenario(3, "Customs trouble",
      "Grace starts her day on Home. Sample Trading’s container (SJ-2026-00130) was picked for a physical inspection, a Red lane, and is on hold. On Golden Harvest’s SJ-2026-00065, the crew raised an exception: the HS code on the invoice does not match the Bill of Lading. Both jobs are frozen until a manager acts.",
      "Manager: Grace Tan", "The hold cleared and customs moving again on one job; the exception approved with a named fix and owner on the other."))
    H.append(step(1, "Start from the Command center", "<p>(1) KPI tiles: each is a question with its answer, and a click opens the jobs behind it. (2) The pipeline: every stage with its job count; a red lock counts blocked jobs. (3) Needs you: everything waiting for a manager, most urgent first, filterable. (4) Fee clocks: free days left before storage or detention fees.</p>" + img(S["s3_home"]) +
      "<p>Every row carries the button that resolves it, so most decisions are one click from Home: (1) review the exception, (2) open the held job.</p>" + img(S["s3_queue"]) +
      why("a manager’s job is decisions, so Home is a decision list sorted by consequence (frozen jobs, then late work, then money, then clocks), not a wall of tables.")))
    H.append(step(2, "Clear a customs hold", "<p>SJ-2026-00130 is <b>Blocked</b>: the panel explains the hold (1) and what the Red lane means (2). Only a Manager or Admin sees <b>Clear hold</b> (3); a dispatcher sees who they are waiting on.</p>" + img(S["s3_hold"]) +
      "<p>Once cleared, the customs strip shows step 2 of 7 (1) and the next move (2).</p>" + img(S["s3_cleared"])))
    H.append(step(3, "Move customs forward, and say whose move it is", "<p>Customs moves one step at a time. When it reaches Payment Pending the portal asks who pays: Top1Movers from the client’s deposit, or the client directly (1).</p>" + img(S["s3_party"], narrow=True) +
      see("“Waiting on the client” (1) and a gate item naming who to chase (2). Nobody has to ask whose move it is.") + img(S["s3_waiting"]) +
      "<p>When the client pays, <b>Client has paid</b> opens a confirmation (1). Proof of payment is required (2); a deposit slip already recorded while waiting is reused. Confirm with <b>Yes, client has paid</b> (3).</p>" + img(S["s3_paid"], narrow=True) +
      why("releasing the duty payment lets Top1Movers spend money at customs, so it is never one accidental click, and the proof is kept on the job’s record.")))
    H.append(step(4, "Decide the exception", "<p>On SJ-2026-00065 the journey shows the frozen stage in red (1) and the primary button is <b>Review exception</b> (2).</p>" + img(S["s3_ex"]) +
      "<p>Approving means “this is real”: name the fix (1), who does it (2) and by when (3), then <b>Approve &amp; assign fix</b> (4). Rejecting needs a note.</p>" + img(S["s3_review"], narrow=True) +
      see("the job unfrozen, and the fix now part of its gate (1): the job cannot move on until the corrected invoice is done.") + img(S["s3_fixed"]) +
      why("approving an exception must not quietly make the problem disappear. The fix becomes a task that blocks the next move until it is actually done.")))
    H.append(step(5, "How is the operation doing?", "<p>For analysis rather than action, open <b>Reports</b>: jobs by stage (1), health, document status, workload, and the money picture. Every chart has one line saying what it tells you, and each bar opens its jobs.</p>" + img(S["s3_reports"])))

    # Scenario 4
    H.append(scenario(4, "Delivery day, on a phone",
      "The truck with Meridian’s container (SJ-2026-00077) has reached the consignee in Pasig. Ben is in the yard with a phone. He has to confirm who received the goods and attach proof, the photo of the signed receipt. Without that proof the job cannot be billed.",
      "Warehouse Crew: Ben Santos", "SJ-2026-00077 Delivered with receiver and proof, and the empty-container return waiting on his list."))
    H.append('<div class="two">' + step(1, "Deliveries come first", "<p>Ben’s Home leads with deliveries to confirm, with the customer’s delivery instructions on the card. The big button (1) is the whole job. The bottom bar (2) has labels, not just icons.</p>" + img(S["s4_home"], narrow=True)) +
      step(2, "Confirm with proof", "<p>The form opens as a bottom sheet. Confirming without the receiver or the proof is refused, with the reason under each field (1, 2).</p>" + img(S["s4_err"], narrow=True)) + '</div>')
    H.append('<div class="two">' + step(3, "Fill it in", "<p>Receiver (1), the proof photo (2), the damage switch if anything arrived broken (3), then <b>Confirm delivery</b> (4), which stays at the bottom of the sheet.</p>" + img(S["s4_sheet"], narrow=True)) +
      step(4, "Done", "<p>The job is Delivered (1). The next step (2) is the Finance checklist, which includes returning the empty container.</p>" + img(S["s4_done"], narrow=True)) + '</div>')
    H.append(step(5, "Return the empty container", "<p>On the Delivery tab the detention clock shows how long before the shipping line charges; <b>Mark returned</b> (1) stops it.</p>" + img(S["s4_return"], narrow=True) +
      why("field crew work on phones in a yard. One big action per card, forms as bottom sheets with the confirm button always in reach, and 44px touch targets.")))

    # Scenario 5
    H.append(scenario(5, "Whose money is it?",
      "Top1Movers pays duties and freight for clients first and bills them back, like a personal shopper who pays up front. On Golden Harvest’s SJ-2026-00120 a customs duty of ₱18,400 is due 30 September, but only ₱10,000 of the client’s money is left, and free storage ends in two days.",
      "Manager: Grace Tan", "The shortfall covered, the duty paid with a receipt, and customs moved on."))
    H.append(step(1, "The shortfall blocks the payment", "<p>The gate says it plainly: not enough client funds to pay the duty (1). The primary button is <b>Add funds received</b> (2). The fee clock (3) shows why it is urgent.</p>" + img(S["s5_job"]) +
      "<p>Trying to mark the duty as paid anyway is refused (1, 2).</p>" + img(S["s5_blocked"], narrow=True) +
      why("a warning that can be ignored is not a control. The portal stops a payment the client’s money does not cover, and names the fix.")))
    H.append(step(2, "The client’s money notebook", "<p>The Money tab: the shortfall in one sentence (1), Money in / Money spent / Left over (2), and every movement in date order, including what is due but not yet paid (3).</p>" + img(S["s5_money"])))
    H.append(step(3, "Record the deposit", "<p>The amount is pre-filled with the shortfall (1). Attach the deposit slip (2) and save (3).</p>" + img(S["s5_funds"], narrow=True) +
      see("Left over rising to cover the duty (1), and the deposit in the notebook (2). The shortfall banner is gone.") + img(S["s5_covered"]) +
      "<p>Now the duty can be paid (with its receipt as proof), and the primary button moves customs on (1).</p>" + img(S["s5_next"])))

    # Scenario 6
    H.append(scenario(6, "Hand over to Finance",
      "Sample Trading’s SJ-2026-00070 has been delivered. Before Finance can bill it, two things are open: a storage fee of ₱6,800 that was never in the approved quotation, and the empty container still has to be returned.",
      "Manager: Grace Tan", "The surprise charge decided, the checklist complete, and the job handed to Finance."))
    H.append(step(1, "The Finance checklist is the gate", "<p>From Delivered, the gate is the handoff checklist. Each open line has its fix: (1) complete the container return, (2) decide the extra charge.</p>" + img(S["s6_gate"])))
    H.append(step(2, "Decide the surprise charge", "<p>Either the client agreed to pay it (1), recorded with who approved it, or Top1Movers absorbs it (2) with a written reason (3), which comes off the margin and goes in the audit trail.</p>" + img(S["s6_decide"], narrow=True) +
      "<p>With every line ticked (1), the primary button is <b>Mark ready for Finance</b> (2).</p>" + img(S["s6_ready"]) +
      see("the job at Billing Ready (1) and its health “With Finance” (2).") + img(S["s6_done"])))

    # Scenario 7
    H.append(scenario(7, "Finance reads the result",
      "Paolo in Finance needs to know which jobs are ready to bill and how each one settles: does the client get a refund, owe a balance, or is it even?",
      "Finance: Paolo Reyes", "The jobs waiting for Finance, each outcome, and the printable Billing Summary."))
    H.append(step(1, "The Finance desk", "<p>(1) What is waiting and what it is worth. (2) Jobs handed to Finance, oldest first, each with its Billing Summary. (3) Everything is read only for Finance.</p>" + img(S["s7_home"]) + "<p>Further down, how every delivered job settles (1): refund, balance to bill or fully settled, and “Provisional” while an extra charge is undecided.</p>" + img(S["s7_settle"])))
    H.append(step(2, "The Billing Summary", "<p>A clean page for the handoff: Print or export (1). It is labelled a mock document (2) and is not an invoice.</p>" + img(S["s7_summary"]) + "<p>The client funds block ends with the final position (1).</p>" + img(S["s7_funds"], narrow=True)))

    # Scenario 8
    H.append(scenario(8, "People come and go",
      "Nina Lopez joins Finance and Cathy Lim, a dispatcher, is leaving. Cathy still owns open work, including a customs task on BlueWave’s SJ-2026-00082 that is already four days overdue. Mark has to add Nina, switch Cathy off, and make sure nothing she owned falls through the cracks.",
      "Admin: Mark Villar, then Dispatcher: Ana Cruz", "Nina added; Cathy switched off with every open task handed to Ana; proof that a role cannot open pages outside its permissions."))
    H.append(step(1, "Users and roles", "<p><b>Add user</b> (1). The Open work column (2) shows what each person still owns. Each row has an on/off switch (3).</p>" + img(S["s8_users"]) +
      "<p>Name (1) and role (2); the role’s meaning is spelled out (3), so nobody guesses what a role can see.</p>" + img(S["s8_add"], narrow=True)))
    H.append(step(2, "Switch someone off, and hand over their work", "<p>Switching Cathy off opens a hand-over: her open tasks (1), who takes them (2), and <b>Switch off and hand over</b> (3). Due dates stay, so overdue work stays visibly overdue.</p>" + img(S["s8_handover"], narrow=True) +
      see("Cathy inactive with no open work left (1). Her history stays in the audit trail.") + img(S["s8_after"]) +
      why("before, switching someone off quietly left their tasks with a person who could no longer sign in. Now the hand-over is part of the same action.")))
    H.append(step(3, "The colleague picks it up", "<p>Ana’s My work now leads with the overdue task on SJ-2026-00082 (1).</p>" + img(S["s8_ana"])))
    H.append(step(4, "Roles only see what they may use", "<p>The permission matrix is marked illustrative (1) until agreed with Top1Movers.</p>" + img(S["s8_matrix"]) +
      "<p>Typing <code>#/audit</code> into the address bar as a dispatcher shows a plain “Not available for Dispatcher” (1); the menu (2) never offered it.</p>" + img(S["s8_denied"]) +
      "<p>As a Manager, the audit trail is filterable by date (1) and searchable (2); every entry names the person, the action and the job (3).</p>" + img(S["s8_audit"])))

    # Scenario 9
    H.append(scenario(9, "What the customer sees",
      "Golden Harvest wants an update on SJ-2026-00065 but has no login. They open the tracking page and type their bill of lading number.",
      "Customer: no account", "A plain, friendly status, with an “action needed” note when it is genuinely their move, and no internal details."))
    H.append(step(1, "Enter any number they have", "<p>Job, bill of lading or container number (1); capitals and spaces do not matter. <b>Track shipment</b> (2).</p>" + img(S["s9_lookup"])))
    H.append(step(2, "Read the status", "<p>A plain headline (1). Because the customs duty on this job is waiting for the client (set in Scenario 3), the page says <b>Action needed from you</b> (2). The timeline (3) uses seven customer words, never internal statuses.</p>" + img(S["s9_page"]) +
      see("no money, staff names, tasks or exception details anywhere on the page.")))

    H.append(f"""<section><h2 class="part">What changed from v2, and why</h2><table class="grid"><tr><th>Area</th><th>Before (v2)</th><th>Now (v3)</th></tr>{change_rows}</table>
      <h2 class="part" style="margin-top:28px">Why it looks the way it does</h2><table class="grid"><tr><th>Choice</th><th>Reason</th></tr>{design_rows}</table>
      <h2 class="part" style="margin-top:28px">Notes</h2>
      <ul class="small"><li>The workflow follows the client’s written blueprint and general Philippine customs-brokerage practice. It has not been confirmed line by line with Top1Movers’ operations; wording and rules may change after discovery.</li>
      <li>Still to decide with the client: who may move a job’s stage (today Dispatcher, Manager, Admin), several containers per job, vessel delays as their own status, partial deliveries, and a secure expiring link for the customer page instead of a guessable number.</li>
      <li>The UAT workbook (<code>docs/testing/UAT-test-cases.xlsx</code>) was written for v2. Its steps name screens and buttons that v3 has replaced, so it needs updating before the next test round.</li>
      <li>All names, numbers and files are fictional. Nothing is saved: refresh the page to start over.</li></ul></section>""")

    css = f"""@font-face {{ font-family: Inter; src: url('{FONT}'); font-weight: 100 900; }}
    @page {{ size: A4; margin: 16mm 14mm 18mm; }}
    body {{ font: 10.5pt/1.5 Inter, Arial, sans-serif; color: #262b52; margin: 0; }}
    h1, h2, h3 {{ color: #2f3a8f; line-height: 1.2; margin: 0; }}
    code {{ font-family: Consolas, monospace; font-size: .92em; background: #eff2f8; padding: 1px 4px; border-radius: 4px; }}
    section {{ break-before: page; }}
    .cover {{ break-before: auto; padding-top: 30mm; }}
    .cover-bar {{ height: 4px; width: 60px; background: #e5383b; margin-bottom: 18px; }}
    .eyebrow {{ text-transform: uppercase; letter-spacing: .08em; font-size: 9pt; color: #545b7c; font-weight: 600; margin: 0 0 6px; }}
    .cover h1 {{ font-size: 34pt; letter-spacing: -.01em; }}
    .lead {{ font-size: 13pt; color: #545b7c; max-width: 150mm; margin: 10px 0 24px; }}
    .note, .small {{ font-size: 9pt; color: #545b7c; }}
    table {{ border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9.5pt; }}
    th {{ text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .05em; color: #5d6485; border-bottom: 1px solid #c9d1e3; padding: 6px 8px; }}
    td {{ border-bottom: 1px solid #e3e8f1; padding: 6px 8px; vertical-align: top; }}
    td.num {{ color: #2f3a8f; font-weight: 700; width: 18px; }}
    .toc td:first-child {{ color: #2f3a8f; font-weight: 700; width: 18px; }}
    h2.part {{ font-size: 18pt; margin-bottom: 8px; break-after: avoid; }}
    tr {{ break-inside: avoid; }} h3.sub {{ break-after: avoid; }}
    h3.sub {{ font-size: 12pt; margin: 16px 0 4px; }}
    .three {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }}
    .three > div {{ background: #f2f4fc; border-radius: 10px; padding: 10px 12px; }}
    .three b {{ color: #2f3a8f; }} .three p {{ margin: 4px 0 0; font-size: 9.5pt; }}
    .scenario {{ margin-bottom: 8px; }}
    .sc-head {{ border-left: 0; }}
    .sc-n {{ font-size: 9pt; letter-spacing: .1em; font-weight: 700; color: #e5383b; }}
    .sc-head h2 {{ font-size: 20pt; margin: 2px 0 10px; }}
    .sc-box {{ background: #1c2050; color: #fff; border-radius: 12px; padding: 14px 16px; display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }}
    .sc-box b {{ color: #c4c9ea; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; }}
    .sc-box p {{ margin: 4px 0 0; font-size: 10pt; }}
    .sc-meta {{ display: grid; gap: 10px; }}
    .step {{ margin: 14px 0 6px; }}
    .step h3 {{ font-size: 12.5pt; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; break-after: avoid; }}
    .step h3 span {{ width: 22px; height: 22px; border-radius: 50%; background: #2f3a8f; color: #fff; font-size: 10pt; display: inline-grid; place-items: center; flex: none; }}
    .step p {{ margin: 4px 0; }}
    figure {{ margin: 8px 0 10px; break-inside: avoid; }}
    figure img {{ max-width: 100%; max-height: 98mm; border: 1px solid #d5dbe8; border-radius: 8px; display: block; margin: 0 auto; }}
    figure.narrow img {{ width: auto; max-width: 100%; max-height: 105mm; }}
    figcaption {{ text-align: left; font-size: 8.5pt; color: #545b7c; margin-top: 4px; }}
    .see {{ background: #e8f4ee; border-radius: 8px; padding: 6px 10px; font-size: 9.5pt; break-inside: avoid; }}
    .see b {{ color: #1f7a55; }}
    .why {{ background: #f2f4fc; border-left: 0; border-radius: 8px; padding: 6px 10px; font-size: 9.5pt; break-inside: avoid; }}
    .why b {{ color: #2f3a8f; }}
    .two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }}
    .two figure.narrow img {{ max-height: 150mm; }}
    ul.small li {{ margin: 4px 0; }}"""
    doc = f"<!doctype html><html><head><meta charset='utf-8'><style>{css}</style></head><body>{''.join(H)}</body></html>"
    return doc

def main():
    S = capture()
    doc = build(S)
    html_path = IMG / "manual.html"; html_path.write_text(doc, encoding="utf-8")
    with sync_playwright() as pw:
        b = pw.chromium.launch(); p = b.new_page()
        p.goto(html_path.as_uri()); p.wait_for_timeout(800)
        p.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True,
              header_template="<span></span>",
              footer_template="<div style='font:8px Arial;color:#8794ae;width:100%;padding:0 14mm;display:flex;justify-content:space-between'><span>Top1Movers Operations Portal · Scenario manual v3 · sample data</span><span>Page <span class='pageNumber'></span> of <span class='totalPages'></span></span></div>",
              margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
        b.close()
    print("Wrote", OUT, f"{OUT.stat().st_size/1024/1024:.1f} MB", "screens in", IMG)

if __name__ == "__main__":
    main()
