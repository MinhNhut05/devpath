import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Option {
  value: string;
  label: string;
}
interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: Option[];
}
interface Recommendation {
  source: 'ai' | 'fallback';
  primaryPath: string;
  alternativePaths: string[];
  reason: string;
  focusAreas: string[];
  tips: string[];
}

// Mapping slug → display name (vì backend trả về slug, cần hiển thị tên đẹp cho user)
const PATH_NAMES: Record<string, string> = {
  'frontend-developer': 'Frontend Developer',
  'backend-developer': 'Backend Developer',
  'fullstack-developer': 'Fullstack Developer',
  'ai-python': 'AI / Data Science (Python)',
};

type Step = 'questions' | 'recommendation' | 'done';

// Onboarding flow: 4 câu hỏi → submit → xem AI recommendation → confirm
export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load câu hỏi khi mount
  useEffect(() => {
    api.get('/onboarding/questions')
      .then((res) => setQuestions(res.data.data))
      .catch(() => setError('Không tải được câu hỏi'));
  }, []);

  // Xử lý chọn đáp án
  function handleSelect(questionId: string, value: string, type: 'single' | 'multiple') {
    if (type === 'single') {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    } else {
      setAnswers((prev) => {
        const current = (prev[questionId] as string[]) ?? [];
        const exists = current.includes(value);
        return {
          ...prev,
          [questionId]: exists ? current.filter((v) => v !== value) : [...current, value],
        };
      });
    }
  }

  // Submit onboarding answers
  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      // Build payload đúng với SubmitOnboardingDto
      const payload = {
        careerGoal: answers['careerGoal'] as string,
        priorKnowledge: (answers['priorKnowledge'] as string[]) ?? [],
        learningBackground: answers['learningBackground'] as string,
        hoursPerWeek: parseInt(answers['hoursPerWeek'] as string),
      };
      await api.post('/onboarding/submit', payload);

      // Sau khi submit → lấy recommendation
      const recRes = await api.get('/onboarding/recommendation');
      setRecommendation(recRes.data.data);
      setStep('recommendation');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Confirm path (bỏ qua nếu chưa có learning path trong DB)
  async function handleConfirm() {
    navigate('/dashboard');
  }

  // Kiểm tra đã trả lời đủ chưa
  const allAnswered = questions.every((q) => {
    const ans = answers[q.id];
    if (q.type === 'single') return !!ans;
    return Array.isArray(ans) && ans.length > 0;
  });

  // ── Render: Questions ─────────────────────────────────────────────────────
  if (step === 'questions') {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Thiết lập hành trình học</h1>
          <p className="text-gray-500 text-sm mb-8">Trả lời {questions.length} câu hỏi để AI gợi ý lộ trình phù hợp</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 text-sm mb-4">{error}</div>
          )}

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm p-5">
                <p className="font-medium mb-3">
                  <span className="text-blue-600 mr-2">{idx + 1}.</span>{q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected =
                      q.type === 'single'
                        ? answers[q.id] === opt.value
                        : ((answers[q.id] as string[]) ?? []).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(q.id, opt.value, q.type)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 hover:border-blue-400 text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl disabled:opacity-40"
          >
            {loading ? 'Đang xử lý...' : 'Xem gợi ý của AI →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Recommendation ────────────────────────────────────────────────
  if (step === 'recommendation' && recommendation) {
    const pathDisplayName = PATH_NAMES[recommendation.primaryPath] ?? recommendation.primaryPath;
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold">Gợi ý của AI</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              recommendation.source === 'ai'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {recommendation.source === 'ai' ? '✨ AI' : '📋 Fallback'}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 className="font-semibold text-lg mb-1">{pathDisplayName}</h2>
            <p className="text-gray-500 text-sm mb-4">{recommendation.reason}</p>

            {recommendation.alternativePaths.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Lộ trình thay thế:</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.alternativePaths.map((slug) => (
                    <span key={slug} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {PATH_NAMES[slug] ?? slug}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recommendation.focusAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Chủ đề cần tập trung:</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.focusAreas.map((topic) => (
                    <span key={topic} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">{topic}</span>
                  ))}
                </div>
              </div>
            )}

            {recommendation.tips.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Mẹo học tập:</p>
                <ul className="list-disc list-inside space-y-1">
                  {recommendation.tips.map((tip) => (
                    <li key={tip} className="text-sm text-gray-600">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
          >
            Bắt đầu học →
          </button>
        </div>
      </div>
    );
  }

  return null;
}
