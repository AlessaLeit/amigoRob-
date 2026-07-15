import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { THEMES } from "@/lib/themeWords";

export default function ThemeSelect() {
  const [, setLocation] = useLocation();

  const handleThemeSelect = (themeId: string) => {
    setLocation(`/speak/${themeId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <div className="text-center mb-12">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032703009/koQ5SBS8WfJwkP4eqQ5oRn/amigo-robo-logo-oBoi8q5ruWBtdE7Y7wNDiv.webp"
          alt="Amigo Robô"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Amigo Robô</h1>
        <p className="text-lg text-slate-600">Vamos aprender juntos! 🎉</p>
      </div>

      {/* Instructions */}
      <div className="text-center mb-8">
        <p className="text-xl text-slate-700 font-semibold">
          Escolha um tema para começar:
        </p>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl w-full mb-8">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className="group"
          >
            <Card className="h-full p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white border-2 border-blue-100 hover:border-blue-300">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {theme.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800 text-center">
                  {theme.name}
                </h2>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-600">
        <p>Clique em um tema para começar a falar! 🎤</p>
      </div>
    </div>
  );
}
