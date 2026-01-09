import os
import base64
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pdf2image import convert_from_path
import json
from dotenv import load_dotenv
from .ai_generator import generate_manim_article



load_dotenv()

# ============================================================================
# STRUCTURED OUTPUT MODELS
# ============================================================================

class Equation(BaseModel):
    """Represents a mathematical equation found on the page"""
    latex: str = Field(description="The equation in LaTeX format")
    context: str = Field(description="Brief context about what this equation represents")
    is_numbered: bool = Field(description="Whether the equation has a number/label")
    equation_number: Optional[str] = Field(default=None, description="The equation number if numbered")
    position_in_flow: int = Field(description="Position in the reading order of the page (0-indexed)")

class Diagram(BaseModel):
    """Represents a diagram, figure, or illustration"""
    description: str = Field(description="Detailed description of what the diagram shows")
    caption: Optional[str] = Field(default=None, description="The caption text if present")
    figure_number: Optional[str] = Field(default=None, description="Figure number if labeled (e.g., 'Figure 3.2')")
    diagram_type: str = Field(description="Type of diagram (graph, flowchart, geometric figure, etc.)")
    key_elements: List[str] = Field(description="List of key elements or labels visible in the diagram")
    position_in_flow: int = Field(description="Position in the reading order of the page (0-indexed)")

class TextSection(BaseModel):
    """Represents a section of text content"""
    heading: Optional[str] = Field(default=None, description="Section heading if present")
    content: str = Field(description="The actual text content")
    text_type: str = Field(description="Type of text (paragraph, definition, theorem, example, etc.)")
    is_highlighted: bool = Field(default=False, description="Whether this text is in a box or highlighted")
    position_in_flow: int = Field(description="Position in the reading order of the page (0-indexed)")

class ContentElement(BaseModel):
    """A single content element that preserves position in reading order"""
    element_type: str = Field(description="Type: 'text', 'equation', or 'diagram'")
    position: int = Field(description="Position in reading order (0-indexed)")
    text_section: Optional[TextSection] = Field(default=None, description="Present if element_type is 'text'")
    equation: Optional[Equation] = Field(default=None, description="Present if element_type is 'equation'")
    diagram: Optional[Diagram] = Field(default=None, description="Present if element_type is 'diagram'")

class PageContent(BaseModel):
    """Complete structured representation of a PDF page with preserved reading order"""
    page_number: int = Field(description="The page number")
    main_topic: str = Field(description="The main topic or concept covered on this page")
    content_flow: List[ContentElement] = Field(
        description="All content elements in reading order from top to bottom"
    )
    key_definitions: List[str] = Field(description="Important definitions or terms introduced on this page")
    summary: str = Field(description="A brief 2-3 sentence summary of what this page covers")

# ============================================================================
# PDF EXTRACTION SYSTEM PROMPT
# ============================================================================

EXTRACTION_SYSTEM_PROMPT = """You are an expert at analyzing educational and technical documents. Your job is to extract structured information from textbook pages, lecture notes, and academic papers.

When analyzing a page image, you must:

1. **Preserve reading order**: Extract content in the exact order it appears on the page from top to bottom. This is CRITICAL.
2. **Identify content types**: For each element, determine if it's text, an equation, or a diagram.
3. **Extract with precision**:
   - Text: Capture paragraphs, headings, definitions, theorems, examples
   - Equations: Convert to LaTeX format, preserve equation numbers
   - Diagrams: Detailed descriptions with all labels and visual elements
4. **Assign positions**: Each element gets a position number (0, 1, 2, ...) based on reading order
5. **Recognize key concepts**: Identify definitions, theorems, and core ideas for the summary

**CRITICAL**: The content_flow list must reflect the EXACT reading order of the page. If the page has:
- Paragraph → Equation → Paragraph → Diagram → Equation
Then content_flow must have elements at positions 0, 1, 2, 3, 4 in that exact order.

Be thorough and precise. The extracted information will be used to generate educational visualizations that follow the page's narrative flow."""

# ============================================================================
# MAIN EXTRACTION FUNCTIONS
# ============================================================================

class PDFPageExtractor:
    """Extract structured content from PDF pages using Claude Vision"""
    
    def __init__(self, anthropic_api_key: Optional[str] = os.environ.get("ANTHROPIC_API_KEY")):
        """
        Initialize the extractor
        
        Args:
            anthropic_api_key: Anthropic API key (or uses ANTHROPIC_API_KEY env var)
        """
        self.api_key = anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set in environment or passed as argument")
        
        self.llm = ChatAnthropic(
            model="claude-sonnet-4-5-20250929",
            temperature=0.3,  # Lower temperature for more accurate extraction
            api_key=self.api_key,
            max_tokens=8192
        )
        self.structured_llm = self.llm.with_structured_output(PageContent)
    
    def pdf_page_to_image(self, pdf_path: str, page_num: int, dpi: int = 300) -> str:
        """
        Convert a specific PDF page to an image using pdf2image
        
        Args:
            pdf_path: Path to the PDF file
            page_num: Page number to convert (1-indexed)
            dpi: Resolution for conversion (higher = better quality but larger file)
        
        Returns:
            Path to the generated image file
        """
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        # Convert single page to image
        images = convert_from_path(
            pdf_path,
            first_page=page_num,
            last_page=page_num,
            dpi=dpi
        )
        
        if not images:
            raise ValueError(f"Could not convert page {page_num} to image")
        
        # Save the image
        output_dir = Path("extracted_pages")
        output_dir.mkdir(exist_ok=True)
        
        image_path = output_dir / f"{pdf_path.stem}_page_{page_num}.png"
        images[0].save(image_path, "PNG")
        
        return str(image_path)
    
    def image_to_base64(self, image_path: str) -> str:
        """Convert image to base64 for API submission"""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    
    def extract_page_content(self, image_path: str, page_num: int) -> PageContent:
        """
        Extract structured content from a page image using Claude Vision
        
        Args:
            image_path: Path to the page image
            page_num: Page number for reference
        
        Returns:
            PageContent object with all extracted information
        """
        # Encode image to base64
        image_base64 = self.image_to_base64(image_path)
        
        # Create message with image
        messages = [
            SystemMessage(content=EXTRACTION_SYSTEM_PROMPT),
            HumanMessage(content=[
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_base64
                    }
                },
                {
                    "type": "text",
                    "text": f"Extract all content from this page (page {page_num}) IN READING ORDER. "
                           "Start from the top of the page and work down. Each piece of content "
                           "(text paragraph, equation, diagram) should be assigned a position number "
                           "based on where it appears in the natural reading flow. "
                           "Convert all equations to LaTeX. Describe all diagrams in detail."
                }
            ])
        ]
        
        # Get structured response
        page_content = self.structured_llm.invoke(messages)
        page_content.page_number = page_num
        
        return page_content
    
    def extract_pdf_page(self, pdf_path: str, page_num: int, dpi: int = 300) -> PageContent:
        """
        Complete pipeline: Convert PDF page to image and extract content
        
        Args:
            pdf_path: Path to the PDF file
            page_num: Page number to extract (1-indexed)
            dpi: Image resolution
        
        Returns:
            PageContent object with all extracted information
        """
        print(f"Converting page {page_num} to image...")
        image_path = self.pdf_page_to_image(pdf_path, page_num, dpi)
        
        print(f"Extracting content from page {page_num}...")
        page_content = self.extract_page_content(image_path, page_num)
        
        return page_content
    
    def extract_pdf_range(self, pdf_path: str, start_page: int, end_page: int, 
                          dpi: int = 300) -> List[PageContent]:
        """
        Extract content from a range of PDF pages
        
        Args:
            pdf_path: Path to the PDF file
            start_page: Starting page number (1-indexed)
            end_page: Ending page number (inclusive)
            dpi: Image resolution
        
        Returns:
            List of PageContent objects
        """
        all_pages = []
        
        for page_num in range(start_page, end_page + 1):
            try:
                page_content = self.extract_pdf_page(pdf_path, page_num, dpi)
                all_pages.append(page_content)
                print(f"✅ Successfully extracted page {page_num}")
            except Exception as e:
                print(f"❌ Error extracting page {page_num}: {e}")
        
        return all_pages
    
    def save_extraction(self, page_content: PageContent, output_path: str):
        """Save extracted content to JSON file"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(page_content.model_dump(), f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved extraction to {output_path}")
    
    def load_extraction(self, json_path: str) -> PageContent:
        """Load previously extracted content from JSON"""
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return PageContent(**data)

# ============================================================================
# INTEGRATION WITH YOUR EXISTING SYSTEM
# ============================================================================

def create_context_from_extraction(page_content: PageContent) -> str:
    """
    Create a text context that preserves the reading order of the page
    
    This converts the structured extraction into a format your system can use
    when generating components, maintaining the narrative flow.
    """
    context_parts = []
    
    context_parts.append(f"# Page {page_content.page_number}: {page_content.main_topic}")
    context_parts.append(f"\n## Summary\n{page_content.summary}\n")
    
    if page_content.key_definitions:
        context_parts.append("## Key Definitions")
        for definition in page_content.key_definitions:
            context_parts.append(f"- {definition}")
        context_parts.append("")
    
    context_parts.append("## Content (in reading order)\n")
    
    # Sort by position to ensure correct order
    sorted_content = sorted(page_content.content_flow, key=lambda x: x.position)
    
    for i, element in enumerate(sorted_content):
        context_parts.append(f"### [{i}] {element.element_type.upper()}")
        
        if element.element_type == "text" and element.text_section:
            section = element.text_section
            if section.heading:
                context_parts.append(f"**Heading:** {section.heading}")
            context_parts.append(f"**Type:** {section.text_type}")
            if section.is_highlighted:
                context_parts.append("**Highlighted:** Yes")
            context_parts.append(f"**Content:** {section.content}")
        
        elif element.element_type == "equation" and element.equation:
            eq = element.equation
            eq_num = f" ({eq.equation_number})" if eq.equation_number else ""
            context_parts.append(f"**LaTeX{eq_num}:** {eq.latex}")
            context_parts.append(f"**Context:** {eq.context}")
        
        elif element.element_type == "diagram" and element.diagram:
            diagram = element.diagram
            fig_info = []
            if diagram.figure_number:
                fig_info.append(f"Figure {diagram.figure_number}")
            fig_info.append(diagram.diagram_type)
            context_parts.append(f"**Type:** {' - '.join(fig_info)}")
            if diagram.caption:
                context_parts.append(f"**Caption:** {diagram.caption}")
            context_parts.append(f"**Description:** {diagram.description}")
            if diagram.key_elements:
                context_parts.append(f"**Key elements:** {', '.join(diagram.key_elements)}")
        
        context_parts.append("")  # Blank line between elements
    
    return "\n".join(context_parts)

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

def generate_manim_article_from_page(topic,pdf_path: str = None, page_range: tuple = None, max_components: int = 3, output_path: str ="output.html"):

    # Initialize extractor
    extractor = PDFPageExtractor()
    
    context = ""
    # Extract specified page range
    if pdf_path and page_range:
        start_page, end_page = page_range
        extracted_pages = extractor.extract_pdf_range(pdf_path, start_page, end_page)
        
        # For simplicity, use only the first page's content for context
        page_contents = []

        for page in extracted_pages:
            page_context = create_context_from_extraction(page)
            page_contents.append(page_context)
 
        context += "\n".join(page_contents)
        print("\n" + "="*80)
        print("EXTRACTED CONTEXT:")
        print("="*80)

    print(context)
    
    return generate_manim_article(topic=topic, max_components=max_components, context=context, output_path=output_path)


if __name__ == "__main__":
    # Initialize extractor
    #extractor = PDFPageExtractor()
    
    # Extract a single page
    #pdf_path = "src/notes/APMA1655_Theory_Overall (5).pdf"
    #page_num = 8
    
    # Extract content
    #page_content = extractor.extract_pdf_page(pdf_path, page_num)
    
    # Save to JSON for later use
    #xtractor.save_extraction(page_content, f"extractions/page_{page_num}.json")
    
    # Create text context for your system
    #context = create_context_from_extraction(page_content)
    #print("\n" + "="*80)
    #print("EXTRACTED CONTEXT:")
    #print("="*80)
    #print(context)

    topic = "Create visualization explaining the disc problem in provided page."
    
    generate_manim_article_from_page(topic=topic, pdf_path="src/notes/APMA1655_Theory_Overall (5).pdf", page_range=(8, 8), max_components=4, output_path="from_textbook.html")