import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Zap,
  BookOpen,
  ArrowRight,
  Trophy,
  MessageSquare,
  Compass,
  Clock,
  CheckCircle2,
  Star,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useDashboard } from '../hooks/useDashboard';
import { vi } from '../strings/vi';
import { PageError } from '../components/feedback/PageError';
import { PageEmpty } from '../components/feedback/PageEmpty';

const mockUser = {
  xp: 2450,
  level: 12,
  xpToNext: 3000,
};

const mockLeaderboard = [
  { rank: 1, name: 'Minh Tuan', xp: 5200, isYou: false },
  { rank: 2, name: 'Thanh Ha', xp: 4800, isYou: false },
  { rank: 3, name: 'Duc Anh', xp: 3900, isYou: false },
  { rank: 4, name: 'Leminho', xp: 2450, isYou: true },
  { rank: 5, name: 'Hong Nhi', xp: 2100, isYou: false },
];

const mockActivity = [
  {
    icon: CheckCircle2,
    text: vi.dashboard.activityCompletedReactState,
    time: vi.dashboard.timeTwoHoursAgo,
    color: 'text-dp-success',
  },
  {
    icon: Star,
    text: vi.dashboard.activityScoredJavascriptQuiz,
    time: vi.dashboard.timeFiveHoursAgo,
    color: 'text-dp-xp',
  },
  {
    icon: Flame,
    text: vi.dashboard.activitySevenDayStreak,
    time: vi.dashboard.timeOneDayAgo,
    color: 'text-dp-streak',
  },
  {
    icon: BookOpen,
    text: vi.dashboard.activityStartedReactHooks,
    time: vi.dashboard.timeOneDayAgo,
    color: 'text-dp-primary',
  },
];

const mockBadges = [
  {
    name: 'First Step',
    icon: '🚀',
    desc: vi.dashboard.badgeFirstStepDesc,
  },
  {
    name: '7-Day Streak',
    icon: '🔥',
    desc: vi.dashboard.badgeSevenDayStreakDesc,
  },
  {
    name: 'Quiz Master',
    icon: '🏆',
    desc: vi.dashboard.badgeQuizMasterDesc,
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bento-card lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl-dp bg-dp-glass-bg" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-dp-glass-bg rounded-lg-dp w-2/3" />
              <div className="h-4 bg-dp-glass-bg rounded-lg-dp w-1/3" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 bg-dp-glass-bg rounded-lg-dp w-1/4" />
            <div className="h-2 bg-dp-glass-bg rounded-full w-full" />
          </div>
        </div>
        <div className="bento-card flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-dp-glass-bg mb-3" />
          <div className="h-8 bg-dp-glass-bg rounded-lg-dp w-12 mb-2" />
          <div className="h-3 bg-dp-glass-bg rounded-lg-dp w-20" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bento-card lg:col-span-2 space-y-4">
          <div className="h-5 bg-dp-glass-bg rounded-lg-dp w-1/3" />
          <div className="h-4 bg-dp-glass-bg rounded-lg-dp w-2/3" />
          <div className="h-2 bg-dp-glass-bg rounded-full w-full" />
          <div className="h-11 bg-dp-glass-bg rounded-xl-dp w-full" />
        </div>
        <div className="bento-card space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-dp-glass-bg rounded-lg-dp" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bento-card space-y-3">
            <div className="h-5 bg-dp-glass-bg rounded-lg-dp w-1/2" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 bg-dp-glass-bg rounded-lg-dp" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const authUser = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <PageError message={vi.dashboard.loadError} onRetry={() => refetch()} />;
  }

  const displayName = data?.user?.displayName || authUser?.displayName || vi.dashboard.defaultName;
  const avatarUrl = data?.user?.avatarUrl;
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const currentStreak = data?.recentActivity?.currentStreak ?? 0;
  const currentPath = data?.enrolledPaths?.[0] ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? vi.dashboard.greetingMorning
      : hour < 18
        ? vi.dashboard.greetingAfternoon
        : vi.dashboard.greetingEvening;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard"
        className="space-y-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="bento-card lg:col-span-2">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-14 h-14 rounded-xl-dp object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl-dp bg-gradient-to-br from-dp-primary to-dp-secondary flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {avatarLetter}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-h3 text-dp-text-primary truncate">
                  {greeting}, <span className="gradient-text">{displayName}</span>!
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="badge badge-streak">
                    <Flame size={12} />
                    {currentStreak} {vi.dashboard.streakDays}
                  </span>
                  <span className="badge badge-xp">
                    <Zap size={12} />
                    {mockUser.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-caption text-dp-text-muted mb-1.5">
                <span>
                  {vi.dashboard.levelCurrent} {mockUser.level}
                </span>
                <span>
                  {mockUser.xp.toLocaleString()} / {mockUser.xpToNext.toLocaleString()} XP
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill progress-fill-xp h-full rounded-full"
                  style={{ width: `${(mockUser.xp / mockUser.xpToNext) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="bento-card flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-dp-xp/15 flex items-center justify-center mb-3">
              <Zap size={28} className="text-dp-xp" />
            </div>
            <p className="text-display gradient-text font-bold leading-none">{mockUser.level}</p>
            <p className="text-caption text-dp-text-muted mt-1">{vi.dashboard.levelCurrent}</p>
            <p className="text-mono-sm text-dp-text-ghost mt-2">
              {vi.dashboard.remaining} {(mockUser.xpToNext - mockUser.xp).toLocaleString()} {vi.dashboard.xpRemaining}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="bento-card lg:col-span-2">
            {currentPath ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-h4 text-dp-text-primary">{vi.dashboard.currentPath}</h2>
                  <span className="badge badge-primary">{currentPath.progress}%</span>
                </div>

                <p className="text-body text-dp-text-secondary font-medium mb-2">
                  {currentPath.name}
                </p>

                <div className="progress-track mb-3">
                  <div
                    className="progress-fill h-full rounded-full"
                    style={{ width: `${currentPath.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-body-sm text-dp-text-muted mb-5">
                  <span>
                    {vi.dashboard.currentLesson}{' '}
                    <span className="text-dp-text-secondary">
                      {currentPath.currentLesson?.title ?? vi.dashboard.lessonUndetermined}
                    </span>
                  </span>
                  <span className="font-mono">
                    {currentPath.completedLessons}/{currentPath.totalLessons} {vi.dashboard.lessonUnit}
                  </span>
                </div>

                {currentPath.currentLesson?.slug ? (
                  <Link
                    to={`/lesson/${currentPath.currentLesson.slug}?path=${currentPath.slug}`}
                    className="btn-primary w-full h-11"
                  >
                    {vi.dashboard.continueLesson}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="btn-primary w-full h-11 opacity-40 cursor-not-allowed"
                  >
                    {vi.dashboard.noLessonAvailable}
                  </button>
                )}
              </>
            ) : (
              <PageEmpty
                title={vi.dashboard.emptyPathTitle}
                description={vi.dashboard.emptyPathDesc}
                ctaText={vi.dashboard.emptyPathCta}
                ctaTo="/explore"
              />
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="bento-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h4 text-dp-text-primary flex items-center gap-2">
                <Trophy size={18} className="text-dp-xp" />
                {vi.dashboard.leaderboardTitle}
              </h2>
              <Link to="/leaderboard" className="text-caption text-dp-primary hover:underline">
                {vi.common.viewAll}
              </Link>
            </div>

            <div className="space-y-2.5">
              {mockLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg-dp transition-colors ${
                    entry.isYou
                      ? 'bg-dp-primary-muted border border-dp-primary/20'
                      : 'hover:bg-dp-glass-hover'
                  }`}
                >
                  <span
                    className={`text-caption font-bold w-5 text-center ${
                      entry.rank === 1
                        ? 'text-dp-xp'
                        : entry.rank === 2
                          ? 'text-dp-badge-silver'
                          : entry.rank === 3
                            ? 'text-dp-badge-bronze'
                            : 'text-dp-text-ghost'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span
                    className={`text-body-sm flex-1 truncate ${
                      entry.isYou ? 'text-dp-primary font-medium' : 'text-dp-text-secondary'
                    }`}
                  >
                    {entry.name} {entry.isYou && `(${vi.dashboard.you})`}
                  </span>
                  <span className="text-mono-sm text-dp-text-muted">{entry.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="bento-card">
            <h2 className="text-h4 text-dp-text-primary mb-4 flex items-center gap-2">
              <Clock size={18} className="text-dp-text-muted" />
              {vi.dashboard.recentActivity}
            </h2>

            {data?.recentActivity && (
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-dp-glass-border">
                <div className="text-center flex-1">
                  <p className="text-h4 text-dp-text-primary font-bold">
                    {data.recentActivity.totalStudyMinutes}
                  </p>
                  <p className="text-caption text-dp-text-muted">{vi.dashboard.studyMinutes}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-h4 text-dp-text-primary font-bold">
                    {data.recentActivity.sessionsThisWeek}
                  </p>
                  <p className="text-caption text-dp-text-muted">{vi.dashboard.sessionsThisWeek}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {mockActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <act.icon size={16} className={`${act.color} mt-0.5 shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-body-sm text-dp-text-secondary truncate">{act.text}</p>
                    <p className="text-mono-sm text-dp-text-ghost">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="bento-card">
            <h2 className="text-h4 text-dp-text-primary mb-4">{vi.dashboard.quickActions}</h2>

            <div className="space-y-2">
              <Link to="/ai-chat" className="btn-ghost w-full justify-start">
                <MessageSquare size={16} />
                {vi.dashboard.askAiMentor}
              </Link>
              <Link to="/explore" className="btn-ghost w-full justify-start">
                <Compass size={16} />
                {vi.dashboard.explorePathsCta}
              </Link>
              <Link to="/leaderboard" className="btn-ghost w-full justify-start">
                <Trophy size={16} />
                {vi.dashboard.viewLeaderboard}
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="bento-card">
            <h2 className="text-h4 text-dp-text-primary mb-4 flex items-center gap-2">
              <Award size={18} className="text-dp-secondary" />
              {vi.dashboard.badges}
            </h2>

            <div className="space-y-3">
              {mockBadges.map((badge) => (
                <div key={badge.name} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg-dp bg-dp-glass-bg flex items-center justify-center text-xl shrink-0">
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm text-dp-text-primary font-medium">{badge.name}</p>
                    <p className="text-caption text-dp-text-muted truncate">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
