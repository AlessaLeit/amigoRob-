"""
Backend Flask para Amigo Robô
Integra com Azure AI Agent e busca imagens via Unsplash
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import asyncio
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Unsplash API configuration
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "your_unsplash_key_here")

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


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend is running"}), 200


@app.route("/api/themes", methods=["GET"])
def get_themes():
    """Get all available themes"""
    return jsonify(THEMES), 200


@app.route("/api/search-image", methods=["POST"])
def search_image():
    """
    Search for an image based on a word
    Request: {"word": "gato"}
    Response: {"word": "gato", "image_url": "https://..."}
    """
    try:
        data = request.json
        word = data.get("word", "").strip()

        if not word:
            return jsonify({"error": "Word is required"}), 400

        image_url = search_unsplash_image(word)

        return (
            jsonify({"word": word, "image_url": image_url}),
            200,
        )

    except Exception as e:
        print(f"Error in search_image: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/validate-word", methods=["POST"])
def validate_word():
    """
    Validate if a recognized word matches a theme
    Request: {"word": "gato", "theme_id": "animals"}
    Response: {"is_valid": true, "word": "gato", "image_url": "https://..."}
    """
    try:
        data = request.json
        word = data.get("word", "").strip().lower()
        theme_id = data.get("theme_id", "").strip().lower()

        if not word or not theme_id:
            return jsonify({"error": "Word and theme_id are required"}), 400

        if theme_id not in THEMES:
            return jsonify({"error": "Invalid theme_id"}), 400

        theme_words = THEMES[theme_id]["words"]

        # Check if word matches any word in the theme
        is_valid = any(w in word or word in w for w in theme_words)

        if is_valid:
            image_url = search_unsplash_image(word)
            return (
                jsonify(
                    {
                        "is_valid": True,
                        "word": word,
                        "image_url": image_url,
                        "theme_id": theme_id,
                    }
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "is_valid": False,
                        "word": word,
                        "theme_id": theme_id,
                        "message": f"Palavra '{word}' não encontrada no tema '{THEMES[theme_id]['name']}'",
                    }
                ),
                200,
            )

    except Exception as e:
        print(f"Error in validate_word: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/get-random-word", methods=["GET"])
def get_random_word():
    """
    Get a random word from a theme
    Query params: theme_id
    Response: {"word": "gato", "theme_id": "animals"}
    """
    try:
        import random

        theme_id = request.args.get("theme_id", "").strip().lower()

        if not theme_id or theme_id not in THEMES:
            return jsonify({"error": "Invalid or missing theme_id"}), 400

        word = random.choice(THEMES[theme_id]["words"])

        return (
            jsonify({"word": word, "theme_id": theme_id}),
            200,
        )

    except Exception as e:
        print(f"Error in get_random_word: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("🚀 Amigo Robô Backend is starting...")
    print(f"Unsplash API Key configured: {bool(UNSPLASH_ACCESS_KEY and UNSPLASH_ACCESS_KEY != 'your_unsplash_key_here')}")
    app.run(debug=True, host="0.0.0.0", port=5000)
