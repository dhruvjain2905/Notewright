from manim import *
import os, glob
import numpy as np
import math
import re
import uuid
import subprocess
import base64
from pdf2image import convert_from_path
import json
from pathlib import Path
from langgraph.graph import StateGraph, END, START
from typing import TypedDict, Annotated, List, Union
import operator
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage
from langchain_anthropic import ChatAnthropic
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Send
from dotenv import load_dotenv
from .prompts import PLAN_IMAGE_SYSTEM_PROMPT, PLAN_VIDEO_SYSTEM_PROMPT, EXECUTE_IMAGE_SYSTEM_PROMPT, EXECUTE_VIDEO_SYSTEM_PROMPT

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
# COMPONENT MODELS
# ============================================================================

class ImageComponent(BaseModel):
    description: str = Field(
        description=(
            "A detailed high-level description of a STATIC Manim still-image visualization. "
            "Use ONLY for concepts that do NOT involve motion, change, or transformation. "
            "Examples: labeled diagrams, coordinate systems, static geometric shapes. "
            "If the concept involves ANY animation, movement, or change over time, "
            "you MUST use VideoComponent instead. "
            "Describe what static objects appear, how they should look, "
            "the scene layout, and what conceptual point the static image illustrates."
        )
    )
    caption: str = Field(
        description="A short caption shown below the image explaining the key insight."
    )

class VideoComponent(BaseModel):
    description: str = Field(
        description=(
            "A detailed high-level description of a DYNAMIC Manim animation. "
            "Use for ANY concept involving motion, transformation, change, or process. "
            "Examples: moving objects, morphing shapes, values changing, step-by-step processes, "
            "limits approaching, functions transforming, points moving along curves. "
            "CRITICAL: If something changes, moves, or transforms, this MUST be a VideoComponent. "
            "Describe the SEQUENCE of animation: what happens first, then what changes, "
            "what transforms/movements occur, and how the viewer should interpret the progression. "
            "Keep the total animation conceptual length ≤ 15 seconds."
        )
    )
    caption: str = Field(
        description="A short caption shown below the video explaining the key insight."
    )
    length: str = Field(
        description="Just approximate length of video"
    )

class TextComponent(BaseModel):
    text: str = Field(
        description=(
            "A concise, engaging paragraph that explains part of the concept. "
            "Avoid redundancy and connect smoothly to surrounding components."
        )
    )

class ImageComponentCoded(BaseModel):
    description: str = Field(
        description="A detailed high-level description of the Manim still-image visualization."
    )
    caption: str = Field(
        description="A short caption shown below the image explaining the key insight."
    )
    code: str = Field(
        description="The full runnable error free Manim code to generate the image"
    )

class VideoComponentCoded(BaseModel):
    description: str = Field(
        description="A detailed high-level description of the Manim animation."
    )
    caption: str = Field(
        description="A short caption shown below the video explaining the key insight."
    )
    code: str = Field(
        description="The full runnable error free Manim code to generate the video"
    )

class AllComponents(BaseModel):
    components: List[Union[TextComponent, ImageComponent, VideoComponent]] = Field(
        description=(
            "Ordered list of components forming the complete article content. "
            "Each component should provide a distinct contribution—text, image, or video. "
            "The list should flow logically from introduction through explanation to conclusion."
        )
    )

# ============================================================================
# STATE DEFINITIONS
# ============================================================================

class GenerateArticle(TypedDict):
    topic: str
    max_components: int
    components: List[Union[TextComponent, VideoComponent, ImageComponent]]
    coded_components: Annotated[List[Union[TextComponent, ImageComponentCoded, VideoComponentCoded]], operator.add]

class GenerateCode(TypedDict):
    coded_components: List[Union[TextComponent, ImageComponentCoded, VideoComponentCoded, ImageComponent, VideoComponent]]
    error: str
    attempts: int
    plan: str
    code: str

# ============================================================================
# CODE GENERATION SUB-GRAPH
# ============================================================================

def filter_node(state: GenerateCode):
    """Filter code to route on"""
    pass

def first_router(state: GenerateCode):
    component = state["coded_components"][0]
    if isinstance(component, TextComponent):
        return END
    return "plan_node"

def plan_node(state: GenerateCode):
    component = state["coded_components"][0]
    print("Type", type(component))
    
    prompt = component.description
    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.5, 
                        api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)

    if isinstance(component, VideoComponent):
        print("Generating Code for Video")
        messages = [
            SystemMessage(content=PLAN_VIDEO_SYSTEM_PROMPT),
            HumanMessage(content=f"Create a plan to visualize this prompt: '{prompt}'. "
                                "You are generating a video, and not a still image, clearly state that in plan. "
                                "Be specific about objects, layout, color, and motion. This video is only meant to be "
                                "a few scenes and no more than 10-15 seconds long. Plan accordingly and keep the code "
                                "simple and easy to understand, using basic Manim components."
                                "Please ensure that NOTHING on the screen OVERLAPS. This is VERY important, consider the size of the components and make sure NOTHING OVERLAPS but also make sure NOTHING GOES of SCREEN and the edges don't have anything on them." )
        ]
    else:
        print("Generating Code for Image")
        messages = [
            SystemMessage(content=PLAN_IMAGE_SYSTEM_PROMPT),
            HumanMessage(content=f"Create a plan to visualize this prompt: '{prompt}'. "
                                "You are generating a still image, clearly state that in plan. Be specific about objects, "
                                "layout, color, and motion. Make sure everything fits the screen is laid out nicely, "
                                "and doesn't overlap when not supposed to. Plan accordingly and keep the code simple "
                                "and easy to understand, using basic Manim components."
                                "Please ensure that NOTHING on the screen OVERLAPS. This is VERY important, consider the size of the components and make sure NOTHING OVERLAPS but also make sure NOTHING GOES of SCREEN and the edges don't have anything on them." )
        ]
    
    plan = llm.invoke(messages).content
    return {"plan": plan}

def execute_node(state: GenerateCode):
    plan = state["plan"]
    error = state.get("error", "")
    code = state["code"]
    component = state["coded_components"][0]

    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.5, 
                        api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=8192)


    if isinstance(component, VideoComponent):
        system_prompt = EXECUTE_VIDEO_SYSTEM_PROMPT
    else: 
        system_prompt = EXECUTE_IMAGE_SYSTEM_PROMPT

    if error:
        user_prompt = (
            f"This was the code you previously generated: {code}"
            f"The previous generated Manim code failed with this error:\n\n"
            f"{error}\n\n"
            f"Plan:\n{plan}\n\n"
            f"Fix the code. Output ONLY corrected code from the first line."
        )
    else:
        user_prompt = (
            f"Generate runnable Manim code for this plan:\n\n{plan}\n\n"
            f"Return ONLY the Manim script starting with: from manim import *"
        )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    code = llm.invoke(messages).content
    return {"code": code, "error": ""}

def run_node(state: GenerateCode):
    code = state["code"]
    attempts = state.get("attempts", 0) + 1

    try:
        match = re.search(r"from manim import \*[\s\S]*", code)
        if not match:
            raise Exception("Could not find 'from manim import *' in LLM output.")

        cleaned_code = match.group(0)
        cleaned_code = re.sub(r"```+.*", "", cleaned_code).strip()

        match_scene = re.search(r"class\s+(\w+)\s*\((?:Scene|ThreeDScene)\)", cleaned_code)
        scene_name = match_scene.group(1) if match_scene else "Scene"

        file_id = uuid.uuid4().hex[:8]
        py_path = Path(f"manim_scene_{file_id}.py")
        py_path.write_text(cleaned_code)
        print(f"Saved to file: {py_path}")

        cmd = ["manim", "-qm", "-v", "WARNING", str(py_path), scene_name]
        print("Running:", " ".join(cmd))
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)

        print(f"✔ Manim render succeeded on attempt {attempts}")
        return {"error": "", "attempts": attempts}

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else e.stdout if e.stdout else str(e)
        print(f"❌ Error on attempt {attempts}:\n{error_msg}")
        return {"error": error_msg, "attempts": attempts}
    except Exception as e:
        print(f"❌ Error on attempt {attempts}: {e}")
        return {"error": str(e), "attempts": attempts}

def should_retry(state: GenerateCode):
    if state["error"] and state["attempts"] < 3:
        return "execute_node"
    return "finish_node"

def finish_node(state: GenerateCode):
    orig_component = state["coded_components"][0]
    description = orig_component.description
    caption = orig_component.caption
    code = state["code"]

    if isinstance(orig_component, VideoComponent):
        new_component = VideoComponentCoded(description=description, caption=caption, code=code)
    else:  # ImageComponent
        new_component = ImageComponentCoded(description=description, caption=caption, code=code)
    
    return {"coded_components": [new_component]}

# ============================================================================
# COMPONENT GENERATION
# ============================================================================

component_creator_instructions = """
You are an expert educator and visual explainer who creates structured teaching content using text, conceptual Manim images, and short Manim animations.

You will receive:
- A topic to explain
- A maximum number of components
- The schemas for TextComponent, ImageComponent, VideoComponent, and AllComponents

Your job:
1. Produce a clear, pedagogically sound sequence of components that fully explains the topic from first principles.
2. Use around {max_components} total components (you may use slightly fewer if it makes pedagogical sense).
3. Components should flow in a logical teaching order: introduction → core concepts → examples/applications → conclusion.
4. You may include:
   • TextComponent: engaging explanatory paragraphs that introduce concepts, provide context, or summarize key points. Keep it engaging but keep language formal like in notes or a textbook
   • ImageComponent: still Manim visualizations with detailed descriptions (for static concepts, diagrams, or labeled figures)
   • VideoComponent: short ≤15s Manim animations (for dynamic processes, transformations, or motion)
5. Use a balanced mix of text, images, and videos. Don't overwhelm with too many visuals in a row.
6. Do NOT produce redundant components. Each component should advance understanding.
7. Ensure all Manim descriptions are concrete and actionable: specify what appears, how objects move, and the point being conveyed.
8. Keep explanations friendly, intuitive, and beginner-accessible.
9. The result should read like a polished educational article with supporting visuals.

Output only a JSON object following the AllComponents schema.
Do not include any extra commentary, markdown, or explanations.

Topic: {topic}
Maximum components: {max_components}
"""

def create_components(state: GenerateArticle):
    """Generate all components for the article"""
    topic = state['topic']
    max_components = state['max_components']

    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, 
                        api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)
    
    structured_llm = llm.with_structured_output(AllComponents)
    
    system_message = component_creator_instructions.format(
        topic=topic,
        max_components=max_components
    )
    
    components = structured_llm.invoke([
        SystemMessage(content=system_message),
        HumanMessage(content="Generate the complete set of components for this topic.")
    ])
    
    return {"components": components.components}

def initiate_code_generation(state: GenerateArticle):
    """Map step: send each component to the code generation sub-graph"""
    return [
        Send("create_code", {
            "coded_components": [component], 
            "error": "", 
            "attempts": 0, 
            "plan": "", 
            "code": ""
        }) 
        for component in state["components"]
    ]

# ============================================================================
# GRAPH CONSTRUCTION
# ============================================================================

# Code generation sub-graph
code_builder = StateGraph(GenerateCode)
code_builder.add_node("filter_node", filter_node)
code_builder.add_node("plan_node", plan_node)
code_builder.add_node("execute_node", execute_node)
code_builder.add_node("run_node", run_node)
code_builder.add_node("finish_node", finish_node)

code_builder.add_edge(START, "filter_node")
code_builder.add_conditional_edges("filter_node", first_router, {END: END, "plan_node": "plan_node"})
code_builder.add_edge("plan_node", "execute_node")
code_builder.add_edge("execute_node", "run_node")
code_builder.add_conditional_edges("run_node", should_retry, {
    "execute_node": "execute_node",
    "finish_node": "finish_node"
})
code_builder.add_edge("finish_node", END)

# Main article generation graph
builder = StateGraph(GenerateArticle)
builder.add_node("create_components", create_components)
builder.add_node("create_code", code_builder.compile())

builder.add_edge(START, "create_components")
builder.add_conditional_edges("create_components", initiate_code_generation, ["create_code"])
builder.add_edge("create_code", END)

# Compile
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)

# ============================================================================
# RENDERING UTILITIES
# ============================================================================

def render_manim_from_llm(code: str):
    """Render Manim code and return path to output file"""
    match = re.search(r"from manim import \*[\s\S]*", code)
    if not match:
        raise Exception("Could not find 'from manim import *' in LLM output.")
    cleaned_code = re.sub(r"```+.*", "", match.group(0)).strip()

    match_scene = re.search(r"class\s+(\w+)\s*\((?:Scene|ThreeDScene)\)", cleaned_code)
    scene_name = match_scene.group(1) if match_scene else "Scene"

    file_id = uuid.uuid4().hex[:8]
    py_path = Path(f"manim_scene_{file_id}.py")
    py_path.write_text(cleaned_code)
    print(f"Saved to file: {py_path}")

    media_root = Path("media")
    before_files = {p.resolve() for p in media_root.rglob("*") if p.is_file()} if media_root.exists() else set()

    cmd = ["manim", "-qm", "-v", "WARNING", str(py_path), scene_name]
    print("Running:", " ".join(cmd))
    subprocess.run(cmd, check=True, capture_output=True, text=True)

    after_files = {p.resolve() for p in media_root.rglob("*") if p.is_file()}
    new_files = sorted(after_files - before_files)

    if not new_files:
        raise RuntimeError("Manim ran successfully but produced no output files.")

    print("New files created:")
    for f in new_files:
        print("   >", f)

    final_mp4 = [str(f) for f in new_files if str(f).endswith('.mp4') and 'partial_movie_files' not in str(f)]

    if final_mp4 == []:
        return new_files[0]
    else:
        return final_mp4[0]

def encode_base64(path):
    """Return base64-encoded data URI for images or videos"""
    ext = Path(path).suffix.lower()

    if ext in [".png", ".jpg", ".jpeg", ".gif"]:
        mime = f"image/{ext[1:]}"
    elif ext in [".mp4", ".mov", ".m4v"]:
        mime = "video/mp4"
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()

    return f"data:{mime};base64,{data}"

def generate_page(components, title, subtitle, subject, output_path="article.html"):
    """Generate HTML page from components"""
    html = []
    html.append(f"""
<header class="flex flex-col gap-6 text-center border-b border-gray-100 pb-10">
  <nav class="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#6E6B65] opacity-60 font-medium">
    <a class="hover:text-[#2D2A26] transition-colors" href="#">{subject}</a>
    <span>/</span>
  </nav>
  <h1 class="font-serif text-5xl md:text-6xl text-[#2D2A26] leading-tight">
    {title}
  </h1>
  <p class="font-serif text-xl md:text-2xl text-[#6E6B65] leading-relaxed max-w-2xl mx-auto italic">
    {subtitle}
  </p>
</header>
    """)

    for c in components:
        if isinstance(c, TextComponent):
            html.append(f"""
            <div class="prose prose-lg max-w-none font-serif text-[#2D2A26] leading-loose text-lg md:text-xl mt-12">
            <p>
                {c.text}
            </p>
            </div>
            """)
        elif isinstance(c, ImageComponentCoded):
            image_path = render_manim_from_llm(c.code)
            data_uri = encode_base64(image_path)
            html.append(f"""
                    <section class="flex flex-col gap-4 py-8 mt-8">
                    <figure class="group relative w-full aspect-video bg-gray-50 overflow-hidden shadow-lg border border-[#EBEBE8]">
                        <img class="w-full h-full object-cover opacity-90 transition-transform duration-700 " src="{data_uri}" alt="Manim visualization" />
                    </figure>
                    <figcaption class="text-center text-sm text-[#6E6B65] opacity-70 mt-2">
                        {c.caption}
                    </figcaption>
                    </section>""")
        elif isinstance(c, VideoComponentCoded):
            video_path = render_manim_from_llm(c.code)
            data_uri = encode_base64(video_path)
            html.append(f"""
                <section class="flex flex-col gap-4 py-8 mt-8">
                <figure class="w-full bg-gray-50 shadow-lg border border-[#EBEBE8] rounded-sm overflow-hidden">
                    <div class="custom-video-player" data-video-src="{data_uri}"></div>
                </figure>
                <figcaption class="text-center text-sm text-[#6E6B65] opacity-70 mt-2">
                    {c.caption}
                </figcaption>
            </section>""")

    final_html = "\n".join(html)
    Path(output_path).write_text(final_html)
    print(f"✅ Generated HTML: {output_path}")
    return final_html

# ============================================================================
# MAIN API
# ============================================================================

def generate_manim_article(topic: str, max_components: int = 6, output_path: str = "article.html", anthropic_api_key: str = None):
    """
    Generate an interactive article with Manim visualizations from a topic.
    
    Args:
        topic: The topic to explain (e.g., "Explain the concept of a derivative")
        max_components: Maximum number of components to generate
        output_path: Path to save the output HTML file
        anthropic_api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
    
    Returns:
        List containing [html_content, title, subtitle, subject]
    """
    class Header(BaseModel):
        article_title: str = Field(description="The brief title for the whole article")
        subtitle: str = Field(description="A brief subtitle for the whole article")
        subject: str = Field(description="The 1-2 word subject area for the article")

    if anthropic_api_key:
        os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key
    
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("ANTHROPIC_API_KEY must be set in environment or passed as argument")

    # Generate header
    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, 
                        api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)
    structured_llm = llm.with_structured_output(Header)

    title_creator_instructions = """
    You are an expert explainer. For the given topic, generate a brief title, subtitle, and subject area 
    that will be displayed at the top of the explanation. Follow the structured output.  

    This is the topic: {topic}
    """

    system_message = title_creator_instructions.format(topic=topic)
    header = structured_llm.invoke([
        SystemMessage(content=system_message),
        HumanMessage(content="Generate")
    ])

    title = header.article_title
    subtitle = header.subtitle
    subject = header.subject

    print("Title:", title)
    print("Subtitle:", subtitle)
    print("Subject:", subject)

    # Generate article components
    thread_id = str(uuid.uuid4())
    thread = {"configurable": {"thread_id": thread_id}}

    list_of_comps = []
    for event in graph.stream({"topic": topic, "max_components": max_components}, thread, stream_mode="values"):
        components = event.get('coded_components', '')
        if components:
            for component in components:
                print(component)
                print("-" * 50)
                list_of_comps.append(component)

    my_html = generate_page(list_of_comps, title, subtitle, subject, output_path)
    return [my_html, title, subtitle, subject]

# Example usage
if __name__ == "__main__":
    output_html = generate_manim_article(
        topic="Explain the concept of a derivative",
        max_components=6,
        output_path="derivative.html"
    )