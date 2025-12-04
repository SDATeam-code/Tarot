import React from 'react';
import ApiKeyManager from './components/ApiKeyManager';
import TarotDeck from './components/TarotDeck';
import ReadingDisplay from './components/ReadingDisplay';
import { useTarotSession } from './hooks/useTarotSession';
import { useTheme } from './hooks/useTheme';

function App() {
  const {
    readingText,
    currentCards,
    currentContext,
    isLoading,
    startReading,
    resetSession,
  } = useTarotSession();

  const [theme, setTheme] = useTheme();

  const showingResult = Boolean(readingText && currentContext);

  return (
    <div className="min-h-screen text-slate-100 dark:bg-black font-sans">
      <ApiKeyManager />

      {/* HEADER */}
      <nav className="w-full glass-panel px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-oracle-gold to-orange-500 animate-pulse-slow" />
          <span className="font-serif font-bold text-2xl text-oracle-gold">
            Sơn Cụ Entertainment
          </span>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-xl"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </nav>

      {/* MAIN */}
      <main className="container mx-auto p-6">
        {showingResult ? (
          <ReadingDisplay
            readingText={readingText}
            cards={currentCards}
            context={currentContext}
            onReset={resetSession}
          />
        ) : (
          <TarotDeck
            onReadingComplete={startReading}
            isLoading={isLoading}
          />
        )}
      </main>

      <footer className="text-center text-gray-500 text-sm pb-8">
        © 2025 Sơn Cụ Entertainment. Powered by Gemini 3 Pro.
      </footer>
    </div>
  );
}

export default App;
