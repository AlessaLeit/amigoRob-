import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { useImageSearch } from "@/hooks/useImageSearch";

interface SpeakPageProps {
  themeId: string;
}

const themeData: Record<string, any> = {
  animals: {
    name: "Animais",
    words: ["gato", "cachorro", "leão", "elefante", "pássaro"],
    color: "#A8D8EA",
  },
  colors: {
    name: "Cores",
    words: ["vermelho", "azul", "amarelo", "verde", "roxo"],
    color: "#FFB3D9",
  },
  fruits: {
    name: "Frutas",
    words: ["maçã", "banana", "morango", "laranja", "uva"],
    color: "#B3E5B3",
  },
  numbers: {
    name: "Números",
    words: ["um", "dois", "três", "quatro", "cinco"],
    color: "#FFE4B3",
  },
  shapes: {
    name: "Formas",
    words: ["círculo", "quadrado", "triângulo", "estrela", "coração"],
    color: "#D9B3E5",
  },
};

export default function SpeakPage() {
  const [, params] = useRoute("/speak/:themeId");
  const [, setLocation] = useLocation();
  const themeId = params?.themeId || "animals";
  const theme = themeData[themeId];

  const [isListening, setIsListening] = useState(false);
  const [circleSize, setCircleSize] = useState(120);
  const [circleColor, setCircleColor] = useState(theme?.color || "#A8D8EA");
  const [recognizedWord, setRecognizedWord] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [resultImage, setResultImage] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const { searchImage } = useImageSearch();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Audio API and Speech Recognition
  useEffect(() => {
    // Initialize Web Audio API
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (error) {
        console.error("Erro ao acessar microfone:", error);
      }
    };

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        initAudio();
        startVisualization();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setRecognizedWord(transcript);
        handleWordRecognized(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        // Stop microphone
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Erro no reconhecimento de fala:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Visualization loop
  const startVisualization = () => {
    const visualize = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average frequency (tone)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      // Map frequency to circle size (80-300px)
      const newSize = Math.min(300, Math.max(80, 80 + average * 1.5));
      setCircleSize(newSize);

      // Map frequency to color hue
      const hue = (average / 255) * 360;
      setCircleColor(`hsl(${hue}, 70%, 70%)`);

      animationIdRef.current = requestAnimationFrame(visualize);
    };

    visualize();
  };

  const handleWordRecognized = async (word: string) => {
    // Check if word matches any in the theme
    const isCorrect = theme?.words.some((w: string) =>
      word.includes(w) || w.includes(word)
    );

    if (isCorrect) {
      // Find the correct word
      const correctWord = theme?.words.find((w: string) =>
        word.includes(w) || w.includes(word)
      );

      // Search for image
      const result = await searchImage(correctWord);
      if (result) {
        setResultImage(result.image_url);
        setRecognizedWord(correctWord);
        setIsCorrect(true);
        setShowResult(true);
      }
    } else {
      // Word not found in theme
      setIsCorrect(false);
      setShowResult(true);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
  };

  const handleBack = () => {
    setLocation("/");
  };

  const handleNextWord = () => {
    setShowResult(false);
    setRecognizedWord("");
    setCircleSize(120);
    setCircleColor(theme?.color || "#A8D8EA");
    setIsCorrect(false);
  };

  if (showResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-pink-50 to-yellow-50">
        {isCorrect ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">Muito bem! 🎉</h1>
              <p className="text-2xl font-bold text-blue-600 mb-8">{recognizedWord}</p>
            </div>

            <div className="mb-8">
              <img
                src={resultImage}
                alt={recognizedWord}
                className="w-64 h-64 rounded-2xl shadow-lg object-cover"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleNextWord}
                className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold"
              >
                Próxima palavra
              </Button>
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-8 py-3 rounded-full text-lg font-semibold"
              >
                Voltar ao menu
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-4">Quase lá! 🤔</h1>
              <p className="text-xl text-slate-600 mb-4">Você disse: <strong>{recognizedWord}</strong></p>
              <p className="text-lg text-slate-600">
                Isso não é uma palavra do tema <strong>{theme?.name}</strong>. Tente novamente!
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleNextWord}
                className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold"
              >
                Tentar novamente
              </Button>
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-8 py-3 rounded-full text-lg font-semibold"
              >
                Voltar ao menu
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-pink-50 to-yellow-50 relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
      >
        <ArrowLeft className="w-6 h-6 text-slate-600" />
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Tema: {theme?.name}
        </h1>
        <p className="text-lg text-slate-600">Fale uma palavra! 🎤</p>
      </div>

      {/* Animated Circle */}
      <div className="mb-12 flex items-center justify-center">
        <div
          className="rounded-full shadow-2xl transition-all duration-100 flex items-center justify-center"
          style={{
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            backgroundColor: circleColor,
            opacity: 0.8,
          }}
        >
          {isListening && (
            <div className="text-4xl animate-bounce">🎤</div>
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-8">
        <p className="text-xl text-slate-700 font-semibold">
          {isListening ? "Ouvindo..." : "Pronto para ouvir"}
        </p>
      </div>

      {/* Recognized Word Display */}
      {recognizedWord && (
        <div className="text-center mb-8 p-4 bg-white rounded-2xl shadow-md">
          <p className="text-slate-600">Você disse:</p>
          <p className="text-2xl font-bold text-blue-600">{recognizedWord}</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isListening ? (
          <Button
            onClick={startListening}
            className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center gap-2 shadow-lg"
          >
            <Mic className="w-6 h-6" />
            Começar a falar
          </Button>
        ) : (
          <Button
            onClick={stopListening}
            className="bg-red-400 hover:bg-red-500 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center gap-2 shadow-lg"
          >
            <MicOff className="w-6 h-6" />
            Parar
          </Button>
        )}
      </div>
    </div>
  );
}
