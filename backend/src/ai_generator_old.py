from manim import *
import os, glob
import numpy as np
import math
import re
import uuid
import subprocess
import base64
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

load_dotenv()


class Section(BaseModel):
    title: str = Field(
        description="The title for this section of the article",
    )
    summary: str = Field(
        description="A summary for this section, including what this section is going to be about at a high level, and how it will explain part of the main topic"
    )

    @property
    def persona(self) -> str:
        return f"Title: {self.title}\nSummary: {self.summary}\n"


class AllSections(BaseModel):
    sections: List[Section] = Field(
        description="Full list of all the sections with their titles and high level summaries",
    )


class GenerateSections(TypedDict):
    topic: str
    max_sections: int
    sections: List[Section]
    components: Annotated[List[List], operator.add]
    coded_components: Annotated[List, operator.add]


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

class AllComponents(BaseModel):
    components: List[Union[TextComponent, ImageComponent, VideoComponent]] = Field(
        description=(
            "Ordered list of components forming the content for the selected section. "
            "Each component should provide a distinct contribution—text, image, or video."
        )
    )



class ImageComponentCoded(BaseModel):
    description: str = Field(
        description=(
            "A detailed high-level description of the Manim still-image visualization. "
            "Describe what objects appear, how they should look, the "
            "scene layout, and what conceptual point the image is meant to illustrate."
        )
    )
    caption: str = Field(
        description="A short caption shown below the image explaining the key insight."
    )

    code: str = Field(
        description = "The full runnable error free Manim code to generate the image"
    )

class VideoComponentCoded(BaseModel):
    description: str = Field(
        description=(
            "A detailed high-level description of the Manim animation. "
            "Describe what the animation shows, how it progresses scene by scene, "
            "what transforms/drawings occur, and how the viewer should interpret it, and what it means. "
            "Keep the total animation conceptual length ≤ 15 seconds."
        )
    )
    caption: str = Field(
        description="A short caption shown below the video explaining the key insight."
    )

    code: str = Field(
        description = "The full runnable error free Manim code to generate the image"
    )


class GenerateComponents(TypedDict):
  section: Section    # the Section(title, summary)
  components: List[Union[TextComponent, VideoComponent, ImageComponent]]
  coded_components: Annotated[List[Union[TextComponent, ImageComponentCoded, VideoComponentCoded,ImageComponent, VideoComponent]], operator.add]

class GenerateCode(TypedDict):
  coded_components: List[Union[TextComponent,ImageComponentCoded, VideoComponentCoded, ImageComponent, VideoComponent]]
  error: str
  attempts: int
  plan: str
  code: str

def filter_node(state: GenerateCode):
  """ Filter code to route on """
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

    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)

    if isinstance(component, VideoComponent):
      print("Generating Code for Video")
      messages = [
          SystemMessage(content="You are a Manim video animation planner."),
          HumanMessage(content=f"Create a plan to visualize this prompt: '{prompt}'. "
                              "You are generating a video, and not a still image, clearly state that in plan. Be specific about objects, layout, color, and motion. This video is only meant to be a few scenes and no more than 10-15 seconds long. "
                              "Plan accordingly and keep the code simple and easy to understanding, using basic Manim components.")
      ]
      plan = llm.invoke(messages).content
      return {"plan": plan}

    else:

      print("Generating Code for Image")

      messages = [
          SystemMessage(content="You are a Manim image generation planner."),
          HumanMessage(content=f"Create a plan to visualize this prompt: '{prompt}'. "
                                "You are generating a still image, clearly state that in plan. Be specific about objects, layout, color, and motion. Make sure everything fits the screen is laid out nicely, and doesn't overlap when not supposed to."
                                "Plan accordingly and keep the code simple and easy to understanding, using basic Manim components.")
        ]
      plan = llm.invoke(messages).content
      return {"plan": plan}



def execute_node(state: GenerateCode):
    plan = state["plan"]
    error = state.get("error", "")
    code = state["code"]

    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=8192)

    system = (
        "You are a Python Manim code generator. You may be asked to generate a still image, or a video. "
        "You always return runnable code for Manim Community v0.19. "
        "Return ONLY valid Python code starting with: from manim import * "
        "DO NOT wrap the code in markdown fences like ```python. Just return raw Python code directly. "
        "Make sure none of the objects overlap, and that they all fit the screen and create a visual that is intuitive. "
        "IMPORTANT: Generate the COMPLETE code with no truncation. Include all method calls, all closing braces, and the full construct() method."
    )

    if error:
        # Self-repair mode
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
        SystemMessage(content=system),
        HumanMessage(content=user_prompt)
    ]

    code = llm.invoke(messages).content
    return {"code": code, "error": ""}  # clear error for next run


def run_node(state: GenerateCode):
    code = state["code"]
    attempts = state.get("attempts", 0) + 1

    try:
        # Step 1: Extract "from manim import *" onward
        match = re.search(r"from manim import \*[\s\S]*", code)
        if not match:
            raise Exception("Could not find 'from manim import *' in LLM output.")

        cleaned_code = match.group(0)
        cleaned_code = re.sub(r"```+.*", "", cleaned_code).strip()

        # Step 2: Extract Scene class name (Scene or ThreeDScene)
        match_scene = re.search(r"class\s+(\w+)\s*\((?:Scene|ThreeDScene)\)", cleaned_code)
        scene_name = match_scene.group(1) if match_scene else "Scene"

        # Step 3: Write to temp file
        file_id = uuid.uuid4().hex[:8]
        py_path = Path(f"manim_scene_{file_id}.py")
        py_path.write_text(cleaned_code)
        print(f"Saved to file: {py_path}")

        # Step 4: Run manim via subprocess instead of IPython magic
        cmd = ["manim", "-qm", "-v", "WARNING", str(py_path), scene_name]
        print("Running:", " ".join(cmd))
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)

        print(f"✔ Manim render succeeded on attempt {attempts}")
        return {"error": "", "attempts": attempts}

    except subprocess.CalledProcessError as e:
        # Capture the actual error output from stderr
        error_msg = e.stderr if e.stderr else e.stdout if e.stdout else str(e)
        print(f"❌ Error on attempt {attempts}:\n{error_msg}")
        return {"error": error_msg, "attempts": attempts}
    except Exception as e:
        print(f"❌ Error on attempt {attempts}: {e}")
        return {"error": str(e), "attempts": attempts}


# ------------------------------
# RETRY CONDITION
# ------------------------------
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
    new_component = VideoComponentCoded(description = description, caption = caption, code = code)
    return {"coded_components": [new_component]}

  if isinstance(orig_component, ImageComponent):
    new_component = ImageComponentCoded(description = description, caption = caption, code = code)
    return {"coded_components": [new_component]}


section_creater_instructions="""You are an expert explainer whose job is to break a topic into the clearest possible set of sections.

Given:
- A topic to explain (entered by user)
- A maximum number of sections
- The Section and AllSections schemas

Your task:
1. Break the topic into a set of sections that cover the entire idea from first principles to more advanced intuition.
2. Use **crisp, short, informative titles**.
3. Write **1–3 sentence summaries** that explain:
   • what the section covers
   • why it matters
   • how it contributes to understanding the full topic
4. The section list should form a narrative progression — each section should build on the last.
5. Avoid jargon unless it is defined in a previous section.
6. Make the structure teach the topic to a smart beginner.
7. Never exceed `max_sections`.

Output only a JSON object that conforms to the `AllSections` schema.
Do not include any other text.

This is the topic: {topic}
This is the max_sections: {max_sections}
"""


def create_sections(state: GenerateSections):

  """ Creating sections """

  topic = state['topic']
  max_sections = state['max_sections']

  llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)

  structured_llm = llm.with_structured_output(AllSections)

  system_message = section_creater_instructions.format(topic = topic,
                                               max_sections = max_sections)

  sections = structured_llm.invoke([SystemMessage(content=system_message)]+[HumanMessage(content="Generate the set of sections.")])


  return {"sections": sections.sections}


component_creater_instructions="""
You are an expert educator and visual explainer who creates structured teaching content using text, conceptual Manim images, and short Manim animations.

You will receive:
- A specific section (title + summary)
- The schemas for TextComponent, ImageComponent, VideoComponent, and AllComponents

Your job:
1. Produce a clear, pedagogically sound sequence of components that fully explains the section's concept. Produce the components in the order in which they should be read and displayed
2. Use around 2-3 total components.
3. You may include:
   • TextComponent: an engaging explanatory paragraph
   • ImageComponent: a still Manim visualization with a detailed description and caption
   • VideoComponent: a short ≤15s Manim animation with a clear conceptual narrative and caption
Use a good balanceed mix of videos, images, and text.
4. Do NOT produce redundant components. Each component should advance understanding.
5. Ensure all Manim descriptions are concrete and actionable: specify what appears, how objects move, and the point being conveyed.
6. Keep explanations friendly, intuitive, and beginner-accessible.
7. Use the section's title and summary as the guiding theme.
8. The result should read like a polished mini-lesson with supporting visuals.

Output only a JSON object following the AllComponents schema.
Do not include any extra commentary, markdown, or explanations.
Use at least one image component

This is the section's title: {section_title}
This is the section's summary or description, explaining the main idea for this section: {section_summary}"""



def create_components(state: GenerateComponents):

  """ Creating sections """

  section = state['section']
  section_title = section.title
  section_summary = section.summary

  llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)

  structured_llm = llm.with_structured_output(AllComponents)

  system_message = component_creater_instructions.format(
                                               section_title = section_title,
                                               section_summary = section_summary)

  components = structured_llm.invoke([SystemMessage(content=system_message)] + [HumanMessage(content="Generate the set of components.")])


  return {"components": components.components}


def initiate_component_generation(state: GenerateSections):

    """ This is the "map" step where we run each component gen sub-graph using Send API """

    topic = state["topic"]
    return [Send("generate_components", {"section": section}) for section in state["sections"]]


def initiate_code_generation(state: GenerateComponents):

  return [Send("create_code", {"coded_components": [component], "error": "", "attempts": 0, "plan": "", "code": ""}) for component in state["components"]]


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
code_builder.add_conditional_edges(
    "run_node",
    should_retry,
    {
        "execute_node": "execute_node",
        "finish_node": "finish_node"
    }
)
code_builder.add_edge("finish_node", END)


# Add nodes and edges
component_builder = StateGraph(GenerateComponents)
component_builder.add_node("create_components", create_components)
component_builder.add_node("create_code", code_builder.compile())

# Logic
component_builder.add_edge(START, "create_components")
component_builder.add_conditional_edges("create_components", initiate_code_generation, ["create_code"])
component_builder.add_edge("create_code", END)

# Add nodes and edges
builder = StateGraph(GenerateSections)
builder.add_node("create_sections", create_sections)
builder.add_node("generate_components", component_builder.compile())

# Logic
builder.add_edge(START, "create_sections")
builder.add_conditional_edges("create_sections", initiate_component_generation, ["generate_components"])
builder.add_edge("generate_components", END)

# Compile
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)


def render_manim_from_llm(code: str):
    # Step 1: Extract only manim code
    match = re.search(r"from manim import \*[\s\S]*", code)
    if not match:
        raise Exception("Could not find 'from manim import *' in LLM output.")
    cleaned_code = re.sub(r"```+.*", "", match.group(0)).strip()

    # Step 2: Scene Class
    match_scene = re.search(r"class\s+(\w+)\s*\((?:Scene|ThreeDScene)\)", cleaned_code)
    scene_name = match_scene.group(1) if match_scene else "Scene"

    # Step 3: Write temp file
    file_id = uuid.uuid4().hex[:8]
    py_path = Path(f"manim_scene_{file_id}.py")
    py_path.write_text(cleaned_code)
    print(f"Saved to file: {py_path}")

    # -----------------------------------------
    # NEW: Track output BEFORE running manim
    # -----------------------------------------
    media_root = Path("media")
    before_files = {p.resolve() for p in media_root.rglob("*") if p.is_file()} if media_root.exists() else set()

    # Step 4: Run manim
    cmd = ["manim", "-qm", "-v", "WARNING", str(py_path), scene_name]
    print("Running:", " ".join(cmd))
    subprocess.run(cmd, check=True, capture_output=True, text=True)

    # -----------------------------------------
    # NEW: Detect all new files after render
    # -----------------------------------------
    after_files = {p.resolve() for p in media_root.rglob("*") if p.is_file()}
    new_files = sorted(after_files - before_files)

    if not new_files:
        raise RuntimeError("Manim ran successfully but produced no output files.")

    print("New files created:")
    for f in new_files:
        print("   >", f)

    final_mp4 = [str(f) for f in new_files if str(f).endswith('.mp4') and 'partial_movie_files' not in str(f)]

    # Usually the last one is the final render
    if final_mp4 == []:
      return new_files[0]
    else:
      return final_mp4[0]


def encode_base64(path):
    """Return base64-encoded data URI for images or videos."""
    ext = Path(path).suffix.lower()

    # Decide MIME type
    if ext in [".png", ".jpg", ".jpeg", ".gif"]:
        mime = f"image/{ext[1:]}"
    elif ext in [".mp4", ".mov", ".m4v"]:
        mime = "video/mp4"
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()

    return f"data:{mime};base64,{data}"


def generate_page(components, title, subtitle, subject, output_path="derivative.html"):
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

        # ------------------ TEXT ------------------
        if isinstance(c, TextComponent):
            html.append(f"""
            <div class="prose prose-lg max-w-none font-serif text-[#2D2A26] leading-loose text-lg md:text-xl mt-12">
            <p>
                {c.text}
            </p>

            </div>
            """)


        # ------------------ IMAGE (base64 embed) ------------------
        elif isinstance(c, ImageComponentCoded):
            image_path = render_manim_from_llm(c.code)
            data_uri = encode_base64(image_path)
            html.append(f"""
                    <section class="flex flex-col gap-4 py-8 mt-8">
                    <figure class="group relative w-full aspect-video bg-gray-50 overflow-hidden shadow-lg border border-[#EBEBE8]">
                        <img class="w-full h-full object-cover opacity-90 transition-transform duration-700 " src="{data_uri}" alt="Abstract 3D geometric shapes visualizing mathematical transformation" />
                    </figure>
                    <figcaption class="text-center text-sm text-[#6E6B65] opacity-70 mt-2">
                        {c.caption}
                    </figcaption>
                    </section>""")


        # ------------------ VIDEO (base64 embed) ------------------
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


def generate_manim_article(topic: str, max_sections: int = 2, output_path: str = "derivative.html", anthropic_api_key: str = None):
    """
    Generate an interactive article with Manim visualizations from a topic.
    
    Args:
        topic: The topic to explain (e.g., "Explain the concept of a derivative")
        max_sections: Maximum number of sections to generate
        output_path: Path to save the output HTML file
        anthropic_api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
    
    Returns:
        Path to the generated HTML file
    """
    class Header(BaseModel):
        article_title: str = Field(
            description="The brief title for the whole article"
        )
        subtitle: str = Field(
            description="A brief subtitle for the whole article"
        )
        subject: str = Field(
            description="The 1-2 word subject area for the article"
        )

    llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0.7, api_key=os.environ.get("ANTHROPIC_API_KEY"), max_tokens=4096)

    structured_llm = llm.with_structured_output(Header)

    title_creator_instructions = """
    You are an expert explainer whose job is to break a topic into the clearest possible set of sections. Right now though, for the given topic,
    give me a brief title, and a brief subtitle, and the subject area, that will be displayed at the top of the explanation. Follow the structured output.  

    This is the topic: {topic}
    """

    system_message = title_creator_instructions.format(topic = topic)

    header = structured_llm.invoke([SystemMessage(content=system_message)]+[HumanMessage(content="Generate")])

    title = header.article_title
    subtitle = header.subtitle
    subject = header.subject

    print("Title:", title)
    print("Subtitle:", subtitle)
    print("Subject:", subject)
    
    # Set API key if provided
    if anthropic_api_key:
        os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key
    
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("ANTHROPIC_API_KEY must be set in environment or passed as argument")

    # Use a unique thread ID for each generation to avoid state accumulation
    thread_id = str(uuid.uuid4())
    thread = {"configurable": {"thread_id": thread_id}}

    list_of_comps = []
    for event in graph.stream({"topic": topic, "max_sections": max_sections}, thread, stream_mode = "values"):

      components = event.get('coded_components', '')
      if components:
        for component in components:
            print(component)
            print("-" * 50)
            list_of_comps.append(component)

    my_html = generate_page(list_of_comps, title, subtitle,  subject, output_path)
    return [my_html, title, subtitle, subject]


# Example usage
if __name__ == "__main__":
    output_html = generate_manim_article(
        topic="Explain how a TWO dimensional CDF and PDF works",
        max_sections=2,
        output_path="multivarpdf.html"
    )