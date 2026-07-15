export interface ThemeWord {
  word: string;
  emoji: string;
  syllables: string[];
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  bgClass: string;
  circleColor: string;
  words: ThemeWord[];
}

export const THEMES: Theme[] = [
  {
    id: "animals",
    name: "Animais",
    icon: "🐱",
    bgClass: "bg-blue-100",
    circleColor: "#A8D8EA",
    words: [
      { word: "gato", emoji: "🐱", syllables: ["GA", "TO"] },
      { word: "cachorro", emoji: "🐶", syllables: ["CA", "CHOR", "RO"] },
      { word: "leão", emoji: "🦁", syllables: ["LE", "ÃO"] },
      { word: "elefante", emoji: "🐘", syllables: ["E", "LE", "FAN", "TE"] },
      { word: "pássaro", emoji: "🐦", syllables: ["PÁS", "SA", "RO"] },
    ],
  },
  {
    id: "colors",
    name: "Cores",
    icon: "🎨",
    bgClass: "bg-pink-100",
    circleColor: "#FFB3D9",
    words: [
      { word: "vermelho", emoji: "🔴", syllables: ["VER", "ME", "LHO"] },
      { word: "azul", emoji: "🔵", syllables: ["A", "ZUL"] },
      { word: "amarelo", emoji: "🟡", syllables: ["A", "MA", "RE", "LO"] },
      { word: "verde", emoji: "🟢", syllables: ["VER", "DE"] },
      { word: "roxo", emoji: "🟣", syllables: ["RO", "XO"] },
    ],
  },
  {
    id: "fruits",
    name: "Frutas",
    icon: "🍎",
    bgClass: "bg-green-100",
    circleColor: "#B3E5B3",
    words: [
      { word: "maçã", emoji: "🍎", syllables: ["MA", "ÇÃ"] },
      { word: "banana", emoji: "🍌", syllables: ["BA", "NA", "NA"] },
      { word: "morango", emoji: "🍓", syllables: ["MO", "RAN", "GO"] },
      { word: "laranja", emoji: "🍊", syllables: ["LA", "RAN", "JA"] },
      { word: "uva", emoji: "🍇", syllables: ["U", "VA"] },
    ],
  },
  {
    id: "numbers",
    name: "Números",
    icon: "1️⃣",
    bgClass: "bg-yellow-100",
    circleColor: "#FFE4B3",
    words: [
      { word: "um", emoji: "1️⃣", syllables: ["UM"] },
      { word: "dois", emoji: "2️⃣", syllables: ["DOIS"] },
      { word: "três", emoji: "3️⃣", syllables: ["TRÊS"] },
      { word: "quatro", emoji: "4️⃣", syllables: ["QUA", "TRO"] },
      { word: "cinco", emoji: "5️⃣", syllables: ["CIN", "CO"] },
    ],
  },
  {
    id: "shapes",
    name: "Formas",
    icon: "⭕",
    bgClass: "bg-purple-100",
    circleColor: "#D9B3E5",
    words: [
      { word: "círculo", emoji: "⭕", syllables: ["CÍR", "CU", "LO"] },
      { word: "quadrado", emoji: "🟥", syllables: ["QUA", "DRA", "DO"] },
      { word: "triângulo", emoji: "🔺", syllables: ["TRI", "ÂN", "GU", "LO"] },
      { word: "estrela", emoji: "⭐", syllables: ["ES", "TRE", "LA"] },
      { word: "coração", emoji: "❤️", syllables: ["CO", "RA", "ÇÃO"] },
    ],
  },
];

export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}
