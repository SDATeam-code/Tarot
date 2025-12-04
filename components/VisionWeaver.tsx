import React, { useState, useCallback, useEffect } from 'react';
import { generateVision } from '../services/gemini';
import { VisionConfig } from '../types';

const INITIAL_CONFIG: VisionConfig = { size: '1K', aspectRatio: '1:1' };

const VisionWeaver: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<VisionConfig>(INITIAL_CONFIG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------
     LOAD LAST IMAGE (better UX)
  ------------------------------------------- */
  useEffect(() => {
    const cached = localStorage.getItem("vision-last");
    if (cached) setGeneratedImage(cached);
  }, []);

  /* -------------------------------------------
     GENERATE IMAGE WITH RETRY LOGIC
  ------------------------------------------- */
  const handleGenerate = useCallback(async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    setLoading(true);
    setGeneratedImage(null);

    try {
      let img = await generateVision(cleanPrompt, config.size, config.aspectRatio);

      // Auto Retry if 1st call failed
      if (!img) {
        console.warn("Retrying image generation...");
        img = await generateVision(cleanPrompt, config.size, config.aspectRatio);
      }

      if (img) {
        setGeneratedImage(img);
        localStorage.setItem("vision-last", img);
      }
    } catch (e) {
      alert("Tạo hình ảnh thất bại. Vui lòng thử lại hoặc giảm độ phức tạp prompt.");
    } finally {
      setLoading(false);
    }
  }, [prompt, config]);

  /* -------------------------------------------
     DOWNLOAD BUTTON
  ------------------------------------------- */
  const downloadImage = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "vision-weaver.png";
    link.click();
  }, [generatedImage]);

  return (
    <div className="max-w-3xl mx-auto mt-6 glass-panel rounded-xl p-6 animate-fade-in">
      <h2 className="text-2xl font-serif text-oracle-gold mb-3 text-center">
        Xưởng Họa Sĩ Nano Banana Pro
      </h2>
      <p className="text-gray-400 text-center mb-6 text-sm">
        Hiện thực hóa viễn cảnh trong tâm trí bạn.
      </p>

      {/* PROMPT INPUT */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded p-4 text-white focus:border-oracle-gold outline-none h-28"
        placeholder="Mô tả một viễn cảnh bạn muốn triệu hồi..."
      />

      {/* CONFIG */}
      <div className="flex flex-col md:flex-row gap-4 mt-4 items-center justify-center">

        {/* SIZE */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300 text-sm">Độ phân giải:</label>
          <select
            value={config.size}
            onChange={(e) => setConfig({ ...config, size: e.target.value as any })}
            className="bg-slate-800 text-white border border-slate-600 rounded px-3 py-2"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        </div>

        {/* ASPECT RATIO */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300 text-sm">Tỷ lệ:</label>
          <select
            value={config.aspectRatio}
            onChange={(e) =>
              setConfig({ ...config, aspectRatio: e.target.value as any })
            }
            className="bg-slate-800 text-white border border-slate-600 rounded px-3 py-2"
          >
            <option value="1:1">1:1 (Vuông)</option>
            <option value="16:9">16:9 (Rộng)</option>
            <option value="3:4">3:4 (Dọc)</option>
            <option value="9:16">9:16 (Dọc – story)</option>
          </select>
        </div>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full mt-5 bg-gradient-to-r from-blue-600 to-indigo-700 py-3 rounded text-white font-bold tracking-wider hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {loading ? "Đang triệu hồi..." : "TẠO HÌNH ẢNH"}
      </button>

      {/* OUTPUT */}
      {generatedImage && (
        <div className="mt-8 flex flex-col items-center space-y-4 animate-fade-in">
          <div className="p-2 bg-gradient-to-tr from-oracle-gold to-purple-500 rounded-lg shadow-xl">
            <img
              src={generatedImage}
              alt="Generated Vision"
              className="rounded shadow-2xl max-w-full object-contain"
            />
          </div>

          <button
            onClick={downloadImage}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 hover:bg-slate-700 transition"
          >
            Tải xuống
          </button>
        </div>
      )}
    </div>
  );
};

export default VisionWeaver;
