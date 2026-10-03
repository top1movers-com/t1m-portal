"""Builds docs/demo/T1M-Portal-User-Manual.pdf from the screenshots in docs/demo/manual/shots/.

    python docs/demo/manual/capture_user_manual.py     # takes the screenshots from the live mockup
    python docs/demo/manual/build_user_manual.py       # lays out the PDF
"""
import base64, html, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SHOTS = HERE / "shots"
OUT = ROOT / "docs/demo/T1M-Portal-User-Manual.pdf"
FONT = (ROOT / "packages/design-system/fonts/Inter-latin-wght.woff2").as_uri()
LOGO = ROOT / "packages/design-system/assets"


def b64(path):
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode()


def fig(name, caption, narrow=False):
    return (f'<figure class="{"narrow" if narrow else ""}"><img src="data:image/jpeg;base64,{b64(SHOTS / (name + ".jpg"))}">'
            f'<figcaption>{caption}</figcaption></figure>')


def h1(n, t): return f'<h1 class="chapter"><span>{n}</span>{t}</h1>'
def h2(t): return f'<h2>{t}</h2>'
def p(t): return f'<p>{t}</p>'
def ul(items): return '<ul>' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'
def ol(items): return '<ol>' + ''.join(f'<li>{i}</li>' for i in items) + '</ol>'
def note(kind, title, text): return f'<div class="note {kind}"><b>{title}</b><div>{text}</div></div>'
def tip(text): return note("tip", "Tip", text)
def warn(text): return note("warn", "Good to know", text)
def who(name): return f'<span class="who">{name}</span>'
def table(head, rows, cls=""):
    return (f'<table class="{cls}"><thead><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr></thead><tbody>' +
            ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>')
def stage(n, title, who_, goal, body):
    return (f'<section class="stage"><div class="stagehead"><span class="num">{n}</span><div><h2>{title}</h2>'
            f'<div class="meta">{who_}</div></div></div><p class="goal">{goal}</p>{body}</section>')
def pb(): return '<div class="pb"></div>'


CSS = f"""
@font-face {{ font-family:'Inter'; src:url('{FONT}') format('woff2'); font-weight:100 900; }}
@page {{ size:A4; margin:18mm 16mm 18mm 16mm; }}
* {{ box-sizing:border-box; }}
html {{ font-family:'Inter', Arial, sans-serif; color:#1b1f3b; font-size:10.5pt; line-height:1.5; }}
body {{ margin:0; }}
h1, h2, h3 {{ margin:0; color:#19206b; line-height:1.25; }}
h1.chapter {{ font-size:22pt; margin:0 0 6mm; padding-bottom:3mm; border-bottom:3px solid #2f3a8f; break-before:page; display:flex; gap:10px; align-items:baseline; }}
h1.chapter span {{ color:#e5383b; }}
h2 {{ font-size:14pt; margin:6mm 0 2mm; break-after:avoid; }}
h3 {{ font-size:11.5pt; margin:4mm 0 1mm; }}
p {{ margin:0 0 2.5mm; }}
ul, ol {{ margin:0 0 3mm; padding-left:6mm; }}
li {{ margin-bottom:1.2mm; }}
b, strong {{ color:#19206b; }}
.cover {{ height:255mm; display:flex; flex-direction:column; justify-content:center; padding:0 6mm; background:#1d2152; color:#fff; border-radius:6px; position:relative; overflow:hidden; }}
.cover h1 {{ color:#fff; font-size:38pt; margin:10mm 0 3mm; }}
.cover .sub {{ font-size:15pt; color:#c9cdf2; max-width:130mm; }}
.cover .meta {{ position:absolute; left:6mm; bottom:8mm; color:#aab0e6; font-size:10pt; }}
.cover .badge {{ display:inline-block; margin-top:8mm; padding:3px 12px; border:1px solid #6f78d6; border-radius:99px; color:#dfe2ff; font-size:10pt; width:max-content; }}
.cover .stripes {{ display:flex; gap:10px; margin-top:10mm; }}
.cover .stripes i {{ display:block; height:7px; border-radius:9px; background:#fff; transform:skewX(-30deg); }}
.cover .mark {{ position:absolute; right:-6mm; bottom:-12mm; font-weight:800; font-size:170pt; letter-spacing:-0.04em; color:transparent; -webkit-text-stroke:2px rgba(255,255,255,.12); }}
.cover img {{ width:62mm; background:#fff; padding:4px 8px; border-radius:6px; }}
.toc li {{ margin-bottom:2mm; }}
.toc {{ list-style:none; padding:0; counter-reset:t; }}
.toc li {{ display:flex; gap:10px; padding:2.2mm 0; border-bottom:1px solid #e3e5f5; font-size:11pt; }}
.toc li b {{ color:#e5383b; width:8mm; }}
.toc li span {{ color:#5c6291; margin-left:auto; font-size:9.5pt; }}
figure {{ margin:3mm 0 5mm; break-inside:avoid; }}
figure img {{ width:100%; border:1px solid #d6d9ef; border-radius:6px; display:block; box-shadow:0 2px 8px rgba(25,32,107,.08); }}
figure.narrow {{ width:70%; margin-left:auto; margin-right:auto; }}
figcaption {{ font-size:9pt; color:#5c6291; margin-top:1.5mm; text-align:center; }}
.note {{ border-radius:6px; padding:3mm 4mm; margin:3mm 0 4mm; break-inside:avoid; border:1px solid; font-size:10pt; }}
.note > b {{ display:block; margin-bottom:.5mm; }}
.note.tip {{ background:#eef2ff; border-color:#c7d0fb; }}
.note.warn {{ background:#fdf3e3; border-color:#f1d29a; }}
.note.rule {{ background:#e8f4ee; border-color:#a9d6c0; }}
.who {{ display:inline-block; font-size:8.5pt; font-weight:600; padding:1px 9px; border-radius:99px; background:#2f3a8f; color:#fff; margin-right:4px; }}
table {{ width:100%; border-collapse:collapse; margin:2mm 0 5mm; font-size:9.5pt; break-inside:auto; }}
th {{ text-align:left; background:#eef0fb; color:#19206b; padding:2mm 2.5mm; border-bottom:2px solid #c9cdf2; }}
td {{ padding:1.6mm 2.5mm; border-bottom:1px solid #e3e5f5; vertical-align:top; }}
tr {{ break-inside:avoid; }}
.stage {{ margin-bottom:6mm; }}
.stagehead {{ display:flex; gap:4mm; align-items:center; margin:2mm 0; break-after:avoid; }}
.stagehead .num {{ flex:none; width:11mm; height:11mm; border-radius:50%; background:#e5383b; color:#fff; font-weight:700; font-size:13pt; display:grid; place-items:center; }}
.stagehead h2 {{ margin:0; }}
.stagehead .meta {{ margin-top:.5mm; }}
.goal {{ background:#f5f6fd; border-left:4px solid #2f3a8f; padding:2.5mm 4mm; border-radius:0 6px 6px 0; }}
.flow {{ display:flex; flex-wrap:wrap; align-items:stretch; gap:3mm 2mm; margin:4mm 0; }}
.flow .box {{ flex:1 1 28mm; min-width:26mm; background:#fff; border:1.5px solid #2f3a8f; border-radius:8px; padding:2.5mm; text-align:center; font-size:9pt; }}
.flow .box b {{ display:block; font-size:10pt; }}
.flow .box small {{ color:#5c6291; display:block; margin-top:1mm; }}
.flow .arrow {{ align-self:center; color:#e5383b; font-size:14pt; font-weight:700; }}
.steps {{ counter-reset:s; list-style:none; padding:0; }}
.steps li {{ counter-increment:s; position:relative; padding:0 0 2mm 9mm; }}
.steps li::before {{ content:counter(s); position:absolute; left:0; top:0; width:6mm; height:6mm; border-radius:50%; background:#2f3a8f; color:#fff; font-size:8.5pt; font-weight:700; display:grid; place-items:center; }}
.red {{ color:#e5383b; font-weight:700; }}
.two {{ display:grid; grid-template-columns:1fr 1fr; gap:4mm; }}
.card {{ border:1px solid #d6d9ef; border-radius:8px; padding:3mm 4mm; break-inside:avoid; }}
.card h3 {{ margin-top:0; }}
code, .k {{ font-family:Consolas, monospace; font-size:9pt; background:#eef0fb; padding:0 4px; border-radius:3px; }}
.pb {{ break-after:page; }}
"""


def build():
    H = []

    # ---------------- Cover ----------------
    H.append(f"""
    <div class="cover">
      <img src="data:image/png;base64,{b64(next(LOGO.glob('*logo*.png'), None) or next(LOGO.glob('*.png')))}" onerror="this.remove()">
      <h1>T1M Portal</h1>
      <div class="sub">User manual: what the system is, how the work flows, and how to use it, step by step.</div>
      <div class="stripes"><i style="width:34mm"></i><i style="width:22mm;opacity:.55"></i><i style="width:11mm;opacity:.3"></i></div>
      <div class="badge">Mockup for review · all data is demo data</div>
      <div class="mark">T1M</div>
      <div class="meta">Top1Movers Worldwide Inc. · Operations Portal · Manual v1.0 · October 2026</div>
    </div>""")

    # ---------------- Contents ----------------
    H.append('<h1 class="chapter" style="break-before:page"><span>·</span>What is in this manual</h1>')
    toc = [("1", "About the T1M Portal", "What it is, who it is for"),
           ("2", "Getting started", "Open it and sign in"),
           ("3", "The big picture", "The workflow and the five roles"),
           ("4", "A tour of the screen", "Menu, search, notifications, My work"),
           ("5", "Worked example: one shipment, start to finish", "Nine stages with screenshots"),
           ("6", "Manager and Admin tools", "Dashboard, customers, users, settings, audit log"),
           ("7", "The rules the system enforces", "Hard gates, required fields, confirmations"),
           ("8", "Who can do what", "Role cheat sheet"),
           ("9", "Questions and troubleshooting", "Common problems and answers"),
           ("10", "Glossary", "Shipping and customs terms in plain words")]
    H.append('<ul class="toc">' + ''.join(f'<li><b>{a}</b>{b}<span>{c}</span></li>' for a, b, c in toc) + '</ul>')
    H.append(note("tip", "How to read this manual",
                  "If you only have five minutes, read <b>chapter 3</b> (the big picture) and skim the screenshots in <b>chapter 5</b>. "
                  "If you are going to try the system yourself, start at <b>chapter 2</b> and follow the example in chapter 5 with the same names and numbers."))

    # ---------------- 1 About ----------------
    H.append(h1("1", "About the T1M Portal"))
    H.append(p("The <b>T1M Portal</b> is the operations system for Top1Movers. It keeps every customer request, quotation and shipment job in <b>one record</b>, "
               "so that nothing lives in chat threads, spreadsheets or somebody's inbox."))
    H.append(h2("What problem it solves"))
    H.append(ul([
        "<b>Always a next step.</b> Every inquiry and every job shows what must happen next and who has to do it.",
        "<b>Approvals you can see.</b> Quotes and fund requests go through the Manager. Every version and every reason is kept.",
        "<b>No skipping steps.</b> Job milestones are done in order. Documents, proof and fund approvals are required before the step they belong to.",
        "<b>The client stays informed.</b> The client gets an email link to answer a quotation, and a tracking page for the shipment.",
        "<b>Everyone only sees and does their own part.</b> Sales, Operations and Accounting each get their own simple screens."]))
    H.append(h2("What it covers"))
    H.append(table(["Area", "What you do there"], [
        ["Inquiries & quotes", "Record a customer request, prepare a quotation, get it approved, send it, record the client's answer."],
        ["Jobs", "Run the shipment: accreditation, shipping, customs, trucking, warehousing and LTO, step by step, with documents."],
        ["Funds", "Ask for cash for duties, port charges and other costs, get it approved and released, then report what was spent."],
        ["Customers", "One profile per client with every inquiry and job they have had."],
        ["Admin", "Users and roles, settings, audit log, dashboards."]]))
    H.append(warn("<b>This is a mockup.</b> It is a working preview built to review the design and the process. Sign-in is simulated, nothing is saved on a server, "
                  "and everything you create <b>disappears when you refresh the page</b>. Only the people (demo users) are pre-loaded. "
                  "Billing, statements of account, payments and profit are <b>not</b> part of this portal. Accounting will be integrated later."))

    # ---------------- 2 Getting started ----------------
    H.append(h1("2", "Getting started"))
    H.append(h2("Open the system"))
    H.append(p("Open the file <code>apps/mockup/index.html</code> in a web browser (Chrome or Edge works best). No installation is needed."))
    H.append(h2("Sign in"))
    H.append(ol([
        "On the sign-in page, click <b>Sign in with Microsoft</b>.",
        "A list of demo people appears, grouped by role. This stands in for the Microsoft account picker. Click the person you want to be.",
        "You land on your home screen. To try another role, use the avatar menu (top right) and choose <b>Switch person (demo)</b>."]))
    H.append(fig("01-login", "The sign-in page."))
    H.append(fig("02-account-picker", "Pick a demo person. In the real system this would be your Top1Movers Microsoft work account."))
    H.append(h2("Who to sign in as"))
    H.append(table(["Role", "Try this person", "Good for trying"], [
        ["Manager (and Accounting)", "Grace Tan", "Creating inquiries, approving quotes and funds, converting jobs, confirming completion."],
        ["Manager", "Lorna Bautista", "Same as above, without the Accounting role."],
        ["Sales", "Ana Cruz", "Uploading quotations and following inquiries."],
        ["Operations", "Ben Santos (accreditation), Rico Domingo (freight), Jessa Aquino (customs), Mike Salazar (trucking)", "Running the job steps. Each person only works the services assigned to them."],
        ["Accounting", "Paolo Reyes", "Approving fund release and reviewing liquidations."],
        ["Admin", "Mark Villar or Jun Robles", "Users, roles, settings, audit log. Admin can open everything."]]))
    H.append(tip("The easiest way to learn the system is to play <b>one shipment</b> from start to finish, switching person at each stage, exactly like chapter 5."))

    # ---------------- 3 Big picture ----------------
    H.append(h1("3", "The big picture"))
    H.append(h2("The life of a shipment"))
    H.append(p("Every shipment goes through the same path. Each box below is a stage, and the line under it says who does the work."))
    flow = [("Inquiry", "Manager"), ("Quotation", "Sales"), ("Approval", "Manager"), ("Client answer", "Client"), ("Won &amp; convert", "Manager"),
            ("Job", "Operations"), ("Complete", "Manager")]
    H.append('<div class="flow">' + '<div class="arrow">→</div>'.join(f'<div class="box"><b>{a}</b><small>{b}</small></div>' for a, b in flow) + '</div>')
    H.append(table(["Stage", "What happens", "It ends when"], [
        ["1. Inquiry", "A client asks for a service. The Manager records the customer and the request, and assigns one Sales person.", "The inquiry exists and Sales is assigned."],
        ["2. Quotation", "Sales prepares the quotation in their usual format and uploads it with the amount and how long it is valid.", "Sales submits it for approval."],
        ["3. Approval", "The Manager reviews it. They approve it, or reject it with a reason.", "Approved: the system emails it to the client automatically."],
        ["4. Client answer", "The client opens the link in the email and chooses Accept, Renegotiate or Decline.", "The client answers."],
        ["5. Won and convert", "If accepted, the Manager closes the inquiry as won and converts it into a job, assigning Operations staff for each service.", "The job exists."],
        ["6. Job", "Operations works the job step by step. Money is requested through fund requests when a step costs cash.", "Every step and document is done."],
        ["7. Complete", "Operations submits the job for closing. The Manager confirms it is completed.", "The job is Completed."]]))
    H.append(note("rule", "Two paths that go the other way",
                  "<b>Renegotiate or Decline:</b> Sales prepares a new version of the quotation (v2, v3 ...) with the client's reason in front of them. "
                  "The Manager can also close the inquiry as lost, with a reason, which feeds the sales statistics.<br>"
                  "<b>Issue on a job:</b> Operations can flag an issue. The job goes on hold and its steps are frozen until the issue is resolved."))
    H.append(h2("The five roles"))
    H.append(table(["Role", "In one sentence"], [
        ["Admin", "Looks after users, roles and settings. Can open and do everything."],
        ["Manager", "Creates customers and inquiries, assigns people, approves quotations and fund requests, converts jobs and confirms completion."],
        ["Sales", "Prepares and uploads quotations and follows their inquiries until the client answers. Sales does not work on jobs."],
        ["Operations", "Runs the jobs: marks steps done, uploads documents, requests funds and reports what was spent. Only for the services they were assigned."],
        ["Accounting", "Approves fund release, reviews liquidations and records receipts and quotations."]]))
    H.append(p("One person can hold more than one role. For example Grace Tan is both Manager and Accounting."))

    # ---------------- 4 Tour ----------------
    H.append(h1("4", "A tour of the screen"))
    H.append(p("Every screen has the same layout. Learn it once and you can find your way everywhere."))
    H.append(fig("03-dashboard-empty", "<span class='red'>1</span> the menu on the left, <span class='red'>2</span> the notification bell. The search bar is at the top and your name and role at the top right."))
    H.append(table(["Part", "What it does"], [
        ["Menu (left)", "Shows only what your role can use. Managers see Dashboard, Inquiries &amp; quotes, Jobs, Customers. Admins also see Users &amp; roles, Settings and Audit log."],
        ["Search (top)", "Click it or press <span class='k'>Ctrl</span> + <span class='k'>K</span>. Type a job number, inquiry number, customer name or BL number and press Enter."],
        ["Bell", "Shows how many notifications you have not read. Click it to read them. The counter goes back to zero once you have opened it."],
        ["Your name (top right)", "Opens a small menu to switch person (demo) or sign out."]]))
    H.append(fig("37-search", "Search finds jobs, inquiries and customers from anywhere in the system.", narrow=True))
    H.append(h2("My work: your to-do list"))
    H.append(p("Sales, Operations and Accounting land on <b>My work</b>. It lists only the things waiting on <b>you</b>, most urgent first. Click a row to open it."))
    H.append(fig("06-sales-mywork", "Sales: inquiries waiting for a quotation. Sales can also report a new inquiry to the Manager."))
    H.append(fig("21a-ops-mywork", "Operations: the next step on each of your jobs."))
    H.append(fig("28-accounting-mywork", "Accounting: fund requests waiting for release."))
    H.append(h2("Notifications"))
    H.append(p("When something happens that involves you (an assignment, an approval, an answer from the client), a notification is created. Open the bell to read them."))
    H.append(fig("36-notifications", "Notifications. In the real system the same messages would also be emailed.", narrow=True))
    H.append(h2("Little helpers you will notice"))
    H.append(ul([
        "<span class='red'>*</span> A <b>red star</b> next to a field name means the field is <b>required</b>. Fields marked <i>optional</i> can be left empty.",
        "<b>Confirmation windows.</b> Before anything important is saved (approving, releasing funds, marking a step done) the system asks you to confirm.",
        "<b>Toast messages.</b> A small message appears in the corner after you save, telling you what happened.",
        "<b>Side panels.</b> Most forms open in a panel on the right. Press Cancel or the X to close it without saving."]))

    # ---------------- 5 Worked example ----------------
    H.append(h1("5", "Worked example: one shipment, start to finish"))
    H.append(note("tip", "The story we will follow",
                  "<b>Acme Trading Corp</b> (contact: Juan Dela Cruz) wants to <b>import 2 pickup trucks from Yokohama, Japan</b> to Quezon City. "
                  "They need importer accreditation, shipping, customs clearance and delivery by truck. "
                  "We follow the request through nine stages. The names are the demo users, so you can repeat every step yourself."))

    H.append(stage("1", "Record the customer and the inquiry", who("Manager") + "Grace Tan", "Goal: the request is in the system and one Sales person owns it.",
        ol([
            "Go to <b>Customers</b> and click <b>New customer</b>. Fill in the company name, contact person, address, phone and email.",
            "Click <b>New inquiry</b> (top right of the Dashboard or of Inquiries &amp; quotes).",
            "Pick the <b>Customer</b>. Choose <b>Scope</b> (Domestic or International) and, for International, the <b>Direction</b> (Import or Export).",
            "Tick every <b>service</b> the client needs. The form then asks only for the details those services need (for example route, delivery address).",
            "Add optional <b>Notes</b>, then choose the <b>one</b> Sales person who will prepare the quote.",
            "Click <b>Create inquiry</b> and confirm. The inquiry gets a number, for example INQ-2026-0001, and Sales is notified."]) +
        fig("04-new-inquiry", "New inquiry. <span class='red'>1</span> customer, <span class='red'>2</span> services, <span class='red'>3</span> assigned Sales (further down).", narrow=True) +
        fig("05-inquiries-list", "The inquiry now appears in the list with the status <i>Preparing quote</i>.") +
        tip("<b>Sales can also start it.</b> If a client contacts Sales first, Sales uses <b>Report an inquiry to the manager</b> (description and a supporting document are required). "
            "The Manager then sees it under <i>Needs attention</i> and creates the inquiry from it.") +
        fig("06b-report-inquiry", "Sales reporting a new inquiry to the Manager.", narrow=True)))

    H.append(stage("2", "Prepare and upload the quotation", who("Sales") + "Ana Cruz", "Goal: the quotation file is uploaded and waiting for approval.",
        ol([
            "Open <b>My work</b> or the inquiry. The big panel says <b>Upload quotation v1</b>.",
            "Prepare the quotation in your usual format (PDF, Excel or Word) outside the system, then click the button.",
            "Attach the <b>file</b>, enter the <b>total amount</b> (the currency is fixed to PHP) and the <b>valid until</b> date.",
            "Click <b>Submit for approval</b> and confirm."]) +
        fig("07-inquiry-preparing", "The inquiry page. <span class='red'>1</span> the next step button.") +
        fig("08-upload-quote", "Upload quotation v1. The file, amount and validity date are required.", narrow=True) +
        warn("The amount and date are for tracking and reports only. <b>The file is what the client receives.</b>")))

    H.append(stage("3", "Approve the quotation", who("Manager") + "Grace Tan", "Goal: a checked quotation goes to the client without anyone sending it by hand.",
        ol([
            "The quote appears under <b>Needs attention</b> on the Dashboard. Click <b>Review</b>.",
            "Look at the file, amount, validity and services.",
            "Click <b>Approve</b> (<span class='red'>2</span>) and confirm. <b>Or</b> click <b>Reject</b> (<span class='red'>1</span>): a window asks you what is wrong and you must write a reason.",
            "When approved, the system <b>emails the client automatically</b>. The inquiry now shows <i>Sent to the client</i> as done and <i>Client response: waiting for response</i>."]) +
        fig("09-manager-needs-attention", "The Manager's Dashboard lists the quote waiting for approval.") +
        fig("10-review-quote", "Review quotation. <span class='red'>1</span> Reject, <span class='red'>2</span> Approve.", narrow=True) +
        fig("11-confirm-approve", "Every approval asks you to confirm first.", narrow=True) +
        fig("12-inquiry-waiting-client", "After approval: the quotation is sent and the system waits for the client. <span class='red'>1</span> the status and the View page button.") +
        warn("If you reject, the reason is stored in the quotation history and Sales sees it in a highlighted box when preparing the next version.")))

    H.append(stage("4", "The client answers", who("Client") + "no login needed", "Goal: the client accepts, asks to renegotiate or declines, from a link in their email.",
        p("The client receives an email with a link. In this mockup you open the same page with the <b>View page</b> button next to <i>Client response</i> on the inquiry. "
          "A banner reminds you it is a simulation and has a button to go back.") +
        ol([
            "The client sees the quotation: file, amount, validity and services.",
            "They choose <b>Accept</b>, <b>Renegotiate</b> or <b>Decline</b>.",
            "For Renegotiate and Decline a <b>Reason</b> box appears and is required. The client just types it.",
            "They click <b>Send my answer</b> and confirm. The answer is recorded and the Manager and Sales are notified."]) +
        fig("13-client-page", "What the client sees when they open the link.") +
        fig("14-client-renegotiate", "Renegotiate (or Decline) asks for a reason.", narrow=True) +
        fig("15-client-confirm", "The client confirms before the answer is sent.", narrow=True) +
        note("rule", "If the client does not accept",
             "The inquiry shows <b>Revision needed</b> with the client's reason highlighted. Sales uploads v2 (the old version stays in the history) and the cycle repeats from stage 3. "
             "If it is clearly lost, the Manager uses <b>Close as lost</b> and picks a reason.")))

    H.append(stage("5", "Close as won and convert to a job", who("Manager") + "Grace Tan", "Goal: the accepted quotation becomes a job with the right people assigned.",
        ol([
            "Open the inquiry. It says <b>Client accepted</b>. Click <b>Acknowledge and close</b> and confirm. The inquiry is now <b>Won</b> and the version history is locked.",
            "Click <b>Convert to job</b>.",
            "<b>Assign Operations staff for each service.</b> The form shows one box per service on the inquiry (for example Accreditation, Freight, Customs, Trucking). "
            "Pick one or more Operations people for each.",
            "Choose the <b>Cargo type</b> (FCL, LCL, RoRo, Air, Bulk, Breakbulk or Land). A short description under the box explains each type.",
            "Click <b>Create job</b> and confirm. The job gets a number such as SJ-2026-00001 and a tracking code for the client."]) +
        fig("16-inquiry-accepted", "<span class='red'>1</span> Acknowledge and close.") +
        fig("17-acknowledge-close", "Closing the inquiry as won.", narrow=True) +
        fig("18-convert-to-job", "Convert to job. Each service gets its own Operations staff.", narrow=True) +
        warn("<b>Why one person per service?</b> It keeps the work separated. Only the people assigned to a service can mark that service's steps done. A Manager can step in for any.")))

    H.append(stage("6", "Run the job", who("Operations") + "Ben, Rico, Jessa, Mike", "Goal: every step of every service is done, in order, with the right documents.",
        p("The job page has a <b>Progress map</b> at the top and a <b>Next step</b> panel below it. You never have to guess what to do next.") +
        fig("19-job-top", "A new job. The Progress map shows every phase of the shipment.") +
        h2("Reading the Progress map") +
        ul(["<b>All phases</b> shows the big stages (for example 1 Importer accreditation, 2 Shipping, 3 Customs, 4 Delivery) with a count of steps done. <b>Click a phase</b> to review its steps.",
            "<b>Current phase</b> shows the steps of the phase you are in. Done steps are filled in. The <i>Lane assigned</i> step takes the colour of the lane the customs bureau picked: green, yellow or red."]) +
        h2("Marking a step done") +
        ol(["Open the job. The <b>Next step</b> panel names the step and lists what is needed first.",
            "If a document is needed <b>before</b> the step (for example SEC / DTI registration), upload it from the button on the panel. Steps cannot be done until it is in.",
            "Click <b>Mark done</b>. Enter the date and anything the step asks for (see the table below). Fields with a red star are required.",
            "Click <b>Mark done</b> and confirm. The next step becomes active."]) +
        fig("20-job-nextstep", "The Next step panel. <span class='red'>1</span> the main button.") +
        fig("21-milestone-required-doc", "Some steps create a document, for example <i>Filed with BOC</i> needs the Accreditation Application. It is required to continue.", narrow=True) +
        h2("Steps that ask for more") +
        table(["Step", "What it asks for"], [
            ["Booked with shipping line", "The <b>name of the shipping line</b> (type it in)."],
            ["Lane assigned", "The <b>lane</b> the customs bureau picked: Green, Yellow or Red."],
            ["Truck scheduled", "<b>Driver name</b>, <b>plate number</b> and <b>type of truck</b>."],
            ["Approved (accreditation)", "<b>Proof</b>, for example the BOC approval."],
            ["Delivered", "<b>Proof of delivery</b>, signed by the receiver."],
            ["Empty container returned", "<b>Proof</b>: the container return or interchange receipt."],
            ["D/O released, Duties paid, Port charges paid, Fees paid (LTO)", "An <b>approved and released fund request</b> first (see stage 7)."]]) +
        fig("22-booked-shipping-line", "Booked with shipping line asks for the shipping line.", narrow=True) +
        fig("32-lane-assigned", "Lane assigned: pick Green, Yellow or Red.", narrow=True) +
        fig("32c-truck-scheduled", "Truck scheduled: driver, plate number and type of truck.", narrow=True) +
        h2("The Documents tab") +
        p("Under the progress map, the <b>Documents</b> tab lists every document the job needs and where it belongs. You can <b>view</b> any received document. "
          "Documents are uploaded <b>inside the step</b> they belong to, so the order of work cannot be skipped. Only a Manager can replace a document that is already received.") +
        fig("33-documents-tab", "The Documents tab. Received documents can be viewed.")))

    H.append(stage("7", "Funds: when a step costs cash", who("Operations") + who("Manager") + who("Accounting"), "Goal: money is requested, approved, released and accounted for before the step that needs it.",
        p("Some steps cannot be done until the money for them has been released. The <b>Next step</b> panel shows a row such as <i>Funds for shipping line charges released</i> with the status of the request.") +
        fig("23-do-gate", "<i>D/O released</i> is blocked until funds are released. The panel offers <b>Request funds</b>.", narrow=False) +
        h2("The five moves of a fund request") +
        table(["Move", "Who", "What they do"], [
            ["1. Request", "Operations", "Click <b>Request funds</b>. The purpose is already filled in. Add the amount, who to pay, when it is needed and the funding source."],
            ["2. Approve", "Manager", "Review the request and approve it, or reject it with a reason (Operations can edit and resubmit)."],
            ["3. Approve release", "Accounting", "Choose the mode (cash, check, bank transfer), the date and the reference number. Proof is optional. Reference is not needed for cash."],
            ["4. Liquidate", "Operations", "<b>Only the person who made the request.</b> After paying, enter the amount actually spent and attach the receipts."],
            ["5. Review liquidation", "Accounting", "Check the receipts against the amount. Any excess is returned or any shortfall reimbursed. Then the request is verified."]]) +
        fig("24-fund-request", "Request funds. The purpose is already set for this step.", narrow=True) +
        fig("25-do-gate-submitted", "After submitting, the row shows a badge: <i>Submitted · awaiting approval</i>.") +
        fig("26-funds-tab-manager", "The Funds tab lists every request and its status.") +
        fig("27-review-fund", "Manager reviews the request.", narrow=True) +
        fig("29-approve-release", "Accounting approves the release.", narrow=True) +
        fig("30-liquidate", "Operations reports what was spent and attaches the receipts.", narrow=True) +
        fig("31-review-liquidation", "Accounting reviews the liquidation.", narrow=True) +
        fig("32b-duties-gate", "The same gate protects <i>Duties paid</i>, which needs a Duties &amp; taxes request.") +
        note("rule", "Which step needs which request",
             "<b>D/O released</b> → Shipping line local charges.&nbsp; <b>Duties paid</b> → Duties &amp; taxes.&nbsp; <b>Port charges paid</b> → Port charges (arrastre, wharfage, storage).&nbsp; "
             "<b>Fees paid</b> (LTO) → LTO fees. Each request only unlocks its own step.")))

    H.append(stage("8", "When something goes wrong", who("Operations") + who("Manager"), "Goal: a problem stops the job safely instead of being ignored.",
        ol(["Operations opens the job menu (<b>More</b>) and chooses <b>Flag an issue</b>.",
            "Describe what is wrong and confirm. The job goes <b>on hold</b> and its steps are frozen. The Manager is told.",
            "When it is fixed, Operations or the Manager clicks <b>Resolve issue</b> and writes how it was fixed. The job moves again."]) +
        fig("34-flag-issue", "Flagging an issue puts the job on hold.", narrow=True)))

    H.append(stage("9", "Close the job", who("Operations") + who("Manager"), "Goal: the job is formally completed.",
        ol(["When the last step is done, the panel says <b>All milestones done</b> with a closing checklist: milestones done, required documents received, no open issue.",
            "Operations clicks <b>Submit for closing</b> and confirms.",
            "The Manager opens the job, reviews the checklist and clicks <b>Confirm completed</b>. The job shows <b>Completed</b>."]) +
        fig("35-job-ready-to-close", "Operations submits the job for closing. <span class='red'>1</span>", narrow=False) +
        fig("35b-confirm-complete", "The Manager confirms completion.", narrow=True) +
        fig("35c-job-completed", "The finished job. Billing is outside this portal and will be integrated later.") +
        tip("<b>Done.</b> You have followed one shipment from the first inquiry to a completed job. Try again as a different customer, or press <i>Renegotiate</i> on the client page to see the other path.")))

    # ---------------- 6 Manager/Admin tools ----------------
    H.append(h1("6", "Manager and Admin tools"))
    H.append(h2("Dashboard"))
    H.append(p("Managers and Admins land on the <b>Dashboard</b>. <b>Needs attention</b> lists what waits for you. Below it are simple numbers in three tabs: "
               "<b>Sales &amp; quotations</b>, <b>Operations</b> and <b>Team</b>. Use the filters (time, service, scope, customer, staff) to narrow them."))
    H.append(fig("38-dashboard-admin", "The Dashboard. The Sales tab shows open inquiries, who we are waiting for, and the win rate."))
    H.append(table(["Number", "Meaning"], [
        ["Inquiries", "How many requests were received in the selected range."],
        ["Open now", "Inquiries still being worked on."],
        ["Waiting for client", "Quote sent, no answer yet. Turns amber when there are some."],
        ["Win rate", "Won out of won plus lost."],
        ["Where inquiries stand", "A count at each stage: preparing, waiting for approval, waiting for the client, accepted, won, lost."],
        ["Conversion funnel", "How many inquiries became quotes and how many became wins."]]))
    H.append(h2("Customers"))
    H.append(p("One profile per client with contact details, every inquiry and every job. Click a customer to see their history."))
    H.append(fig("43-customers", "The customer list."))
    H.append(h2("Users &amp; roles (Admin)"))
    H.append(p("Admins add users, change their roles and deactivate people who leave. When a person is deactivated, their open work is handed to someone else first."))
    H.append(fig("39-users", "Users &amp; roles."))
    H.append(fig("40-edit-roles", "Changing a person's roles.", narrow=True))
    H.append(h2("Settings (Admin and Manager)"))
    H.append(p("Defaults the system uses: how long a quote stays valid, reminders for quotes with no answer, port and container free days, and when liquidations are due."))
    H.append(fig("41-settings", "Settings."))
    H.append(h2("Audit log (Admin)"))
    H.append(p("A record of who did what, on which record and when. Nothing in it can be edited."))
    H.append(fig("42-audit", "The audit log."))
    H.append(h2("The client tracking page"))
    H.append(p("Every job has a <b>tracking code</b> (under <i>Key facts</i> on the job page). The client opens the tracking page and enters the code to see progress in plain words. "
               "It never shows money, staff names or documents. Use <b>Client view</b> on the job page to preview it."))
    H.append(fig("44-tracking-page", "What the client sees on the tracking page."))

    # ---------------- 7 Rules ----------------
    H.append(h1("7", "The rules the system enforces"))
    H.append(p("These rules are built in. They are why the system protects against mistakes."))
    H.append(table(["Rule", "What it means for you"], [
        ["Steps are done in order", "You cannot jump ahead. Only the current step can be marked done."],
        ["Documents come first", "If a step needs a document, the step is locked until it is uploaded. If a step produces a document, you upload it while marking the step done."],
        ["Fund gates (hard)", "D/O released, Duties paid, Port charges paid and LTO Fees paid cannot be marked done until the matching fund request is approved and released."],
        ["Required fields", "Fields with a red star must be filled. The system tells you which one is missing."],
        ["Confirm before saving", "Approving, rejecting, releasing funds, marking steps done, closing and similar actions ask you to confirm."],
        ["One Sales owner per inquiry", "An inquiry is assigned to one Sales person, who prepares its quotations."],
        ["Operations by service", "Operations staff are assigned per service on each job and only work their own service's steps."],
        ["Only the requester liquidates", "Only the person who requested the funds can report what was spent."],
        ["Only a Manager replaces documents", "Received documents can be viewed by everyone with access. Replacing one is a Manager action."],
        ["Quotation currency", "Quotations are in PHP."],
        ["Every change is recorded", "Each inquiry and job has a history. Versions of quotations are kept, with the reasons for returns."]]))
    H.append(h2("What Accounting does and does not do here"))
    H.append(p("In this portal Accounting <b>approves fund release</b>, <b>reviews liquidations</b> and <b>records receipts and quotations</b>. "
               "There is no billing, statement of account, payment tracking or profit in the portal. These will be added when the accounting system is integrated."))

    # ---------------- 8 Who can do what ----------------
    H.append(h1("8", "Who can do what"))
    yes, no = "✔", "–"
    H.append(table(["Action", "Admin", "Manager", "Sales", "Operations", "Accounting"], [
        ["Create customers and inquiries", yes, yes, no + " (can report)", no, no],
        ["Upload a quotation", yes, yes, yes + " (assigned)", no, no],
        ["Approve or reject a quotation", yes, yes, no, no, no],
        ["Close an inquiry (won or lost)", yes, yes, no, no, no],
        ["Convert to a job and assign Operations", yes, yes, no, no, no],
        ["See and open jobs", yes, yes, no, yes + " (assigned)", yes + " (view)"],
        ["Mark job steps done", yes, yes, no, yes + " (own service)", no],
        ["Request funds", yes, yes, no, yes + " (assigned)", no],
        ["Approve a fund request", yes, yes, no, no, no],
        ["Approve fund release", yes, no, no, no, yes],
        ["Liquidate (report spending)", no + "*", no + "*", no, yes + " (requester only)", no],
        ["Review liquidation", yes, no, no, no, yes],
        ["Add receipts and quotations", yes, no, no, no, yes],
        ["Replace a received document", yes, yes, no, no, no],
        ["Confirm a job as completed", yes, yes, no, no, no],
        ["Users, roles and audit log", yes, no, no, no, no],
        ["Settings", yes, yes, no, no, no],
        ["Dashboard", yes, yes, no, no, no]]))
    H.append(p("* Liquidation is only ever done by the person who requested the funds."))

    # ---------------- 9 FAQ ----------------
    H.append(h1("9", "Questions and troubleshooting"))
    faq = [
        ("My data disappeared.", "This is a mockup. Data lives in the browser tab and is lost when you refresh or close it. Only the demo people stay. Create the customer and inquiry again."),
        ("I cannot see Jobs (or another menu item).", "The menu only shows what your role can use. Sales, for example, does not see Jobs. Switch person from the avatar menu."),
        ("The Mark done button is missing or says Request funds / Upload.", "The step has something to do first: a document to upload, or a fund request to get approved and released. Read the first row of the Next step panel."),
        ("It says only certain staff can update this step.", "Operations are assigned per service. Ask the Manager to assign you, or sign in as the assigned person."),
        ("I clicked Mark done but nothing happened.", "Look for red messages under the fields. A required field (red star) is empty, such as the driver name or a proof file."),
        ("Why can't I liquidate this fund request?", "Only the person who requested the funds can liquidate them."),
        ("How do I see what the client sees?", "On the inquiry, click <b>View page</b> next to Client response. On a job, use <b>Client view</b> under Key facts."),
        ("How do I go back to the start?", "Refresh the page. Everything you created is cleared."),
        ("Where is billing?", "Billing, statements of account and payments are not part of this portal. They will come with the accounting integration.")]
    H.append(''.join(f'<div class="card" style="margin-bottom:3mm"><h3>{q}</h3><p style="margin:0">{a}</p></div>' for q, a in faq))
    H.append(h2("A quick checklist for a good demo"))
    H.append(ol(["Sign in as <b>Grace Tan</b> and create a customer and an inquiry for Sales <b>Ana Cruz</b>.",
                 "Switch to <b>Ana Cruz</b> and upload a quotation.",
                 "Switch back to <b>Grace Tan</b>, approve it, then open the client page and choose Accept.",
                 "As Grace Tan, close it as won and convert it, assigning Ben, Rico, Jessa and Mike.",
                 "Switch between those four people and work the steps. Try a fund-gated step.",
                 "As <b>Paolo Reyes</b> approve the release, then finish the job and confirm it as the Manager."]))

    # ---------------- 10 Glossary ----------------
    H.append(h1("10", "Glossary"))
    H.append(table(["Term", "In plain words"], [
        ["Inquiry", "A client's request for a service, before any quotation."],
        ["Quotation (quote)", "The price offer sent to the client. It can have several versions."],
        ["Job", "The actual shipment work, created once the client accepts."],
        ["Milestone / step", "One thing that must happen on a job, done in order."],
        ["Progress map", "The picture of all the phases and steps of a job."],
        ["Importer accreditation", "Registering the client with the Bureau of Customs so they can import."],
        ["BOC", "Bureau of Customs."],
        ["BL / AWB", "Bill of Lading (sea) or Air Waybill (air): the transport contract and receipt for the cargo."],
        ["D/O (Delivery Order)", "The paper from the shipping line that lets the cargo be collected from the port. It is issued after the line's local charges are paid."],
        ["Lane (Green, Yellow, Red)", "What the customs bureau decides for the shipment: Green = no check, Yellow = documents reviewed, Red = physical inspection."],
        ["Duties and taxes", "The amount paid to customs to release the cargo."],
        ["Arrastre", "The fee for handling cargo at the pier."],
        ["Wharfage", "The fee for cargo passing through the wharf."],
        ["Storage / port free time", "Days the cargo can stay at the port free of charge. After that, storage is charged each day."],
        ["Demurrage / detention", "Charges when a container stays too long out of the shipping line's hands (see container free days)."],
        ["FCL / LCL", "Full container load / less than container load (shared container)."],
        ["RoRo", "Roll-on/roll-off: vehicles are driven onto the ship."],
        ["POD", "Proof of delivery, signed by the receiver."],
        ["LTO", "Land Transportation Office: vehicle registration."],
        ["Fund request", "A request for cash needed to pay a cost on a job."],
        ["Release", "Accounting approving that the requested money is given out."],
        ["Liquidation", "Reporting how the money was spent, with receipts."],
        ["Tracking code", "A private code the client uses on the tracking page to see progress."]]))
    H.append(p("<br><b>End of manual.</b> If something in the system looks different from this manual, the system is newer. The screenshots can be refreshed at any time from the live build."))

    doc = f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{''.join(H)}</body></html>"
    return doc


def main():
    doc = build()
    with sync_playwright() as pw:
        b = pw.chromium.launch(); page = b.new_page()
        page.set_content(doc, wait_until="load"); page.wait_for_timeout(800)
        page.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True,
                 header_template="<div></div>",
                 footer_template="<div style=\"font-size:8px;color:#6b7099;width:100%;padding:0 16mm;display:flex;justify-content:space-between;font-family:Arial\">"
                                 "<span>T1M Portal · User manual</span><span>Page <span class='pageNumber'></span> of <span class='totalPages'></span></span></div>",
                 margin={"top": "18mm", "bottom": "18mm", "left": "16mm", "right": "16mm"})
        b.close()
    print("wrote", OUT)


if __name__ == "__main__":
    main()
