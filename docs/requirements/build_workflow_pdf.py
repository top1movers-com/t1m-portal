"""Builds docs/requirements/Workflow-by-Stage.pdf from workflow-by-stage.md.

The Markdown file is the source: edit it, then rebuild. Reuses the reader and look of the
workflow guide (docs/workflow/build_guide.py): Inter, A4, cover, contents, page numbers.

    python docs/requirements/build_workflow_pdf.py
"""
import importlib.util, pathlib, tempfile, html
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "docs/requirements/workflow-by-stage.md"
OUT = ROOT / "docs/requirements/Workflow-by-Stage.pdf"
spec = importlib.util.spec_from_file_location("guide", ROOT / "docs/workflow/build_guide.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)

STAGES = [
    ("1", "Inquiry & quotation", ["Report (optional)", "Customer", "Inquiry + staff", "Upload quote", "Approve / return", "Send", "Client answer", "Close as won"]),
    ("2", "Job", ["Convert + assign Ops", "Milestones", "Documents", "Issues", "Submit for closing", "Confirm completed"]),
    ("3", "Accounting & billing", ["Fund request", "Approve", "Release", "Liquidate", "Verify", "SOA", "Approve", "Send", "Payments", "Financially closed"]),
]

def diagram():
    arrow = "<span class='arr'>&rarr;</span>"
    rows = ""
    for n, name, steps in STAGES:
        flow = arrow.join(f"<span class='chip{' chip--end' if k == len(steps)-1 else ''}'>{html.escape(s)}</span>" for k, s in enumerate(steps))
        rows += f"<div class='lane'><div class='lane-l'>Stage {n}<br>{html.escape(name)}</div><div class='flow'>{flow}</div></div><div class='down'>&darr;</div>"
    rows = rows.rsplit("<div class='down'>&darr;</div>", 1)[0]
    return (f"<div class='dia'>{rows}<div style='margin-top:10px;font-size:8.5pt;color:#545b7c'>Alongside every stage: "
            "<b>Stage 4</b> users, roles and permissions · <b>Stage 5</b> dashboards and My Work.</div></div>")

def build():
    title, as_of, lead, sections = g.convert(SRC.read_text(encoding="utf-8"))
    toc = "".join(f"<li>{g.inline(h)}</li>" for h, _ in sections)
    cover = (f"<div class='cover'><img src='{g.LOGO}' alt='Top1Movers'><div class='cover-bar'></div>"
             f"<p class='eyebrow'>Top1Movers Operations Portal · Agreed requirements</p><h1>{g.inline(title)}</h1>"
             f"<p class='lead'>{g.inline(lead or '')}</p><p class='small'>{g.inline(as_of or '')} · Proposal stage</p>"
             f"<div class='toc'><h3>Contents</h3><ol>{toc}</ol></div></div>")
    new_page = {"Stage 1: Inquiry and quotation", "Stage 2: Job", "Stage 3: Accounting and billing",
                "Stage 4: Users, roles and permissions", "Stage 5: Dashboards", "Quick reference: who does what"}
    body = "".join(
        f"<section id='{g.slug(h)}' class='{'new-page' if h in new_page else ''}'><h2><span class='num'>{k:02d}</span>{g.inline(h)}</h2>"
        + b.replace("<!--DIAGRAM-->", diagram()) + "</section>"
        for k, (h, b) in enumerate(sections, 1))
    css = g.CSS + "\n.lane-l { line-height: 1.3; } .down { margin: 4px 0 4px 30mm; }"
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{html.escape(title)}</title><style>{css}</style></head><body>{cover}{body}</body></html>"

def main():
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="t1m-req-")) / "workflow.html"
    tmp.write_text(build(), encoding="utf-8")
    with sync_playwright() as pw:
        b = pw.chromium.launch(); p = b.new_page()
        p.goto(tmp.as_uri()); p.wait_for_timeout(600)
        p.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True,
              header_template="<span></span>",
              footer_template="<div style='font:8px Arial;color:#8794ae;width:100%;padding:0 14mm;display:flex;justify-content:space-between'><span>Top1Movers Operations Portal · Workflow by stage</span><span>Page <span class='pageNumber'></span> of <span class='totalPages'></span></span></div>",
              margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
        b.close()
    print("Wrote", OUT, f"{OUT.stat().st_size/1024:.0f} KB")

if __name__ == "__main__":
    main()
