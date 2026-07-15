"""
Backend FastAPI para Amigo Robô
Serve as rotas REST (temas, busca de imagens) e a geracao das respostas do
agente educacional via Google Gemini (POST /api/agent-reply).
"""

import os
import random

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Unsplash API configuration
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "your_unsplash_key_here")

# Google Gemini configuration (free tier, see https://aistudio.google.com/apikey)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Theme data with example words
THEMES = {
    "animals": {
        "name": "Animais",
        "words": ["gato", "cachorro", "leão", "elefante", "pássaro"],
    },
    "colors": {
        "name": "Cores",
        "words": ["vermelho", "azul", "amarelo", "verde", "roxo"],
    },
    "fruits": {
        "name": "Frutas",
        "words": ["maçã", "banana", "morango", "laranja", "uva"],
    },
    "numbers": {
        "name": "Números",
        "words": ["um", "dois", "três", "quatro", "cinco"],
    },
    "shapes": {
        "name": "Formas",
        "words": ["círculo", "quadrado", "triângulo", "estrela", "coração"],
    },
}


def search_unsplash_image(query: str) -> str:
    """
    Search for an image on Unsplash API
    Returns the image URL or a placeholder if not found
    """
    try:
        url = "https://api.unsplash.com/search/photos"
        params = {
            "query": query,
            "per_page": 1,
            "client_id": UNSPLASH_ACCESS_KEY,
        }
        response = requests.get(url, params=params, timeout=5)

        if response.status_code == 200:
            data = response.json()
            if data["results"]:
                return data["results"][0]["urls"]["regular"]

        # Fallback to placeholder
        return f"https://via.placeholder.com/400?text={query}"

    except Exception as e:
        print(f"Error searching Unsplash: {e}")
        return f"https://via.placeholder.com/400?text={query}"


def word_matches_theme(word: str, theme_id: str) -> bool:
    theme_words = THEMES[theme_id]["words"]
    return any(w in word or word in w for w in theme_words)


def word_matches_expected(word: str, expected_word: str) -> bool:
    return word in expected_word or expected_word in word


def build_agent_prompt(word: str, theme_id: str, is_valid: bool, expected_word: str = "") -> str:
    """Build the prompt sent to Gemini, keeping the same "Amigo Robô" persona/tone."""
    theme = THEMES[theme_id]
    words = ", ".join(theme["words"])

    if expected_word:
        status = (
            f'A criança deveria falar a palavra "{expected_word}" e disse "{word}", que está correto!'
            if is_valid
            else f'A criança deveria falar a palavra "{expected_word}", mas disse "{word}", que está incorreto.'
        )
        correction_hint = f'diga com gentileza que a palavra certa é "{expected_word}"'
    else:
        status = (
            f'A criança disse "{word}", que É uma das palavras do tema.'
            if is_valid
            else f'A criança disse "{word}", que NÃO é uma das palavras do tema.'
        )
        correction_hint = "diga com gentileza qual seria uma palavra certa do tema"

    return f"""Você é o "Amigo Robô", um agente educacional que ajuda crianças pequenas (de 4 a 7 anos) a aprender palavras de forma divertida e gentil.
Tema atual: {theme["name"]}. As palavras do tema são: {words}.
{status}

Responda como o Amigo Robô falaria diretamente com a criança agora, seguindo estas regras:
- Se a palavra estiver correta, elogie com entusiasmo e repita a palavra.
- Se estiver errada, {correction_hint} e incentive a tentar de novo. Nunca seja duro ou sarcástico.
- Use frases curtas e simples, sempre em português do Brasil.
- Responda só com a fala do Amigo Robô, sem aspas, sem explicações extras, no máximo 2 frases."""


def call_gemini(prompt: str) -> str:
    """Call the Gemini API and return the generated reply text, with a safe fallback."""
    if not GEMINI_API_KEY:
        return "Muito bem! Vamos continuar praticando!"

    try:
        response = requests.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return "Muito bem! Vamos continuar praticando!"


@app.get("/api/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "message": "Backend is running"}


@app.get("/api/themes")
def get_themes():
    """Get all available themes"""
    return THEMES


class SearchImageRequest(BaseModel):
    word: str


@app.post("/api/search-image")
def search_image(body: SearchImageRequest):
    """
    Search for an image based on a word
    Request: {"word": "gato"}
    Response: {"word": "gato", "image_url": "https://..."}
    """
    word = body.word.strip()

    if not word:
        return {"error": "Word is required"}, 400

    image_url = search_unsplash_image(word)

    return {"word": word, "image_url": image_url}


class ValidateWordRequest(BaseModel):
    word: str
    theme_id: str


@app.post("/api/validate-word")
def validate_word(body: ValidateWordRequest):
    """
    Validate if a recognized word matches a theme
    Request: {"word": "gato", "theme_id": "animals"}
    Response: {"is_valid": true, "word": "gato", "image_url": "https://..."}
    """
    word = body.word.strip().lower()
    theme_id = body.theme_id.strip().lower()

    if not word or not theme_id:
        return {"error": "Word and theme_id are required"}, 400

    if theme_id not in THEMES:
        return {"error": "Invalid theme_id"}, 400

    if word_matches_theme(word, theme_id):
        image_url = search_unsplash_image(word)
        return {
            "is_valid": True,
            "word": word,
            "image_url": image_url,
            "theme_id": theme_id,
        }

    return {
        "is_valid": False,
        "word": word,
        "theme_id": theme_id,
        "message": f"Palavra '{word}' não encontrada no tema '{THEMES[theme_id]['name']}'",
    }


@app.get("/api/get-random-word")
def get_random_word(theme_id: str):
    """
    Get a random word from a theme
    Query params: theme_id
    Response: {"word": "gato", "theme_id": "animals"}
    """
    theme_id = theme_id.strip().lower()

    if not theme_id or theme_id not in THEMES:
        return {"error": "Invalid or missing theme_id"}, 400

    word = random.choice(THEMES[theme_id]["words"])

    return {"word": word, "theme_id": theme_id}


class AgentReplyRequest(BaseModel):
    word: str
    theme_id: str
    expected_word: str = ""


@app.post("/api/agent-reply")
def agent_reply(body: AgentReplyRequest):
    """
    Ask the Amigo Robô agent (Gemini) to react to a word the child just said.
    Request: {"word": "gato", "theme_id": "animals", "expected_word": "gato"}
    If expected_word is given, the word is validated against that specific word
    (the one shown on screen) instead of the whole theme list.
    Response: {"word", "theme_id", "is_valid", "reply_text"}
    """
    word = body.word.strip().lower()
    theme_id = body.theme_id.strip().lower()
    expected_word = body.expected_word.strip().lower()

    if not word or not theme_id:
        return {"error": "Word and theme_id are required"}, 400

    if theme_id not in THEMES:
        return {"error": "Invalid theme_id"}, 400

    is_valid = (
        word_matches_expected(word, expected_word) if expected_word else word_matches_theme(word, theme_id)
    )
    reply_text = call_gemini(build_agent_prompt(word, theme_id, is_valid, expected_word))

    return {
        "word": word,
        "theme_id": theme_id,
        "is_valid": is_valid,
        "reply_text": reply_text,
    }


if __name__ == "__main__":
    import uvicorn

    print("🚀 Amigo Robô Backend is starting...")
    print(f"Unsplash API Key configured: {bool(UNSPLASH_ACCESS_KEY and UNSPLASH_ACCESS_KEY != 'your_unsplash_key_here')}")
    print(f"Gemini API Key configured: {bool(GEMINI_API_KEY)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
