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
import markdown

load_dotenv()



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
            "A rich-text paragraph that explains part of the concept. "
            "You MUST use markdown formatting including:\n"
            "- **bold** for emphasis\n"
            "- *italic* for emphasis\n"
            "- ## Subheaders for structure\n"
            "- Inline LaTeX for equations using $...$ (e.g., $E = mc^2$)\n"
            "- Display LaTeX for block equations using $$...$$ on separate lines\n"
            "- `code` for inline code\n"
            "- ```language\\ncode block\\n``` for code blocks\n"
            "- Lists with - or 1.\n"
            "- > for blockquotes/definitions\n"
            "Make the text engaging, well-formatted, and include relevant equations."
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
    context: str
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
- A topic to explain, basically a prompt telling you what kind of explanation to create, and how to use additional context if provided
- Additional context from a textbook or other source material (this is optional and may be empty)
- A maximum number of components
- The schemas for TextComponent, ImageComponent, VideoComponent, and AllComponents

Your job:
1. Produce a clear, pedagogically sound sequence of components that fully explains the topic from first principles.
2. **CRITICAL - Component Count Guidelines:**
   - **Aim for 3-5 components** for most explanations - this is the sweet spot for clarity and comprehension
   - You may use 6-8 components for moderately complex topics that need more depth
   - Only use 9-15 components if the request is extremely comprehensive or covers multiple related concepts
   - **Strongly prefer brevity**: fewer, high-quality components are better than many redundant ones
   - The absolute maximum is {max_components} components, but you should rarely need this many
   - When in doubt, use FEWER components and make each one more impactful
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
Additional context: {context}
"""

def create_components(state: GenerateArticle):
    """Generate all components for the article"""
    topic = state['topic']
    max_components = state['max_components']
    context = state.get('context', '')

    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, 
                        api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)
    
    structured_llm = llm.with_structured_output(AllComponents)
    
    system_message = component_creator_instructions.format(
        topic=topic,
        max_components=max_components,
        context=context
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

def process_text_with_formatting(text: str) -> str:
    """Convert markdown text with LaTeX to formatted HTML"""
    import re
    import html as html_module

    # Protect display math ($$...$$)
    display_math_pattern = r'\$\$(.*?)\$\$'
    display_equations = []

    def save_display_math(match):
        idx = len(display_equations)
        # Preserve the equation exactly as-is
        display_equations.append(match.group(1))
        return f"XDISPLAYMATHX{idx}XDISPLAYMATHX"

    text = re.sub(display_math_pattern, save_display_math, text, flags=re.DOTALL)

    # Protect inline math ($...$)
    inline_math_pattern = r'\$([^\$]+?)\$'
    inline_equations = []

    def save_inline_math(match):
        idx = len(inline_equations)
        # Preserve the equation exactly as-is
        inline_equations.append(match.group(1))
        return f"XINLINEMATHX{idx}XINLINEMATHX"

    text = re.sub(inline_math_pattern, save_inline_math, text)

    # Convert markdown to HTML
    html = markdown.markdown(text, extensions=['extra', 'codehilite', 'fenced_code'])

    # Restore equations with $$ delimiters
    # HTML-escape < and > in equations to prevent browser interpretation as tags
    for idx, equation in enumerate(display_equations):
        # Escape HTML special chars in the equation for safe embedding
        safe_equation = html_module.escape(equation)
        html = html.replace(f"XDISPLAYMATHX{idx}XDISPLAYMATHX", f'<div class="math-display">$${safe_equation}$$</div>')

    for idx, equation in enumerate(inline_equations):
        # Escape HTML special chars in the equation for safe embedding
        safe_equation = html_module.escape(equation)
        html = html.replace(f"XINLINEMATHX{idx}XINLINEMATHX", f'<span class="math-inline">${safe_equation}$</span>')

    return html


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
            formatted_html = process_text_with_formatting(c.text)
            html.append(f"""
            <div class="prose prose-lg max-w-none font-serif text-[#2D2A26] leading-loose text-lg md:text-xl mt-12">
            {formatted_html}
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

def generate_manim_article(topic: str, max_components: int = 15, output_path: str = "article.html", context: str = None, anthropic_api_key: str = None):
    """
    Generate an interactive article with Manim visualizations from a topic.
    
    Args:
        topic: The topic to explain (e.g., "Explain the concept of a derivative")
        max_components: Maximum number of components to generate (default 15, AI will typically use 3-5)
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
    You are an expert explainer. For the given topic and context from reference material, generate a brief title, subtitle, and subject area 
    that will be displayed at the top of the explanation. Follow the structured output.  

    This is the topic: {topic}
    This is the additional context: {context}
    """

    system_message = title_creator_instructions.format(topic=topic, context=context if context else "No additional context provided")
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
    for event in graph.stream({"topic": topic, "max_components": max_components, "context": context}, thread, stream_mode="values"):
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
        max_components=15,  # AI will typically use 3-5 components
        output_path="derivative.html"
    )