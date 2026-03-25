import { Check, Circle } from 'lucide-react';

import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '../../lib/utils';

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
  return (
    <Card className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="p-6">
        <div role="group" aria-label={questionText} className="space-y-4">
          <p className="text-base font-medium text-white/90">
            <span className="mr-2 text-purple-400/70">{index + 1}.</span>
            {questionText}
          </p>

          {type === 'single' ? (
            <RadioGroup className="space-y-2">
              {options.map((option) => {
                const selected = isOptionSelected(selectedValues, option.value);
                const optionId = `${questionId}-${option.value}`;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelect(questionId, option.value, type)}
                    className={cn(
                      'flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-base ease-smooth',
                      selected
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12]',
                    )}
                  >
                    <RadioGroupItem
                      id={optionId}
                      checked={selected}
                      onChange={() => onSelect(questionId, option.value, type)}
                      className="pointer-events-none"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <Label htmlFor={optionId} className={cn('flex-1 cursor-pointer leading-6', selected ? 'text-purple-200' : 'text-inherit')}>
                      {option.label}
                    </Label>
                    <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
                      {selected ? <Circle className="h-4 w-4 fill-current text-purple-200" /> : <Circle className="h-4 w-4 text-white/30" />}
                    </span>
                  </button>
                );
              })}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              {options.map((option) => {
                const selected = isOptionSelected(selectedValues, option.value);
                const optionId = `${questionId}-${option.value}`;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => onSelect(questionId, option.value, type)}
                    className={cn(
                      'flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-base ease-smooth',
                      selected
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12]',
                    )}
                  >
                    <Checkbox
                      id={optionId}
                      checked={selected}
                      onChange={() => onSelect(questionId, option.value, type)}
                      className="pointer-events-none"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <Label htmlFor={optionId} className={cn('flex-1 cursor-pointer leading-6', selected ? 'text-purple-200' : 'text-inherit')}>
                      {option.label}
                    </Label>
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                        selected ? 'border-purple-400/60 bg-purple-500/20 text-purple-200' : 'border-white/10 bg-transparent text-transparent',
                      )}
                      aria-hidden="true"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
