"""Builds docs/workflow/E2E-Test-Guide.pdf: one shipment from new customer to Closed, for testers.

Plays the whole process in the real mockup (apps/mockup/index.html) with Playwright and screenshots each
screen with red numbered markers on what to click. Rebuild after any mockup change:

    python docs/workflow/build_e2e_guide.py
"""
import base64, html, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs/demo/manual"))
import build_manual as bm  # reuse its Shooter (screenshots + red markers)

APP = bm.APP
OUT = ROOT / "docs/workflow/E2E-Test-Guide.pdf"
FONT, LOGO = bm.FONT, (ROOT / "packages/design-system/assets/top1movers-logo.png").as_uri()

DATA = [("Company name", "Test Freight Co."), ("Contact person", "Lea Ramos"), ("Phone", "+63 917 555 0123"),
        ("Email", "lea@testfreight.ph"), ("Cargo", "Insured goods, 1 container"), ("From", "Shanghai, CN"),
        ("Final destination", "Pasig, PH"), ("Container type", "20ft dry"), ("Requested pickup", "05 Oct 2026"),
        ("Delivery address", "Unit 5, Pasig Industrial Park, Pasig City, PH"), ("Quotation total", "150,000.00 (default)"),
        ("Received by (delivery)", "R. Santos (Receiving)"), ("Charge", "Ocean freight, 120,000.00, already paid")]

# ------------------------------------------------------------------ capture
def capture():
    S, steps = {}, []  # steps: (part, title, [actions], [shots], result)
    def step(part, title, actions, shots, result=None): steps.append((part, title, actions, shots, result))
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 820}, device_scale_factor=1.5)
        p = ctx.new_page(); sh = bm.Shooter(p)
        E = p.evaluate
        def tag(css, text, name):
            """Marks the first `css` element containing `text` so it can take a red marker: [data-mk=name]."""
            p.locator(css, has_text=text).first.evaluate(f"e => e.setAttribute('data-mk', '{name}')")
            return f"[data-mk={name}]"
        nxt_shot = lambda n=1: sh.shot([("#next-primary", n)], clip="#next-step")
        def drawer(marks):
            # Shrink the drawer to its content so the screenshot has no empty band above the buttons.
            E("document.querySelector('#drawerRoot .ds-drawer').style.cssText += ';height:auto;max-height:none;align-self:flex-start'; document.querySelector('#drawerRoot .ds-drawer__body').style.flex = 'none'")
            return sh.shot(marks, clip=".ds-drawer")
        submit = "#drawerRoot button[type=submit]"
        sample = "#drawerRoot .ds-upload + .ds-link"
        def nxt(): sh.click("#next-primary")

        # ---- Sign in
        p.goto(APP + "#/login"); p.wait_for_timeout(400)
        a = sh.shot([("#ms-signin", 1)])
        sh.click("#ms-signin"); c = sh.shot([(".ds-acct-row", 2)], clip=".ds-acct-picker")
        step("A", "Sign in as Ana Cruz (Dispatcher)", ["Click <b>Sign in with Microsoft</b>.", "Click <b>Ana Cruz</b>."], [a, c])
        sh.click(".ds-acct-row"); p.wait_for_timeout(300)

        # ---- Customer
        sh.go("#/customers")
        a = sh.shot([(".ds-nav [onclick*=\"'#/customers'\"]", 1), (".ds-page-head .ds-btn--primary", 2)])
        step("A", "Add the customer", ["Click <b>Customers</b> in the sidebar.", "Click <b>New customer</b>."], [a])
        sh.click(".ds-page-head .ds-btn--primary")
        sh.fill("#nc-name", "Test Freight Co."); E("checkDuplicate('Test Freight Co.')"); sh.fill("#nc-contact", "Lea Ramos")
        sh.fill("#nc-phone", "+63 917 555 0123"); sh.fill("#nc-email", "lea@testfreight.ph")
        sh.fill("#nc-addr", "Unit 5, Pasig Industrial Park, Pasig City, PH")
        a = drawer([("#nc-name", 1), ("#nc-contact", 2), ("#nc-phone", 3), ("#nc-email", 4), ("#nc-addr", 5), (submit, 6)])
        step("A", "Fill in the customer", ["Company name", "Contact person", "Phone", "Email", "Delivery address", "Click <b>Save customer</b>."], [a],
             "The customer page opens.")
        sh.submit()

        # ---- Inquiry
        a = sh.shot([("#cust-new-inquiry", 1)])
        sh.click("#cust-new-inquiry")
        sh.fill("#inq-cargo", "Insured goods, 1 container"); sh.fill("#inq-origin", "Shanghai, CN"); sh.fill("#inq-dest", "Pasig, PH")
        p.select_option("#inq-ctype", "20ft dry"); sh.fill("#inq-pickup", "2026-10-05")
        b2 = drawer([("#inq-cargo", 2), ("#inq-origin", 3), ("#inq-dest", 4), ("#inq-ctype", 5), ("#inq-pickup", 6), (submit, 7)])
        step("A", "Register the inquiry", ["Click <b>New inquiry</b>.", "Cargo", "From (foreign port)", "Final destination", "Container type",
             "Requested pickup: pick the date from the calendar.", "Click <b>Register inquiry</b>."], [a, b2], "The inquiry page opens.")
        sh.submit()

        # ---- Quotation, conforme, job
        a = nxt_shot(); nxt(); b2 = drawer([("#qt-total", 2), (submit, 3)])
        step("A", "Create the quotation", ["Click <b>Create quotation</b>.", "Check the total.", "Click <b>Create v1</b>."], [a, b2])
        sh.submit()
        a = nxt_shot(); nxt(); b2 = drawer([("#cf-who", 2), (submit, 3)])
        step("A", "Record the client's approval", ["Click <b>Record approval</b>.", "Check who approved.", "Click <b>Save approval</b>."], [a, b2])
        sh.submit()
        a = nxt_shot(); nxt(); b2 = drawer([("#create-job", 2)])
        step("A", "Create the shipment job", ["Click <b>Create shipment job</b>.", "Click <b>Create shipment job</b> again to confirm."], [a, b2])
        sh.click("#create-job"); p.wait_for_timeout(300)
        jid = E("location.hash.split('/')[2]"); S["jid"] = jid
        a = sh.shot([("#journey", 1), ("#next-primary", 2)])
        step("B", "Start documentation", ["The job opens at stage <b>Booked</b>.", "Click <b>Start documentation</b>."], [a])
        nxt()

        # ---- Documents
        a = sh.shot([("#gate li:first-child", 1), ("#next-primary", 2)], clip="#next-step")
        nxt(); sh.click(sample); b2 = drawer([(".ds-upload", 3), (submit, 4)])
        step("B", "Upload a document", ["Five documents are missing.", "Click <b>Upload</b>.",
             "Choose the file, or click <b>Use a sample file (demo)</b>.", "Click the upload button."], [a, b2])
        sh.submit()
        a = nxt_shot(); nxt(); b2 = drawer([("#approve-doc", 2)])
        step("B", "Approve the document", ["Click <b>Review</b>.", "Click <b>Approve</b>."], [a, b2])
        sh.click("#approve-doc")
        for _ in range(4):  # the other four documents
            nxt(); sh.click(sample); sh.submit(); nxt(); sh.click("#approve-doc")
        a = sh.shot([("#gate li:first-child", 1)], clip="#next-step")
        step("B", "Repeat for the other four documents", ["Upload and approve Packing List, Bill of Lading, Certificate of Origin and Import Permit the same way."], [a],
             "All 5 documents approved.")
        a = nxt_shot(); nxt(); sh.click(sample); b2 = drawer([(".ds-upload", 2), (submit, 3)])
        step("B", "Complete the task: Verify shipment documents complete", ["Click <b>Complete task</b>.", "Attach proof (sample file).", "Click <b>Mark done</b>."], [a, b2])
        sh.submit()
        for label in ["Confirm vessel sailed", "Confirm arrival at port", "Start customs clearance"]:
            a = nxt_shot(); step("B", label, [f"Click <b>{label}</b>."], [a]); nxt()

        # ---- Customs
        def task(title, proof):
            a = nxt_shot(); nxt()
            if proof:
                sh.click(sample); b2 = drawer([(".ds-upload", 2), (submit, 3)])
                step("C", "Complete the task: " + title, ["Click <b>Complete task</b>.", "Attach proof (sample file).", "Click <b>Mark done</b>."], [a, b2])
            else:
                b2 = drawer([(submit, 2)])
                step("C", "Complete the task: " + title, ["Click <b>Complete task</b>.", "Click <b>Mark done</b>."], [a, b2])
            sh.submit()
        def move(label):
            a = nxt_shot(); step("C", label, [f"Click <b>{label}</b>."], [a]); nxt()
        task("Lodge customs entry", True)
        move("Mark as Lodged"); move("Mark as Assessment Pending")
        a = nxt_shot(); nxt(); p.check("input[value=Client]"); b2 = drawer([("input[value=Client]", 2), (submit, 3)])
        step("C", "Mark as Payment Pending", ["Click <b>Mark as Payment Pending</b>.", "Choose <b>Waiting for the client</b>.", "Click <b>Mark as Payment Pending</b>."], [a, b2])
        sh.submit()
        a = nxt_shot(); nxt(); sh.click(sample); b2 = drawer([(".ds-upload", 2), (submit, 3)])
        step("C", "Confirm the client has paid", ["Click <b>Client has paid</b>.", "Attach the client's proof of payment (sample file).", "Click <b>Yes, client has paid</b>."], [a, b2])
        sh.submit()
        task("Pay duties and assessment", True)
        move("Mark as Payment Completed"); move("Mark as Release Pending")
        task("Secure delivery order", False)
        move("Mark as Released")
        task("Book delivery truck", False)
        a = nxt_shot(); step("C", "Send out for delivery", ["Click <b>Send out for delivery</b>."], [a], "Stage: Out for Delivery.")
        nxt()

        # ---- Delivery (Warehouse Crew)
        crew = E(f"crewFor(jobById('{jid}'))"); S["crew"] = crew
        sh.click("#avatar-menu .ds-avatar"); p.wait_for_timeout(200)
        a = sh.shot([("#avatar-menu .ds-avatar", 1), (tag("#avatar-menu .ds-menu__action", crew, "crew"), 2)])
        step("D", f"Switch to {crew} (Warehouse Crew)", ["Click your avatar (top right).", f"Click <b>{crew}</b>."], [a])
        E(f"switchPerson('{crew}')"); p.wait_for_timeout(300); sh.go("#/home")
        card = tag(".ds-workcard", jid, "card")
        a = sh.shot([(card + " .ds-btn:last-child", 1)], clip=card, pad=24)
        sh.click(card + " .ds-btn:last-child")
        sh.fill("#pod-receiver", "R. Santos (Receiving)"); sh.click(sample)
        b2 = drawer([("#pod-receiver", 2), (".ds-upload", 3), (submit, 4)])
        step("D", "Confirm the delivery", [f"On Home, find job <b>{jid}</b> and click <b>Confirm delivery</b>.", "Received by", "Attach the proof of delivery (sample file).",
             "Click <b>Confirm delivery</b>."], [a, b2], "Stage: Delivered.")
        sh.submit()
        sh.go(f"#/jobs/{jid}")
        a = nxt_shot(); nxt(); b2 = drawer([(submit, 2)])
        step("D", "Complete the task: Return empty container", [f"Open job {jid}. Click <b>Complete return empty container</b>.", "Click <b>Mark done</b>."], [a, b2])
        sh.submit()

        # ---- Billing and close (Manager)
        sh.click("#avatar-menu .ds-avatar"); p.wait_for_timeout(200)
        a = sh.shot([("#avatar-menu .ds-avatar", 1), (tag("#avatar-menu .ds-menu__action", "Grace Tan", "mgr"), 2)])
        step("E", "Switch to Grace Tan (Manager)", ["Click your avatar (top right).", "Click <b>Grace Tan</b>."], [a])
        E("switchPerson('Grace Tan')"); p.wait_for_timeout(300); sh.go("#/jobs")
        row = tag("#main tr, #main .ds-card", jid, "row")
        a = sh.shot([(".ds-nav [onclick*=\"'#/jobs'\"]", 1), (row, 2)])
        step("E", "Open the job", ["Click <b>Shipments</b> in the sidebar.", f"Click job <b>{jid}</b>."], [a])
        sh.go(f"#/jobs/{jid}")
        a = sh.shot([("#gate li:last-child", 1), ("#next-primary", 2)], clip="#next-step")
        nxt(); sh.fill("#ch-desc", "Ocean freight"); sh.fill("#ch-amount", "120000"); sh.click(sample)
        b2 = drawer([("#ch-desc", 3), ("#ch-amount", 4), ("#ch-quoted", 5), ("#ch-paid", 6), (submit, 7)])
        step("E", "Add a charge", ["One check is left: <b>At least one charge recorded</b>.", "Click <b>Add charge</b>.", "Description", "Amount",
             "In the approved quotation: <b>Yes</b>", "Payment: <b>Already paid</b>", "Click <b>Save charge</b>."], [a, b2])
        sh.submit()
        a = sh.shot([("#gate", 1), ("#next-primary", 2)], clip="#next-step")
        step("E", "Mark ready for Finance", ["All checks are met.", "Click <b>Mark ready for Finance</b>."], [a], "Stage: Billing Ready.")
        nxt()
        a = nxt_shot(); step("E", "Close the job", ["Click <b>Close job</b>."], [a]); nxt()
        a = sh.shot([("#journey", 1), ("#next-step", 2)])
        step("E", "Done", ["All stages complete.", "The job shows <b>This job is closed</b>."], [a])
        b.close()
    return S, steps

# ------------------------------------------------------------------ document
PARTS = {"A": ("Part A", "Customer to shipment job", "Ana Cruz · Dispatcher"),
         "B": ("Part B", "Documents to arrival", "Ana Cruz · Dispatcher"),
         "C": ("Part C", "Customs clearance", "Ana Cruz · Dispatcher"),
         "D": ("Part D", "Delivery", "Warehouse Crew"),
         "E": ("Part E", "Billing and closing", "Grace Tan · Manager")}

def img(path):
    return f'<img src="data:image/jpeg;base64,{base64.b64encode(path.read_bytes()).decode()}">'

def build(S, steps):
    PARTS["D"] = ("Part D", "Delivery", S["crew"] + " · Warehouse Crew")
    rows = "".join(f"<tr><td>{html.escape(k)}</td><td>{html.escape(v)}</td></tr>" for k, v in DATA)
    parts = "".join(f"<tr><td class='pn'>{v[0]}</td><td>{v[1]}</td><td class='who'>{v[2]}</td></tr>" for v in PARTS.values())
    H = [f"""<section class="cover"><img class="logo" src="{LOGO}"><div class="bar"></div>
      <p class="eyebrow">Top1Movers Operations Portal · Tester guide</p><h1>End-to-end test:<br>new customer to closed job</h1>
      <ul class="rules"><li>Do the steps in order.</li><li>Red numbers on each screenshot match the numbered actions.</li>
      <li>Do not refresh the page. The mockup does not save data; a refresh starts over.</li><li>Your job number may differ from <b>{S['jid']}</b>.</li></ul>
      <h3>Parts</h3><table class="parts">{parts}</table>
      <h3>Test data</h3><table class="data">{rows}</table></section>"""]
    cur, n = None, 0
    for part, title, actions, shots, result in steps:
        if part != cur:
            cur = part; v = PARTS[part]
            H.append(f"<div class='part'><span>{v[0]}</span><h2>{v[1]}</h2><p>{v[2]}</p></div>")
        n += 1
        acts = "".join(f"<li><span class='mk'>{k}</span><span>{t}</span></li>" for k, t in enumerate(actions, 1))
        res = f"<p class='res'>✓ {result}</p>" if result else ""
        # Pairs share the width by shape (clamped so neither gets squeezed); a lone panel crop is drawn smaller than a full screen.
        figs = "".join(f"<figure class='{'full' if PIL_W(s) >= 1800 else 'crop'}' style='flex:{min(1.6, max(0.8, PIL_W(s)/PIL_H(s))):.3f} 1 0'>{img(s)}</figure>" for s in shots)
        H.append(f"<div class='step'><h3><span class='sn'>{n}</span>{title}</h3><ol class='acts'>{acts}</ol>"
                 f"<div class='figs figs-{len(shots)}'>{figs}</div>{res}</div>")
    css = f"""@font-face {{ font-family: Inter; src: url('{FONT}'); font-weight: 100 900; }}
    @page {{ size: A4; margin: 14mm 14mm 16mm; }}
    body {{ font: 10pt/1.45 Inter, Arial, sans-serif; color: #262b52; margin: 0; }}
    h1, h2, h3 {{ color: #2f3a8f; margin: 0; line-height: 1.2; }}
    .cover {{ break-after: page; }} .logo {{ height: 40px; margin: 4mm 0 16mm; }}
    .bar {{ height: 4px; width: 60px; background: #e5383b; margin-bottom: 14px; }}
    .eyebrow {{ text-transform: uppercase; letter-spacing: .08em; font-size: 8.5pt; color: #545b7c; font-weight: 600; margin: 0 0 6px; }}
    .cover h1 {{ font-size: 28pt; }} .cover h3 {{ font-size: 9pt; text-transform: uppercase; letter-spacing: .08em; color: #545b7c; margin: 16px 0 4px; }}
    .rules {{ margin: 14px 0 0; padding-left: 18px; font-size: 10.5pt; }} .rules li {{ margin: 3px 0; }}
    table {{ border-collapse: collapse; width: 100%; font-size: 9pt; }} td {{ border-bottom: 1px solid #e3e8f1; padding: 5px 6px; vertical-align: top; }}
    .data td:first-child {{ color: #545b7c; width: 45mm; }} .parts .pn {{ color: #e5383b; font-weight: 700; width: 18mm; }} .parts .who {{ color: #545b7c; }}
    .part {{ break-before: page; background: #1c2050; color: #fff; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; }}
    .part span {{ font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #ff8a8c; font-weight: 700; }}
    .part h2 {{ color: #fff; font-size: 17pt; margin: 2px 0; }} .part p {{ margin: 0; color: #c4c9ea; font-size: 9.5pt; }}
    .step {{ break-inside: avoid; border-bottom: 1px solid #e3e8f1; padding: 8px 0 10px; }}
    .step h3 {{ font-size: 12pt; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }}
    .sn {{ background: #2f3a8f; color: #fff; border-radius: 6px; font-size: 9pt; padding: 1px 7px; }}
    .acts {{ list-style: none; padding: 0; margin: 4px 0 6px; }} .acts li {{ margin: 2px 0; display: flex; gap: 6px; align-items: baseline; }}
    .mk {{ flex: none; display: inline-grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: #e5383b; color: #fff; font-size: 8pt; font-weight: 700; }}
    .figs {{ display: flex; gap: 10px; align-items: flex-start; }} .figs-1 {{ justify-content: flex-start; }}
    figure {{ margin: 0; min-width: 0; }} figure img {{ border: 1px solid #d5dbe8; border-radius: 6px; display: block; width: 100%; }}
    .figs-1 figure {{ flex: none !important; max-width: 100%; }} .figs-1 figure img {{ width: auto; max-width: 100%; max-height: 100mm; }} .figs-1 figure.crop img {{ max-width: 115mm; max-height: 70mm; }}
    .res {{ margin: 6px 0 0; color: #1f7a55; font-weight: 600; font-size: 9.5pt; }}"""
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{css}</style></head><body>{''.join(H)}</body></html>"

def PIL_W(path): from PIL import Image; return Image.open(path).size[0]
def PIL_H(path): from PIL import Image; return Image.open(path).size[1]

def main():
    S, steps = capture()
    html_path = bm.IMG / "e2e.html"; html_path.write_text(build(S, steps), encoding="utf-8")
    with sync_playwright() as pw:
        b = pw.chromium.launch(); p = b.new_page()
        p.goto(html_path.as_uri()); p.wait_for_timeout(800)
        p.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True, header_template="<span></span>",
              footer_template="<div style='font:8px Arial;color:#8794ae;width:100%;padding:0 14mm;display:flex;justify-content:space-between'><span>Top1Movers Operations Portal · End-to-end tester guide · sample data</span><span>Page <span class='pageNumber'></span> of <span class='totalPages'></span></span></div>",
              margin={"top": "14mm", "bottom": "16mm", "left": "14mm", "right": "14mm"})
        b.close()
    print("Wrote", OUT, f"{OUT.stat().st_size/1024/1024:.1f} MB,", len(steps), "steps")

if __name__ == "__main__":
    main()
