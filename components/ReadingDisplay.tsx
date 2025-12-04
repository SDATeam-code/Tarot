import React, { useMemo, useCallback } from 'react';
import { TarotCard, ReadingContext } from '../types';
import ChatInterface from './ChatInterface';

interface ReadingDisplayProps {
  readingText: string;
  cards: TarotCard[];
  context: ReadingContext;
  onReset: () => void;
}

const CARD_BACK_IMG = "https://upload.wikimedia.org/wikipedia/commons/d/d4/RWS_Tarot_Back.jpg";

/* ------------------------------------------------------
   1) SAFE SECTION PARSER (Fail-safe)
------------------------------------------------------ */
const extractSection = (text: string, keyword: string, fallbackToAll = false) => {
  if (!text) return "";
  const regex = new RegExp(`${keyword}[\\s\\S]*?(?=(?:PHẦN \\d|###|$))`, 'i');
  const match = text.match(regex);
  if (match) {
    return match[0].replace(keyword, "").trim();
  }
  // If strict section parsing fails and we want fallback (e.g. for Deep Analysis)
  if (fallbackToAll) return text; 
  return "";
};

/* ------------------------------------------------------
   2) GOOD/BAD TAG PARSER
------------------------------------------------------ */
const useStyledText = (text: string) =>
  useMemo(() => {
    if (!text) return text;

    const regex = /{{(GOOD|BAD):(.*?)}}/g;
    let result: React.ReactNode[] = [];
    let last = 0;
    let m;

    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) {
        result.push(text.substring(last, m.index));
      }
      result.push(
        <span
          key={m.index}
          className={
            m[1] === "GOOD"
              ? "text-blue-400 font-bold print:text-blue-700"
              : "text-red-500 font-bold print:text-red-600"
          }
        >
          {m[2]}
        </span>
      );
      last = regex.lastIndex;
    }

    if (last < text.length) result.push(text.slice(last));
    return result;
  }, [text]);

/* ------------------------------------------------------
   3) CARD DESCRIPTION PARSER
------------------------------------------------------ */
const useCardDescriptions = (raw: string, cardCount: number) =>
  useMemo(() => {
    if (!raw) return {};

    // Try standard delimiters first
    let sections = raw.split(/==LÁ SỐ\s+(\d+)==/gi);
    
    // Fallback: If AI forgot == == but used "LÁ SỐ X"
    if (sections.length < 2) {
         sections = raw.split(/LÁ SỐ\s+(\d+)/gi);
    }

    const desc: any = {};

    for (let i = 1; i < sections.length; i += 2) {
      const index = Number(sections[i]) - 1;
      if (index >= 0 && index < cardCount) {
        desc[index] = sections[i + 1].trim();
      }
    }

    return desc;
  }, [raw, cardCount]);

/* ------------------------------------------------------
   COMPONENT: ReadingDisplay
------------------------------------------------------ */
const ReadingDisplay: React.FC<ReadingDisplayProps> = ({
  readingText,
  cards,
  context,
  onReset,
}) => {

  // Parse Sections
  const visualRaw = extractSection(readingText, "PHẦN 1");
  
  // For Deep Analysis (Part 2), if we can't find the header, we assume the model just outputted the analysis directly (Fail-safe)
  // We remove Part 1 and Part 3 if they exist to clean it up, otherwise take everything.
  let deepRaw = extractSection(readingText, "PHẦN 2");
  if (!deepRaw) {
      // Emergency Fallback: Take text that ISN'T Part 1 or Part 3
      let temp = readingText;
      if (visualRaw) temp = temp.replace(visualRaw, "").replace("PHẦN 1", "");
      const part3 = extractSection(readingText, "PHẦN 3");
      if (part3) temp = temp.replace(part3, "").replace("PHẦN 3", "");
      deepRaw = temp.trim();
  }

  const exportRaw = extractSection(readingText, "PHẦN 3");

  const cardDescriptions = useCardDescriptions(visualRaw, cards.length);
  const deepStyled = useStyledText(deepRaw);
  const exportStyled = useStyledText(exportRaw);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="text-center mb-8 border-b border-gray-700 pb-6 print:border-black">
        <h1 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-oracle-gold to-orange-300 print:text-black mb-3">
          {context.spreadName}
        </h1>
        <div className="inline-block bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <p className="text-gray-300 text-sm md:text-base print:text-gray-600 font-sans">
            Phong cách: <span className="text-oracle-gold font-bold">{context.interpretationStyle}</span>
            </p>
        </div>
      </div>

      {/* CARD GRID */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${cards.length > 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3"} gap-6 page-break`}>
        {cards.map((card, idx) => {
          const desc = cardDescriptions[idx];
          const styledDesc = useStyledText(desc || "");

          return (
            <div
              key={card.id}
              className="flex flex-col bg-slate-900/50 p-4 rounded-xl border border-white/10 shadow-lg hover:shadow-oracle-gold/20 transition-all h-full"
            >
              {/* HEADER: POS + NAME */}
              <div className="flex justify-between items-center mb-3 text-xs uppercase font-bold tracking-widest text-gray-400">
                  <span className="bg-black/40 px-2 py-1 rounded text-oracle-gold border border-oracle-gold/20">
                    {idx + 1}. {context.positions[idx]}
                  </span>
                  {card.isReversed ? (
                    <span className="text-red-400">⟳ Ngược</span>
                  ) : (
                    <span className="text-emerald-400">↑ Xuôi</span>
                  )}
              </div>

              {/* IMAGE */}
              <div className="relative w-full aspect-[2/3] mb-4 rounded-lg overflow-hidden border border-white/10 bg-black/40 group">
                <img
                  src={card.image}
                  alt={card.name}
                  className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${card.isReversed ? "rotate-180" : ""}`}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = CARD_BACK_IMG;
                    if (card.isReversed) img.classList.add("rotate-180");
                  }}
                />
              </div>

              {/* NAME */}
              <h3 className="text-center text-lg font-serif text-white print:text-black font-bold mb-3">
                 {card.name}
              </h3>

              {/* DESCRIPTION */}
              <div className="text-sm text-gray-300 print:text-black whitespace-pre-wrap leading-relaxed border-t border-white/10 pt-3 mt-auto">
                {desc ? (
                  styledDesc
                ) : (
                    // Skeleton loader text
                  <div className="space-y-2 animate-pulse">
                    <div className="h-2 bg-slate-700 rounded w-3/4 mx-auto"></div>
                    <div className="h-2 bg-slate-700 rounded w-full"></div>
                    <div className="h-2 bg-slate-700 rounded w-5/6 mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DEEP ANALYSIS */}
      <div className="glass-panel p-6 md:p-10 rounded-2xl border border-oracle-gold/20 shadow-2xl print:border-black print:p-0 print:shadow-none page-break">
        <h3 className="text-2xl font-serif text-oracle-gold mb-8 uppercase tracking-widest text-center border-b border-gray-700 pb-4 print:text-black print:border-black flex items-center justify-center gap-3">
          <span className="material-icons text-3xl">auto_awesome</span>
          Giải Mã Định Mệnh
        </h3>

        <div className="prose prose-invert prose-lg max-w-none text-gray-200 whitespace-pre-wrap leading-loose print:text-black text-justify font-serif">
          {deepRaw ? (
            deepStyled
          ) : (
             <div className="p-4 border border-red-500/50 bg-red-900/10 rounded text-center text-red-200">
                Không có dữ liệu phân tích. Vui lòng thử lại.
             </div>
          )}
        </div>
      </div>

      {/* EXPORT SECTION */}
      {exportRaw && (
        <div className="glass-panel p-6 rounded-lg border-l-4 border-emerald-500 print:border-l-0 print:p-0 page-break">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 uppercase tracking-widest print:text-black border-b border-emerald-500/30 pb-2 font-sans">
            Tổng Kết & Lời Khuyên
          </h3>

          <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap font-sans text-sm bg-black/30 p-4 rounded print:bg-transparent print:text-black print:p-0">
            {exportStyled}
          </div>
        </div>
      )}

      {/* CHAT + BUTTONS */}
      <div className="no-print space-y-8 pt-8 border-t border-gray-700">
        <ChatInterface initialContext={readingText} />

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handlePrint}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold flex items-center gap-2 transition-all border border-gray-600 hover:border-white shadow-lg"
          >
            Lưu PDF
          </button>

          <button
            onClick={onReset}
            className="px-8 py-3 bg-gradient-to-r from-oracle-gold to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-900 rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,215,0,0.4)] transform hover:scale-105"
          >
            Trải Bài Mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadingDisplay;
