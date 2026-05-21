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
import './Dashboard.css';

// Mock seeds aligned with Variant B design (backend not yet exposing these).
const mockUser = {
  totalXp: 2450,
  level: 12,
  currentXp: 1250,
  targetXp: 2000,
};
const remainingXp = mockUser.targetXp - mockUser.currentXp;
const xpProgress = Math.round((mockUser.currentXp / mockUser.targetXp) * 100);

const mockLeaderboard = [
  { rank: 1, name: 'Tuấn Kiệt', xp: 8420, isYou: false },
  { rank: 2, name: 'Hà Phương', xp: 6890, isYou: false },
  { rank: 3, name: 'Minh Anh', xp: 2450, isYou: true },
  { rank: 4, name: 'Duy Khang', xp: 2210, isYou: false },
  { rank: 5, name: 'Bảo Trân', xp: 1980, isYou: false },
];

const mockActivity = [
  {
    icon: CheckCircle2,
    text: vi.dashboard.activityCompletedReactState,
    time: vi.dashboard.timeTwoHoursAgo,
    tone: 'success' as const,
  },
  {
    icon: Star,
    text: vi.dashboard.activityScoredJavascriptQuiz,
    time: vi.dashboard.timeFiveHoursAgo,
    tone: 'xp' as const,
  },
  {
    icon: Flame,
    text: vi.dashboard.activitySevenDayStreak,
    time: vi.dashboard.timeOneDayAgo,
    tone: 'streak' as const,
  },
  {
    icon: BookOpen,
    text: vi.dashboard.activityStartedReactHooks,
    time: vi.dashboard.timeOneDayAgo,
    tone: 'secondary' as const,
  },
];

const mockBadges = [
  { name: vi.dashboard.badgeFirstStepName, icon: '🌊', desc: vi.dashboard.badgeFirstStepDesc },
  { name: vi.dashboard.badgeSevenDayStreakName, icon: '🔥', desc: vi.dashboard.badgeSevenDayStreakDesc },
  { name: vi.dashboard.badgeQuizMasterName, icon: '🎯', desc: vi.dashboard.badgeQuizMasterDesc },
];

const fmtVN = (n: number) => n.toLocaleString('vi-VN');

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ─── Skeletons ─────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="dash-card dash-card-hero">
      <div className="dash-hero-inner">
        <div className="dash-hero-top">
          <div className="dash-skl" style={{ width: 88, height: 88, borderRadius: 22 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div className="dash-skl" style={{ height: 13, width: 160 }} />
            <div className="dash-skl" style={{ height: 40, width: '60%' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="dash-skl" style={{ height: 22, width: 110, borderRadius: 999 }} />
              <div className="dash-skl" style={{ height: 22, width: 100, borderRadius: 999 }} />
            </div>
          </div>
        </div>
        <div className="dash-hero-divider" />
        <div className="dash-hero-rail">
          <div className="dash-skl" style={{ height: 14, width: 100 }} />
          <div className="dash-skl" style={{ height: 48, width: 120 }} />
          <div className="dash-skl" style={{ height: 6, width: '100%', borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dp-dashboard">
      <div className="dash-stack">
        <HeroSkeleton />
        <div className="dash-grid-mid">
          <div className="dash-col">
            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="dash-skl" style={{ height: 18, width: 140 }} />
              <div className="dash-skl" style={{ height: 20, width: '70%' }} />
              <div className="dash-skl" style={{ height: 6, borderRadius: 999 }} />
              <div className="dash-skl" style={{ height: 44, borderRadius: 12 }} />
            </div>
            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dash-skl" style={{ height: 18, width: 160 }} />
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div className="dash-skl" style={{ width: 32, height: 32, borderRadius: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div className="dash-skl" style={{ height: 13, width: '75%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="dash-skl" style={{ height: 18, width: 130 }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="dash-skl" style={{ height: 36, borderRadius: 10 }} />
            ))}
          </div>
        </div>
        <div className="dash-grid-bottom">
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="dash-skl" style={{ height: 18, width: 100 }} />
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="dash-skl" style={{ width: 40, height: 40, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="dash-skl" style={{ height: 13, width: 130 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="dash-skl" style={{ height: 18, width: 130 }} />
            {[0, 1, 2].map((i) => (
              <div key={i} className="dash-skl" style={{ height: 44, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function Dashboard() {
  const authUser = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="dp-dashboard">
        <PageError message={vi.dashboard.loadError} onRetry={() => refetch()} />
      </div>
    );
  }

  const displayName = data?.user?.displayName || authUser?.displayName || vi.dashboard.defaultName;
  const avatarUrl = data?.user?.avatarUrl;
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const currentStreak = data?.recentActivity?.currentStreak ?? 7;
  const currentPath = data?.enrolledPaths?.[0] ?? null;
  const totalStudyMinutes = data?.recentActivity?.totalStudyMinutes ?? 320;
  const sessionsThisWeek = data?.recentActivity?.sessionsThisWeek ?? 12;

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? vi.dashboard.greetingMorning
      : hour < 18
        ? vi.dashboard.greetingAfternoon
        : vi.dashboard.greetingEvening;

  return (
    <div className="dp-dashboard">
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          className="dash-stack"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* ── Magazine Hero ───────────────────────────────────── */}
          <motion.div variants={fadeUp} className="dash-card dash-card-hero">
            <div className="dash-glow-blob" aria-hidden="true" />
            <div className="dash-hero-inner">
              <div className="dash-hero-top">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="dash-avatar-img" />
                ) : (
                  <div className="dash-avatar">{avatarLetter}</div>
                )}
                <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
                  <div className="dash-hero-eyebrow">{greeting} — sẵn sàng học chưa?</div>
                  <h1 className="dash-hero-name">
                    <span className="dash-grad-text">{displayName}</span>
                  </h1>
                  <div className="dash-chips-row" style={{ marginTop: 12 }}>
                    <span className="dash-chip dash-chip-streak">
                      <Flame size={12} />
                      {currentStreak} {vi.dashboard.streakDays}
                    </span>
                    <span className="dash-chip dash-chip-xp">
                      <Zap size={12} />
                      {fmtVN(mockUser.totalXp)} XP
                    </span>
                  </div>
                </div>
              </div>
              <div className="dash-hero-divider" />
              <div className="dash-hero-rail">
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--dash-text-ghost)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  {vi.dashboard.levelCurrent}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    className="dash-grad-text-warm dash-tabular"
                    style={{
                      fontFamily: 'var(--dash-font-display)',
                      fontWeight: 700,
                      fontSize: 48,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {mockUser.level}
                  </span>
                  <span
                    className="dash-mono dash-tabular"
                    style={{ fontSize: 12, color: 'var(--dash-text-muted)' }}
                  >
                    {fmtVN(mockUser.currentXp)} / {fmtVN(mockUser.targetXp)} XP
                  </span>
                </div>
                <div className="dash-prog">
                  <div className="dash-fill dash-fill-warm" style={{ width: `${xpProgress}%` }} />
                </div>
                <div
                  className="dash-mono dash-tabular"
                  style={{ fontSize: 11, color: 'var(--dash-text-muted)' }}
                >
                  {vi.dashboard.remaining} {fmtVN(remainingXp)} {vi.dashboard.xpRemaining}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Mid row: path + activity | leaderboard ──────────── */}
          <div className="dash-grid-mid">
            <div className="dash-col">
              {/* Current path */}
              <motion.div variants={fadeUp}>
                {currentPath ? (
                  <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="dash-card-title">{vi.dashboard.currentPath}</h2>
                      <span className="dash-chip dash-chip-primary dash-tabular">{currentPath.progress}%</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--dash-text-primary)' }}>
                      {currentPath.name}
                    </div>
                    <div className="dash-prog">
                      <div className="dash-fill" style={{ width: `${currentPath.progress}%` }} />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                        gap: 8,
                      }}
                    >
                      <span style={{ color: 'var(--dash-text-muted)' }}>
                        {vi.dashboard.currentLesson}{' '}
                        <span style={{ color: 'var(--dash-text-secondary)' }}>
                          {currentPath.currentLesson?.title ?? vi.dashboard.lessonUndetermined}
                        </span>
                      </span>
                      <span
                        className="dash-mono dash-tabular"
                        style={{ color: 'var(--dash-text-muted)', flexShrink: 0 }}
                      >
                        {currentPath.completedLessons}/{currentPath.totalLessons} {vi.dashboard.lessonUnit}
                      </span>
                    </div>
                    {currentPath.currentLesson?.slug ? (
                      <Link
                        to={`/lesson/${currentPath.currentLesson.slug}?path=${currentPath.slug}`}
                        className="dash-btn dash-btn-primary"
                        style={{ marginTop: 4 }}
                      >
                        {vi.dashboard.continueLesson}
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="dash-btn dash-btn-disabled"
                        style={{ marginTop: 4 }}
                      >
                        {vi.dashboard.noLessonAvailable}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="dash-card">
                    <PageEmpty
                      title={vi.dashboard.emptyPathTitle}
                      description={vi.dashboard.emptyPathDesc}
                      ctaText={vi.dashboard.emptyPathCta}
                      ctaTo="/explore"
                    />
                  </div>
                )}
              </motion.div>

              {/* Recent activity */}
              <motion.div variants={fadeUp} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="dash-card-h">
                  <Clock size={16} color="var(--dash-text-muted)" />
                  <h2 className="dash-card-title">{vi.dashboard.recentActivity}</h2>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    paddingBottom: 14,
                    borderBottom: '1px solid var(--dash-border-subtle)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      className="dash-tabular"
                      style={{
                        fontFamily: 'var(--dash-font-display)',
                        fontWeight: 700,
                        fontSize: 22,
                        color: 'var(--dash-text-primary)',
                        lineHeight: 1,
                      }}
                    >
                      {fmtVN(totalStudyMinutes)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--dash-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginTop: 4,
                      }}
                    >
                      {vi.dashboard.studyMinutes}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--dash-border-subtle)' }} />
                  <div style={{ flex: 1 }}>
                    <div
                      className="dash-tabular"
                      style={{
                        fontFamily: 'var(--dash-font-display)',
                        fontWeight: 700,
                        fontSize: 22,
                        color: 'var(--dash-text-primary)',
                        lineHeight: 1,
                      }}
                    >
                      {sessionsThisWeek}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--dash-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginTop: 4,
                      }}
                    >
                      {vi.dashboard.sessionsThisWeek}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mockActivity.slice(0, 3).map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div className={`dash-act-ico dash-act-ico-${a.tone}`}>
                        <a.icon size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--dash-text-primary)',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.text}
                        </div>
                        <div
                          className="dash-mono"
                          style={{ fontSize: 11, color: 'var(--dash-text-ghost)', marginTop: 2 }}
                        >
                          {a.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Leaderboard rail */}
            <motion.div variants={fadeUp} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <div className="dash-card-h">
                  <Trophy size={18} color="var(--dash-xp)" />
                  <h2 className="dash-card-title">{vi.dashboard.leaderboardTitle}</h2>
                </div>
                <Link
                  to="/leaderboard"
                  style={{ fontSize: 12.5, color: 'var(--dash-primary)', textDecoration: 'none' }}
                >
                  {vi.common.viewAll} →
                </Link>
              </div>
              {mockLeaderboard.map((r) => {
                const rankCls = r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : r.rank === 3 ? 'bronze' : '';
                return (
                  <div key={r.rank} className={`dash-lb-row ${r.isYou ? 'me' : ''}`}>
                    <span className={`dash-lb-rank ${rankCls}`}>{r.rank}</span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: r.isYou ? 'var(--dash-primary)' : 'var(--dash-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.name}{' '}
                      {r.isYou && (
                        <span style={{ color: 'var(--dash-primary)', fontSize: 12 }}>
                          ({vi.dashboard.you})
                        </span>
                      )}
                    </span>
                    <span
                      className="dash-mono dash-tabular"
                      style={{
                        fontSize: 12.5,
                        color: r.isYou ? 'var(--dash-primary)' : 'var(--dash-text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {fmtVN(r.xp)}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* ── Bottom row: badges + quick actions ──────────────── */}
          <div className="dash-grid-bottom">
            <motion.div variants={fadeUp} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dash-card-h">
                <Award size={18} color="var(--dash-secondary)" />
                <h2 className="dash-card-title">{vi.dashboard.badges}</h2>
              </div>
              {mockBadges.map((b) => (
                <div key={b.name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--dash-glass-bg)',
                      border: '1px solid var(--dash-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {b.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: 'var(--dash-text-primary)',
                      }}
                    >
                      {b.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--dash-text-muted)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.desc}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="dash-card-title" style={{ marginBottom: 4 }}>
                {vi.dashboard.quickActions}
              </h2>
              <Link to="/ai-chat" className="dash-btn dash-btn-ghost">
                <MessageSquare size={16} />
                {vi.dashboard.askAiMentor}
              </Link>
              <Link to="/explore" className="dash-btn dash-btn-ghost">
                <Compass size={16} />
                {vi.dashboard.explorePathsCta}
              </Link>
              <Link to="/leaderboard" className="dash-btn dash-btn-ghost">
                <Trophy size={16} />
                {vi.dashboard.viewLeaderboard}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
