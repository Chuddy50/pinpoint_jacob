from fastapi import APIRouter
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
import io
import os

router = APIRouter()

page_height = 792

'''
COORDS? 
 x ,y 
Brand: 600, 15
Style: 850, 15
prod type: 700 ,91
color: 700, 121
a color: 700, 154
material: 700, 188
weight: 700, 221
texture: 700, 249
print: 700, 279
special feat: 700, 311
measure: 700, 344
sizes: 700, 377
sample: 700, 407
order: 700, 430
Target: 700, 470
Decription: 7, 549
special instructions: 502, 549
front: 7, 93
back: 252, 91
'''

# x,y coords on pdf of where to write 
elementCoordinates = {
    "brandName": (846, 20),
    "productName": (1202, 20),
    "productType": (982, 131),
    "primaryColor": (982, 172),
    "accentColors": (982, 217),
    "material": (982, 263),
    "weight": (982, 310),
    "finishTexture": (982, 354),
    "printMethod": (982, 400),
    "specialFeatures": (982, 445),
    "measurements": (982, 491),
    "sizes": (982, 535),
    "sampleQuantity": (982, 577),
    "orderQuantity": (982, 621),
    "targetPrice": (982, 665),
    "description": (8, 770),
    "specialInstructions": (704, 770),
    "front": (8, 128),
    "back": (354, 128)
}

@router.post("/changed")
async def generate_techpack_changed(data: dict):
    # Path to blank template
    template_path = os.path.join(
        os.path.dirname(__file__), 
        "../../Frontend/public/TechPack.pdf"
    )
    
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found at {template_path}")
    
    # Read blank template
    reader = PdfReader(template_path)
    writer = PdfWriter()
    
    # Create overlay with user data
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Set font
    can.setFont("Helvetica", 10)
    
    '''
    # Draw each field at its coordinate
    for field, (x, y) in elementCoordinates.items():
        if field in data and data[field]:
            text = str(data[field])
            
            # Handle multiline text for description/instructions
            if field in ['description', 'specialInstructions']:
                can.setFont("Helvetica", 8)
                lines = text.split('\n')[:5]  # Max 5 lines
                for i, line in enumerate(lines):
                    can.drawString(x, y - (i * 12), line[:80])  # Truncate long lines
                can.setFont("Helvetica", 10)
            else:
                can.drawString(x, y, text[:50])  # Truncate to 50 chars

     # Just draw test text - change these coordinates to see where it appears
    can.drawString(100, 200, "I hate this")
    can.drawString(100, 100, "Test text 2")
    can.drawString(200, 100, "Another test")

    can.setFillColorRGB(1, 1, 1)  # White background
    can.rect(200-2, 200-2, 200, 15, fill=1, stroke=0)  # White rectangle
    can.setFillColorRGB(0, 0, 0)  # Black text
    can.drawString(200, 200, "I hate this")

    '''

    height = 683

    #brand test
    can.drawString(600, height - 15, "MY BRAND")

    #style test
    can.drawString(850, height - 15, "MY SHIRT")

    #prod type test
    can.drawString(700, height - 91, "TSHIRT")

        
    can.save()
    packet.seek(0)
    
    # Merge overlay with template
    overlay = PdfReader(packet)
    page = reader.pages[0]
    page.merge_page(overlay.pages[0])
    writer.add_page(page)
    
    # Write to temp file
    output_path = "/tmp/filled_techpack.pdf"
    with open(output_path, "wb") as output_file:
        writer.write(output_file)
    
    return FileResponse(
        output_path, 
        filename="techpack.pdf",
        media_type="application/pdf"
    )

@router.post("/generate")
async def generate_techpack(data: dict):
    template_path = os.path.join(
        os.path.dirname(__file__), 
        "../../Frontend/public/BlankTechPack.pdf"
    )
    
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found at {template_path}")
    
    reader = PdfReader(template_path)
    writer = PdfWriter()
    
    # Get the template page
    template_page = reader.pages[0]
    
    # Create text overlay
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    can.setFont("Helvetica", 16)
    can.drawString(100, 700, "I hate this")
    can.drawString(100, 650, "Test text 2")

    height = 683

    #brand test
    can.drawString(600, height - 15, "MY BRAND")

    #style test
    can.drawString(850, height - 15, "MY SHIRT")

    #prod type test
    can.drawString(700, height - 91, "TSHIRT")

    can.save()
    packet.seek(0)
    
    # Get text overlay
    overlay = PdfReader(packet)
    overlay_page = overlay.pages[0]
    
    # CRITICAL: Merge template ONTO overlay (not the other way)
    # This puts template below, text on top
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