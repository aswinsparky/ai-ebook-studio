import json
import random
from typing import Dict, Any, List

class MockAIProvider:
    """
    Mock AI Provider for development, offline usage, and automated testing.
    Provides deterministic and realistic responses for all AI workflows.
    """

    @staticmethod
    def generate_ideas(niche_or_genre: str = "Nonfiction", target_audience: str = "General", keywords: str = "", count: int = 3) -> Dict[str, Any]:
        genre_key = (niche_or_genre or "Business").lower()
        
        sample_idea_library = [
            {
                "title": f"The Unfair Advantage of {niche_or_genre.title() if niche_or_genre else 'Modern Mindsets'}",
                "subtitle": "How to Outthink, Outperform, and Thrive in the Age of Acceleration",
                "target_audience": target_audience or "Ambitious professionals and lifelong learners",
                "hook": "99% of people rely on outdated playbooks; here is the counter-intuitive framework that changes everything.",
                "reader_promise": "Develop rare mental models, eliminate cognitive friction, and execute at peak velocity.",
                "unique_angle": "Combines behavioural neuroscience, compound systems thinking, and actionable weekly sprints.",
                "sample_chapters": [
                    "The Cognitive Moat",
                    "Architecting High-Leverage Routines",
                    "The Frictionless Decision Framework",
                    "Compounding Micro-Wins",
                    "The Antifragile Creator"
                ]
            },
            {
                "title": f"The {niche_or_genre.title() if niche_or_genre else 'Clarity'} Blueprint",
                "subtitle": "A Step-by-Step Field Guide from Zero to Mastery",
                "target_audience": target_audience or "Creators, entrepreneurs, and practitioners",
                "hook": "You don't need more information—you need a ruthless prioritization architecture.",
                "reader_promise": "Master core fundamentals in 30 days with reproducible protocols and self-auditing checklists.",
                "unique_angle": "Zero fluff, 100% case-tested templates and visual diagnostic tools.",
                "sample_chapters": [
                    "The Diagnostic Foundation",
                    "Deconstructing Core Mechanics",
                    "The 80/20 Leverage Points",
                    "Systemizing Iteration Cycles",
                    "Sustainable Scale and Longevity"
                ]
            },
            {
                "title": f"Mastering {niche_or_genre.title() if niche_or_genre else 'Strategic Focus'}",
                "subtitle": "Proven Tactics to Turn Chaos into Clarity and Results",
                "target_audience": target_audience or "Leaders, specialists, and team builders",
                "hook": "In a world of perpetual distraction, focused depth is the only true superpower.",
                "reader_promise": "Reclaim 15 hours every week and double your high-value creative output.",
                "unique_angle": "Rooted in deep work experiments and modern knowledge-work analytics.",
                "sample_chapters": [
                    "The Anatomy of Distraction",
                    "Protecting the Sacred Flow State",
                    "The Asynchronous Output Engine",
                    "Ruthless Boundary Design",
                    "The Mastery Playbook"
                ]
            }
        ]

        ideas = sample_idea_library[:min(count, len(sample_idea_library))]
        return {
            "niche": niche_or_genre,
            "ideas": ideas
        }

    @staticmethod
    def generate_blueprint(
        title: str,
        subtitle: str,
        author: str,
        genre: str,
        topic: str,
        target_audience: str,
        reader_promise: str,
        writing_style: str,
        tone: str,
        target_chapter_count: int,
        target_word_count: int,
        custom_instructions: str = ""
    ) -> Dict[str, Any]:
        words_per_chapter = max(1000, target_word_count // max(1, target_chapter_count))
        
        default_titles = [
            ("The Foundation & The Problem", "Deconstruct why conventional methods fail and outline the shift required."),
            ("The Mindset Architecture", "Rewire mental models and establish cognitive resilience before taking action."),
            ("Core Principles & First Fundamentals", "Deep dive into the core mechanisms that drive 80% of results."),
            ("The Strategic Framework", "A step-by-step implementation protocol with actionable milestones."),
            ("Overcoming Roadblocks & Resistance", "Identify hidden bottlenecks, psychological friction, and troubleshooting strategies."),
            ("Leverage, Systems & Automation", "Shift from manual grind to scalable, compound leverage."),
            ("Case Studies & Real-World Application", "Detailed breakdowns of three distinct scenarios and outcomes."),
            ("Advanced Tactics & Optimization", "Fine-tuning nuances for experienced practitioners seeking top 1% performance."),
            ("Building Long-Term Momentum", "Habitual sustainability, review cadences, and continuous iteration."),
            ("The Mastery Horizon", "Synthesizing the journey and articulating the ongoing lifestyle transition.")
        ]

        chapters = []
        for i in range(1, target_chapter_count + 1):
            if i - 1 < len(default_titles):
                chap_title, chap_summary = default_titles[i - 1]
            else:
                chap_title = f"Phase {i}: Deep Dive & Applied Tactics"
                chap_summary = f"Practical implementation steps for stage {i} of the journey."
            
            chapters.append({
                "order_index": i,
                "title": f"Chapter {i}: {chap_title}",
                "summary": chap_summary,
                "key_points": [
                    f"Understanding key dynamic #{i} in depth",
                    "Common pitfalls and how to avoid them",
                    "Practical self-assessment diagnostic"
                ],
                "target_word_count": words_per_chapter,
                "learning_objective": f"Equip the reader with actionable mastery over {chap_title.lower()}."
            })

        return {
            "title": title,
            "subtitle": subtitle or f"A Definitive Guide to {topic or genre}",
            "core_concept": f"A comprehensive, highly practical guide tailored for {target_audience or 'dedicated readers'} to achieve {reader_promise or 'measurable transformation'}.",
            "target_audience_profile": target_audience or "Motivated individuals looking for evidence-based, actionable guidance.",
            "unique_selling_proposition": "Combines clear theoretical rigor with plug-and-play frameworks, zero fluff, and progressive chapter mastery.",
            "reader_transformation": f"From feeling uncertain or overwhelmed to possessing absolute clarity and executing {reader_promise or 'meaningful progress'}.",
            "suggested_tone": tone or "Authoritative, engaging, and deeply practical",
            "proposed_structure": chapters
        }

    @staticmethod
    def generate_chapter_content(
        book_title: str,
        chapter_title: str,
        order_index: int,
        genre: str,
        target_audience: str,
        reader_promise: str,
        writing_style: str,
        tone: str,
        summary: str,
        key_points: List[str],
        target_word_count: int,
        writing_instructions: str = "",
        mode: str = "full",
        existing_content: str = ""
    ) -> str:
        kps = "\n".join([f"- **{kp}**" for kp in key_points]) if key_points else "- Foundational mechanics\n- Strategic execution\n- Practical exercises"
        
        content = f"""# {chapter_title}

## Introduction: The Turning Point

Every breakthrough begins not with heroic effort, but with a fundamental shift in perception. When approaching **{book_title}**, most readers start with good intentions but quickly encounter the invisible barriers of habit, fatigue, and conflicting advice.

In this chapter, we bridge the gap between abstract desire and repeatable execution. As we unpack this material, keep our central promise in mind: *{reader_promise or 'lasting clarity and measurable transformation'}*.

---

## 1. The Core Principles

To build a structure that endures, we must ground our actions in first principles.

{kps}

Consider the reality of how momentum compounds. When you align your daily actions with high-leverage constraints, friction diminishes. What once felt like swimming upstream transforms into an effortless rhythm.

> "Simplicity is the prerequisite for reliability." — Classic Systems Law

---

## 2. In-Depth Analysis and Framework

Let us explore the tactical mechanics step-by-step:

### Phase A: Observation & Diagnostic
Before making any sudden shifts, audit where your current energy and focus flow. The vast majority of bottlenecks are not caused by lack of effort, but by misplaced focus.

### Phase B: Calibration
Once the diagnostic is clear, introduce calibrated adjustments. Rather than attempting a complete overhaul overnight, modify the single highest-leverage variable first.

### Phase C: Reinforcement
Consistency is reinforced through feedback loops. When you observe tangible evidence that the new approach produces superior results, cognitive resistance dissolves naturally.

---

## 3. Real-World Case Study

Consider the experience of Alex, a professional facing the exact challenges discussed in *{book_title}*. 

Initially, Alex struggled with information overload and constant reactivity. By adopting the structured approach outlined above:
1. Alex audited key daily commitments and eliminated 40% of low-impact tasks.
2. Implemented the 90-minute focus protocol without exceptions.
3. Within three weeks, output doubled while stress levels decreased noticeably.

This demonstrates that the system works regardless of external chaos when applied with deliberate intention.

---

## 4. Key Takeaways & Summary

- **Clarity precedes execution**: Never act without first diagnosing the leverage point.
- **Micro-adjustments yield macro results**: Small, disciplined actions compound exponentially over time.
- **Systems outperform willpower**: Design environments that make the right decision the default decision.

---

## 5. Chapter Action Exercise

Take 15 minutes right now to complete the following exercise:
1. Write down the single biggest friction point you currently experience in this area.
2. Identify one structural constraint you can implement today to eliminate that friction.
3. Commit to testing this constraint for seven consecutive days before re-evaluating.
"""
        if mode == "continue" and existing_content:
            return existing_content.rstrip() + "\n\n" + content
        elif mode == "expand" and existing_content:
            return existing_content.rstrip() + "\n\n### Expanded Insights & Advanced Nuances\n\nDeepening our analysis further, notice how subtle shifts in context dictate execution. By auditing feedback loops continuously, you safeguard your progress against regression.\n\n" + content
        elif mode == "shorten" and existing_content:
            return f"# {chapter_title}\n\n## Core Concept\n{summary}\n\n## Key Takeaways\n{kps}\n\n## Action Step\nApply the primary principle immediately in your next working session."

        return content

    @staticmethod
    def ai_edit(action: str, full_content: str, selected_text: str = None, tone_target: str = "engaging", custom_instruction: str = "") -> Dict[str, Any]:
        target = selected_text if selected_text else full_content
        
        if action == "proofread":
            modified = target.replace("teh", "the").replace("alot", "a lot").replace("their", "there")  # sample
            summary = "Corrected minor punctuation, standardized capitalization, and enhanced sentence cadence."
            suggestions = ["Consider breaking long compound sentences into crisp independent clauses."]
        elif action == "rewrite_tone":
            modified = f"*(Rewritten with {tone_target} tone)*\n\n{target}"
            summary = f"Refactored prose to project a {tone_target} tone while preserving technical accuracy."
            suggestions = [f"Adjusted vocabulary to align with {tone_target} reader expectations."]
        elif action == "simplify":
            modified = target.replace("utilize", "use").replace("commence", "begin").replace("subsequently", "then")
            summary = "Simplified complex terminology, shortened passive phrasing, and boosted readability scores."
            suggestions = ["Replaced bureaucratic jargon with direct, punchy phrasing."]
        elif action == "expand":
            modified = f"{target}\n\nFurthermore, when we examine this from an operational standpoint, several practical implications emerge. Practitioners who integrate these insights consistently report significant gains in both speed and retention."
            summary = "Expanded theoretical points with practical context and empirical elaboration."
            suggestions = ["Added supporting examples and extended conceptual depth."]
        elif action == "shorten":
            paragraphs = [p for p in target.split("\n\n") if p.strip()]
            modified = "\n\n".join(paragraphs[:max(1, len(paragraphs) // 2)])
            summary = "Trimmed secondary filler and condensed narrative to core essentials."
            suggestions = ["Removed redundant transitional paragraphs."]
        elif action == "add_examples":
            modified = f"{target}\n\n### Concrete Example in Action\nImagine a scenario where Team A implements this protocol while Team B sticks to legacy habits. Team A completes deliverables in half the time with zero quality defects, illustrating the power of proactive architecture."
            summary = "Synthesized a realistic comparative case example."
            suggestions = ["Placed the example adjacent to the primary conceptual framework."]
        elif action == "add_exercises":
            modified = f"{target}\n\n### Reflection & Practice Drill\n1. What is the primary takeaway you will test in the next 24 hours?\n2. What metric will you track to determine whether this change succeeded?"
            summary = "Generated two targeted reader reflection exercises."
            suggestions = ["Positioned reflection drills at the end of the section."]
        elif action == "add_faq":
            modified = f"{target}\n\n### Frequently Asked Questions\n**Q: How quickly will I see results?**\n*A: Most readers notice measurable improvements within the first 3 to 7 days of disciplined application.*\n\n**Q: Does this work for beginners?**\n*A: Yes, the principles are designed from first principles and do not require prior specialization.*"
            summary = "Generated high-impact reader FAQ module."
            suggestions = ["Addressed common objections and timeline expectations."]
        else:
            modified = target
            summary = "Applied requested editorial adjustments."
            suggestions = []

        return {
            "action": action,
            "original_text": target,
            "modified_text": modified,
            "diff_summary": summary,
            "suggestions": suggestions
        }

    @staticmethod
    def check_consistency(title: str, target_audience: str, chapters_content: str) -> Dict[str, Any]:
        return {
            "overall_score": 92,
            "issues_found": 2,
            "overlap_warnings": [
                "Noticeable overlap in productivity definitions between Chapter 1 and Chapter 3."
            ],
            "terminology_inconsistencies": [
                "Term 'Sprint Phase' is used in Chapter 2, while Chapter 4 refers to 'Focused Cycle'."
            ],
            "continuity_contradictions": [],
            "unverified_claims": [
                "Statistical claim regarding 90% failure rates in Chapter 2 should cite a verifiable source or study."
            ],
            "recommendations": [
                "Standardize workflow nomenclature into a unified glossary.",
                "Add explicit source citations for all empirical statistics.",
                "Ensure smooth transitional hooks between consecutive chapters."
            ]
        }

    @staticmethod
    def generate_front_back_matter(section_type: str, title: str, subtitle: str, author: str, genre: str, target_audience: str, reader_promise: str, custom_details: str = "") -> Dict[str, str]:
        section_titles = {
            "introduction": "Introduction",
            "conclusion": "Conclusion: The Path Forward",
            "preface": "Preface: Why This Book Exists",
            "acknowledgements": "Acknowledgements",
            "author_bio": "About the Author",
            "glossary": "Glossary of Key Terms"
        }
        
        display_title = section_titles.get(section_type, section_type.replace("_", " ").title())
        
        if section_type == "introduction":
            body = f"""# {display_title}

Welcome to **{title}**: *{subtitle}*.

If you picked up this book, chances are you are seeking more than just theoretical knowledge—you are looking for a reliable, repeatable roadmap. 

For too long, advice in **{genre}** has been dominated by vague inspiration and impractical complexity. Our promise in these pages is straightforward: *{reader_promise or 'to give you absolute clarity and an actionable toolkit for lasting transformation'}*.

As you read, treat each chapter as an active dialogue. Highlight key insights, complete the exercises, and most importantly, test the principles in your own life.

Let us begin."""
        elif section_type == "conclusion":
            body = f"""# {display_title}

You have reached the final pages of **{title}**, but in truth, this is where your real work begins.

Knowledge without execution is merely entertainment. What separates those who achieve extraordinary breakthroughs from those who remain stagnant is not talent or luck—it is the courage to apply proven frameworks consistently.

Remember the central thesis of our journey: lasting mastery is built through compound daily iterations. 

Go forward with confidence, trust your systems, and build the future you set out to create."""
        elif section_type == "preface":
            body = f"""# {display_title}

Every book is born from a moment of intense frustration or deep inspiration. For me, **{title}** was conceived when I realized how fragmented and inaccessible practical knowledge had become for {target_audience or 'aspiring practitioners'}.

This volume reflects years of real-world experimentation, careful observation, and distillation. My goal was to create the guide I wished had existed when I first started."""
        elif section_type == "acknowledgements":
            body = f"""# {display_title}

No book is created in isolation. 

I am profoundly grateful to my family, mentors, and colleagues whose unwavering encouragement made this work possible. 

Special thanks to the early readers and beta reviewers whose incisive feedback sharpened every chapter, and to you, the reader, for dedicating your precious time and attention to this journey."""
        elif section_type == "author_bio":
            body = f"""# {display_title}

**{author}** is an author, researcher, and practitioner dedicated to advancing human potential in {genre}. 

Through writings, workshops, and consultative projects, {author} has helped thousands of readers worldwide cut through complexity, design resilient habits, and achieve sustainable success.

When not writing, {author} enjoys exploring new ideas, mentoring emerging creators, and traveling."""
        elif section_type == "glossary":
            body = f"""# {display_title}

- **Cognitive Leverage**: The practice of directing mental energy exclusively toward high-impact decisions.
- **Feedback Loop**: A circular process where the output of a system is returned as input to inform future adjustments.
- **First Principles**: Foundational truths or assumptions that cannot be deduced any further, used to construct reliable logic.
- **Frictionless Workflow**: An environment configured such that the desired behavior requires minimal activation energy.
- **Compound Execution**: The exponential accumulation of results achieved through small, regular, disciplined actions."""
        else:
            body = f"# {display_title}\n\nContent for {display_title} of {title}."

        return {
            "section_type": section_type,
            "title": display_title,
            "content": body
        }

