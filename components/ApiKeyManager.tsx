
import React, { useEffect, useState } from 'react';

const ApiKeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  // Try to load from localStorage first
  useEffect(() => {
    const saved = localStorage.getItem('api_key');
    if (saved) {
      setApiKey(saved);
      setLoading(false);
      return;
    }

    // Try Google AI Studio built-in selector
    const loadKeyFromAIStudio = async () => {
      try {
        if (window.aistudio?.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (hasKey) {
            setApiKey("ai-studio-env");
            setLoading(false);
            return;
          }
        }

        // No key found → ask user manually
        setShowPrompt(true);
      } catch {
        setShowPrompt(true);
      } finally {
        setLoading(false);
      }
    };

    loadKeyFromAIStudio();
  }, []);

  const handleSelectKeyAIStudio = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setApiKey("ai-studio-env");
        setShowPrompt(false);
      }
    } catch {
      alert("Không thể chọn API Key.");
    }
  };

  const handleManualSave = () => {
    const key = (document.getElementById('manualKeyInput') as HTMLInputElement).value;
    if (!key) return alert("Hãy nhập API Key.");
    localStorage.setItem('api_key', key);
    setApiKey(key);
    setShowPrompt(false);
  };

  if (loading) return null;
  if (apiKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="glass-panel p-8 rounded-xl max-w-md text-center border border-oracle-gold/20">
        <h2 className="text-2xl font-serif text-oracle-gold mb-4">
          Kích hoạt Truy cập Oracle
        </h2>

        <p className="text-gray-300 mb-6">
          Bạn cần một API Key Gemini (Pro 2 / Pro 3 / Flash) để sử dụng ứng dụng.
        </p>

        {/* OPTION 1 — AI STUDIO KEY */}
        {window.aistudio?.openSelectKey && (
          <button
            onClick={handleSelectKeyAIStudio}
            className="px-6 py-3 bg-oracle-purple rounded-lg font-bold text-white w-full mb-4"
          >
            Chọn API Key từ Google AI Studio
          </button>
        )}

        {/* OPTION 2 — MANUAL KEY */}
        <input
          id="manualKeyInput"
          placeholder="Nhập API Key thủ công..."
          className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white mb-4"
        />

        <button
          onClick={handleManualSave}
          className="px-6 py-3 w-full bg-oracle-gold text-black rounded-lg font-bold"
        >
          Lưu API Key
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Chưa có key?  
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            className="underline ml-1"
          >
            Lấy API Key tại đây
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManager;
