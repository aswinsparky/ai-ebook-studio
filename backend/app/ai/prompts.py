# Prompt engineering templates for AI Ebook Studio

IDEA_GENERATION_SYSTEM_PROMPT = """You are an elite bestselling author and book publishing strategist.
Your task is to generate high-converting, deeply compelling book ideas based on the provided niche or genre.
Always output strictly valid JSON matching the requested schema. No markdown formatting outside the JSON."""

IDEA_GENERATION_USER_PROMPT = """Generate {count} distinct, commercially viable book ideas for:
Niche / Genre: {niche_or_genre}
Target Audience: {target_audience}
Keywords / Themes: {keywords}

Output valid JSON with the following structure:
{{
  "niche": "{niche_or_genre}",
  "ideas": [
    {{
      "title": "Bestselling Title",
      "subtitle": "Clear, compelling subtitle conveying reader transformation",
      "target_audience": "Specific reader profile",
      "hook": "Why readers must pick this up today",
      "reader_promise": "Exact benefit or transformation after reading",
      "unique_angle": "What makes this stand out against existing books",
      "sample_chapters": ["Chapter 1 Title", "Chapter 2 Title", "Chapter 3 Title"]
    }}
  ]
}}"""

BLUEPRINT_SYSTEM_PROMPT = """You are a master book architect and publishing consultant.
You design comprehensive, logically structured book blueprints that guide authors through crafting bestselling nonfiction or fiction works.
Always output strictly valid JSON matching the requested schema."""

BLUEPRINT_USER_PROMPT = """Create an in-depth book blueprint for the following project:
Title: {title}
Subtitle: {subtitle}
Author: {author}
Genre: {genre}
Topic: {topic}
Target Audience: {target_audience}
Reader Promise: {reader_promise}
Writing Style: {writing_style}
Tone: {tone}
Target Chapter Count: {target_chapter_count}
Target Word Count: {target_word_count}
Custom Instructions: {custom_instructions}

Ensure the chapter progression is progressive, practical, and highly engaging.
Output strictly valid JSON with this exact structure:
{{
  "title": "{title}",
  "subtitle": "{subtitle}",
  "core_concept": "Detailed description of the book's core premise",
  "target_audience_profile": "In-depth description of demographic, pain points, and aspirations",
  "unique_selling_proposition": "What sets this book apart in the market",
  "reader_transformation": "Before-and-after psychological or skill transformation",
  "suggested_tone": "{tone}",
  "proposed_structure": [
    {{
      "order_index": 1,
      "title": "Chapter title",
      "summary": "2-3 sentence overview of the chapter focus",
      "key_points": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
      "target_word_count": {target_words_per_chapter},
      "learning_objective": "What the reader understands or accomplishes by the end of this chapter"
    }}
  ]
}}"""

CHAPTER_WRITING_SYSTEM_PROMPT = """You are a master book author and ghostwriter.
You write engaging, high-retention, publication-ready book chapters.
Use clean Markdown formatting with clear H2 and H3 subheadings, well-structured paragraphs, illustrative examples, callout takeaways, and chapter action steps where relevant.
Do NOT include metadata banners or conversational introductory comments (e.g. 'Sure, here is your chapter'). Start directly with the chapter content."""

CHAPTER_WRITING_USER_PROMPT = """Write Chapter {order_index}: "{title}" for the book "{book_title}".

Book Context:
- Genre/Topic: {genre} / {topic}
- Target Audience: {target_audience}
- Reader Promise: {reader_promise}
- Style & Tone: {writing_style}, {tone}
- Chapter Summary: {summary}
- Key Points to Cover: {key_points}
- Previous Chapters Context: {previous_context}
- Target Word Count: approximately {target_word_count} words
- Special Instructions: {writing_instructions}
- Research / Sources to integrate: {sources_summary}

Mode: {mode}
Existing text (if continuing or expanding):
{existing_content}

Write rich, compelling, practical content that keeps readers hooked. Include practical frameworks, vivid storytelling or realistic case examples, and crisp summaries."""

AI_EDITING_PROMPTS = {
    "proofread": """Carefully proofread the provided text. Correct grammatical mistakes, typos, awkward phrasing, and punctuation while preserving the author's original voice. Provide the cleaned text and a brief summary of changes.""",
    "rewrite_tone": """Rewrite the provided text to match this target tone: {tone_target}. Make it natural, fluent, and captivating. Preserve all factual points and core message.""",
    "simplify": """Simplify the provided text for maximum readability and accessibility. Remove jargon, shorten convoluted sentences, and clarify dense explanations without losing substance.""",
    "expand": """Expand the provided passage by adding insightful explanations, vivid real-world examples, actionable nuances, and deeper analysis while maintaining pacing.""",
    "shorten": """Condense and tighten the provided text by removing fluff, filler words, and redundancy while preserving all vital concepts.""",
    "remove_repetition": """Identify and eliminate redundant statements, recurring phrases, and repetitive arguments in the provided text.""",
    "add_examples": """Enhance the provided text by weaving in concrete illustrative examples, case studies, or scenarios that clearly demonstrate the concepts.""",
    "add_exercises": """At the end of the provided section, generate 2-3 engaging, practical reader exercises or reflection questions based on the content.""",
    "add_faq": """Generate a high-value FAQ (3-5 frequently asked questions and crisp answers) addressing the most common reader questions regarding the provided chapter content."""
}

CONSISTENCY_CHECK_PROMPT = """Analyze the following book chapters for overall coherence and quality:
Book Title: {title}
Target Audience: {target_audience}

Chapters Overview & Content:
{chapters_content}

Perform a rigorous editorial review:
1. Identify any overlapping ideas or recurring points across chapters.
2. Flag internal contradictions in arguments, numbers, or recommendations.
3. Check for terminology consistency.
4. Flag unverified claims or unsupported statistics.
5. Provide actionable recommendations.

Output valid JSON:
{{
  "overall_score": 88,
  "issues_found": 3,
  "overlap_warnings": ["Chapter 2 and Chapter 4 both explain the 80/20 rule at length"],
  "terminology_inconsistencies": ["Chapter 1 uses 'Focus Block' while Chapter 3 calls it 'Deep Session'"],
  "continuity_contradictions": [],
  "unverified_claims": ["Chapter 3 mentions '94% of people fail' without citation"],
  "recommendations": ["Consolidate productivity frameworks into Chapter 2"]
}}"""

FRONT_BACK_MATTER_PROMPT = """Generate a publication-ready {section_type} for the book:
Title: {title}
Subtitle: {subtitle}
Author: {author}
Genre: {genre}
Target Audience: {target_audience}
Reader Promise: {reader_promise}
Additional Details / Author Notes: {custom_details}

Format with appropriate Markdown headings and a professional, heartfelt, or authoritative tone fitting the genre."""

