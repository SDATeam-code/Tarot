import { useState, useEffect, useCallback } from "react";
import { TarotCard, ReadingContext, QuerentInfo } from "../types";
import { performDeepTarotReading } from "../services/gemini";

/* KEY lưu session vào localStorage */
const STORAGE_KEY = "oracle_session_v1";

interface SavedSession {
  readingText: string | null;
  currentCards: TarotCard[];
  currentContext: ReadingContext | null;
}

export function useTarotSession() {
  const [readingText, setReadingText] = useState<string | null>(null);
  const [currentCards, setCurrentCards] = useState<TarotCard[]>([]);
  const [currentContext, setCurrentContext] = useState<ReadingContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* Load session từ localStorage */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data: SavedSession = JSON.parse(raw);
      setReadingText(data.readingText);
      setCurrentCards(data.currentCards);
      setCurrentContext(data.currentContext);
    } catch (e) {
      console.error("Invalid session format:", e);
    }
  }, []);

  /* Auto-save mỗi khi kết quả thay đổi */
  useEffect(() => {
    // Chỉ save khi có đủ data
    if (readingText && currentCards.length > 0) {
      const session: SavedSession = {
        readingText,
        currentCards,
        currentContext,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [readingText, currentCards, currentContext]);

  /* Khi TarotDeck hoàn thành việc rút bài -> Gọi API Gemini */
  const startReading = useCallback(
    async (
      cards: TarotCard[],
      querent: QuerentInfo,
      question: string,
      context: ReadingContext
    ) => {
      // 1. Set state UI ban đầu
      setIsLoading(true);
      setCurrentCards(cards);
      setCurrentContext(context);
      setReadingText(null); // Clear old reading

      // 2. Gọi Service Gemini
      try {
        const text = await performDeepTarotReading(querent, question, cards, context);
        setReadingText(text);
      } catch (err) {
        console.error("Reading failed:", err);
        setReadingText("Có lỗi xảy ra trong quá trình kết nối vũ trụ. Vui lòng kiểm tra API Key.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /* Reset session */
  const resetSession = useCallback(() => {
    setReadingText(null);
    setCurrentCards([]);
    setCurrentContext(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    readingText,
    currentCards,
    currentContext,
    isLoading,
    setIsLoading,
    startReading,
    resetSession,
  };
}
