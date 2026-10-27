import re
import json
from reportlab.lib.pagesizes import letter, A4, A5
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Page sizing dictionary
PAGE_SIZES = {
    "6x9": (6 * inch, 9 * inch),
    "8.5x11": letter,
    "A4": A4,
    "A5": A5,
    "Kindle": (6 * inch, 9 * inch)
}

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            if self._pageNumber > 1:  # Don't print page number on cover/title page
                self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(self._pagesize[0] - 0.75 * inch, 0.45 * inch, page_text)
        self.restoreState()

def clean_for_pdf(text: str) -> str:
    # Escape XML entities for ReportLab Paragraphs
    clean = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Convert markdown bold and italic
    clean = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", clean)
    clean = re.sub(r"\*(.*?)\*", r"<i>\1</i>", clean)
    clean = re.sub(r"`(.*?)`", r"<font face='Courier'>\1</font>", clean)
    clean = re.sub(r"^>\s*", "", clean)
    return clean

def generate_pdf(book, chapters, settings, output_path: str):
    trim = settings.trim_size if settings and settings.trim_size else "6x9"
    page_size = PAGE_SIZES.get(trim, (6 * inch, 9 * inch))
    margin = (settings.margin_inches if settings else 0.75) * inch

    doc = SimpleDocTemplate(
        output_path,
        pagesize=page_size,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        alignment=1,  # Center
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=14
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#475569"),
        spaceAfter=30
    )
    author_style = ParagraphStyle(
        "CoverAuthor",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=40
    )
    h1_style = ParagraphStyle(
        "BookH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=16,
        spaceAfter=12
    )
    h2_style = ParagraphStyle(
        "BookH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        "BookBody",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=settings.font_size_pt if settings else 11,
        leading=(settings.font_size_pt or 11) * (settings.line_spacing or 1.4),
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=8
    )
    bullet_style = ParagraphStyle(
        "BookBullet",
        parent=body_style,
        leftIndent=15,
        spaceAfter=4
    )

    story = []

    # Title Page
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph(clean_for_pdf(book.title), title_style))
    if book.subtitle:
        story.append(Paragraph(clean_for_pdf(book.subtitle), subtitle_style))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph(clean_for_pdf(f"By {book.author or 'Anonymous'}"), author_style))
    story.append(PageBreak())

    # Front Matter
    if settings and settings.include_front_matter and settings.front_matter_json:
        try:
            fm = json.loads(settings.front_matter_json)
            for key, content in fm.items():
                if content:
                    story.append(Paragraph(clean_for_pdf(key.replace("_", " ").title()), h1_style))
                    for line in content.split("\n\n"):
                        clean_line = clean_for_pdf(line.strip())
                        if clean_line:
                            story.append(Paragraph(clean_line, body_style))
                    story.append(PageBreak())
        except Exception:
            pass

    # Table of Contents
    if settings and settings.include_toc:
        story.append(Paragraph("Table of Contents", h1_style))
        story.append(Spacer(1, 0.2 * inch))
        for ch in chapters:
            toc_item = clean_for_pdf(f"Chapter {ch.order_index}: {ch.title}")
            story.append(Paragraph(toc_item, body_style))
        story.append(PageBreak())

    # Chapters
    for ch in chapters:
        story.append(Paragraph(clean_for_pdf(f"Chapter {ch.order_index}: {ch.title}"), h1_style))
        content = ch.content or "No content recorded."
        paragraphs = content.split("\n\n")

        for para in paragraphs:
            trimmed = para.strip()
            if not trimmed:
                continue

            if trimmed.startswith("### "):
                story.append(Paragraph(clean_for_pdf(trimmed[4:]), h2_style))
            elif trimmed.startswith("## "):
                story.append(Paragraph(clean_for_pdf(trimmed[3:]), h2_style))
            elif trimmed.startswith("# "):
                continue  # Skip duplicate H1
            elif trimmed.startswith("- ") or trimmed.startswith("* "):
                for item in trimmed.split("\n"):
                    item_text = re.sub(r"^[\-\*]\s*", "", item.strip())
                    story.append(Paragraph(f"• {clean_for_pdf(item_text)}", bullet_style))
            else:
                story.append(Paragraph(clean_for_pdf(trimmed), body_style))

        story.append(PageBreak())

    # Back Matter
    if settings and settings.include_back_matter and settings.back_matter_json:
        try:
            bm = json.loads(settings.back_matter_json)
            for key, content in bm.items():
                if content:
                    story.append(Paragraph(clean_for_pdf(key.replace("_", " ").title()), h1_style))
                    for line in content.split("\n\n"):
                        clean_line = clean_for_pdf(line.strip())
                        if clean_line:
                            story.append(Paragraph(clean_line, body_style))
                    story.append(PageBreak())
        except Exception:
            pass

    doc.build(story, canvasmaker=NumberedCanvas)
    return output_path

