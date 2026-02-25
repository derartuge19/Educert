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
# 0) Helpers for Font Mapping
# ──────────────────────────────────────────────────────────────────

def _map_font_name(font_name: str) -> str:
    """
    Maps extraction font names to PyMuPDF standard font names.
    Prevents 'need font file or buffer' error by ensuring we use built-in fonts.
    """
    fn = str(font_name).lower()
    
    # Check for bold and italic flags in the name
    is_bold = "bold" in fn or "black" in fn or "heavy" in fn
    is_italic = "italic" in fn or "oblique" in fn
    
    # Map serif/times
    if "times" in fn or "serif" in fn or "roman" in fn:
        if is_bold and is_italic: return "tibi"
        if is_bold: return "tibo"
        if is_italic: return "tiit"
        return "tiro"
        
    # Map monospace/courier
    if "courier" in fn or "mono" in fn or "consolas" in fn:
        if is_bold and is_italic: return "cobi"
        if is_bold: return "cobo"
        if is_italic: return "coit"
        return "cour"
        
    # Default to Helvetica/Sans-Serif
    if is_bold and is_italic: return "hebi"
    if is_bold: return "hebo"
    if is_italic: return "heit"
    return "helv"

def extract_pdf_placeholders(pdf_path: str) -> dict:
    """
    Robust extraction of placeholders with font metadata.
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
                result[field_name].append({
                    "type": "acroform",
                    "page": page_idx,
                    "rect": (widget.rect.x0, widget.rect.y0, widget.rect.x1, widget.rect.y1)
                })

        # --- PASS 2: Text Layer ({{placeholder}}) ---
        # Using dict format to get font info
        page_dict = page.get_text("dict")
        page_width = page.rect.width
        page_center = page_width / 2

        for block in page_dict.get("blocks", []):
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span["text"]
                    for match in PLACEHOLDER_RE.finditer(text):
                        field_name = match.group(1).strip()
                        bbox = span["bbox"] # (x0, y0, x1, y1)
                        span_center = (bbox[0] + bbox[2]) / 2
                        
                        # Heuristic: if span center is within 10% of page center, it's "centered"
                        is_centered = abs(span_center - page_center) < (page_width * 0.1)
                        
                        # Store properties
                        style = {
                            "font": span["font"],
                            "size": span["size"],
                            "color": span["color"],
                            "flags": span["flags"],
                            "align": "center" if is_centered else "left"
                        }
                        
                        if field_name not in result:
                            result[field_name] = []
                        result[field_name].append({
                            "type": "text_overlay",
                            "page": page_idx,
                            "rect": bbox,
                            "style": style
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
    
    # --- PASS 1: Define what counts as an image field ---
    def is_signature(name: str) -> bool:
        n = name.lower()
        return "signature" in n or "sign" in n or n == "sig"

    def is_stamp(name: str) -> bool:
        n = name.lower()
        return "stamp" in n or "seal" in n or "logo" in n

    # Pre-index widgets by name for each page to avoid O(N*W) complexity
    if widget_index is None:
        page_widgets = {}
        for i in range(len(doc)):
            page_widgets[i] = {w.field_name: w for w in doc[i].widgets() if w.field_name}
    else:
        page_widgets = widget_index

    print(f"DEBUG: Starting PDF Render for {template_path}")
    print(f"DEBUG: field_values keys: {list(field_values.keys())}")
    
    for field_name, occurrences in placeholder_map.items():
        # Get value with fallbacks for common design names
        value = field_values.get(field_name)
        if value is None:
            fn_lower = field_name.lower().strip().replace("_", "").replace(" ", "")
            # Collect all field values with normalized keys
            normalized_field_values = {
                str(k).lower().strip().replace("_", "").replace(" ", ""): v 
                for k, v in field_values.items()
            }
            
            if fn_lower in {"recipientname", "studentname", "fullname", "name", "recipient"}:
                value = normalized_field_values.get("studentname") or normalized_field_values.get("recipientname") or normalized_field_values.get("name")
            elif fn_lower in {"coursename", "course", "subject", "training", "program"}:
                value = normalized_field_values.get("coursename") or normalized_field_values.get("course")
            elif fn_lower in {"certid", "certificateid", "id"}:
                value = normalized_field_values.get("certid") or normalized_field_values.get("id")
            elif fn_lower in {"issuedat", "date", "issuedon"}:
                value = normalized_field_values.get("issuedat") or normalized_field_values.get("issuedon")
            else:
                # Direct match on normalized key
                value = normalized_field_values.get(fn_lower)
        
        print(f"DEBUG: Field '{field_name}' -> Value: '{value}' (Type: {type(value)})")
        
        if value is None:
            value = ""
        
        is_sig_field = is_signature(field_name)
        is_stamp_field = is_stamp(field_name)
        is_image_field = is_sig_field or is_stamp_field

        for occ_idx, occ in enumerate(occurrences):
            page_idx = occ["page"]
            page = doc[page_idx]
            rect = fitz.Rect(occ["rect"])
            
            if occ["type"] == "acroform":
                target_widget = page_widgets.get(page_idx, {}).get(field_name)
                if target_widget:
                    if is_image_field:
                        img_path = signature_img_path if is_sig_field else stamp_img_path
                        if img_path and Path(img_path).exists():
                            page.insert_image(rect, filename=img_path, keep_proportion=True)
                    else:
                        target_widget.field_value = str(value)
                        target_widget.update()
            else:
                # Erase placeholder text
                page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)

                if is_image_field:
                    img_path = signature_img_path if is_sig_field else stamp_img_path
                    if img_path and Path(img_path).exists():
                        page.insert_image(rect, filename=img_path, keep_proportion=True)
                else:
                    if value:
                        style = occ.get("style", {})
                        font_size = style.get("size", min(rect.height * 0.9, 14))
                        ext_font = style.get("font", "helv")
                        font_name = _map_font_name(ext_font)
                        alignment = style.get("align", "left")

                        # RGB color conversion
                        color_int = style.get("color", 0)
                        red = (color_int >> 16) & 255
                        green = (color_int >> 8) & 255
                        blue = color_int & 255
                        color_tuple = (red/255, green/255, blue/255)

                        # If centered, expand the box to page width
                        render_rect = rect
                        if alignment == "center":
                            render_rect = fitz.Rect(10, rect.y0, page.rect.width - 10, rect.y1 + 10)
                            align_val = fitz.TEXT_ALIGN_CENTER
                        else:
                            align_val = fitz.TEXT_ALIGN_LEFT

                        print(f"DEBUG: Rendering '{field_name}' as '{value}' at {render_rect} Align={alignment}")
                        try:
                            page.insert_textbox(
                                rect=render_rect,
                                buffer=str(value),
                                fontsize=font_size,
                                fontname=font_name,
                                color=color_tuple,
                                align=align_val
                            )
                        except Exception as e:
                            print(f"DEBUG: Rendering failed, falling back. Error: {e}")
                            page.insert_text(
                                point=fitz.Point(rect.x0, rect.y1 - (rect.height * 0.2)),
                                text=str(value),
                                fontsize=font_size,
                                fontname="helv",
                                color=color_tuple,
                            )

    # Flatten the form
    doc.need_appearances(True)
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
    signer_info: dict | None = None,
) -> str:
    """
    Applies images to an already rendered PDF using the original template's coordinates.
    """
    placeholder_map = extract_pdf_placeholders(template_path)
    doc = fitz.open(pdf_path)

    # Re-use the same flexible matching logic
    def is_signature(name: str) -> bool:
        n = name.lower()
        return "signature" in n or "sign" in n or n == "sig"

    def is_stamp(name: str) -> bool:
        n = name.lower()
        return "stamp" in n or "seal" in n or "logo" in n

    for field_name, occurrences in placeholder_map.items():
        is_sig = is_signature(field_name)
        is_stmp = is_stamp(field_name)
        
        # Determine if this is a text placeholder for signer info
        is_signer_name = "signer_name" in field_name.lower() or "authority_name" in field_name.lower()
        is_signer_role = "signer_role" in field_name.lower() or "authority_title" in field_name.lower()

        img_path = None
        text_val = None

        if is_sig:
            img_path = signature_img_path
        elif is_stmp:
            img_path = stamp_img_path
        elif is_signer_name and signer_info:
            text_val = signer_info.get("name")
        elif is_signer_role and signer_info:
            text_val = signer_info.get("role")
        
        # Skip if nothing to apply
        if not img_path and not text_val:
            continue
        if img_path and not Path(img_path).exists():
            continue

        for occ in occurrences:
            page = doc[occ["page"]]
            rect = fitz.Rect(occ["rect"])
            
            # Erase existing placeholder
            page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)

            if img_path:
                page.insert_image(rect, filename=img_path, keep_proportion=True)
            elif text_val:
                style = occ.get("style", {})
                font_size = style.get("size", min(rect.height * 0.8, 12))
                ext_font = style.get("font", "helv")
                font_name = _map_font_name(ext_font)
                alignment = style.get("align", "left")
                
                # RGB color conversion
                color_int = style.get("color", 0)
                red = (color_int >> 16) & 255
                green = (color_int >> 8) & 255
                blue = color_int & 255
                color_tuple = (red/255, green/255, blue/255)

                render_rect = rect
                if alignment == "center":
                    render_rect = fitz.Rect(10, rect.y0, page.rect.width - 10, rect.y1 + 10)
                    align_val = fitz.TEXT_ALIGN_CENTER
                else:
                    align_val = fitz.TEXT_ALIGN_LEFT

                try:
                    page.insert_textbox(
                        rect=render_rect,
                        buffer=str(text_val),
                        fontsize=font_size,
                        fontname=font_name,
                        color=color_tuple,
                        align=align_val
                    )
                except Exception as e:
                    print(f"DEBUG: Rendering failed in sign apply. Error: {e}")
                    page.insert_text(
                        point=fitz.Point(rect.x0, rect.y1 - (rect.height * 0.2)),
                        text=str(text_val),
                        fontsize=font_size,
                        fontname="helv",
                        color=color_tuple
                    )

    doc.save(output_path)
    doc.close()
    return output_path
