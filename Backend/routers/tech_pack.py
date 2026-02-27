from fastapi import APIRouter, File, UploadFile, Form
from typing import Optional
import json
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
import io
import os

router = APIRouter()

# PDF is 1400x900 points - must match template
PAGE_SIZE = (1400, 900)

elementCoordinates = {
    "brandName":           (920,  863),
    "productName":         (1210, 863),
    "productType":         (970,  765),
    "primaryColor":        (970,  720),
    "accentColors":        (970,  675),
    "material":            (970,  635),
    "weight":              (970,  590),
    "finishTexture":       (970,  545),
    "printMethod":         (970,  500),
    "specialFeatures":     (970,  455),
    "measurements":        (970,  410),
    "sizes":               (970,  365),
    "sampleQuantity":      (970,  320),
    "orderQuantity":       (970,  275),
    "targetPrice":         (970,  235),
    "description":         (10,   135),
    "specialInstructions": (710,  135),
}


@router.post("/generate")
async def generate_techpack(
    data: str = Form(...),
    frontSketch: Optional[UploadFile] = File(None),
    backSketch: Optional[UploadFile] = File(None)
):
    parsed_data = json.loads(data)

    template_path = os.path.join(
        os.path.dirname(__file__), 
        "../../Frontend/public/BlankTechPack.pdf"
    )
    
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found at {template_path}")
    
    reader = PdfReader(template_path)
    writer = PdfWriter()
    template_page = reader.pages[0]
    
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(1400, 900))

    # Draw text fields
    for field, (x, y) in elementCoordinates.items():
        value = parsed_data.get(field, "")
        if not value:
            continue

        text = str(value)

        if field in ['description', 'specialInstructions']:
            can.setFont("Helvetica", 18)
            lines = text.split('\n')[:5]
            for i, line in enumerate(lines):
                can.drawString(x, y - (i * 14), line[:80])
        else:
            can.setFont("Helvetica", 18)
            can.drawString(x, y, text[:50])

    # Draw front sketch image
    if frontSketch:
        front_bytes = await frontSketch.read()
        front_buffer = io.BytesIO(front_bytes)
        from reportlab.lib.utils import ImageReader
        front_img = ImageReader(front_buffer)
        # Front sketch area: x=10, y=100 from top -> y=790 reportlab, width~330, height~590
        can.drawImage(front_img, 10, 180, width=330, height=580, preserveAspectRatio=True, mask='auto')

    # Draw back sketch image
    if backSketch:
        back_bytes = await backSketch.read()
        back_buffer = io.BytesIO(back_bytes)
        from reportlab.lib.utils import ImageReader
        back_img = ImageReader(back_buffer)
        # Back sketch area: x=350, same y
        can.drawImage(back_img, 350, 180, width=330, height=580, preserveAspectRatio=True, mask='auto')

    can.save()
    packet.seek(0)
    
    overlay = PdfReader(packet)
    overlay_page = overlay.pages[0]
    template_page.merge_page(overlay_page)
    writer.add_page(template_page)
    
    output_path = "/tmp/filled_techpack.pdf"
    with open(output_path, "wb") as output_file:
        writer.write(output_file)
    
    return FileResponse(
        output_path, 
        filename="techpack.pdf",
        media_type="application/pdf"
    )