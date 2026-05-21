import { Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface QuestionCardProps {
  questionId: string;
  questionText: string;
  type: 'single' | 'multiple';
  options: Option[];
  selectedValues: string | string[];
  onSelect: (questionId: string, value: string, type: 'single' | 'multiple') => void;
  index: number;
}

function isOptionSelected(selectedValues: string | string[], value: string) {
  if (Array.isArray(selectedValues)) {
    return selectedValues.includes(value);
  }
  return selectedValues === value;
}

export default function QuestionCard({
  questionId,
  questionText,
  type,
  options,
  selectedValues,
  onSelect,
  index,
}: QuestionCardProps) {
  const isMulti = type === 'multiple';

  return (
    <div className="q-card">
      <div className="q-prompt">
        <span className="q-num">{String(index + 1).padStart(2, '0')}.</span>
        <p className="q-text">{questionText}</p>
      </div>

      <div className="q-options" role="group" aria-label={questionText}>
        {options.map((option) => {
          const selected = isOptionSelected(selectedValues, option.value);
          return (
            <button
              key={option.value}
              type="button"
              role={isMulti ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => onSelect(questionId, option.value, type)}
              className={`opt${selected ? ' selected' : ''}`}
            >
              <span className="opt-label">{option.label}</span>
              {isMulti ? (
                <span className={`opt-indicator check${selected ? ' selected' : ''}`} aria-hidden="true">
                  {selected ? <Check size={12} strokeWidth={2.6} /> : null}
                </span>
              ) : (
                <span className="opt-indicator" aria-hidden="true">
                  {selected ? <span className="opt-indicator-fill" /> : null}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
