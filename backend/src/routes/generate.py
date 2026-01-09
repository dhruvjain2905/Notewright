from fastapi import APIRouter, Depends, HTTPException, Request, File, UploadFile, Form
from pydantic import BaseModel
from ..ai_generator_image import generate_manim_article_from_page
from ..ai_generator import generate_manim_article
import json
from datetime import datetime
from ..database.models import get_db, Articles
from ..database.db import add_article, get_article_quota, get_articles
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os
from pathlib import Path
from pdf2image import convert_from_path
import base64
from PIL import Image
from PyPDF2 import PdfMerger, PdfReader
import img2pdf

router = APIRouter()

class ArticleRequest(BaseModel):
    prompt: str

    class Config:
        json_schema_extra = {"example": {"prompt": "Explain to me what a derivative is"}}


@router.post("/generate-article")
async def generate_article(
    prompt: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    """
    Generate an article from a text prompt and optional uploaded files (PDFs and images).
    Maximum 10 total pages (PDF pages + images count as 1 page each).
    Files are processed in order and combined into a single PDF.
    """
    temp_files = []  # Track all temp files for cleanup
    
    try:
        # If no files provided, use regular text generation
        if not files or len(files) == 0:
            my_html, title, subtitle, subject = generate_manim_article(
                topic=prompt, 
                max_components=15, 
                output_path="output.html"
            )
            
            saved_article = add_article(
                db, 
                title=title, 
                subtitle=subtitle, 
                subject=subject, 
                content=my_html
            )
            
            return {
                "id": saved_article.id,
                "html": my_html,
                "title": title,
                "subtitle": subtitle,
                "subject": subject
            }
        
        # Process files in order
        total_pages = 0
        pdf_merger = PdfMerger()
        
        for idx, file in enumerate(files):
            content_type = file.content_type
            
            if content_type == 'application/pdf':
                # Save PDF temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                    content = await file.read()
                    tmp.write(content)
                    tmp_path = tmp.name
                    temp_files.append(tmp_path)
                
                # Count pages and validate
                try:
                    pdf_reader = PdfReader(tmp_path)
                    page_count = len(pdf_reader.pages)
                    total_pages += page_count
                    
                    if total_pages > 10:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Total page count ({total_pages}) exceeds maximum of 10 pages"
                        )
                    
                    # Add to merger
                    pdf_merger.append(tmp_path)
                    
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Error reading PDF {file.filename}: {str(e)}")
                    
            elif content_type.startswith('image/'):
                # Save image temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
                    content = await file.read()
                    tmp.write(content)
                    img_path = tmp.name
                    temp_files.append(img_path)
                
                total_pages += 1  # Each image counts as 1 page
                
                if total_pages > 10:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Total page count ({total_pages}) exceeds maximum of 10 pages"
                    )
                
                # Convert image to PDF
                try:
                    # Open and convert image to RGB (needed for PDF conversion)
                    img = Image.open(img_path)
                    if img.mode in ('RGBA', 'LA', 'P'):
                        # Convert to RGB
                        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                        img = rgb_img
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Save as temporary image
                    temp_rgb_path = tempfile.NamedTemporaryFile(delete=False, suffix='.png').name
                    temp_files.append(temp_rgb_path)
                    img.save(temp_rgb_path, 'PNG')
                    
                    # Convert image to PDF
                    img_pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf').name
                    temp_files.append(img_pdf_path)
                    
                    with open(img_pdf_path, 'wb') as f:
                        f.write(img2pdf.convert(temp_rgb_path))
                    
                    # Add to merger
                    pdf_merger.append(img_pdf_path)
                    
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Error converting image {file.filename} to PDF: {str(e)}")
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")
        
        # Create the combined PDF
        combined_pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf').name
        temp_files.append(combined_pdf_path)
        pdf_merger.write(combined_pdf_path)
        pdf_merger.close()
        
        print(f"✅ Combined PDF created with {total_pages} pages at: {combined_pdf_path}")
        
        # Generate article from combined PDF
        my_html, title, subtitle, subject = generate_manim_article_from_page(
            topic=prompt,
            pdf_path=combined_pdf_path,
            page_range=(1, total_pages),  # Include all pages
            max_components=15,
            output_path="from_upload.html"
        )
        
        # Save article to database
        saved_article = add_article(
            db, 
            title=title, 
            subtitle=subtitle, 
            subject=subject, 
            content=my_html
        )
        
        return {
            "id": saved_article.id,
            "html": my_html,
            "title": title,
            "subtitle": subtitle,
            "subject": subject
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Clean up all temporary files
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception as e:
                print(f"Warning: Could not delete temp file {temp_file}: {e}")


@router.get("/articles")
async def read_articles(db: Session = Depends(get_db)):

    try:
        articles = get_articles(db)
        return articles

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/articles/{article_id}")
async def read_article(article_id: int, db: Session = Depends(get_db)):
    try:
        article = db.query(Articles).filter(Articles.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        return article

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


