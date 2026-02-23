"""
pdf_utils.py
─────────────────────────────────────────────────────────────────────
PDF template engine for EduCerts.

Workflow:
  1. extract_pdf_placeholders(pdf_path)
       → Scans every page for {{field}} patterns using PyMuPDF and pdfplumber.
       → Returns: { "field_name": [(page_idx, x0, y0, x1, y1), ...] }

  2. render_pdf_certificate(template_path, field_values, output_path)
       → Overlays field values on top of extracted positions.

  3. apply_signatures_to_pdf(...)
       → Overlays images on top of reserved signature/stamp placeholders.
"""

import re
import fitz  # PyMuPDF
import pdfplumber
from pathlib import Path

# More robust regex to handle potential line breaks or weird spacing inside {{ }}
PLACEHOLDER_RE = re.compile(r"\{\{\s*([\w\s]+?)\s*\}\}")

# ──────────────────────────────────────────────────────────────────
# 1) Extract placeholders + their bounding boxes from a PDF template
# ──────────────────────────────────────────────────────────────────

def extract_pdf_placeholders(pdf_path: str) -> dict:
    """
    Ultra-robust extraction of placeholders from:
    1. Text layer: {{field_name}}
    2. Interactive Form Fields (AcroForms): Field Names
    """
    result: dict[str, list] = {}
    doc = fitz.open(pdf_path)

    for page_idx, page in enumerate(doc):
        # --- PASS 1: Interactive Form Fields (AcroForms) ---
        for widget in page.widgets():
            field_name = widget.field_name
            if field_name:
                if field_name not in result:
                    result[field_name] = []
                # Store widget position; we can fill it directly later
                result[field_name].append({
                    "type": "acroform",
                    "page": page_idx,
                    "rect": (widget.rect.x0, widget.rect.y0, widget.rect.x1, widget.rect.y1)
                })

        # --- PASS 2: Text Layer ({{placeholder}}) ---
        words = page.get_text("words")
        if words:
            full_text = ""
            index_map = []
            for w in words:
                word_str = w[4]
                for _ in range(len(word_str)):
                    index_map.append(w)
                full_text += word_str + " "
                index_map.append(None)

            for match in PLACEHOLDER_RE.finditer(full_text):
                field_name = match.group(1)
                start, end = match.start(), match.end()
                participating_words = [index_map[k] for k in range(start, end) if index_map[k] is not None]
                
                if participating_words:
                    x0 = min(w[0] for w in participating_words)
                    y0 = min(w[1] for w in participating_words)
                    x1 = max(w[2] for w in participating_words)
                    y1 = max(w[3] for w in participating_words)
                    
                    if field_name not in result:
                        result[field_name] = []
                    result[field_name].append({
                        "type": "text_overlay",
                        "page": page_idx,
                        "rect": (x0, y0, x1, y1)
                    })

    doc.close()
    return result


# ──────────────────────────────────────────────────────────────────
# 2) Render a certificate PDF by overlaying values on the template
# ──────────────────────────────────────────────────────────────────

def render_pdf_certificate(
    template_path: str,
    field_values: dict,
    output_path: str,
    signature_img_path: str | None = None,
    stamp_img_path: str | None = None,
    placeholder_map: dict | None = None,
    widget_index: dict | None = None,
) -> str:
    """
    Fills forms and overlays text/images on the PDF.
    If placeholder_map is provided, skip the expensive extraction scan.
    If widget_index is provided, skip the widget indexing loop.
    """
    import time
    start_time = time.time()
    
    if placeholder_map is None:
        placeholder_map = extract_pdf_placeholders(template_path)

    doc = fitz.open(template_path)
    IMAGE_FIELDS = {"digital_signature", "stamp"}

    # Pre-index widgets by name for each page to avoid O(N*W) complexity
    if widget_index is None:
        page_widgets = {}
        for i in range(len(doc)):
            page_widgets[i] = {w.field_name: w for w in doc[i].widgets() if w.field_name}
    else:
        page_widgets = widget_index

    for field_name, occurrences in placeholder_map.items():
        value = field_values.get(field_name, "")
        is_image_field = field_name in IMAGE_FIELDS

        for occ in occurrences:
            page_idx = occ["page"]
            page = doc[page_idx]
            rect = fitz.Rect(occ["rect"])
            
            if occ["type"] == "acroform":
                widget = page_widgets.get(page_idx, {}).get(field_name)
                if widget:
                    # For widgets, we need to bind them to the existing doc/page
                    # fitz widgets are bound to the document they were read from.
                    # If we use a CACHED widget_index, we MUST ensure the widget is from the SAME doc.
                    # ACTUALLY, PyMuPDF widgets are bound to the document. 
                    # If we opened a NEW doc, we must find the widget in THIS doc.
                    # So caching the widget OBJECTS won't work across fitz.open calls.
                    # BUT we can cache the widget names and types if needed.
                    # However, searching by name is still O(W).
                    
                    # Re-finding the widget in the current doc's page
                    target_widget = None
                    for w in page.widgets():
                        if w.field_name == field_name:
                            target_widget = w
                            break
                    
                    if target_widget:
                        if is_image_field:
                            img_path = signature_img_path if field_name == "digital_signature" else stamp_img_path
                            if img_path and Path(img_path).exists():
                                page.insert_image(rect, filename=img_path)
                        else:
                            target_widget.field_value = str(value)
                            target_widget.update()
            else:
                page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)

                if is_image_field:
                    img_path = signature_img_path if field_name == "digital_signature" else stamp_img_path
                    if img_path and Path(img_path).exists():
                        page.insert_image(rect, filename=img_path)
                else:
                    if value:
                        font_size = min(rect.height * 0.9, 14)
                        page.insert_text(
                            point=fitz.Point(rect.x0, rect.y1 - (rect.height * 0.15)),
                            text=str(value),
                            fontsize=font_size,
                            color=(0, 0, 0),
                        )

    # Flatten the form (makes it uneditable and professional)
    doc.need_appearances(True) # Ensure values are visible
    doc.save(output_path)
    doc.close()
    
    elapsed = time.time() - start_time
    print(f"DEBUG: PDF Rendered in {elapsed:.3f}s: {output_path}")
    return output_path


# ──────────────────────────────────────────────────────────────────
# 3) Apply signature/stamp to an *already-rendered* certificate PDF
# ──────────────────────────────────────────────────────────────────

def apply_signatures_to_pdf(
    pdf_path: str,
    signature_img_path: str | None,
    stamp_img_path: str | None,
    template_path: str,
    output_path: str,
) -> str:
    """
    Applies images to an already rendered PDF.
    """
    placeholder_map = extract_pdf_placeholders(template_path)
    doc = fitz.open(pdf_path)

    for field_name, occurrences in placeholder_map.items():
        img_path = None
        if field_name == "digital_signature":
            img_path = signature_img_path
        elif field_name == "stamp":
            img_path = stamp_img_path
        
        if not img_path or not Path(img_path).exists():
            continue

        for occ in occurrences:
            page = doc[occ["page"]]
            rect = fitz.Rect(occ["rect"])
            # Erase existing placeholder text/blank space
            page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)
            page.insert_image(rect, filename=img_path)

    doc.save(output_path)
    doc.close()
    return output_path
