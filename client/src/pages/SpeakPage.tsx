import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { getTheme } from "@/lib/themeWords";
import { usePersistFn } from "@/hooks/usePersistFn";

interface AgentReplyResult {
  word: string;
  theme_id: string;
  is_valid: boolean;
  reply_text: string;
}

// How long (ms) of continuous detected speech fills one syllable box.
// The Web Speech API doesn't expose per-syllable timing, so this is an
// approximation driven by the microphone volume, not real phonetic detection.
const MS_PER_SYLLABLE = 350;
const SPEAKING_VOLUME_THRESHOLD = 25;

const PARADE_EMOJIS = "🐱 🐶 🐰 🦁 🐼 🐸 🐵 🐷";

// Shown while waiting for the Amigo Robô's reply, so the wait feels playful
// instead of a dead spinner.
function AnimalParadeLoader() {
  return (
    <div className="w-56 h-10 mx-auto overflow-hidden relative">
      <div
        className="absolute whitespace-nowrap text-3xl"
        style={{ animation: "animal-parade 3s linear infinite" }}
      >
        {PARADE_EMOJIS}
      </div>
    </div>
  );
}

const wordMatchesExpected = (word: string, expected: string) => word.includes(expected) || expected.includes(word);

export default function SpeakPage() {
  const [, params] = useRoute("/speak/:themeId");
  const [, setLocation] = useLocation();
  const themeId = params?.themeId || "animals";
  const theme = getTheme(themeId);

  const [wordIndex, setWordIndex] = useState(0);
  const currentWord = theme.words[wordIndex];

  const [isListening, setIsListening] = useState(false);
  const [filledSyllables, setFilledSyllables] = useState(0);
  const [circleSize, setCircleSize] = useState(120);

  const [showResult, setShowResult] = useState(false);
  const [themeComplete, setThemeComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedWord, setRecognizedWord] = useState("");
  const [agentReply, setAgentReply] = useState("");
  const [agentReplyLoading, setAgentReplyLoading] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const speakingMsRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        speakingMsRef.current = 0;
        lastFrameTimeRef.current = performance.now();
        setFilledSyllables(0);
        initAudio();
        startVisualization();
      };

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (!lastResult.isFinal) return;

        const transcript = lastResult[0].transcript.toLowerCase();
        handleWordRecognized(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
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
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapped with usePersistFn because it's called from the speech-recognition
  // handlers below, which are only wired up once on mount — without this,
  // they'd keep closing over the very first word instead of the current one.
  const startVisualization = usePersistFn(() => {
    const visualize = (time: number) => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      const newSize = Math.min(300, Math.max(80, 80 + average * 1.5));
      setCircleSize(newSize);

      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;
      if (average > SPEAKING_VOLUME_THRESHOLD) {
        speakingMsRef.current += delta;
      }

      const filled = Math.min(
        currentWord.syllables.length,
        Math.floor(speakingMsRef.current / MS_PER_SYLLABLE)
      );
      setFilledSyllables((prev) => (prev === filled ? prev : filled));

      animationIdRef.current = requestAnimationFrame(visualize);
    };

    animationIdRef.current = requestAnimationFrame(visualize);
  });

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    window.speechSynthesis.speak(utterance);
  };

  // Same reasoning as startVisualization above: wrapped so the mount-only
  // recognition handlers always validate against the *current* target word.
  // The result screen shows immediately from a local check (instant, no
  // network wait); the Gemini reply text/image/voice arrive right after,
  // in the background, without blocking the UI.
  const handleWordRecognized = usePersistFn((word: string) => {
    const target = currentWord.word;
    const valid = wordMatchesExpected(word, target);

    setRecognizedWord(word);
    setIsCorrect(valid);
    if (valid) {
      setFilledSyllables(currentWord.syllables.length);
    }
    setAgentReply("");
    setAgentReplyLoading(true);
    setShowResult(true);

    fetch("/api/agent-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, theme_id: themeId, expected_word: target }),
    })
      .then((response) => response.json())
      .then((data: AgentReplyResult) => {
        setAgentReply(data.reply_text);
        speak(data.reply_text);
      })
      .catch((error) => console.error("Erro ao consultar o agente:", error))
      .finally(() => setAgentReplyLoading(false));
  });

  const startListening = () => {
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.abort();
    setIsListening(false);
  };

  const handleBack = () => {
    setLocation("/");
  };

  const resetWordUi = () => {
    setShowResult(false);
    setRecognizedWord("");
    setCircleSize(120);
    setFilledSyllables(0);
    setIsCorrect(false);
    setAgentReply("");
    setAgentReplyLoading(false);
  };

  const handleNextWord = () => {
    const nextIndex = wordIndex + 1;
    resetWordUi();
    if (nextIndex >= theme.words.length) {
      setThemeComplete(true);
    } else {
      setWordIndex(nextIndex);
    }
  };

  const handleRestartTheme = () => {
    setThemeComplete(false);
    setWordIndex(0);
    resetWordUi();
  };

  if (themeComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-pink-50 to-yellow-50">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Tema completo! 🏆</h1>
          <p className="text-xl text-slate-600">
            Você aprendeu todas as palavras de <strong>{theme.name}</strong>!
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={handleRestartTheme}
            className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold"
          >
            Praticar de novo
          </Button>
          <Button
            onClick={handleBack}
            variant="outline"
            className="px-8 py-3 rounded-full text-lg font-semibold"
          >
            Voltar ao menu
          </Button>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-pink-50 to-yellow-50">
        {isCorrect ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">Muito bem! 🎉</h1>
              <p className="text-2xl font-bold text-blue-600 mb-4">{currentWord.word}</p>
              {agentReply ? (
                <p className="text-lg text-slate-600 mb-4">{agentReply}</p>
              ) : agentReplyLoading ? (
                <AnimalParadeLoader />
              ) : null}
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
              {agentReply ? (
                <p className="text-lg text-slate-600">{agentReply}</p>
              ) : agentReplyLoading ? (
                <AnimalParadeLoader />
              ) : null}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={resetWordUi}
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
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Tema: {theme.name}</h1>
        <p className="text-sm text-slate-500">
          Palavra {wordIndex + 1} de {theme.words.length}
        </p>
      </div>

      {/* Emoji + syllables */}
      <div className="text-center mb-8">
        <div className="text-8xl mb-4">{currentWord.emoji}</div>
        <div className="flex gap-2 justify-center flex-wrap">
          {currentWord.syllables.map((syllable, index) => (
            <span
              key={index}
              className="px-4 py-2 rounded-xl text-2xl font-bold transition-colors duration-200"
              style={{
                backgroundColor: index < filledSyllables ? theme.circleColor : "#E5E7EB",
                color: index < filledSyllables ? "#1E293B" : "#94A3B8",
              }}
            >
              {syllable}
            </span>
          ))}
        </div>
      </div>

      {/* Animated Circle */}
      <div className="mb-8 flex items-center justify-center">
        <div
          className="rounded-full shadow-2xl transition-all duration-100 flex items-center justify-center"
          style={{
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            backgroundColor: theme.circleColor,
            opacity: 0.8,
          }}
        >
          {isListening && <div className="text-4xl animate-bounce">🎤</div>}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-8">
        <p className="text-xl text-slate-700 font-semibold">
          {isListening ? "Ouvindo..." : "Fale a palavra! 🎤"}
        </p>
      </div>

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
