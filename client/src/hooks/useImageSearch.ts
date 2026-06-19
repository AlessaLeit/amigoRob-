import { useState, useCallback } from "react";

interface SearchResult {
  word: string;
  image_url: string;
  is_valid?: boolean;
}

export function useImageSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchImage = useCallback(async (word: string): Promise<SearchResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Try to use backend API first
      const response = await fetch("/api/search-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setLoading(false);
        return data;
      }

      // Fallback: Use Unsplash API directly from frontend
      const unsplashKey = import.meta.env.VITE_UNSPLASH_KEY || "demo";
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&per_page=1&client_id=${unsplashKey}`;

      const unsplashResponse = await fetch(unsplashUrl);

      if (unsplashResponse.ok) {
        const data = await unsplashResponse.json();
        if (data.results && data.results.length > 0) {
          setLoading(false);
          return {
            word,
            image_url: data.results[0].urls.regular,
          };
        }
      }

      // Final fallback: placeholder image
      setLoading(false);
      return {
        word,
        image_url: `https://via.placeholder.com/400?text=${encodeURIComponent(word)}`,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar imagem";
      setError(errorMessage);
      setLoading(false);
      return {
        word,
        image_url: `https://via.placeholder.com/400?text=${encodeURIComponent(word)}`,
      };
    }
  }, []);

  const validateWord = useCallback(
    async (word: string, themeId: string): Promise<SearchResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/validate-word", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ word, theme_id: themeId }),
        }).catch(() => null);

        if (response && response.ok) {
          const data = await response.json();
          setLoading(false);
          return data;
        }

        // Fallback: just search for image
        return await searchImage(word);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao validar palavra";
        setError(errorMessage);
        setLoading(false);
        return await searchImage(word);
      }
    },
    [searchImage]
  );

  return { searchImage, validateWord, loading, error };
}
