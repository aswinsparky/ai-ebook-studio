import json
import logging
import re
import time
from typing import Dict, Any, List, Optional
from app.config import settings
from app.ai.mock_provider import MockAIProvider
from app.ai.prompts import (
    IDEA_GENERATION_SYSTEM_PROMPT,
    IDEA_GENERATION_USER_PROMPT,
    BLUEPRINT_SYSTEM_PROMPT,
    BLUEPRINT_USER_PROMPT,
    CHAPTER_WRITING_SYSTEM_PROMPT,
    CHAPTER_WRITING_USER_PROMPT,
    AI_EDITING_PROMPTS,
    CONSISTENCY_CHECK_PROMPT,
    FRONT_BACK_MATTER_PROMPT
)

logger = logging.getLogger(__name__)

SUPPORTED_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]

class GeminiClient:
    def __init__(self):
        self.request_count = 0
        self.mock_request_count = 0
        self.real_request_count = 0
        self.last_status = "idle"

    def is_configured(self) -> bool:
        return bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and not settings.USE_MOCK_AI)

    def _get_client(self, override_key: Optional[str] = None):
        from google import genai
        api_key = override_key or settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")
        return genai.Client(api_key=api_key)

    def _clean_json_response(self, text: str) -> str:
        """Strip markdown fences ```json ... ``` if returned."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        return cleaned.strip()

    def _call_gemini_with_retry(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = False,
        model_name: Optional[str] = None,
        max_retries: int = 3
    ) -> str:
        from google.genai import types
        model = model_name or settings.GEMINI_MODEL
        client = self._get_client()

        config_args = {}
        if system_instruction:
            config_args["system_instruction"] = system_instruction
        if json_output:
            config_args["response_mime_type"] = "application/json"

        config = types.GenerateContentConfig(**config_args) if config_args else None

        delay = 1.5
        last_error = None

        for attempt in range(max_retries):
            try:
                self.request_count += 1
                self.real_request_count += 1
                self.last_status = f"Calling {model}"

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config
                )
                self.last_status = "ready"
                if response and response.text:
                    return response.text
                raise ValueError("Received empty response from Gemini API.")
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                logger.warning(f"Gemini API attempt {attempt + 1} failed: {e}")
                # Don't retry on invalid API key
                if "api_key" in err_str or "unauthenticated" in err_str or "permission" in err_str:
                    raise
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
                else:
                    self.last_status = f"Error: {type(e).__name__}"
                    raise last_error

    def test_connection(self, api_key: Optional[str] = None, model_name: Optional[str] = None) -> Dict[str, Any]:
        target_key = api_key or settings.GEMINI_API_KEY
        target_model = model_name or settings.GEMINI_MODEL

        if not target_key:
            return {
                "success": False,
                "message": "No API key configured. Application is running in Mock AI Mode.",
                "model_tested": target_model
            }

        try:
            from google import genai
            client = genai.Client(api_key=target_key)
            res = client.models.generate_content(
                model=target_model,
                contents="Hello! Respond with the single word 'CONNECTED'."
            )
            return {
                "success": True,
                "message": f"Successfully connected to Gemini API ({target_model})! Response: {res.text.strip()}",
                "model_tested": target_model
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "model_tested": target_model
            }

    # ==================== High-Level AI Features ====================

    def generate_ideas(
        self,
        niche: str = "",
        genre: str = "Nonfiction",
        target_audience: str = "",
        keywords: str = "",
        count: int = 3
    ) -> Dict[str, Any]:
        if not self.is_configured():
            self.request_count += 1
            self.mock_request_count += 1
            return MockAIProvider.generate_ideas(
                niche_or_genre=niche or genre,
                target_audience=target_audience,
                keywords=keywords,
                count=count
            )

        prompt = IDEA_GENERATION_USER_PROMPT.format(
            count=count,
            niche_or_genre=niche or genre,
            target_audience=target_audience or "General Readers",
            keywords=keywords or "Growth, Mastery, Practical Strategy"
        )
        try:
            raw = self._call_gemini_with_retry(
                prompt=prompt,
                system_instruction=IDEA_GENERATION_SYSTEM_PROMPT,
                json_output=True
            )
            cleaned = self._clean_json_response(raw)
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Fallback to mock for generate_ideas: {e}")
            self.mock_request_count += 1
            return MockAIProvider.generate_ideas(
                niche_or_genre=niche or genre,
                target_audience=target_audience,
                keywords=keywords,
                count=count
            )

    def generate_blueprint(
        self,
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
        if not self.is_configured():
            self.request_count += 1
            self.mock_request_count += 1
            return MockAIProvider.generate_blueprint(
                title=title,
                subtitle=subtitle,
                author=author,
                genre=genre,
                topic=topic,
                target_audience=target_audience,
                reader_promise=reader_promise,
                writing_style=writing_style,
                tone=tone,
                target_chapter_count=target_chapter_count,
                target_word_count=target_word_count,
                custom_instructions=custom_instructions
            )

        words_per_chapter = max(1000, target_word_count // max(1, target_chapter_count))
        prompt = BLUEPRINT_USER_PROMPT.format(
            title=title,
            subtitle=subtitle,
            author=author,
            genre=genre,
            topic=topic,
            target_audience=target_audience,
            reader_promise=reader_promise,
            writing_style=writing_style,
            tone=tone,
            target_chapter_count=target_chapter_count,
            target_word_count=target_word_count,
            target_words_per_chapter=words_per_chapter,
            custom_instructions=custom_instructions or "None"
        )

        try:
            raw = self._call_gemini_with_retry(
                prompt=prompt,
                system_instruction=BLUEPRINT_SYSTEM_PROMPT,
                json_output=True
            )
            cleaned = self._clean_json_response(raw)
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Fallback to mock for generate_blueprint: {e}")
            self.mock_request_count += 1
            return MockAIProvider.generate_blueprint(
                title=title,
                subtitle=subtitle,
                author=author,
                genre=genre,
                topic=topic,
                target_audience=target_audience,
                reader_promise=reader_promise,
                writing_style=writing_style,
                tone=tone,
                target_chapter_count=target_chapter_count,
                target_word_count=target_word_count,
                custom_instructions=custom_instructions
            )

    def generate_chapter(
        self,
        book_title: str,
        chapter_title: str,
        order_index: int,
        genre: str,
        topic: str,
        target_audience: str,
        reader_promise: str,
        writing_style: str,
        tone: str,
        summary: str,
        key_points: List[str],
        target_word_count: int,
        previous_context: str = "",
        sources_summary: str = "",
        writing_instructions: str = "",
        mode: str = "full",
        existing_content: str = ""
    ) -> str:
        if not self.is_configured():
            self.request_count += 1
            self.mock_request_count += 1
            return MockAIProvider.generate_chapter_content(
                book_title=book_title,
                chapter_title=chapter_title,
                order_index=order_index,
                genre=genre,
                target_audience=target_audience,
                reader_promise=reader_promise,
                writing_style=writing_style,
                tone=tone,
                summary=summary,
                key_points=key_points,
                target_word_count=target_word_count,
                writing_instructions=writing_instructions,
                mode=mode,
                existing_content=existing_content
            )

        prompt = CHAPTER_WRITING_USER_PROMPT.format(
            order_index=order_index,
            title=chapter_title,
            book_title=book_title,
            genre=genre,
            topic=topic,
            target_audience=target_audience,
            reader_promise=reader_promise,
            writing_style=writing_style,
            tone=tone,
            summary=summary,
            key_points=", ".join(key_points) if key_points else "Comprehensive topic breakdown",
            previous_context=previous_context or "Beginning of book",
            target_word_count=target_word_count,
            writing_instructions=writing_instructions or "None",
            sources_summary=sources_summary or "None provided",
            mode=mode,
            existing_content=existing_content or "None"
        )

        try:
            content = self._call_gemini_with_retry(
                prompt=prompt,
                system_instruction=CHAPTER_WRITING_SYSTEM_PROMPT,
                json_output=False
            )
            return content
        except Exception as e:
            logger.error(f"Fallback to mock for generate_chapter: {e}")
            self.mock_request_count += 1
            return MockAIProvider.generate_chapter_content(
                book_title=book_title,
                chapter_title=chapter_title,
                order_index=order_index,
                genre=genre,
                target_audience=target_audience,
                reader_promise=reader_promise,
                writing_style=writing_style,
                tone=tone,
                summary=summary,
                key_points=key_points,
                target_word_count=target_word_count,
                writing_instructions=writing_instructions,
                mode=mode,
                existing_content=existing_content
            )

    def ai_edit(
        self,
        action: str,
        full_content: str,
        selected_text: Optional[str] = None,
        tone_target: str = "engaging",
        custom_instruction: str = ""
    ) -> Dict[str, Any]:
        if not self.is_configured():
            self.request_count += 1
            self.mock_request_count += 1
            return MockAIProvider.ai_edit(
                action=action,
                full_content=full_content,
                selected_text=selected_text,
                tone_target=tone_target,
                custom_instruction=custom_instruction
            )

        instruction = AI_EDITING_PROMPTS.get(action, "Improve the following text.")
        if "{tone_target}" in instruction:
            instruction = instruction.format(tone_target=tone_target)
        if custom_instruction:
            instruction += f" Additional instruction: {custom_instruction}"

        target_text = selected_text if selected_text else full_content
        prompt = f"""{instruction}

Original Text:
{target_text}

Output strictly valid JSON with this format:
{{
  "action": "{action}",
  "original_text": "{target_text[:100]}...",
  "modified_text": "Improved text here",
  "diff_summary": "Brief summary of improvements made",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}}"""

        try:
            raw = self._call_gemini_with_retry(
                prompt=prompt,
                system_instruction="You are an expert editor. Output strictly valid JSON.",
                json_output=True
            )
            cleaned = self._clean_json_response(raw)
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Fallback to mock for ai_edit: {e}")
            self.mock_request_count += 1
            return MockAIProvider.ai_edit(
                action=action,
                full_content=full_content,
                selected_text=selected_text,
                tone_target=tone_target,
                custom_instruction=custom_instruction
            )

    def check_consistency(self, title: str, target_audience: str, chapters_content: str) -> Dict[str, Any]:
        if not self.is_configured():
            self.request_count += 1
            self.mock_request_count += 1
            return MockAIProvider.check_consistency(title, target_audience, chapters_content)

        prompt = CONSISTENCY_CHECK_PROMPT.format(
            title=title,
            target_audience=target_audience,
            chapters_content=chapters_content[:15000]  # bounded token size
        )

        try:
            raw = self._call_gemini_with_retry(
                prompt=prompt,
                system_instruction="You are a book continuity and consistency editor. Output strictly valid JSON.",
                json_output=True
            )
            cleaned = self._clean_json_response(raw)
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Fallback to mock for check_consistency: {e}")
            self.mock_request_count += 1
            return MockAIProvider.check_consistency(title, target_audience, chapters_content)

    def generate_front_back_matter(
        self,
        section_type: str,
        title: str,
        subtitle: str,
        author: str,
        genre: str,
        target_audience: str,
        reader_promise: str,
        custom_details: str = ""
    ) -> Dict[str, str]:
        if not self.is_configured():
            self.request_count += 1
            self.mock_request_count += 1
            return MockAIProvider.generate_front_back_matter(
                section_type=section_type,
                title=title,
                subtitle=subtitle,
                author=author,
                genre=genre,
                target_audience=target_audience,
                reader_promise=reader_promise,
                custom_details=custom_details
            )

        prompt = FRONT_BACK_MATTER_PROMPT.format(
            section_type=section_type,
            title=title,
            subtitle=subtitle,
            author=author,
            genre=genre,
            target_audience=target_audience,
            reader_promise=reader_promise,
            custom_details=custom_details or "Standard publication format"
        )

        try:
            content = self._call_gemini_with_retry(
                prompt=prompt,
                system_instruction="You are a master book publisher and editor. Output markdown.",
                json_output=False
            )
            display_title = section_type.replace("_", " ").title()
            return {
                "section_type": section_type,
                "title": display_title,
                "content": content
            }
        except Exception as e:
            logger.error(f"Fallback to mock for front/back matter: {e}")
            self.mock_request_count += 1
            return MockAIProvider.generate_front_back_matter(
                section_type=section_type,
                title=title,
                subtitle=subtitle,
                author=author,
                genre=genre,
                target_audience=target_audience,
                reader_promise=reader_promise,
                custom_details=custom_details
            )

# Global client singleton
ai_client = GeminiClient()

