import React, { useState, useCallback, useRef } from 'react';
import { getCosmicIntel, SearchResult } from '../services/gemini';

const CosmicNews: React.FC = () => {
  const [query, setQuery] = useState('Chuyển động các vì sao hôm nay');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortController = useRef<AbortController | null>(null);

  /** 🔮 SEND SEARCH REQUEST — SAFE WITH ABORT / NO RACE CONDITION */
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    // Abort previous request (if user clicks spam)
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();

    try {
      const data = await getCosmicIntel(query, abortController.current.signal);
      setResult(data);
    } catch (err: any) {
      if (err.name === "AbortError") return; // request bị huỷ → không hiển thị lỗi

      console.error(err);
      setErrorMsg("Không thể kết nối với tầng thông tin vũ trụ. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  /** 🔮 ENTER TO SEARCH */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) handleSearch();
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 glass-panel rounded-xl p-6 animate-fade-in">
      <h2 className="text-2xl font-serif text-oracle-gold mb-4 text-center">
        Thông Tin Vũ Trụ (Cosmic Search)
      </h2>

      {/* QUERY INPUT */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:border-oracle-gold outline-none"
          placeholder="Nhập chủ đề tâm linh cần tìm..."
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2 rounded font-bold disabled:opacity-50"
        >
          {loading ? "Đang quét..." : "Tìm Kiếm"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="text-red-400 bg-red-900/20 border border-red-700 rounded p-3 mb-4">
          {errorMsg}
        </div>
      )}

      {/* NO RESULT */}
      {!loading && result === null && (
        <p className="text-sm text-gray-400 text-center">
          Hãy nhập một câu hỏi để kết nối với dòng chảy vũ trụ.
        </p>
      )}

      {/* RESULT SECTION */}
      {result && (
        <div className="space-y-6">
          <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap">
            {result.text}
          </div>

          {/* SOURCES */}
          {result.sources?.length > 0 && (
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">
                Nguồn Tham Chiếu
              </h4>
              <ul className="space-y-2">
                {result.sources.map((source, i) => (
                  <li key={i} className="truncate">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 text-sm hover:underline block"
                    >
                      {source.title || source.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* NO SOURCES */}
          {result.sources?.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              (Không tìm thấy nguồn tham chiếu được trích dẫn.)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CosmicNews;
