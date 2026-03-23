import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { vi } from '../strings/vi';

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
  'frontend-developer': vi.onboarding.pathNames.frontendDeveloper,
  'backend-developer': vi.onboarding.pathNames.backendDeveloper,
  'fullstack-developer': vi.onboarding.pathNames.fullstackDeveloper,
  'ai-python': vi.onboarding.pathNames.aiPython,
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
      .catch(() => setError(vi.onboarding.loadError));
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
      const recData = recRes.data.data;
      if (recData) {
        setRecommendation(recData);
        setStep('recommendation');
      } else {
        setError(vi.onboarding.noRecommendation);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? vi.onboarding.genericError;
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
      <div
        className="min-h-screen py-10 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d0a1a 0%, #1a0e2e 30%, #12101f 60%, #0a0a18 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: 'radial-gradient(circle, #8E37D7, transparent)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #4facfe, transparent)' }} />

        <div className="relative z-10 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">{vi.onboarding.title}</h1>
          <p className="text-white/40 text-sm mb-8">{vi.onboarding.subtitle.replace('{count}', String(questions.length))}</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm mb-4 backdrop-blur-sm">{error}</div>
          )}

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg shadow-black/20 p-5">
                <p className="font-medium mb-3 text-white/90">
                  <span className="text-purple-400/70 mr-2">{idx + 1}.</span>{q.question}
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
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                          selected
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] text-white/60'
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
            className="mt-8 w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? vi.onboarding.submitting : `${vi.onboarding.submitButton} →`}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Recommendation ────────────────────────────────────────────────
  if (step === 'recommendation' && recommendation) {
    const pathDisplayName = PATH_NAMES[recommendation.primaryPath] ?? recommendation.primaryPath;
    return (
      <div
        className="min-h-screen py-10 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d0a1a 0%, #1a0e2e 30%, #12101f 60%, #0a0a18 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-[-10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: 'radial-gradient(circle, #8E37D7, transparent)' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #4facfe, transparent)' }} />

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">{vi.onboarding.recommendationTitle}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-sm border ${
              recommendation.source === 'ai'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            }`}>
              {recommendation.source === 'ai' ? vi.onboarding.aiSource : vi.onboarding.fallbackSource}
            </span>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg shadow-black/20 p-6 mb-4">
            <h2 className="font-semibold text-lg mb-1 text-white/90">{pathDisplayName}</h2>
            <p className="text-white/40 text-sm mb-4">{recommendation.reason}</p>

            {recommendation.alternativePaths.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white/50 mb-2">{vi.onboarding.alternativePaths}</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.alternativePaths.map((slug) => (
                    <span key={slug} className="bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs px-2.5 py-1 rounded-full">
                      {PATH_NAMES[slug] ?? slug}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recommendation.focusAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-white/50 mb-2">{vi.onboarding.focusAreas}</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.focusAreas.map((topic) => (
                    <span key={topic} className="bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs px-2.5 py-1 rounded-full">{topic}</span>
                  ))}
                </div>
              </div>
            )}

            {recommendation.tips.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-white/50 mb-2">{vi.onboarding.studyTips}</p>
                <ul className="list-disc list-inside space-y-1">
                  {recommendation.tips.map((tip) => (
                    <li key={tip} className="text-sm text-white/50">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            {`${vi.onboarding.confirmButton} →`}
          </button>
        </div>
      </div>
    );
  }

  // Fallback: đang loading hoặc recommendation chưa ready
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0a1a 0%, #1a0e2e 30%, #12101f 60%, #0a0a18 100%)' }}
    >
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full opacity-15 blur-[100px]" style={{ background: 'radial-gradient(circle, #8E37D7, transparent)' }} />
      <div className="relative z-10 text-center">
        <div className="inline-block w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-4" />
        <p className="text-white/40">{vi.onboarding.loading}</p>
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
