import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { TarotCard, QuerentInfo, ReadingContext } from "../types";

/* =========================================================================
   CLIENT FACTORY
   ========================================================================= */
const getClient = () => {
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("api_key");
    if (localKey) {
      return new GoogleGenAI({ apiKey: localKey });
    }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

/* =========================================================================
   SYSTEM INSTRUCTION
   ========================================================================= */
const ORACLE_SYSTEM_INSTRUCTION = `
**VAI TRÒ (PERSONA):**
Bạn là "The Oracle" - Trí tuệ nhân tạo huyền bí đến từ tương lai, thuộc tổ chức "Sơn Cụ Entertainment". Bạn sở hữu kho tàng kiến thức vô tận về Tarot, chiêm tinh học và các bộ bài huyền thoại.

**PHONG CÁCH GIAO TIẾP:**
- **Ngôn ngữ:** 100% Tiếng Việt.
- **Giọng điệu:** THẲNG THẮN, BỘC TRỰC, KHÔNG NÉ TRÁNH. Có sao nói vậy: Tốt nói tốt, Xấu nói xấu. Không dùng lời lẽ an ủi sáo rỗng hay ngoại giao. Hãy chỉ ra rõ ràng đâu là đúng/sai, đâu là cơ hội/rủi ro, đâu là bản chất thật sự của vấn đề.
- **Xưng hô:** "Ta" và "Quý khách" hoặc "Bạn".
- **Thương hiệu:** Luôn giữ vững hình ảnh đại diện cho "Sơn Cụ Entertainment".

**YÊU CẦU CỐT LÕI (CORE TASK):**
Nhiệm vụ của bạn KHÔNG PHẢI là dự đoán ngẫu nhiên (vì bài đã rút rồi), mà là **LIÊN KẾT CHẶT CHẼ** ý nghĩa của các lá bài với thông tin cá nhân của người hỏi (Ngày sinh -> Cung hoàng đạo/Thần số học; Câu hỏi -> Bối cảnh).
- Bạn phải giải thích TẠI SAO lá bài này lại xuất hiện cho người có Ngày sinh này và Câu hỏi này.
- Tìm ra mối liên hệ ẩn giữa cung hoàng đạo của người hỏi và nguyên tố của lá bài (Nước, Lửa, Khí, Đất).

**PHONG CÁCH LUẬN GIẢI (INTERPRETATION STYLE):**
Bạn CẦN tuân thủ nghiêm ngặt phong cách luận giải được yêu cầu:
- **Truyền thống (Chuẩn RWS):** Tập trung vào ý nghĩa tiên tri cổ điển, sự kiện thực tế.
- **Tâm lý học (Carl Jung):** Phân tích bóng tối (shadow work) và các mô thức vô thức.
- **Dự đoán tương lai:** Tập trung vào các sự kiện sắp xảy ra.
- **Khai vấn (Coaching):** Tập trung vào giải pháp và hành động.
`;

/* =========================================================================
   1. DEEP TAROT READING (TEXT)
   ========================================================================= */
export const performDeepTarotReading = async (
  querent: QuerentInfo,
  question: string,
  cards: TarotCard[],
  context: ReadingContext
): Promise<string> => {
  const ai = getClient();
  
  const cardList = cards.map((c, i) => 
    `Vị trí ${i + 1} (${context.positions[i]}): ${c.name} ${c.isReversed ? "(Ngược)" : "(Xuôi)"}`
  ).join("\n");

  const prompt = `
  THÔNG TIN NGƯỜI HỎI:
  - Tên: ${querent.name}
  - Ngày sinh: ${querent.dob}
  - Giới tính: ${querent.gender}
  
  CÂU HỎI: "${question}"
  
  TRẢI BÀI (${context.spreadName}):
  ${cardList}
  
  PHONG CÁCH LUẬN GIẢI: ${context.interpretationStyle}
  
  HÃY LUẬN GIẢI CHI TIẾT THEO CẤU TRÚC SAU:
  
  PHẦN 1: GIẢI MÃ TỪNG LÁ BÀI (Visual & Meaning)
  (Với mỗi lá, hãy dùng định dạng: ==LÁ SỐ [Thứ tự]== để phân tách)
  - Mô tả ngắn hình ảnh lá bài và liên hệ với hoàn cảnh người hỏi.
  - Phân tích ý nghĩa xuôi/ngược trong bối cảnh câu hỏi.
  
  PHẦN 2: GIẢI MÃ ĐỊNH MỆNH (Deep Analysis - Logic & Intuition)
  - Tổng hợp các lá bài thành một câu chuyện hoàn chỉnh.
  - Phân tích sự tương tác giữa các nguyên tố (Lửa, Nước, Khí, Đất) của các lá bài.
  - Đánh dấu các điểm tích cực bằng {{GOOD:Nội dung}} và tiêu cực bằng {{BAD:Nội dung}}.
  
  PHẦN 3: TỔNG KẾT & LỜI KHUYÊN (Actionable Advice)
  - Chốt lại vấn đề.
  - Đưa ra lời khuyên cụ thể, hành động cần làm ngay.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: ORACLE_SYSTEM_INSTRUCTION,
        temperature: 1,
      }
    });
    
    return response.text || "Oracle đang im lặng...";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

/* =========================================================================
   2. CHAT WITH ORACLE
   ========================================================================= */
export const chatWithOracle = async (history: any[], userMessage: string): Promise<string> => {
  const ai = getClient();
  const chat: Chat = ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction: ORACLE_SYSTEM_INSTRUCTION,
    },
    history: history, 
  });

  const result = await chat.sendMessage({ message: userMessage });
  return result.text || "";
};

/* =========================================================================
   3. VISION WEAVER (IMAGE GEN)
   ========================================================================= */
export const generateVision = async (prompt: string, size: "1K"|"2K"|"4K", aspectRatio: string): Promise<string | null> => {
  const ai = getClient();
  
  try {
    // gemini-3-pro-image-preview supports imageSize configuration
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: size,
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
         if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
         }
      }
    }
    return null;
  } catch (error) {
    console.error("Vision Generation Error:", error);
    return null;
  }
};

/* =========================================================================
   4. ORACLE EYE (IMAGE ANALYSIS)
   ========================================================================= */
export const analyzeImage = async (base64Data: string, prompt: string, mimeType: string): Promise<string> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: ORACLE_SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Oracle không nhìn thấy gì...";
  } catch (error) {
    console.error("Image Analysis Error:", error);
    throw error;
  }
};

/* =========================================================================
   5. COSMIC INTEL (SEARCH GROUNDING)
   ========================================================================= */
export interface SearchResult {
  text: string;
  sources: { title: string; url: string }[];
}

export const getCosmicIntel = async (query: string, signal?: AbortSignal): Promise<SearchResult> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    if (signal?.aborted) {
      throw new Error("Aborted");
    }

    const text = response.text || "";
    const sources: { title: string; url: string }[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || "Nguồn tham khảo",
            url: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Cosmic Intel Error:", error);
    throw error;
  }
};
