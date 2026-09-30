"""Builds docs/workflow/Shipment-Workflow-Guide.pdf from shipment-workflow-e2e.md.

The Markdown file is the source of truth: edit it, then rebuild. The PDF uses the same look as the
scenario manual (Inter from the design system, A4, page numbers) and replaces the text diagram in
"The lifecycle at a glance" with a drawn one.

    python docs/workflow/build_guide.py
"""
import html, pathlib, re, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "docs/workflow/shipment-workflow-e2e.md"
OUT = ROOT / "docs/workflow/Shipment-Workflow-Guide.pdf"
FONT = (ROOT / "packages/design-system/fonts/Inter-latin-wght.woff2").as_uri()
LOGO = (ROOT / "packages/design-system/assets/top1movers-logo.png").as_uri()

# ---------- A small Markdown reader: just what the guide uses ----------

def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\[([^\]]+)\]\(#[^)]+\)", r"\1", s)  # in-page links read as plain text on paper
    return s

def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def table(rows):
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    head, body = cells[0], cells[2:]
    return ("<table><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr>"
            + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body) + "</table>")

def convert(md):
    """Returns (title, as_of, lead, sections) where sections = [(heading, html)]."""
    lines = md.splitlines()
    title = as_of = lead = None
    sections, buf, i = [], [], 0
    heading = None
    def flush():
        if heading: sections.append((heading, "".join(buf)))
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("# "): title = ln[2:].strip(); i += 1; continue
        if ln.startswith("As of "): as_of = ln.strip(); i += 1; continue
        if ln.startswith("## "):
            flush(); heading, buf = ln[3:].strip(), []; i += 1; continue
        if ln.startswith("### "): buf.append(f"<h3>{inline(ln[4:])}</h3>"); i += 1; continue
        if ln.startswith("```"):
            j = i + 1
            while not lines[j].startswith("```"): j += 1
            buf.append("<!--DIAGRAM-->" if heading == "The lifecycle at a glance" else "<pre>" + html.escape("\n".join(lines[i+1:j])) + "</pre>")
            i = j + 1; continue
        if ln.startswith("|"):
            j = i
            while j < len(lines) and lines[j].startswith("|"): j += 1
            buf.append(table(lines[i:j])); i = j; continue
        if re.match(r"^- \[ \] ", ln):
            items = []
            while i < len(lines) and re.match(r"^- \[ \] ", lines[i]): items.append(lines[i][6:]); i += 1
            buf.append("<ul class='check'>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul>"); continue
        if ln.startswith("- "):
            items = []
            while i < len(lines) and lines[i].startswith("- "): items.append(lines[i][2:]); i += 1
            buf.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul>"); continue
        if re.match(r"^\d+\. ", ln):
            items = []
            while i < len(lines) and re.match(r"^\d+\. ", lines[i]): items.append(re.sub(r"^\d+\. ", "", lines[i])); i += 1
            buf.append("<ol>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ol>"); continue
        if ln.strip():
            if heading == "About this guide" and lead is None: lead = ln.strip()
            buf.append(f"<p>{inline(ln)}</p>")
        i += 1
    flush()
    return title, as_of, lead, sections

# ---------- The lifecycle diagram (replaces the text drawing on paper) ----------

PHASES = [
    ("Pre-shipment", [("1", "Booked"), ("2", "Documentation")]),
    ("On the water", [("3", "Sailed")]),
    ("Port & customs", [("4", "Arrived at Port"), ("5", "Customs Clearance")]),
    ("Delivery", [("6", "Out for Delivery"), ("7", "Delivered")]),
    ("Finance", [("8", "Billing Ready"), ("9", "Closed")]),
]
CUSTOMS = ["Lodging Pending", "Lodged", "Assessment Pending", "Payment Pending", "Payment Completed", "Release Pending", "Released"]
SALES = ["Customer", "Inquiry", "Quotation", "Conforme signed", "Create shipment job"]

def diagram():
    arrow = "<span class='arr'>&rarr;</span>"
    sales = arrow.join(f"<span class='chip{' chip--end' if k == len(SALES)-1 else ''}'>{s}</span>" for k, s in enumerate(SALES))
    phases = ""
    for name, stages in PHASES:
        boxes = ""
        for n, s in stages:
            sub = ""
            if s == "Customs Clearance":
                sub = "<ol class='subs'>" + "".join(f"<li>{c}</li>" for c in CUSTOMS) + "</ol>"
            boxes += f"<div class='stage'><div class='t'><span class='n'>{n}</span><b>{s}</b></div>{sub}</div>"
        phases += f"<div class='phase'><div class='ph'>{name}</div>{boxes}</div>"
    return (f"<div class='dia'><div class='lane'><div class='lane-l'>Sales</div><div class='flow'>{sales}</div></div>"
            f"<div class='down'>&darr; the job opens at stage 1</div>"
            f"<div class='lane'><div class='lane-l'>Shipment job</div><div class='phases'>{phases}</div></div></div>")

# ---------- Page ----------

CSS = f"""@font-face {{ font-family: Inter; src: url('{FONT}'); font-weight: 100 900; }}
@page {{ size: A4; margin: 16mm 14mm 18mm; }}
body {{ font: 10.5pt/1.5 Inter, Arial, sans-serif; color: #262b52; margin: 0; }}
h1, h2, h3 {{ color: #2f3a8f; line-height: 1.2; margin: 0; }}
code {{ font-family: Consolas, monospace; font-size: .92em; background: #eff2f8; padding: 1px 4px; border-radius: 4px; }}
b {{ font-weight: 650; }}
p {{ margin: 6px 0; }}
ul, ol {{ margin: 6px 0 10px; padding-left: 20px; }} li {{ margin: 3px 0; }}
.cover {{ padding-top: 8mm; break-after: page; }}
.cover img {{ height: 44px; margin-bottom: 22mm; }}
.cover-bar {{ height: 4px; width: 60px; background: #e5383b; margin-bottom: 18px; }}
.eyebrow {{ text-transform: uppercase; letter-spacing: .08em; font-size: 9pt; color: #545b7c; font-weight: 600; margin: 0 0 6px; }}
.cover h1 {{ font-size: 32pt; letter-spacing: -.01em; }}
.lead {{ font-size: 12.5pt; color: #545b7c; max-width: 150mm; margin: 12px 0 22px; }}
.small {{ font-size: 9pt; color: #545b7c; }}
.toc {{ margin-top: 10mm; }} .toc h3 {{ font-size: 10pt; text-transform: uppercase; letter-spacing: .08em; color: #545b7c; margin-bottom: 6px; }}
.toc ol {{ padding-left: 0; list-style: none; counter-reset: t; }}
.toc li {{ counter-increment: t; border-bottom: 1px solid #e3e8f1; padding: 6px 0; }}
.toc li::before {{ content: counter(t); color: #2f3a8f; font-weight: 700; display: inline-block; width: 26px; }}
section {{ margin-bottom: 8mm; }}
section.new-page {{ break-before: page; }}
h2 {{ font-size: 17pt; margin: 0 0 8px; padding-top: 2mm; break-after: avoid; break-inside: avoid; }}
h2 .num {{ color: #e5383b; font-size: 10pt; letter-spacing: .1em; display: block; margin-bottom: 2px; }}
h3 {{ font-size: 12pt; margin: 14px 0 4px; break-after: avoid; }}
table {{ border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9pt; }}
th {{ text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .05em; color: #5d6485; border-bottom: 1px solid #c9d1e3; padding: 6px 7px; }}
td {{ border-bottom: 1px solid #e3e8f1; padding: 6px 7px; vertical-align: top; }}
tr {{ break-inside: avoid; }}
ul.check {{ list-style: none; padding-left: 4px; }}
ul.check li::before {{ content: ''; display: inline-block; width: 10px; height: 10px; border: 1.5px solid #2f3a8f; border-radius: 3px; margin-right: 8px; vertical-align: -1px; }}
pre {{ font: 8.5pt/1.4 Consolas, monospace; background: #f2f4fc; border-radius: 8px; padding: 10px 12px; }}
.dia {{ background: #f7f8fd; border: 1px solid #e3e8f1; border-radius: 12px; padding: 12px; margin: 10px 0 14px; break-inside: avoid; }}
.lane {{ display: grid; grid-template-columns: 22mm 1fr; gap: 8px; align-items: start; }}
.lane-l {{ font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: #545b7c; font-weight: 700; padding-top: 6px; }}
.flow {{ display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }}
.chip {{ background: #fff; border: 1px solid #c9d1e3; border-radius: 999px; padding: 3px 10px; font-size: 8.5pt; }}
.chip--end {{ background: #2f3a8f; color: #fff; border-color: #2f3a8f; font-weight: 600; }}
.arr {{ color: #8794ae; font-size: 9pt; }}
.down {{ margin: 8px 0 8px 30mm; font-size: 8.5pt; color: #545b7c; }}
.phases {{ display: grid; grid-template-columns: 1.1fr .85fr 1.35fr 1.05fr 1fr; gap: 6px; }}
.phase {{ display: flex; flex-direction: column; gap: 5px; }}
.ph {{ font-size: 7.5pt; text-transform: uppercase; letter-spacing: .06em; color: #fff; background: #2f3a8f; border-radius: 6px; padding: 3px 6px; font-weight: 700; }}
.stage {{ background: #fff; border: 1px solid #c9d1e3; border-radius: 8px; padding: 5px 7px; font-size: 8.5pt; }}
.stage > .t {{ display: flex; gap: 5px; align-items: flex-start; }}
.stage .n {{ display: inline-grid; place-items: center; flex: none; width: 15px; height: 15px; border-radius: 50%; background: #e8ebf7; color: #2f3a8f; font-size: 7.5pt; font-weight: 700; margin-top: 1px; }}
.subs {{ margin: 5px 0 0; padding-left: 16px; font-size: 7.5pt; color: #545b7c; }} .subs li {{ margin: 1px 0; }}"""

def build():
    title, as_of, lead, sections = convert(SRC.read_text(encoding="utf-8"))
    toc = "".join(f"<li>{inline(h)}</li>" for h, _ in sections)
    cover = (f"<div class='cover'><img src='{LOGO}' alt='Top1Movers'><div class='cover-bar'></div>"
             f"<p class='eyebrow'>Top1Movers Operations Portal · User guide</p><h1>{inline(title)}</h1>"
             f"<p class='lead'>{inline(lead or '')}</p><p class='small'>{inline(as_of or '')} · Stakeholder mockup, sample data only</p>"
             f"<div class='toc'><h3>Contents</h3><ol>{toc}</ol></div></div>")
    # Each major part starts on a new page; short parts flow on.
    new_page = {"The lifecycle at a glance", "Winning the work: inquiry to shipment job", "Customs Clearance",
                "Running alongside every stage", "Quick reference"}
    body = "".join(
        f"<section id='{slug(h)}' class='{'new-page' if h in new_page else ''}'><h2><span class='num'>{k:02d}</span>{inline(h)}</h2>"
        + b.replace("<!--DIAGRAM-->", diagram()) + "</section>"
        for k, (h, b) in enumerate(sections, 1))
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{html.escape(title)}</title><style>{CSS}</style></head><body>{cover}{body}</body></html>"

def main():
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="t1m-guide-")) / "guide.html"
    tmp.write_text(build(), encoding="utf-8")
    with sync_playwright() as pw:
        b = pw.chromium.launch(); p = b.new_page()
        p.goto(tmp.as_uri()); p.wait_for_timeout(600)
        p.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True,
              header_template="<span></span>",
              footer_template="<div style='font:8px Arial;color:#8794ae;width:100%;padding:0 14mm;display:flex;justify-content:space-between'><span>Top1Movers Operations Portal · Shipment workflow guide · sample data</span><span>Page <span class='pageNumber'></span> of <span class='totalPages'></span></span></div>",
              margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
        b.close()
    print("Wrote", OUT, f"{OUT.stat().st_size/1024:.0f} KB")

if __name__ == "__main__":
    main()
