import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz, type QuizOption } from '../hooks/useQuiz';
import { useQuizSubmit, type GradedAnswer } from '../hooks/useQuizSubmit';
import { vi } from '../strings/vi';
import { Skeleton } from '../components/feedback/Skeleton';

export default function Quiz() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const { data: quiz, isLoading, error } = useQuiz(slug);
  const submitMutation = useQuizSubmit(slug);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  function handleSelect(questionId: string, optionId: string, questionType: string) {
    setAnswers((prev) => {
      if (questionType === 'SINGLE_CHOICE') {
        return { ...prev, [questionId]: [optionId] };
      }

      const current = prev[questionId] ?? [];
      const exists = current.includes(optionId);
      return {
        ...prev,
        [questionId]: exists
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  }

  function handleSubmit() {
    if (!slug) return;
    submitMutation.mutate(answers);
  }

  function handleRetry() {
    setAnswers({});
    submitMutation.reset();
  }

  const result = submitMutation.data;
  const questions = quiz != null && Array.isArray(quiz.questions) ? quiz.questions : [];
  const allAnswered =
    quiz != null &&
    questions.length > 0 &&
    questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
          <Skeleton className="h-4 w-32 bg-white/20" />
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 space-y-3">
            <Skeleton className="h-6 w-2/3 bg-white/20" />
            <Skeleton className="h-4 w-1/3 bg-white/20" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-5 space-y-3">
              <Skeleton className="h-5 w-4/5 bg-white/20" />
              <Skeleton className="h-4 w-16 bg-white/20" />
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-12 w-full rounded-xl bg-white/20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const status = (error as { response?: { status?: number } } | null)?.response?.status;

  if (error && !quiz) {
    const message =
      status === 404
        ? vi.quiz.notFound
        : status === 403
          ? vi.quiz.noAccess
          : vi.quiz.genericError;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <button
            onClick={() => navigate(`/lesson/${slug}`)}
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            ← {vi.quiz.backToLesson}
          </button>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center space-y-4">
            <p className="text-4xl">😕</p>
            <p className="text-white/80">{message}</p>
            <button
              onClick={() => navigate(`/lesson/${slug}`)}
              className="bg-white text-purple-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors hover:bg-white/90"
            >
              {vi.quiz.backToLessonButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  function getGradedAnswer(questionId: string): GradedAnswer | undefined {
    return result?.answers.find((a) => a.questionId === questionId);
  }

  const passRequired = vi.quiz.passRequired.replace('{threshold}', String(quiz.passThreshold));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/lesson/${slug}`)}
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            ← {vi.quiz.backToLesson}
          </button>
          {!result && (
            <span className="text-xs text-white/70 bg-white/20 px-2.5 py-1 rounded-full">
              {passRequired}
            </span>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">📝 {quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm text-white/70 mt-2">{quiz.description}</p>
          )}
          {!result && (
            <p className="text-xs text-white/50 mt-3">
              {questions.length} {vi.quiz.questionsUnit} • {vi.quiz.instructions}
            </p>
          )}
        </div>

        {result && (
          <div
            className={`bg-white/10 backdrop-blur-xl border rounded-2xl p-6 text-center space-y-2 ${
              result.passed
                ? 'border-green-400/40 bg-green-400/10'
                : 'border-red-400/40 bg-red-400/10'
            }`}
          >
            <p className="text-3xl">{result.passed ? '🎉' : '💪'}</p>
            <p className="text-lg font-bold text-white">
              {vi.quiz.score} {result.score}/100
              {result.passed ? ` — ${vi.quiz.resultPassed}` : ` — ${vi.quiz.resultFailed}`}
            </p>
            <p className="text-sm text-white/70">
              {result.correctCount}/{result.totalQuestions} {vi.quiz.correctCount}
              {!result.passed && ` • ${vi.quiz.passThreshold.replace('{threshold}', String(result.passThreshold))}`}
            </p>
          </div>
        )}

        {questions.length === 0 && !result && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center space-y-3">
            <p className="text-3xl">⚠️</p>
            <p className="text-white/80 text-sm">{vi.quiz.noQuestions}</p>
            <button
              onClick={() => navigate(`/lesson/${slug}`)}
              className="bg-white text-purple-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors hover:bg-white/90"
            >
              {vi.quiz.backToLessonButton}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => {
            const graded = getGradedAnswer(question.id);
            const isCorrect = graded?.isCorrect;
            const selectedIds = result ? graded?.selected ?? [] : answers[question.id] ?? [];

            return (
              <div
                key={question.id}
                className={`bg-white/10 backdrop-blur-xl border rounded-2xl p-5 space-y-3 transition-all ${
                  graded
                    ? isCorrect
                      ? 'border-green-400/40'
                      : 'border-red-400/40'
                    : 'border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white leading-relaxed">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold mr-2 flex-shrink-0">
                      {index + 1}
                    </span>
                    {question.questionText}
                  </h3>
                  {graded && (
                    <span className="flex-shrink-0 text-lg">{isCorrect ? '✅' : '❌'}</span>
                  )}
                </div>

                <span className="inline-block text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
                  {question.questionType === 'SINGLE_CHOICE'
                    ? vi.quiz.singleChoice
                    : vi.quiz.multipleChoice}
                </span>

                <div className="space-y-2">
                  {(Array.isArray(question.options) ? (question.options as QuizOption[]) : []).map((option) => {
                    const isSelected = selectedIds.includes(option.id);
                    const isCorrectOption = graded?.correct.includes(option.id);
                    const isSingle = question.questionType === 'SINGLE_CHOICE';

                    let optionStyle = 'border-white/20 hover:border-white/40 hover:bg-white/10';
                    if (result) {
                      if (isCorrectOption && isSelected) {
                        optionStyle = 'border-green-400/40 bg-green-400/20';
                      } else if (isSelected && !isCorrectOption) {
                        optionStyle = 'border-red-400/40 bg-red-400/20';
                      } else if (isCorrectOption) {
                        optionStyle = 'border-green-400/40 bg-green-400/10';
                      } else {
                        optionStyle = 'border-white/10 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-white/40 bg-white/30';
                    }

                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${optionStyle} ${
                          result ? 'cursor-default' : ''
                        }`}
                      >
                        <input
                          type={isSingle ? 'radio' : 'checkbox'}
                          name={`question-${question.id}`}
                          checked={isSelected}
                          onChange={() => {
                            if (!result) {
                              handleSelect(question.id, option.id, question.questionType);
                            }
                          }}
                          disabled={!!result}
                          className="sr-only"
                        />
                        <span
                          className={`flex-shrink-0 w-5 h-5 ${isSingle ? 'rounded-full' : 'rounded'} border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? result
                                ? isCorrectOption
                                  ? 'border-green-400 bg-green-400'
                                  : 'border-red-400 bg-red-400'
                                : 'border-white bg-white/80'
                              : 'border-white/40'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>
                        <span className={`text-sm ${isSelected && !result ? 'text-white font-medium' : 'text-white/80'}`}>
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {graded?.explanation && (
                  <div
                    className={`mt-2 p-3 rounded-xl text-sm leading-relaxed border ${
                      isCorrect
                        ? 'bg-green-400/10 text-white border-green-400/30'
                        : 'bg-amber-400/10 text-white border-amber-400/30'
                    }`}
                  >
                    <span className="font-medium">💡 {vi.quiz.explanation}</span> {graded.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {submitMutation.isError && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
            <p className="text-sm text-white">{vi.quiz.submitError}</p>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              className="w-full bg-white text-purple-700 font-semibold text-sm py-3 rounded-xl transition-colors hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending
                ? vi.quiz.submitting
                : !allAnswered
                  ? `${vi.quiz.answerProgress} (${Object.keys(answers).length}/${questions.length})`
                  : `${vi.quiz.submitButton} ✓`}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-white/10 border border-white/20 text-white text-sm font-medium py-3 rounded-xl transition-colors hover:bg-white/20"
              >
                🔄 {vi.quiz.retryButton}
              </button>
              <button
                onClick={() => navigate(`/lesson/${slug}`)}
                className="flex-1 bg-white text-purple-700 font-semibold text-sm py-3 rounded-xl transition-colors hover:bg-white/90"
              >
                {vi.quiz.backToLessonButton}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
