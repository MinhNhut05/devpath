import { useMemo, useState } from 'react';

import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import QuestionCard from './QuestionCard';

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: { value: string; label: string }[];
}

interface RoundOnePayload {
  careerGoal: string;
  priorKnowledge: string[];
  learningBackground: string;
  hoursPerWeek: number;
}

interface RoundOneProps {
  questions: Question[];
  onSubmit: (data: RoundOnePayload) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function RoundOne({ questions, onSubmit, isSubmitting, error }: RoundOneProps) {
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

      return {
        ...prev,
        [questionId]: nextValues,
      };
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
      careerGoal: String(answers.careerGoal ?? ''),
      priorKnowledge: Array.isArray(answers.priorKnowledge) ? answers.priorKnowledge : [],
      learningBackground: String(answers.learningBackground ?? ''),
      hoursPerWeek: parseInt(String(answers.hoursPerWeek ?? '0'), 10),
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white/90">Hồ sơ cơ bản</h2>
        <p className="mt-2 text-sm text-white/50">Cho chúng tôi biết về bạn để bắt đầu lộ trình phù hợp.</p>
      </div>

      <div className="space-y-6">
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

      <div className="mt-8">
        {error ? (
          <Alert className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 disabled:opacity-40"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục thiết lập →'}
        </Button>
      </div>
    </div>
  );
}
