import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithOracle } from '../services/gemini';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  initialContext?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialContext }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  /** 🚀 Scroll xuống cuối mỗi khi có message mới */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** 🚀 Khởi tạo câu chào chỉ 1 lần */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    setMessages([
      {
        id: 'init',
        role: 'model',
        text: 'Nghi thức đã hoàn tất. Bạn có thắc mắc nào về trải bài vừa rồi không?',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  /** 🚀 Build history hợp lệ cho Gemini */
  const buildApiHistory = useCallback(
    (userText: string): any[] => {
      const baseHistory = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // Inject bối cảnh lần đầu tiên
      if (initialContext && messages.length === 1) {
        return [
          {
            role: 'user',
            parts: [
              {
                text:
                  `Đây là kết quả trải bài Tarot vừa nhận:\n\n${initialContext}\n\n` +
                  `Hãy ghi nhớ bối cảnh này để trả lời mọi câu hỏi tiếp theo của tôi.`,
              },
            ],
          },
          {
            role: 'model',
            parts: [{ text: 'Ta đã ghi nhớ định mệnh này. Nói đi.' }],
          },
          ...baseHistory,
          { role: 'user', parts: [{ text: userText }] },
        ];
      }

      // Bình thường: nối tiếp cuộc trò chuyện
      return [...baseHistory, { role: 'user', parts: [{ text: userText }] }];
    },
    [messages, initialContext]
  );

  /** 🚀 Gửi tin nhắn */
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    // Clear input trước khi gọi API
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiHistory = buildApiHistory(userText);
      const aiResponse = await chatWithOracle(apiHistory, userText);

      const aiMsg: ChatMessage = {
        id: `${Date.now()}-ai`,
        role: 'model',
        text: aiResponse,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'model',
          text: 'Kết nối đến cõi hư vô bị gián đoạn. Thử lại nhé.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, buildApiHistory]);

  return (
    <div className="flex flex-col h-[500px] border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50 mt-4 no-print">
      
      {/* HEADER */}
      <div className="p-3 bg-oracle-purple/20 border-b border-white/5 flex items-center gap-2">
        <span className="material-icons text-oracle-gold text-sm">auto_awesome</span>
        <h3 className="text-sm font-bold text-gray-300">Hỏi Thêm Oracle</h3>
      </div>

      {/* MESSAGE AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3 text-sm rounded-xl ${
                msg.role === 'user'
                  ? 'bg-violet-700 text-white rounded-br-none'
                  : 'bg-slate-800 text-gray-200 border border-slate-700 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none border border-slate-700">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Bạn muốn hỏi rõ hơn về lá bài nào?"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:border-oracle-gold outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-oracle-gold text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50 text-sm"
        >
          Gửi
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
