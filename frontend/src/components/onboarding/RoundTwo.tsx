import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

import { vi } from '../../strings/vi';
import QuestionCard from './QuestionCard';

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: { value: string; label: string }[];
}

interface RoundTwoPayload {
  targetRole: string;
  workEnvironment: string;
  timeline: string;
  learningStyle: string;
}

interface RoundTwoProps {
  questions: Question[];
  onSubmit: (data: RoundTwoPayload) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function RoundTwo({ questions, onSubmit, isSubmitting, error }: RoundTwoProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  function handleSelect(questionId: string, value: string, type: 'single' | 'multiple') {
    if (type === 'single') {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      return;
    }

    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const nextValues = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return { ...prev, [questionId]: nextValues };
    });
  }

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((question) => {
      const answer = answers[question.id];
      if (question.type === 'single') {
        return typeof answer === 'string' && answer.length > 0;
      }
      return Array.isArray(answer) && answer.length > 0;
    }),
    [answers, questions],
  );

  function handleSubmit() {
    onSubmit({
      targetRole: String(answers.targetRole ?? ''),
      workEnvironment: String(answers.workEnvironment ?? ''),
      timeline: String(answers.timeline ?? ''),
      learningStyle: String(answers.learningStyle ?? ''),
    });
  }

  return (
    <>
      <div className="round-head">
        <h2>{vi.onboarding.roundTwoTitle}</h2>
        <p>{vi.onboarding.roundTwoSubtitle}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            questionId={question.id}
            questionText={question.question}
            type={question.type}
            options={question.options}
            selectedValues={answers[question.id] ?? (question.type === 'multiple' ? [] : '')}
            onSelect={handleSelect}
            index={index}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error ? (
          <div className="onb-alert" role="alert">
            <span className="ic"><AlertCircle size={16} strokeWidth={2} /></span>
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="onb-btn"
        >
          {isSubmitting ? (
            <>
              <span className="onb-spinner" />
              <span>{vi.onboarding.submitting}</span>
            </>
          ) : (
            <>
              <span>{vi.onboarding.primaryCta}</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </>
          )}
        </button>
      </div>
    </>
  );
}
