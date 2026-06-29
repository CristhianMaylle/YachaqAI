from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field

from app.config import settings

logger = logging.getLogger(__name__)

LLM_PROVIDERS: dict[str, dict] = {
    "gemini": {
        "env_key": "google_ai_api_key",
        "label": "Google Gemini",
        "models": [
            {"id": "gemini-2.5-flash", "label": "Gemini 2.5 Flash", "tier": "fast"},
            {"id": "gemini-2.5-pro", "label": "Gemini 2.5 Pro", "tier": "quality"},
        ],
    },
    "groq": {
        "env_key": "groq_api_key",
        "label": "Groq",
        "models": [
            {"id": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B", "tier": "fast"},
            {"id": "mixtral-8x7b-32768", "label": "Mixtral 8x7B", "tier": "fast"},
            {"id": "gemma2-9b-it", "label": "Gemma 2 9B", "tier": "fast"},
        ],
    },
    "openai": {
        "env_key": "openai_api_key",
        "label": "OpenAI",
        "models": [
            {"id": "gpt-4o", "label": "GPT-4o", "tier": "quality"},
            {"id": "gpt-4o-mini", "label": "GPT-4o Mini", "tier": "fast"},
        ],
    },
    "anthropic": {
        "env_key": "anthropic_api_key",
        "label": "Anthropic",
        "models": [
            {"id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6", "tier": "quality"},
            {"id": "claude-haiku-4-5", "label": "Claude Haiku 4.5", "tier": "fast"},
        ],
    },
    "nvidia": {
        "env_key": "nvidia_api_key",
        "label": "NVIDIA NIM",
        "models": [
            {"id": "deepseek-ai/deepseek-v4-flash", "label": "DeepSeek V4 Flash", "tier": "fast"},
            {"id": "deepseek-ai/deepseek-v4-pro", "label": "DeepSeek V4 Pro", "tier": "quality"},
            {"id": "nvidia/nemotron-3-ultra-550b-a55b", "label": "Nemotron 3 Ultra 550B", "tier": "quality"},
            {"id": "minimaxai/minimax-m3", "label": "MiniMax M3", "tier": "fast"},
        ],
    },
}


class LLMError(Exception):
    pass


@dataclass
class LLMResponse:
    text: str
    model: str
    provider: str
    usage: dict[str, int] = field(default_factory=dict)


class LLMGateway:
    def __init__(self, _settings: object) -> None:
        self._settings = _settings
        self._available = self._detect_available()
        self._active_provider: str | None = None
        self._active_model: str | None = None

        if self._available:
            first = next(iter(self._available))
            self._active_provider = first
            self._active_model = LLM_PROVIDERS[first]["models"][0]["id"]

    def _detect_available(self) -> dict[str, dict]:
        available: dict[str, dict] = {}
        for provider_id, config in LLM_PROVIDERS.items():
            api_key = getattr(self._settings, config["env_key"], "")
            if api_key:
                available[provider_id] = {
                    "label": config["label"],
                    "models": config["models"],
                }
        return available

    def get_available_providers(self) -> list[dict]:
        result = []
        for provider_id, config in LLM_PROVIDERS.items():
            is_available = provider_id in self._available
            result.append({
                "id": provider_id,
                "label": config["label"],
                "available": is_available,
                "models": config["models"] if is_available else [],
                "message": None if is_available
                else f"API key no configurada ({config['env_key'].upper()})",
            })
        return result

    def get_active(self) -> dict:
        return {"provider": self._active_provider, "model": self._active_model}

    def select(self, provider: str, model: str) -> dict:
        if provider not in LLM_PROVIDERS:
            raise ValueError(f"Proveedor '{provider}' no existe")
        if provider not in self._available:
            env_key = LLM_PROVIDERS[provider]["env_key"].upper()
            raise ValueError(f"Proveedor '{provider}' no disponible. Configura {env_key} en .env")
        valid_models = [m["id"] for m in LLM_PROVIDERS[provider]["models"]]
        if model not in valid_models:
            raise ValueError(f"Modelo '{model}' no existe en {provider}. Opciones: {valid_models}")
        self._active_provider = provider
        self._active_model = model
        return self.get_active()

    async def generate(
        self,
        prompt: str,
        system: str = "",
        response_format: str = "text",
    ) -> LLMResponse:
        if not self._active_provider:
            raise LLMError("No hay proveedor LLM configurado. Agrega al menos una API key en .env")

        assert self._active_model is not None

        try:
            if self._active_provider == "gemini":
                return await self._call_gemini(prompt, system, response_format)
            if self._active_provider == "groq":
                return await self._call_groq(prompt, system, response_format)
            if self._active_provider == "openai":
                return await self._call_openai(prompt, system, response_format)
            if self._active_provider == "anthropic":
                return await self._call_anthropic(prompt, system, response_format)
            if self._active_provider == "nvidia":
                return await self._call_nvidia(prompt, system, response_format)
            raise LLMError(f"Proveedor desconocido: {self._active_provider}")
        except LLMError:
            raise
        except Exception as exc:
            msg = str(exc)
            if "429" in msg or "rate" in msg.lower() or "quota" in msg.lower() or "RESOURCE_EXHAUSTED" in msg:
                raise LLMError(f"Limite de uso alcanzado en {self._active_provider}. Cambia de modelo en Settings o intenta mas tarde") from exc
            if "401" in msg or "403" in msg or "invalid" in msg.lower():
                env_key = LLM_PROVIDERS[self._active_provider]["env_key"].upper()
                raise LLMError(f"API key invalida para {self._active_provider}. Verifica {env_key} en .env") from exc
            raise LLMError(f"Error del proveedor {self._active_provider}: {msg}") from exc

    # ── Adapters ──────────────────────────────────────────────

    async def _call_gemini(self, prompt: str, system: str, response_format: str) -> LLMResponse:
        from google import genai

        client = genai.Client(api_key=self._settings.google_ai_api_key)

        config: dict = {}
        if system:
            config["system_instruction"] = system
        if response_format == "json":
            config["response_mime_type"] = "application/json"

        response = client.models.generate_content(
            model=self._active_model,
            contents=prompt,
            config=config if config else None,
        )
        usage = {}
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            usage = {
                "input_tokens": getattr(response.usage_metadata, "prompt_token_count", 0),
                "output_tokens": getattr(response.usage_metadata, "candidates_token_count", 0),
            }
        return LLMResponse(text=response.text, model=self._active_model, provider="gemini", usage=usage)

    async def _call_groq(self, prompt: str, system: str, response_format: str) -> LLMResponse:
        from groq import Groq

        client = Groq(api_key=self._settings.groq_api_key)
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        kwargs: dict = {"model": self._active_model, "messages": messages}
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        usage = {}
        if response.usage:
            usage = {"input_tokens": response.usage.prompt_tokens, "output_tokens": response.usage.completion_tokens}
        return LLMResponse(text=choice.message.content or "", model=self._active_model, provider="groq", usage=usage)

    async def _call_openai(self, prompt: str, system: str, response_format: str) -> LLMResponse:
        from openai import OpenAI

        client = OpenAI(api_key=self._settings.openai_api_key)
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        kwargs: dict = {"model": self._active_model, "messages": messages}
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        usage = {}
        if response.usage:
            usage = {"input_tokens": response.usage.prompt_tokens, "output_tokens": response.usage.completion_tokens}
        return LLMResponse(text=choice.message.content or "", model=self._active_model, provider="openai", usage=usage)

    async def _call_anthropic(self, prompt: str, system: str, response_format: str) -> LLMResponse:
        import anthropic

        client = anthropic.Anthropic(api_key=self._settings.anthropic_api_key)
        sys_prompt = system or ""
        if response_format == "json":
            sys_prompt += "\n\nResponde SOLO en JSON valido, sin texto adicional."

        response = client.messages.create(
            model=self._active_model,
            max_tokens=8192,
            system=sys_prompt,
            messages=[{"role": "user", "content": prompt}],
        )
        return LLMResponse(
            text=response.content[0].text,
            model=self._active_model,
            provider="anthropic",
            usage={"input_tokens": response.usage.input_tokens, "output_tokens": response.usage.output_tokens},
        )

    async def _call_nvidia(self, prompt: str, system: str, response_format: str) -> LLMResponse:
        from openai import OpenAI

        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=self._settings.nvidia_api_key
        )
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        kwargs: dict = {
            "model": self._active_model,
            "messages": messages,
            "stream": False
        }

        # Aplicar parámetros específicos para DeepSeek con soporte para razonamiento (thinking)
        if "deepseek" in self._active_model.lower():
            kwargs["temperature"] = 1.0
            kwargs["top_p"] = 0.95
            kwargs["max_tokens"] = 16384
            kwargs["extra_body"] = {"chat_template_kwargs": {"thinking": True, "reasoning_effort": "high"}}

        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        
        # Extraer y registrar el razonamiento del modelo si está disponible
        reasoning = getattr(choice.message, "reasoning", None) or getattr(choice.message, "reasoning_content", None)
        if reasoning:
            logger.info(f"NVIDIA DeepSeek Reasoning:\n{reasoning}")

        usage = {}
        if response.usage:
            usage = {"input_tokens": response.usage.prompt_tokens, "output_tokens": response.usage.completion_tokens}
        
        return LLMResponse(text=choice.message.content or "", model=self._active_model, provider="nvidia", usage=usage)


gateway = LLMGateway(settings)
