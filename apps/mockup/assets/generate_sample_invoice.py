"""
Generates a sample/mock invoice PDF for the Top1Movers Operations Portal
mockup, so the demo has a downloadable document to simulate the Billing
Summary -> Finance handoff. Uses the same job data as the mockup's
SJ-2026-00101 sample (Sample Trading Co., Shanghai -> Manila -> Cebu).

Run: python generate_sample_invoice.py
Output: sample-invoice-SJ-2026-00101.pdf (in this same folder)
"""
import base64
import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX_HTML = os.path.join(HERE, "..", "index.html")
LOGO_PNG = os.path.join(HERE, "top1movers-logo.png")
OUTPUT_PDF = os.path.join(HERE, "sample-invoice-SJ-2026-00101.pdf")

NAVY = colors.HexColor("#0B1F4B")
NAVY_700 = colors.HexColor("#1E3A7A")
INK = colors.HexColor("#1A1F2B")
INK_2 = colors.HexColor("#5B6472")
BORDER = colors.HexColor("#D8DCE3")
SURFACE_MUTED = colors.HexColor("#F4F6F9")
WARNING_BG = colors.HexColor("#FFF4E5")
WARNING_TEXT = colors.HexColor("#8A5A00")


def extract_logo():
    """Pull the base64 PNG logo already embedded in the mockup's index.html
    so the sample invoice matches the mockup's brand asset exactly."""
    if os.path.exists(LOGO_PNG):
        return
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()
    m = re.search(r'LOGO_SRC = "data:image/png;base64,([^"]+)"', html)
    if not m:
        raise RuntimeError("Could not find LOGO_SRC base64 PNG in index.html")
    with open(LOGO_PNG, "wb") as out:
        out.write(base64.b64decode(m.group(1)))


def peso(n):
    return "PHP {:,.2f}".format(n)


def build():
    extract_logo()

    styles = getSampleStyleSheet()
    label_style = ParagraphStyle(
        "label", parent=styles["Normal"], fontName="Helvetica-Bold",
        fontSize=8, textColor=INK_2, spaceAfter=2, leading=10,
    )
    value_style = ParagraphStyle(
        "value", parent=styles["Normal"], fontName="Helvetica",
        fontSize=10, textColor=INK, leading=13,
    )
    small_style = ParagraphStyle(
        "small", parent=styles["Normal"], fontName="Helvetica",
        fontSize=8, textColor=INK_2, leading=11,
    )
    title_style = ParagraphStyle(
        "title", parent=styles["Normal"], fontName="Helvetica-Bold",
        fontSize=20, textColor=NAVY, leading=24,
    )
    section_style = ParagraphStyle(
        "section", parent=styles["Normal"], fontName="Helvetica-Bold",
        fontSize=9, textColor=NAVY_700, spaceBefore=4, spaceAfter=6,
    )

    doc = SimpleDocTemplate(
        OUTPUT_PDF, pagesize=letter,
        topMargin=20 * mm, bottomMargin=20 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm,
        title="Sample Billing Summary - SJ-2026-00101 (Mock Data)",
    )

    story = []

    # ---- Mock watermark banner ----
    mock_banner = Table(
        [[Paragraph(
            "<b>SAMPLE DOCUMENT &mdash; MOCK DATA</b>  "
            "For Top1Movers Operations Portal demo purposes only. "
            "Not a real invoice, not financial advice, no actual amounts owed.",
            ParagraphStyle("mock", parent=small_style, textColor=WARNING_TEXT,
                           fontSize=8.5, alignment=TA_CENTER),
        )]],
        colWidths=[doc.width],
    )
    mock_banner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WARNING_BG),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#F0C36D")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(mock_banner)
    story.append(Spacer(1, 14))

    # ---- Header: logo + doc title/meta ----
    logo_img = Image(LOGO_PNG, width=42 * mm, height=42 * mm * (0.32))
    logo_img.hAlign = "LEFT"

    meta_table = Table(
        [
            [Paragraph("Billing Summary", title_style)],
            [Paragraph("Doc No. <b>BS-2026-00101</b>", value_style)],
            [Paragraph("Date issued: <b>28 Sep 2026</b>", value_style)],
            [Paragraph("Shipment Job: <b>SJ-2026-00101</b>", value_style)],
        ],
        colWidths=[doc.width - 46 * mm],
    )
    meta_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    header_table = Table([[logo_img, meta_table]], colWidths=[46 * mm, doc.width - 46 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Top1Movers Worldwide Inc. &middot; Manila North Harbor Office, Manila, Philippines "
        "&middot; ops@top1movers.example (mock)",
        small_style,
    ))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 14))

    # ---- Bill-to / shipment reference two-column block ----
    bill_to = [
        Paragraph("BILL TO", label_style),
        Paragraph("<b>Sample Trading Co.</b>", value_style),
        Paragraph("Cebu Branch (Consignee)", value_style),
        Paragraph("Attn: Ana Reyes", value_style),
        Paragraph("Terms: Net 45, FOB Manila", value_style),
    ]
    shipment_ref = [
        Paragraph("SHIPMENT REFERENCE", label_style),
        Paragraph("Route: Shanghai, CN &rarr; Manila, PH &rarr; Cebu, PH", value_style),
        Paragraph("Shipping line: Maersk &middot; Vessel/Voyage: Maersk Shenzhen / 118E", value_style),
        Paragraph("Container: TMWU-330218-4 &middot; BL No.: BL-2026-04471", value_style),
        Paragraph("Quotation: QT-2026-0041 v3 (approved 14 Sep 2026)", value_style),
    ]
    ref_table = Table([[bill_to, shipment_ref]], colWidths=[doc.width / 2.0] * 2)
    ref_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (1, 0), (1, 0), 16),
    ]))
    story.append(ref_table)
    story.append(Spacer(1, 18))

    # ---- Charges table ----
    story.append(Paragraph("CHARGES", section_style))

    rows = [
        ["Description", "Category", "Supporting evidence", "Amount"],
        ["Ocean freight", "Freight", "freight-invoice.pdf", peso(132000)],
        ["Customs duty", "Duties & Taxes", "boc-receipt.pdf", peso(18400)],
        ["Documentation fee", "Fees", "docfee-receipt.pdf", peso(3500)],
    ]
    actual_total = 132000 + 18400 + 3500
    quoted_total = 174500

    charges_table = Table(rows, colWidths=[62 * mm, 34 * mm, 42 * mm, doc.width - (62 + 34 + 42) * mm])
    charges_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SURFACE_MUTED]),
    ]))
    story.append(charges_table)
    story.append(Spacer(1, 10))

    # ---- Totals block ----
    margin = quoted_total - actual_total
    margin_pct = (margin / quoted_total * 100) if quoted_total else 0
    totals_rows = [
        ["Quoted amount (QT-2026-0041 v3)", peso(quoted_total)],
        ["Total actual charges", peso(actual_total)],
        ["Margin", "{}  ({:.1f}%)".format(peso(margin), margin_pct)],
    ]
    totals_table = Table(totals_rows, colWidths=[doc.width - 55 * mm, 55 * mm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, -1), (-1, -1), NAVY),
        ("LINEABOVE", (0, -1), (-1, -1), 0.75, NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 18))

    story.append(Paragraph("BILLING STATUS", section_style))
    status_note = Table(
        [[Paragraph(
            "This job's billing checklist is complete and has been marked "
            "<b>Ready for Finance</b>. This summary reflects charges recorded "
            "in the Operations Portal as of the issue date above; it is a "
            "handoff document to Finance, not a client-facing invoice.",
            value_style,
        )]],
        colWidths=[doc.width],
    )
    status_note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE_MUTED),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(status_note)
    story.append(Spacer(1, 24))

    story.append(HRFlowable(width="100%", thickness=0.75, color=BORDER))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Generated from mock data for the Top1Movers Operations Portal "
        "proposal-stage mockup. All names, amounts, and reference numbers "
        "are illustrative.",
        small_style,
    ))

    doc.build(story)
    print("Wrote", OUTPUT_PDF)


if __name__ == "__main__":
    build()
