import React, { useState, useRef, useCallback } from 'react';
import { analyzeImage } from '../services/gemini';

/** Resize ảnh để không gửi file quá lớn → giảm chi phí + tăng tốc */
async function resizeImageIfNeeded(base64: string, maxSize = 1500): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      if (scale === 1) return resolve(base64);

      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.src = base64;
  });
}

const OracleEye: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Load và preview ảnh, có validate */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setErrorMsg("File này không phải ảnh hợp lệ.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Ảnh quá lớn (trên 15MB). Hãy chọn ảnh nhẹ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;

      // Resize nhẹ cho optimized
      base64 = await resizeImageIfNeeded(base64);

      setImage(base64);
      setAnalysis('');
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  }, []);

  /** Gửi ảnh đến Gemini */
  const handleAnalyze = useCallback(async () => {
    if (!image) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches?.[1] || "image/jpeg";
      const base64Data = matches?.[2] || image.split(',')[1];

      const prompt = "Hãy đọc 'hào quang' của hình ảnh này và giải thích ý nghĩa tâm linh nằm ẩn sau đó.";

      const result = await analyzeImage(base64Data, prompt, mimeType);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setErrorMsg("Mắt thần của Oracle bị che khuất. Không thể phân tích.");
    } finally {
      setLoading(false);
    }
  }, [image]);

  return (
    <div className="max-w-3xl mx-auto mt-6 glass-panel rounded-xl p-6 animate-fade-in">
      <h2 className="text-2xl font-serif text-oracle-gold mb-4 text-center">
        Con Mắt Oracle
      </h2>

      <div className="flex flex-col items-center gap-6">

        {/* PREVIEW ZONE */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 border-2 border-dashed border-slate-500 rounded-xl flex items-center justify-center cursor-pointer hover:border-oracle-gold hover:bg-white/5 transition-all overflow-hidden relative"
        >
          {image ? (
            <img src={image} alt="Upload" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-4xl mb-2">📷</p>
              <p>Nhấn để tải ảnh lên và kết nối với Mắt Thần</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="w-full bg-red-900/20 border border-red-700 p-3 rounded-lg text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        {/* ANALYZE BUTTON */}
        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="px-8 py-3 bg-oracle-purple hover:bg-violet-700 rounded-full text-white font-bold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang đọc vị...
            </>
          ) : (
            "ĐỌC HÀO QUANG"
          )}
        </button>

        {/* ANALYSIS RESULT */}
        {analysis && (
          <div className="w-full bg-black/40 p-6 rounded-lg border border-slate-700 animate-fade-in">
            <h3 className="text-oracle-gold font-bold mb-2">Lời giải của Oracle:</h3>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OracleEye;
