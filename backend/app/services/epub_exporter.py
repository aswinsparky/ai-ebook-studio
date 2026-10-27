import re
import json
import html
import ebooklib
from ebooklib import epub

def markdown_to_html(md: str) -> str:
    paragraphs = md.split("\n\n")
    html_parts = []
    in_list = False

    for p in paragraphs:
        trimmed = p.strip()
        if not trimmed:
            continue

        if trimmed.startswith("### "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h3>{html.escape(trimmed[4:])}</h3>")
        elif trimmed.startswith("## "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h2>{html.escape(trimmed[3:])}</h2>")
        elif trimmed.startswith("# "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h1>{html.escape(trimmed[2:])}</h1>")
        elif trimmed.startswith("- ") or trimmed.startswith("* "):
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            for item in trimmed.split("\n"):
                clean_item = re.sub(r"^[\-\*]\s*", "", item.strip())
                if clean_item:
                    # Parse bold inside bullet
                    b_item = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", html.escape(clean_item))
                    html_parts.append(f"<li>{b_item}</li>")
        else:
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            # Parse bold, italic, code
            esc = html.escape(trimmed)
            esc = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", esc)
            esc = re.sub(r"\*(.*?)\*", r"<em>\1</em>", esc)
            esc = re.sub(r"`(.*?)`", r"<code>\1</code>", esc)
            html_parts.append(f"<p>{esc}</p>")

    if in_list:
        html_parts.append("</ul>")

    return "\n".join(html_parts)

def generate_epub(book, chapters, settings, output_path: str):
    epub_book = epub.EpubBook()

    # Metadata
    epub_book.set_identifier(f"urn:uuid:{book.id}")
    epub_book.set_title(book.title)
    epub_book.set_language(book.language or "en")
    epub_book.add_author(book.author or "Anonymous")

    # CSS Style
    style = """
    @namespace epub "http://www.idpf.org/2007/ops";
    body {
        font-family: 'Georgia', serif;
        line-height: 1.5;
        margin: 5%;
        color: #1e293b;
    }
    h1 {
        font-size: 1.8em;
        text-align: center;
        margin-top: 1.5em;
        margin-bottom: 0.8em;
        color: #0f172a;
    }
    h2 {
        font-size: 1.3em;
        margin-top: 1.2em;
        margin-bottom: 0.5em;
        color: #1e293b;
    }
    h3 {
        font-size: 1.1em;
        margin-top: 1em;
        margin-bottom: 0.4em;
        color: #334155;
    }
    p {
        margin-bottom: 0.8em;
        text-indent: 1.2em;
    }
    p:first-of-type {
        text-indent: 0;
    }
    ul {
        margin-bottom: 0.8em;
        padding-left: 1.5em;
    }
    li {
        margin-bottom: 0.4em;
    }
    .titlepage {
        text-align: center;
        margin-top: 25%;
    }
    .subtitle {
        font-style: italic;
        color: #64748b;
        font-size: 1.1em;
    }
    .author {
        font-weight: bold;
        margin-top: 2em;
    }
    """
    default_css = epub.EpubItem(
        uid="style_nav",
        file_name="style/main.css",
        media_type="text/css",
        content=style
    )
    epub_book.add_item(default_css)

    spine = ["nav"]
    toc = []

    # Title Page
    title_html = f"""
    <html>
    <head><title>{html.escape(book.title)}</title></head>
    <body class="titlepage">
        <h1>{html.escape(book.title)}</h1>
        <p class="subtitle">{html.escape(book.subtitle or '')}</p>
        <p class="author">By {html.escape(book.author or 'Anonymous')}</p>
    </body>
    </html>
    """
    c_title = epub.EpubHtml(title="Title Page", file_name="titlepage.xhtml", lang=book.language or "en")
    c_title.content = title_html
    c_title.add_item(default_css)
    epub_book.add_item(c_title)
    spine.append(c_title)

    # Front Matter
    if settings and settings.include_front_matter and settings.front_matter_json:
        try:
            fm = json.loads(settings.front_matter_json)
            for idx, (key, content) in enumerate(fm.items(), 1):
                if content:
                    sec_title = key.replace("_", " ").title()
                    c_fm = epub.EpubHtml(title=sec_title, file_name=f"fm_{idx}.xhtml", lang=book.language or "en")
                    c_fm.content = f"<html><head><title>{sec_title}</title></head><body><h1>{sec_title}</h1>{markdown_to_html(content)}</body></html>"
                    c_fm.add_item(default_css)
                    epub_book.add_item(c_fm)
                    spine.append(c_fm)
                    toc.append(c_fm)
        except Exception:
            pass

    # Chapters
    for ch in chapters:
        ch_title = f"Chapter {ch.order_index}: {ch.title}"
        c_ch = epub.EpubHtml(title=ch_title, file_name=f"chap_{ch.order_index}.xhtml", lang=book.language or "en")
        body_html = markdown_to_html(ch.content or "")
        c_ch.content = f"<html><head><title>{html.escape(ch_title)}</title></head><body><h1>{html.escape(ch_title)}</h1>{body_html}</body></html>"
        c_ch.add_item(default_css)
        epub_book.add_item(c_ch)
        spine.append(c_ch)
        toc.append(c_ch)

    # Back Matter
    if settings and settings.include_back_matter and settings.back_matter_json:
        try:
            bm = json.loads(settings.back_matter_json)
            for idx, (key, content) in enumerate(bm.items(), 1):
                if content:
                    sec_title = key.replace("_", " ").title()
                    c_bm = epub.EpubHtml(title=sec_title, file_name=f"bm_{idx}.xhtml", lang=book.language or "en")
                    c_bm.content = f"<html><head><title>{sec_title}</title></head><body><h1>{sec_title}</h1>{markdown_to_html(content)}</body></html>"
                    c_bm.add_item(default_css)
                    epub_book.add_item(c_bm)
                    spine.append(c_bm)
                    toc.append(c_bm)
        except Exception:
            pass

    epub_book.toc = tuple(toc)
    epub_book.add_item(epub.EpubNcx())
    epub_book.add_item(epub.EpubNav())
    epub_book.spine = spine

    epub.write_epub(output_path, epub_book, {})
    return output_path

