import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Onboarding from './Onboarding';
import { renderWithProviders } from '../test/renderWithProviders';
import type { OnboardingStatus } from '../hooks/useOnboardingStatus';
import type { OnboardingQuestion } from '../hooks/useOnboardingQuestions';
import type { OnboardingRecommendation } from '../hooks/useOnboardingRecommendation';

const {
  mockNavigate,
  mockUseOnboardingStatus,
  mockUseOnboardingQuestions,
  mockUseSubmitOnboardingRound,
  mockUseOnboardingRecommendation,
  mockUseConfirmOnboardingPath,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseOnboardingStatus: vi.fn(),
  mockUseOnboardingQuestions: vi.fn(),
  mockUseSubmitOnboardingRound: vi.fn(),
  mockUseOnboardingRecommendation: vi.fn(),
  mockUseConfirmOnboardingPath: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useOnboardingStatus', () => ({
  useOnboardingStatus: mockUseOnboardingStatus,
}));

vi.mock('../hooks/useOnboardingQuestions', () => ({
  useOnboardingQuestions: mockUseOnboardingQuestions,
}));

vi.mock('../hooks/useSubmitOnboardingRound', () => ({
  useSubmitOnboardingRound: mockUseSubmitOnboardingRound,
}));

vi.mock('../hooks/useOnboardingRecommendation', () => ({
  useOnboardingRecommendation: mockUseOnboardingRecommendation,
}));

vi.mock('../hooks/useConfirmOnboardingPath', () => ({
  useConfirmOnboardingPath: mockUseConfirmOnboardingPath,
}));

function createStatus(overrides: Partial<OnboardingStatus> = {}): OnboardingStatus {
  return {
    completedRounds: [],
    nextRound: 1,
    resumeAvailable: false,
    canRequestRecommendation: false,
    hasConfirmedPath: false,
    ...overrides,
  };
}

function createStatusQuery(status: OnboardingStatus) {
  return {
    data: status,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

function createQuestionsQuery(questions: OnboardingQuestion[] = []) {
  return {
    data: questions,
    isLoading: false,
    error: null,
  };
}

function createRecommendationQuery(recommendation: OnboardingRecommendation | null = null) {
  return {
    data: recommendation,
    isLoading: false,
    error: null,
  };
}

function createSubmitMutation() {
  return {
    mutate: vi.fn(),
    isPending: false,
    error: null,
  };
}

function createConfirmMutation() {
  return {
    mutate: vi.fn(),
    isPending: false,
    error: null,
  };
}

const roundOneQuestions: OnboardingQuestion[] = [
  {
    id: 'careerGoal',
    question: 'Bạn muốn theo đuổi hướng nào?',
    type: 'single',
    options: [
      { value: 'frontend', label: 'Frontend' },
      { value: 'backend', label: 'Backend' },
    ],
  },
  {
    id: 'priorKnowledge',
    question: 'Bạn đã từng học gì rồi?',
    type: 'multiple',
    options: [
      { value: 'html', label: 'HTML/CSS' },
      { value: 'js', label: 'JavaScript' },
    ],
  },
  {
    id: 'learningBackground',
    question: 'Nền tảng học tập của bạn là gì?',
    type: 'single',
    options: [
      { value: 'self_taught', label: 'Tự học' },
      { value: 'cs_degree', label: 'Học đại học' },
    ],
  },
  {
    id: 'hoursPerWeek',
    question: 'Bạn có thể học bao nhiêu giờ mỗi tuần?',
    type: 'single',
    options: [
      { value: '10', label: '10 giờ' },
      { value: '20', label: '20 giờ' },
    ],
  },
];

const roundTwoQuestions: OnboardingQuestion[] = [
  {
    id: 'targetRole',
    question: 'Vai trò mục tiêu của bạn là gì?',
    type: 'single',
    options: [
      { value: 'junior', label: 'Junior Developer' },
      { value: 'intern', label: 'Intern' },
    ],
  },
];

const recommendation: OnboardingRecommendation = {
  source: 'ai',
  primaryPath: 'frontend-developer',
  learningPathId: 'path-123',
  alternativePaths: ['fullstack-developer'],
  reason: 'Phù hợp với mục tiêu hiện tại của bạn.',
  focusAreas: ['JavaScript', 'React'],
  tips: ['Ôn lại nền tảng HTML/CSS'],
};

describe('Onboarding', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseOnboardingStatus.mockReset();
    mockUseOnboardingQuestions.mockReset();
    mockUseSubmitOnboardingRound.mockReset();
    mockUseOnboardingRecommendation.mockReset();
    mockUseConfirmOnboardingPath.mockReset();

    mockUseOnboardingStatus.mockReturnValue(createStatusQuery(createStatus()));
    mockUseOnboardingQuestions.mockReturnValue(createQuestionsQuery(roundOneQuestions));
    mockUseSubmitOnboardingRound.mockReturnValue(createSubmitMutation());
    mockUseOnboardingRecommendation.mockReturnValue(createRecommendationQuery());
    mockUseConfirmOnboardingPath.mockReturnValue(createConfirmMutation());
  });

  it('renders ONB-04 resume flow and hides welcome card after continue click', async () => {
    mockUseOnboardingStatus.mockReturnValue(
      createStatusQuery(
        createStatus({
          completedRounds: [1],
          nextRound: 2,
          resumeAvailable: true,
        }),
      ),
    );
    mockUseOnboardingQuestions.mockReturnValue(createQuestionsQuery(roundTwoQuestions));

    const user = userEvent.setup();

    renderWithProviders(<Onboarding />);

    expect(await screen.findByText('Chào mừng bạn quay lại')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    await waitFor(() => {
      expect(screen.queryByText('Chào mừng bạn quay lại')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Định hướng nghề nghiệp')).toBeInTheDocument();
  });

  it('submits round one payload for ONB-05 sequential progression', async () => {
    const submitMutation = createSubmitMutation();
    mockUseSubmitOnboardingRound.mockReturnValue(submitMutation);
    mockUseOnboardingStatus.mockReturnValue(
      createStatusQuery(
        createStatus({
          completedRounds: [],
          nextRound: 1,
          resumeAvailable: false,
        }),
      ),
    );
    mockUseOnboardingQuestions.mockReturnValue(createQuestionsQuery(roundOneQuestions));

    const user = userEvent.setup();

    renderWithProviders(<Onboarding />);

    expect(screen.queryByText('Chào mừng bạn quay lại')).not.toBeInTheDocument();
    expect(screen.getByText('Hồ sơ cơ bản')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /frontend/i }));
    await user.click(screen.getByRole('checkbox', { name: /html\/css/i }));
    await user.click(screen.getByRole('radio', { name: /tự học/i }));
    await user.click(screen.getByRole('radio', { name: /10 giờ/i }));
    await user.click(screen.getByRole('button', { name: /tiếp tục thiết lập/i }));

    expect(submitMutation.mutate).toHaveBeenCalledWith({
      round: 1,
      data: {
        careerGoal: 'frontend',
        priorKnowledge: ['html'],
        learningBackground: 'self_taught',
        hoursPerWeek: 10,
      },
    });
  });

  it('calls confirm mutation for D-17 confirm flow', async () => {
    const confirmMutation = createConfirmMutation();
    mockUseConfirmOnboardingPath.mockReturnValue(confirmMutation);
    mockUseOnboardingStatus.mockReturnValue(
      createStatusQuery(
        createStatus({
          completedRounds: [1, 2, 3],
          nextRound: null,
          canRequestRecommendation: true,
        }),
      ),
    );
    mockUseOnboardingQuestions.mockReturnValue(createQuestionsQuery());
    mockUseOnboardingRecommendation.mockReturnValue(createRecommendationQuery(recommendation));

    const user = userEvent.setup();

    renderWithProviders(<Onboarding />);

    await user.click(screen.getByRole('button', { name: /xác nhận lộ trình/i }));

    expect(confirmMutation.mutate).toHaveBeenCalledWith('path-123');
  });

  it('redirects to dashboard when hasConfirmedPath is true', async () => {
    mockUseOnboardingStatus.mockReturnValue(
      createStatusQuery(
        createStatus({
          completedRounds: [1, 2, 3],
          nextRound: null,
          canRequestRecommendation: true,
          hasConfirmedPath: true,
        }),
      ),
    );
    mockUseOnboardingQuestions.mockReturnValue(createQuestionsQuery());
    mockUseOnboardingRecommendation.mockReturnValue(createRecommendationQuery());

    renderWithProviders(<Onboarding />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
