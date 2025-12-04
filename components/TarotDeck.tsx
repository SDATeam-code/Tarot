import React, { useState, useEffect, useCallback } from 'react';
import { TarotCard, QuerentInfo, ReadingContext } from '../types';

const CARD_BACK_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/d/d4/RWS_Tarot_Back.jpg";

// Reliable Source: Sacred Texts (PKT)
const IMG_BASE = "https://www.sacred-texts.com/tarot/pkt/img";

/* -------------------------------------------------------
   FULL 78 CARD DATA GENERATION (SACRED TEXTS MAPPING)
------------------------------------------------------- */
const generateDeck = () => {
  const cards = [];

  // 1. Major Arcana (ar00 - ar21)
  const majors = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
    "Judgement", "The World"
  ];
  
  majors.forEach((name, i) => {
    const code = `ar${i.toString().padStart(2, '0')}`;
    cards.push({ name, image: `${IMG_BASE}/${code}.jpg` });
  });

  // 2. Minor Arcana
  // Suits: wa (Wands), cu (Cups), sw (Swords), pe (Pentacles)
  const suits = [
    { name: "Wands", code: "wa" },
    { name: "Cups", code: "cu" },
    { name: "Swords", code: "sw" },
    { name: "Pentacles", code: "pe" }
  ];

  // Ranks: ac, 02..10, pa, kn, qu, ki
  const ranks = [
    { name: "Ace", val: "ac" },
    { name: "Two", val: "02" },
    { name: "Three", val: "03" },
    { name: "Four", val: "04" },
    { name: "Five", val: "05" },
    { name: "Six", val: "06" },
    { name: "Seven", val: "07" },
    { name: "Eight", val: "08" },
    { name: "Nine", val: "09" },
    { name: "Ten", val: "10" },
    { name: "Page", val: "pa" },
    { name: "Knight", val: "kn" },
    { name: "Queen", val: "qu" },
    { name: "King", val: "ki" }
  ];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      cards.push({
        name: `${rank.name} of ${suit.name}`,
        image: `${IMG_BASE}/${suit.code}${rank.val}.jpg`
      });
    });
  });

  return cards;
};

const FULL_DECK_DATA = generateDeck();

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */
const LOADING_QUOTES = [
  "Đang kết nối tần số vũ trụ với năng lượng của bạn...",
  "Đang lắng nghe lời thì thầm từ những lá bài...",
  "Đang giải mã tín hiệu từ các vì sao chiếu mệnh...",
  "Oracle đang suy ngẫm về câu hỏi của bạn...",
  "Đang phân tích liên kết giữa Quá Khứ và Tương Lai...",
  "Vũ trụ đang sắp xếp lại những mảnh ghép định mệnh...",
];

const SPREADS = [
  { 
    id: "daily", 
    name: "Thông Điệp Hàng Ngày (1 Lá)", 
    positions: ["Thông Điệp Hôm Nay"] 
  },
  { 
    id: "time", 
    name: "Dòng Chảy Thời Gian (3 Lá)", 
    positions: ["Quá Khứ", "Hiện Tại", "Tương Lai"] 
  },
  {
    id: "finance",
    name: "Tài Chính & Thịnh Vượng (4 Lá)",
    positions: ["Tình hình hiện tại", "Thách thức/Rào cản", "Cơ hội ẩn giấu", "Kết quả tài chính"]
  },
  {
    id: "career",
    name: "Định Hướng Sự Nghiệp (5 Lá)",
    positions: ["Công việc hiện tại", "Nguyện vọng sâu kín", "Yếu tố cản trở", "Lời khuyên hành động", "Kết quả tiềm năng"]
  },
  {
    id: "love",
    name: "Mối Quan Hệ & Tình Cảm (7 Lá)",
    positions: ["Bạn nghĩ gì", "Người đó nghĩ gì", "Tình trạng mối quan hệ", "Thách thức chung", "Yếu tố bên ngoài", "Lời khuyên", "Tương lai mối quan hệ"]
  },
  { 
    id: "celtic", 
    name: "Celtic Cross (10 Lá - Chi Tiết)", 
    positions: ["Hiện Tại", "Thách Thức", "Căn Nguyên (Quá Khứ Xa)", "Quá Khứ Gần", "Đỉnh Cao (Mục Tiêu)", "Tương Lai Gần", "Bản Thân", "Môi Trường", "Hy Vọng/Sợ Hãi", "Kết Quả"] 
  },
];

const INTERPRETATION_STYLES = [
  { id: "traditional", name: "Truyền thống (Rider Waite)", desc: "Dựa trên ý nghĩa tiên tri cổ điển và biểu tượng học." },
  { id: "psychological", name: "Tâm lý học (Carl Jung)", desc: "Phân tích bóng tối (shadow work) và các mô thức vô thức." },
  { id: "predictive", name: "Dự đoán tương lai (Fortune Telling)", desc: "Tập trung vào các sự kiện thực tế sắp xảy ra." },
  { id: "coaching", name: "Khai vấn & Hành động (Coaching)", desc: "Tập trung vào giải pháp, lời khuyên và bước đi tiếp theo." },
  { id: "karmic", name: "Nghiệp quả & Tâm linh", desc: "Phân tích bài học linh hồn và nợ nghiệp cần giải quyết." },
  { id: "love_focus", name: "Chuyên sâu Tình cảm", desc: "Tập trung phân tích cảm xúc và kết nối giữa hai người." },
];

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */
const TarotDeck: React.FC<{
  onReadingComplete: (
    cards: TarotCard[],
    querent: QuerentInfo,
    question: string,
    context: ReadingContext
  ) => void;
  isLoading: boolean;
}> = ({ onReadingComplete, isLoading }) => {
  /* ———————— FORM STATE ———————— */
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Khác");
  const [question, setQuestion] = useState("");

  const [selectedSpread, setSelectedSpread] = useState(SPREADS[1]); // Default to 3 cards
  const [selectedStyle, setSelectedStyle] = useState(INTERPRETATION_STYLES[0]);

  /* ———————— DECK STATE ———————— */
  const [deck, setDeck] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);

  /* ———————— LOADING QUOTES ———————— */
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setQuoteIndex((n) => (n + 1) % LOADING_QUOTES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isLoading]);

  /* -------------------------------------------------------
     SHUFFLE DECK
  ------------------------------------------------------- */
  const shuffleDeck = useCallback(() => {
    const arr = [...FULL_DECK_DATA];
    for (let i = arr.length - 1; i > 0; i--) {
      const r = new Uint32Array(1);
      crypto.getRandomValues(r);
      const j = r[0] % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setDeck(arr);
  }, []);

  /* -------------------------------------------------------
     START READING
  ------------------------------------------------------- */
  const handleStart = useCallback(() => {
    if (!name || !dob || !question) return;
    shuffleDeck();
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [name, dob, question, shuffleDeck]);

  /* -------------------------------------------------------
     DRAW CARD
  ------------------------------------------------------- */
  const drawCard = useCallback(() => {
    if (!deck.length) return;

    const idx = selectedCards.length;
    if (idx >= selectedSpread.positions.length) return;

    const base = deck[idx];
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    const isReversed = (r[0] & 1) === 0;

    const card: TarotCard = {
      id: `${Date.now()}-${idx}`,
      name: base.name,
      image: base.image,
      isReversed,
    };

    const next = [...selectedCards, card];
    setSelectedCards(next);

    if (next.length === selectedSpread.positions.length) {
      const querent: QuerentInfo = { name, dob, gender };
      const context: ReadingContext = {
        spreadName: selectedSpread.name,
        interpretationStyle: selectedStyle.name,
        positions: selectedSpread.positions,
      };

      setTimeout(() => {
        onReadingComplete(next, querent, question, context);
      }, 800);
    }
  }, [
    deck,
    selectedCards,
    selectedSpread,
    selectedStyle,
    name,
    dob,
    gender,
    question,
    onReadingComplete,
  ]);

  /* ===================================================================================
     LOADING UI
  =================================================================================== */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-oracle-gold border-t-transparent rounded-full animate-spin mb-8"></div>
        
        <h2 className="text-xl md:text-2xl text-oracle-gold font-serif mb-4 transition-all duration-500 min-h-[60px]">
          "{LOADING_QUOTES[quoteIndex]}"
        </h2>
        
        {selectedSpread.positions.length >= 7 && (
           <p className="text-sm text-yellow-500/80 mt-2 max-w-md">
             *Lưu ý: Với trải bài lớn ({selectedSpread.positions.length} lá), Oracle cần khoảng 30-45 giây để tổng hợp dữ liệu vũ trụ. Vui lòng kiên nhẫn.
           </p>
        )}
      </div>
    );
  }

  /* ===================================================================================
     STEP 0 — USER INPUT FORM
  =================================================================================== */
  if (step === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 glass-panel rounded-xl mt-6 animate-fade-in">
        <h2 className="text-3xl font-serif text-center text-oracle-gold mb-8">
          Thiết Lập Nghi Thức
        </h2>

        <div className="space-y-6">

          {/* NAME + DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Họ và Tên Quý Khách" value={name} setValue={setName} placeholder="VD: Nguyễn Văn A" />
            <Input type="date" label="Ngày Sinh (Dương Lịch)" value={dob} setValue={setDob} />
          </div>

          {/* GENDER */}
          <Select
            label="Giới tính"
            value={gender}
            setValue={setGender}
            options={["Nam", "Nữ", "Khác"]}
          />

          {/* SPREAD + STYLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
            <Select
              label="Chọn Loại Trải Bài"
              value={selectedSpread.id}
              setValue={(id) => setSelectedSpread(SPREADS.find((s) => s.id === id)!)}
              options={SPREADS.map((s) => ({ value: s.id, label: s.name }))}
            />

            <Select
              label="Phương Pháp Luận Giải"
              value={selectedStyle.id}
              setValue={(id) => setSelectedStyle(INTERPRETATION_STYLES.find((d) => d.id === id)!)}
              options={INTERPRETATION_STYLES.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
             <p className="text-sm text-oracle-gold font-bold mb-1">Mô tả phương pháp:</p>
             <p className="text-xs text-gray-300 italic">{selectedStyle.desc}</p>
          </div>

          {/* QUESTION */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-bold">Câu Hỏi Cho Oracle</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-white focus:border-oracle-gold outline-none h-28 resize-none shadow-inner"
              placeholder="VD: Chuyện tình cảm của tôi trong 3 tháng tới sẽ như thế nào? Tôi nên làm gì để thăng tiến?"
            ></textarea>
          </div>

          {/* START BUTTON */}
          <Button
            disabled={!name || !dob || !question}
            onClick={handleStart}
            label="TIẾN HÀNH RÚT BÀI"
          />
        </div>
      </div>
    );
  }

  /* ===================================================================================
     STEP 1 — DRAWING CARDS
  =================================================================================== */
  const totalCards = selectedSpread.positions.length;
  // Responsive grid columns: 1 for 1 card, 2 for 2-4 cards, 3 for 5-6 cards, 5 for more.
  // Using explicit cols via style for flexibility
  
  return (
    <div className="flex flex-col items-center p-4 pt-8 min-h-screen">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif text-oracle-gold mb-2">{selectedSpread.name}</h2>
        <p className="text-gray-400 italic max-w-2xl mx-auto px-4">"{question}"</p>
      </div>

      <div
        className={`grid gap-4 md:gap-8 justify-center items-start w-full max-w-6xl animate-fade-in`}
        style={{ 
            gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`
        }}
      >
        {selectedCards.map((card, idx) => (
          <CardSlot
            key={card.id}
            card={card}
            label={`${idx + 1}. ${selectedSpread.positions[idx]}`}
          />
        ))}

        {selectedCards.length < totalCards && (
          <DrawButton
            current={selectedCards.length + 1}
            total={totalCards}
            onClick={drawCard}
          />
        )}
      </div>
    </div>
  );
};

export default TarotDeck;

/* -------------------------------------------------------
   SUB-COMPONENTS
------------------------------------------------------- */

const Input = ({ label, value, setValue, type = "text", placeholder = "" }: any) => (
  <div>
    <label className="block text-gray-300 mb-2 text-sm font-bold">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-oracle-gold outline-none transition-colors"
    />
  </div>
);

const Select = ({ label, value, setValue, options }: any) => (
  <div>
    <label className="block text-gray-300 mb-2 text-sm font-bold">{label}</label>
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-oracle-gold outline-none appearance-none"
    >
      {options.map((o: any) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      )}
    </select>
  </div>
);

const Button = ({ label, disabled, onClick }: any) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className="w-full bg-gradient-to-r from-oracle-purple to-indigo-900 py-4 rounded-lg text-white font-bold tracking-widest hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed mt-4 border border-oracle-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all transform hover:-translate-y-1"
  >
    {label}
  </button>
);

const CardSlot = ({ card, label }: any) => (
  <div className="flex flex-col items-center animate-fade-in w-full">
    <div className="relative w-full aspect-[2/3] max-w-[160px] bg-slate-800 rounded-lg shadow-xl hover:scale-105 transition-transform duration-300 group">
        <img
        src={card.image}
        alt={card.name}
        className={`w-full h-full object-fill rounded-lg border border-oracle-gold/40 ${
            card.isReversed ? "rotate-180" : ""
        }`}
        onError={(e) => ((e.target as HTMLImageElement).src = CARD_BACK_IMG)}
        />
        {card.isReversed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="bg-black/80 text-red-500 px-2 py-1 text-xs font-bold rounded border border-red-500 transform -rotate-180 shadow-lg backdrop-blur-sm">
            NGƯỢC
            </span>
        </div>
        )}
    </div>
    <span className="mt-3 text-center text-oracle-gold text-xs font-bold uppercase tracking-wide bg-black/40 px-2 py-1 rounded w-full truncate">
      {label}
    </span>
    <span className="text-gray-300 text-xs mt-1 font-serif italic text-center w-full">{card.name}</span>
  </div>
);

const DrawButton = ({ current, total, onClick }: any) => (
  <div className="flex flex-col items-center w-full">
    <div
        onClick={onClick}
        className="w-full aspect-[2/3] max-w-[160px] rounded-lg bg-cover bg-center cursor-pointer hover:-translate-y-2 transition-transform shadow-[0_0_15px_rgba(255,215,0,0.2)] border-2 border-dashed border-gray-600 flex items-center justify-center hover:border-oracle-gold group relative overflow-hidden"
        style={{ backgroundImage: `url(${CARD_BACK_IMG})` }}
    >
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
        <div className="z-10 bg-black/80 px-4 py-2 rounded-lg text-white text-sm font-bold group-hover:bg-oracle-gold group-hover:text-black transition-colors border border-white/20">
        Rút Bài
        <br />
        <span className="text-xs font-normal opacity-80 block text-center mt-1">
            {current}/{total}
        </span>
        </div>
    </div>
    <span className="mt-3 text-center text-gray-500 text-xs font-bold uppercase tracking-wide px-2 py-1">
      Vị trí tiếp theo
    </span>
  </div>
);