/**
 * Centralized Vietnamese UI strings for DevPath Learning.
 *
 * Rules:
 * - Tone: friendly tutor voice, address user as "bạn".
 * - All text uses proper Vietnamese diacritics.
 * - Organized by page/feature section.
 * - Components import keys from this file, never hardcode strings.
 */
export const vi = {
  // ── Common / shared ──────────────────────────────────────────────
  common: {
    loading: 'Đang tải dữ liệu...',
    retry: 'Thử lại',
    goExplore: 'Khám phá lộ trình',
    offline: 'Không có kết nối mạng',
    genericError: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    goBack: 'Quay lại',
    or: 'hoặc',
    viewAll: 'Xem tất cả',
  },

  // ── Auth / Login / Register ──────────────────────────────────────
  auth: {
    loginTitle: 'Đăng nhập',
    registerTitle: 'Đăng ký',
    subtitle: 'Lộ trình học IT cá nhân hóa',
    continueWithGoogle: 'Tiếp tục với Google',
    continueWithGithub: 'Tiếp tục với GitHub',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Mật khẩu',
    confirmPasswordPlaceholder: 'Xác nhận mật khẩu',
    displayNamePlaceholder: 'Tên hiển thị',
    loginButton: 'Đăng nhập',
    loginLoading: 'Đang đăng nhập...',
    registerButton: 'Đăng ký',
    registerLoading: 'Đang đăng ký...',
    loginError: 'Email hoặc mật khẩu không đúng',
    registerError: 'Đăng ký thất bại. Email có thể đã được dùng.',
    passwordMismatch: 'Mật khẩu xác nhận không khớp',
    forgotPassword: 'Quên mật khẩu?',
    forgotPasswordTitle: 'Quên mật khẩu',
    forgotPasswordDesc: 'Nhập email để nhận mã OTP đặt lại mật khẩu.',
    emailRegisteredPlaceholder: 'Email đã đăng ký',
    sendOtp: 'Gửi mã OTP',
    sendingOtp: 'Đang gửi...',
    otpSent: 'Đã gửi mã OTP đến email của bạn!',
    otpResent: 'Đã gửi lại mã OTP!',
    enterOtp: 'Nhập mã 6 chữ số đã gửi đến',
    confirmCode: 'Xác nhận mã',
    confirmingOtp: 'Đang xác nhận...',
    confirmOtpButton: 'Xác nhận OTP',
    resendOtp: 'Gửi lại mã',
    newPasswordPlaceholder: 'Mật khẩu mới',
    confirmNewPasswordPlaceholder: 'Xác nhận mật khẩu mới',
    enterNewPassword: 'Nhập mật khẩu mới của bạn.',
    resetPassword: 'Đặt lại mật khẩu',
    resettingPassword: 'Đang đặt lại...',
    resetSuccess: 'Đổi mật khẩu thành công!',
    resetSuccessDesc: 'Bạn có thể đăng nhập với mật khẩu mới.',
    backToLogin: 'Quay lại đăng nhập',
    hidePassword: 'Ẩn mật khẩu',
    showPassword: 'Hiện mật khẩu',
    otpInvalid: 'Mã OTP không đúng hoặc đã hết hạn',
    otpInvalidShort: 'OTP không đúng hoặc đã hết hạn',
    emailSendError: 'Không thể gửi email. Kiểm tra lại địa chỉ email.',
    resendOtpError: 'Không thể gửi lại OTP',
    sessionExpired: 'Phiên đã hết hạn, vui lòng đăng nhập lại',
    callbackLoading: 'Đang đăng nhập...',
    passwordStrengthWeak: 'Yếu',
    passwordStrengthMedium: 'Trung bình',
    passwordStrengthStrong: 'Mạnh',
  },

  // ── Dashboard ────────────────────────────────────────────────────
  dashboard: {
    errorTitle: 'Đã xảy ra lỗi',
    loadError: 'Không thể tải dữ liệu trang tổng quan.',
    greetingMorning: 'Chào buổi sáng',
    greetingAfternoon: 'Chào buổi chiều',
    greetingEvening: 'Chào buổi tối',
    defaultName: 'Bạn',
    streakDays: 'ngày streak',
    currentPath: 'Lộ trình hiện tại',
    currentLesson: 'Bài hiện tại:',
    lessonUndetermined: 'Chưa xác định',
    lessonUnit: 'bài',
    continueLesson: 'Tiếp tục học',
    noLessonAvailable: 'Chưa có bài học',
    emptyPathTitle: 'Bạn chưa đăng ký lộ trình nào',
    emptyPathDesc:
      'Hãy khám phá các lộ trình phù hợp để bắt đầu học và theo dõi tiến độ của bạn.',
    emptyPathCta: 'Khám phá lộ trình',
    leaderboardTitle: 'Bảng xếp hạng',
    you: 'Bạn',
    recentActivity: 'Hoạt động gần đây',
    studyMinutes: 'phút học',
    sessionsThisWeek: 'phiên tuần này',
    quickActions: 'Thao tác nhanh',
    askAiMentor: 'Hỏi AI Mentor',
    explorePathsCta: 'Khám phá lộ trình',
    viewLeaderboard: 'Xem bảng xếp hạng',
    badges: 'Huy hiệu',
    levelCurrent: 'Level hiện tại',
    xpRemaining: 'XP nữa',
    remaining: 'Còn',
    activityCompletedReactState: 'Hoàn thành "React State Management"',
    activityScoredJavascriptQuiz: 'Đạt 90% quiz "JavaScript Basics"',
    activitySevenDayStreak: 'Streak 7 ngày liên tiếp!',
    activityStartedReactHooks: 'Bắt đầu "React Hooks Deep Dive"',
    timeTwoHoursAgo: '2 giờ trước',
    timeFiveHoursAgo: '5 giờ trước',
    timeOneDayAgo: '1 ngày trước',
    badgeFirstStepDesc: 'Hoàn thành bài học đầu tiên',
    badgeSevenDayStreakDesc: 'Streak 7 ngày',
    badgeQuizMasterDesc: 'Đạt 100% quiz',
  },

  // ── Explore ──────────────────────────────────────────────────────
  explore: {
    title: 'Khám phá lộ trình',
    loadError: 'Không thể tải danh sách lộ trình.',
    emptyState: 'Không có lộ trình nào',
    enrollButton: 'Đăng ký học',
    enrolling: 'Đang đăng ký...',
    enrolled: 'Đã đăng ký',
    enrollError: 'Đăng ký thất bại. Vui lòng thử lại.',
    tracks: 'chủ đề',
    difficultyBeginner: 'Cơ bản',
    difficultyIntermediate: 'Trung cấp',
    difficultyAdvanced: 'Nâng cao',
  },

  // ── Lesson ───────────────────────────────────────────────────────
  lesson: {
    loadError: 'Không thể tải bài học.',
    notFound: 'Không tìm thấy bài học.',
    notEnrolled: 'Bạn chưa đăng ký lộ trình chứa bài học này.',
    genericError: 'Có lỗi xảy ra. Vui lòng thử lại.',
    goBack: 'Quay lại',
    minutes: 'phút',
    references: 'Tài liệu tham khảo',
    completeButton: 'Hoàn thành bài học',
    completing: 'Đang xử lý...',
    completeError: 'Hoàn thành thất bại. Vui lòng thử lại.',
    completed: 'Hoàn thành!',
    backToDashboard: 'Quay về trang tổng quan',
    takeQuiz: 'Làm Quiz',
    explorePathsCta: 'Khám phá lộ trình',
  },

  // ── Lesson Sidebar ───────────────────────────────────────────────
  lessonSidebar: {
    title: 'Danh sách bài học',
    noPathSelected: 'Hãy chọn một lộ trình để xem danh sách bài học.',
    loading: 'Đang tải...',
    loadError: 'Không thể tải danh sách bài học.',
    optional: 'Tùy chọn',
    hasQuiz: 'Có câu hỏi ôn tập',
  },

  // ── Quiz ─────────────────────────────────────────────────────────
  quiz: {
    loading: 'Đang tải quiz...',
    notFound: 'Bài học này không có quiz.',
    noAccess: 'Bạn chưa có quyền truy cập quiz này.',
    genericError: 'Có lỗi xảy ra. Vui lòng thử lại.',
    backToLesson: 'Quay lại bài học',
    backToLessonButton: 'Quay về bài học',
    passRequired: 'Cần {threshold}% để đạt',
    questionsUnit: 'câu hỏi',
    instructions: 'Chọn đáp án và nhấn "Nộp bài"',
    noQuestions: 'Quiz này chưa có câu hỏi nào.',
    singleChoice: 'Chọn 1',
    multipleChoice: 'Chọn nhiều',
    explanation: 'Giải thích:',
    submitButton: 'Nộp bài',
    submitting: 'Đang chấm điểm...',
    submitError: 'Nộp bài thất bại. Vui lòng thử lại.',
    answerProgress: 'Trả lời tất cả câu hỏi',
    resultPassed: 'Đạt!',
    resultFailed: 'Chưa đạt',
    score: 'Bạn đạt',
    correctCount: 'câu đúng',
    passThreshold: 'Cần {threshold}% để pass',
    retryButton: 'Làm lại',
  },

  // ── Settings ─────────────────────────────────────────────────────
  settings: {
    title: 'Cài đặt',
    loadError: 'Không thể tải thông tin. Vui lòng thử lại.',
    accountInfo: 'Thông tin tài khoản',
    defaultUser: 'Người dùng',
    subscription: 'Gói đăng ký',
    freeTier: 'Miễn phí',
    proTier: 'Pro',
    ultraTier: 'Ultra',
    freeDesc: 'Bạn đang dùng gói',
    freeLabel: 'miễn phí',
    upgradeDesc:
      'Nâng cấp lên Pro hoặc Ultra để trải nghiệm đầy đủ tính năng.',
    upgradeButton: 'Nâng cấp ngay',
    currentPlan: 'Gói hiện tại',
    startDate: 'Ngày bắt đầu:',
    endDate: 'Hết hạn:',
    daysLeft: 'Còn lại',
    daysUnit: 'ngày',
    renewButton: 'Gia hạn gói',
    paymentHistory: 'Lịch sử thanh toán',
    noTransactions: 'Chưa có giao dịch nào',
    loadMore: 'Xem thêm',
    loadingMore: 'Đang tải thêm...',
    statusSuccess: 'Thành công',
    statusPending: 'Đang xử lý',
    statusFailed: 'Thất bại',
  },

  // ── Onboarding ───────────────────────────────────────────────────
  onboarding: {
    title: 'Thiết lập hành trình học',
    subtitle: 'Trả lời {count} câu hỏi để AI gợi ý lộ trình phù hợp',
    loadError: 'Không tải được câu hỏi',
    submitButton: 'Xem gợi ý của AI',
    submitting: 'Đang xử lý...',
    noRecommendation: 'AI không trả về gợi ý. Vui lòng thử lại.',
    genericError: 'Có lỗi xảy ra',
    recommendationTitle: 'Gợi ý của AI',
    aiSource: 'AI',
    fallbackSource: 'Gợi ý dự phòng',
    alternativePaths: 'Lộ trình thay thế:',
    focusAreas: 'Chủ đề cần tập trung:',
    studyTips: 'Mẹo học tập:',
    confirmButton: 'Bắt đầu học',
    loading: 'Đang tải...',
    pathNames: {
      frontendDeveloper: 'Lập trình viên Frontend',
      backendDeveloper: 'Lập trình viên Backend',
      fullstackDeveloper: 'Lập trình viên Fullstack',
      aiPython: 'AI / Khoa học dữ liệu (Python)',
    },
  },

  // ── Sidebar / Navigation ────────────────────────────────────────
  sidebar: {
    dashboard: 'Tổng quan',
    explore: 'Khám phá',
    aiChat: 'Trò chuyện AI',
    leaderboard: 'Bảng xếp hạng',
    settings: 'Cài đặt',
    notifications: 'Thông báo',
    admin: 'Quản trị',
    expandSidebar: 'Mở rộng thanh bên',
    collapseSidebar: 'Thu gọn thanh bên',
    openSidebar: 'Mở thanh bên',
    closeSidebar: 'Đóng thanh bên',
    streakDays: 'ngày',
    toNextLevel: 'đến level tiếp theo',
  },

  // ── Landing ──────────────────────────────────────────────────────
  landing: {
    heroTitle:
      'Con đường học IT của bạn, được cá nhân hóa bởi AI',
    heroDesc:
      'Lộ trình học thông minh, bài tập thực tế, và trợ lý AI đồng hành cùng bạn trên hành trình trở thành developer chuyên nghiệp.',
    ctaStart: 'Bắt đầu miễn phí',
    ctaExplore: 'Khám phá lộ trình',
    whyTitle: 'Tại sao chọn DevPath?',
    featurePersonalizedTitle: 'Lộ trình cá nhân hóa',
    featurePersonalizedDesc:
      'AI phân tích trình độ và mục tiêu của bạn, tạo lộ trình học tối ưu nhất.',
    featureLiveCodeTitle: 'Code trực tiếp',
    featureLiveCodeDesc:
      'Thực hành code ngay trên trình duyệt với môi trường sandbox an toàn.',
    featureGamificationTitle: 'Gamification',
    featureGamificationDesc:
      'Tích XP, giữ streak, mở badge - học mà như chơi game.',
    featureAiMentorTitle: 'AI Mentor',
    featureAiMentorDesc:
      'Trợ lý AI 24/7 giải đáp mọi thắc mắc, hướng dẫn từ cơ bản đến nâng cao.',
    statsLearners: 'Học viên',
    statsPaths: 'Lộ trình',
    statsLessons: 'Bài học',
    statsSatisfaction: 'Hài lòng',
    testimonialsTitle: 'Học viên nói gì?',
    testimonials: {
      minhTuanRole: 'Lập trình viên Frontend',
      minhTuanReview:
        'DevPath giúp mình đi từ con số 0 đến có việc làm frontend chỉ trong 6 tháng. Lộ trình rõ ràng, AI mentor rất hữu ích!',
      thanhHaRole: 'Sinh viên',
      thanhHaReview:
        'Cách học gamification giúp mình duy trì động lực mỗi ngày. Mình đã giữ streak 30 ngày liên tiếp rồi!',
      ducAnhRole: 'Lập trình viên Backend',
      ducAnhReview:
        'Bài tập thực tế, quiz kiểm tra kiến thức và AI review code - đúng những gì mình cần.',
    },
    copyright: '© 2024 DevPath Learning. Bảo lưu mọi quyền.',
  },

  // ── AI Chat ──────────────────────────────────────────────────────
  aiChat: {
    title: 'Trợ lý AI',
    quotaRemaining: 'câu còn lại',
    quotaExhausted:
      'Bạn đã dùng hết quota hôm nay. Quay lại vào ngày mai nhé!',
    loadError: 'Không tải được dữ liệu. Vui lòng thử lại.',
    sendError: 'Gửi thất bại. Thử lại nhé!',
    emptyTitle: 'Xin chào! Mình có thể giúp gì cho bạn?',
    emptyDesc:
      'Hỏi bất kỳ câu hỏi nào về lập trình, lộ trình học, hoặc bài tập nhé.',
    thinking: 'AI đang suy nghĩ',
    noQuotaPlaceholder: 'Đã hết quota hôm nay...',
    inputPlaceholder:
      'Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)',
    sendButton: 'Gửi',
    disclaimer:
      'AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.',
    noResponse: 'Không có phản hồi',
  },

  // ── Theme ────────────────────────────────────────────────────────
  theme: {
    switchToLight: 'Chuyển sang sáng',
    switchToDark: 'Chuyển sang tối',
  },
} as const;
