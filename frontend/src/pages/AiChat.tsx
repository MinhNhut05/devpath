import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, Send } from 'lucide-react';
import api from '../services/api';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface Quota {
  used: number;
  limit: number;
  remaining: number;
  tier: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);   // initial load
  const [sending, setSending] = useState(false);   // khi gửi message
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Mount: load quota + history ────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/ai/quota'),
      api.get('/ai/chat/history?limit=20&offset=0'),
    ])
      .then(([quotaRes, historyRes]) => {
        setQuota(quotaRes.data.data);
        // Backend trả về { items: [...] } với fields: questionSummary, responseSummary
        // Cần transform sang Message format { role, content }
        const items = historyRes.data.data.items ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const historyMessages: Message[] = items.flatMap((item: any) => [
          { id: item.id + '-q', role: 'user' as const, content: item.questionSummary, createdAt: item.createdAt },
          { id: item.id + '-a', role: 'assistant' as const, content: item.responseSummary, createdAt: item.createdAt },
        ]);
        // Backend trả về desc (mới nhất trước) → reverse để hiển thị đúng thứ tự
        setMessages(historyMessages.reverse());
      })
      .catch(() => setError('Không tải được dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Auto-scroll xuống cuối mỗi khi messages / sending thay đổi ─────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // ── Gửi message ────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!input.trim() || sending || quota?.remaining === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const res = await api.post('/ai/chat', { message: userMsg.content });
      // Backend trả về: { message: string, model: string, context: string }
      // Nếu AI lỗi: { message: string, model: null, fallback: true }
      const aiReply = res.data.data;
      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: aiReply.message ?? aiReply.reply ?? 'Không có phản hồi',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      // Cập nhật quota locally sau mỗi lần gửi thành công
      setQuota((prev) =>
        prev ? { ...prev, remaining: prev.remaining - 1, used: prev.used + 1 } : prev
      );
    } catch {
      setError('Gửi thất bại. Thử lại nhé!');
    } finally {
      setSending(false);
    }
  }

  // ── Enter gửi, Shift+Enter xuống dòng ──────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Format giờ từ ISO string ────────────────────────────────────────────────
  function formatTime(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">Đang tải...</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        {/* Nút quay lại */}
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        {/* Tiêu đề */}
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-purple-600" />
          <span className="font-semibold text-gray-800">Trợ lý AI</span>
        </div>

        {/* Quota badge */}
        {quota !== null && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
            {quota.remaining} câu còn lại
          </span>
        )}
      </header>

      {/* ── Quota-exhausted banner ───────────────────────────────────────────── */}
      {quota?.remaining === 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 text-center text-sm text-yellow-700 shrink-0">
          ⚠️ Bạn đã dùng hết quota hôm nay. Quay lại vào ngày mai nhé!
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm text-red-600 shrink-0">
          {error}
        </div>
      )}

      {/* ── Messages area (scrollable) ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Empty state — chưa có tin nhắn nào */}
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <Bot size={28} className="text-purple-600" />
            </div>
            <p className="font-semibold text-gray-700">Xin chào! Mình có thể giúp gì cho bạn?</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Hỏi bất kỳ câu hỏi nào về lập trình, lộ trình học, hoặc bài tập nhé.
            </p>
          </div>
        )}

        {/* Danh sách tin nhắn */}
        {messages.map((msg) =>
          msg.role === 'user' ? (
            // ── User bubble (phải) ──
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[80%]">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-none px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.createdAt && (
                  <p className="text-xs text-gray-400 mt-1 text-right">{formatTime(msg.createdAt)}</p>
                )}
              </div>
            </div>
          ) : (
            // ── AI bubble (trái) ──
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">{formatTime(msg.createdAt)}</p>
                )}
              </div>
            </div>
          )
        )}

        {/* Typing indicator — AI đang trả lời */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <span className="text-gray-500 text-sm">AI đang suy nghĩ</span>
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {/* Anchor để auto-scroll tới đây */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area (cố định dưới) ────────────────────────────────────────── */}
      <div className="bg-white border-t px-4 py-3 shrink-0">
        <div className="flex gap-2 max-w-xl mx-auto">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              quota?.remaining === 0
                ? 'Đã hết quota hôm nay...'
                : 'Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)'
            }
            disabled={quota?.remaining === 0 || sending}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
              placeholder:text-gray-400"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || quota?.remaining === 0}
            className="flex items-center justify-center w-10 h-10 mt-0.5 bg-purple-600 hover:bg-purple-700
              text-white rounded-xl transition-colors shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Gửi"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Hint text */}
        <p className="text-center text-xs text-gray-400 mt-1.5">
          AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
        </p>
      </div>

    </div>
  );
}
