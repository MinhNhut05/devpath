import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { resetSessionExpiredGuard } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { vi } from '../strings/vi';

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

// ─── Helper: extract error from axios response ───────────────────────────────
type ApiError = { response?: { data?: { error?: { message?: string } } } };
function getErrMsg(err: unknown, fallback: string): string {
  return (err as ApiError)?.response?.data?.error?.message ?? fallback;
}

// ─── OAuth base URL ───────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3002/api/v1';

// ─── Animation Variants ──────────────────────────────────────────────────────
const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -30 : 30,
    opacity: 0,
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Alert box */
function Alert({ type, msg }: { type: 'error' | 'success' | 'info'; msg: string }) {
  const cls = {
    error: 'bg-dp-error/10 border-dp-error/30 text-dp-error',
    success: 'bg-dp-success/10 border-dp-success/30 text-dp-success',
    info: 'bg-dp-info/10 border-dp-info/30 text-dp-info',
  }[type];
  return (
    <div className={`border rounded-xl-dp px-4 py-3 text-sm mb-4 backdrop-blur-sm ${cls}`}>{msg}</div>
  );
}

/** Divider */
function Divider() {
  return (
    <div className="flex items-center my-5 gap-3">
      <div className="flex-1 h-px bg-dp-border-subtle" />
      <span className="text-xs text-dp-text-ghost whitespace-nowrap">{vi.common.or}</span>
      <div className="flex-1 h-px bg-dp-border-subtle" />
    </div>
  );
}

/** OAuth buttons (Google / GitHub) */
function OAuthButtons() {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => (window.location.href = `${API_URL}/auth/google`)}
        className="w-full flex items-center justify-center gap-3 glass glass-hover rounded-xl-dp py-2.5 text-sm font-medium text-dp-text-secondary"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {vi.auth.continueWithGoogle}
      </button>

      <button
        type="button"
        onClick={() => (window.location.href = `${API_URL}/auth/github`)}
        className="w-full flex items-center justify-center gap-3 glass glass-hover rounded-xl-dp py-2.5 text-sm font-medium text-dp-text-secondary"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        {vi.auth.continueWithGithub}
      </button>
    </div>
  );
}

/** Password input with toggle */
function PasswordInput({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full glass-input text-dp-text-primary rounded-xl-dp px-4 py-3 pr-11 text-sm placeholder:text-dp-text-ghost transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-dp-text-ghost hover:text-dp-text-secondary transition-colors"
        aria-label={show ? vi.auth.hidePassword : vi.auth.showPassword}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/** Password strength indicator */
function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: vi.auth.passwordStrengthWeak, color: 'bg-dp-error' };
    if (score <= 2) return { level: 2, label: vi.auth.passwordStrengthMedium, color: 'bg-dp-warning' };
    return { level: 3, label: vi.auth.passwordStrengthStrong, color: 'bg-dp-success' };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-base ${
              i <= strength.level ? strength.color : 'bg-dp-border'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength.level === 1 ? 'text-dp-error' :
        strength.level === 2 ? 'text-dp-warning' : 'text-dp-success'
      }`}>
        {strength.label}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  // ── Tab state + direction for animation ─────────────────────
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [tabDirection, setTabDirection] = useState(0);

  // ── Login state ─────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'new-password' | 'done'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword2, setShowForgotPassword2] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');

  // ── Register state ──────────────────────────────────────────
  const [registerStep, setRegisterStep] = useState<'form' | 'verify-otp' | 'done'>('form');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regInfo, setRegInfo] = useState('');
  const [storedRegEmail, setStoredRegEmail] = useState('');

  // ── Handlers: Login ─────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      const { accessToken, user } = res.data.data;
      resetSessionExpiredGuard();
      setAuth(accessToken, user);
      navigate(!user.onboardingCompleted ? '/onboarding' : '/dashboard');
    } catch (err) {
      setLoginError(getErrMsg(err, vi.auth.loginError));
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Handlers: Forgot password ───────────────────────────────

  async function handleForgotEmail(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotInfo('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotInfo(vi.auth.otpSent);
      setForgotStep('otp');
    } catch (err) {
      setForgotError(getErrMsg(err, vi.auth.emailSendError));
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(vi.auth.passwordMismatch);
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        code: forgotCode,
        newPassword: forgotNewPassword,
      });
      setForgotStep('done');
    } catch (err) {
      setForgotError(getErrMsg(err, vi.auth.otpInvalid));
    } finally {
      setForgotLoading(false);
    }
  }

  function resetForgotFlow() {
    setShowForgotPassword(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotInfo('');
  }

  // ── Handlers: Register ──────────────────────────────────────

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setRegError(vi.auth.passwordMismatch);
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      await api.post('/auth/register', {
        email: regEmail,
        password: regPassword,
        displayName: regDisplayName,
      });
      setStoredRegEmail(regEmail);
      setRegInfo(vi.auth.otpSent);
      setRegisterStep('verify-otp');
    } catch (err) {
      setRegError(getErrMsg(err, vi.auth.registerError));
    } finally {
      setRegLoading(false);
    }
  }

  async function handleVerifyRegOtp(e: React.FormEvent) {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      await api.post('/auth/otp/verify', { email: storedRegEmail, code: regOtpCode });
      setRegisterStep('form');
      setRegDisplayName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegOtpCode('');
      setRegInfo('');
      setStoredRegEmail('');
      setActiveTab('login');
      setLoginError('');
    } catch (err) {
      setRegError(getErrMsg(err, vi.auth.otpInvalidShort));
    } finally {
      setRegLoading(false);
    }
  }

  async function handleResendRegOtp() {
    setRegLoading(true);
    setRegError('');
    setRegInfo('');
    try {
      await api.post('/auth/otp/request', { email: storedRegEmail });
      setRegInfo(vi.auth.otpResent);
    } catch (err) {
      setRegError(getErrMsg(err, vi.auth.resendOtpError));
    } finally {
      setRegLoading(false);
    }
  }

  // ── Switch tab ──────────────────────────────────────────────

  function handleSwitchTab(tab: 'login' | 'register') {
    setTabDirection(tab === 'register' ? 1 : -1);
    setActiveTab(tab);
    setLoginError('');
    setRegError('');
    setRegInfo('');
    resetForgotFlow();
  }

  // ─── Input class ────────────────────────────────────────────
  const inputCls = 'w-full glass-input text-dp-text-primary rounded-xl-dp px-4 py-3 text-sm placeholder:text-dp-text-ghost transition-all';
  const otpInputCls = 'w-full glass-input text-dp-text-primary rounded-xl-dp px-4 py-3 text-center text-lg font-mono tracking-widest placeholder:text-dp-text-ghost transition-all';

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dp-deep flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Decorative glow blobs */}
      <div className="glow-blob glow-blob-purple w-[500px] h-[500px] -top-[20%] -left-[10%]" />
      <div className="glow-blob glow-blob-blue w-[500px] h-[500px] -bottom-[20%] -right-[10%]" />
      <div className="glow-blob glow-blob-purple w-[300px] h-[300px] top-[50%] left-[60%] opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_SMOOTH }}
        className="relative z-10 glass rounded-2xl-dp shadow-dp-lg w-full max-w-sm p-8"
      >
        {/* Logo + subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">DevPath</span>
          </h1>
          <p className="text-dp-text-muted text-sm mt-1">{vi.auth.subtitle}</p>
        </div>

        {/* Tab buttons */}
        <div className="flex rounded-xl-dp glass p-1 mb-6">
          <button
            type="button"
            onClick={() => handleSwitchTab('login')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg-dp transition-all duration-base ${
              activeTab === 'login'
                ? 'bg-dp-primary-muted text-dp-primary border border-dp-primary/20 shadow-dp-glow-blue'
                : 'text-dp-text-muted hover:text-dp-text-secondary border border-transparent'
            }`}
          >
            {vi.auth.loginTitle}
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('register')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg-dp transition-all duration-base ${
              activeTab === 'register'
                ? 'bg-dp-primary-muted text-dp-primary border border-dp-primary/20 shadow-dp-glow-blue'
                : 'text-dp-text-muted hover:text-dp-text-secondary border border-transparent'
            }`}
          >
            {vi.auth.registerTitle}
          </button>
        </div>

        {/* Animated tab content */}
        <AnimatePresence mode="wait" custom={tabDirection}>
          {/* ════════════════════════════ TAB: LOGIN */}
          {activeTab === 'login' && (
            <motion.div
              key="login"
              custom={tabDirection}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: EASE_SMOOTH }}
            >
              {!showForgotPassword ? (
                <>
                  {loginError && <Alert type="error" msg={loginError} />}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <input
                      type="email"
                      placeholder={vi.auth.emailPlaceholder}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className={inputCls}
                    />

                    <PasswordInput
                      value={loginPassword}
                      onChange={setLoginPassword}
                      placeholder={vi.auth.passwordPlaceholder}
                      show={showLoginPassword}
                      onToggle={() => setShowLoginPassword((v) => !v)}
                    />

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="btn-primary w-full h-11 disabled:opacity-40"
                    >
                      {loginLoading ? vi.auth.loginLoading : vi.auth.loginButton}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setLoginError(''); }}
                    className="block w-full text-center text-sm text-dp-primary/70 hover:text-dp-primary hover:underline mt-3 transition-colors"
                  >
                    {vi.auth.forgotPassword}
                  </button>

                  <Divider />
                  <OAuthButtons />
                </>
              ) : (
                /* ─── Forgot Password Flow ─── */
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <button
                      type="button"
                      onClick={resetForgotFlow}
                      className="text-dp-text-ghost hover:text-dp-text-secondary text-xl leading-none transition-colors"
                      aria-label={vi.auth.backToLogin}
                    >
                      &larr;
                    </button>
                    <h2 className="font-semibold text-dp-text-primary text-sm">{vi.auth.forgotPasswordTitle}</h2>
                  </div>

                  {forgotError && <Alert type="error" msg={forgotError} />}
                  {forgotInfo && <Alert type="info" msg={forgotInfo} />}

                  {/* Step 1: Email */}
                  {forgotStep === 'email' && (
                    <form onSubmit={handleForgotEmail} className="space-y-4">
                      <p className="text-sm text-dp-text-muted">
                        {vi.auth.forgotPasswordDesc}
                      </p>
                      <input
                        type="email"
                        placeholder={vi.auth.emailRegisteredPlaceholder}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className={inputCls}
                      />
                      <button type="submit" disabled={forgotLoading} className="btn-primary w-full h-11 disabled:opacity-40">
                        {forgotLoading ? vi.auth.sendingOtp : vi.auth.sendOtp}
                      </button>
                    </form>
                  )}

                  {/* Step 2: OTP */}
                  {forgotStep === 'otp' && (
                    <div className="space-y-4">
                      <p className="text-sm text-dp-text-muted">
                        {vi.auth.enterOtp} <strong className="text-dp-text-secondary">{forgotEmail}</strong>
                      </p>
                      <input
                        type="text"
                        placeholder="000000"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className={otpInputCls}
                      />
                      <button
                        type="button"
                        onClick={() => { setForgotError(''); setForgotStep('new-password'); }}
                        disabled={forgotCode.length < 6}
                        className="btn-primary w-full h-11 disabled:opacity-40"
                      >
                        {vi.auth.confirmCode}
                      </button>
                    </div>
                  )}

                  {/* Step 3: New password */}
                  {forgotStep === 'new-password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <p className="text-sm text-dp-text-muted">{vi.auth.enterNewPassword}</p>
                      <PasswordInput
                        value={forgotNewPassword}
                        onChange={setForgotNewPassword}
                        placeholder={vi.auth.newPasswordPlaceholder}
                        show={showForgotPassword2}
                        onToggle={() => setShowForgotPassword2((v) => !v)}
                      />
                      <input
                        type={showForgotPassword2 ? 'text' : 'password'}
                        placeholder={vi.auth.confirmNewPasswordPlaceholder}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        required
                        className={inputCls}
                      />
                      <button type="submit" disabled={forgotLoading} className="btn-primary w-full h-11 disabled:opacity-40">
                        {forgotLoading ? vi.auth.resettingPassword : vi.auth.resetPassword}
                      </button>
                    </form>
                  )}

                  {/* Step 4: Done */}
                  {forgotStep === 'done' && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-dp-success/15 flex items-center justify-center mx-auto">
                        <span className="text-3xl">&#10003;</span>
                      </div>
                      <p className="text-dp-text-primary font-medium">{vi.auth.resetSuccess}</p>
                      <p className="text-dp-text-muted text-sm">{vi.auth.resetSuccessDesc}</p>
                      <button type="button" onClick={resetForgotFlow} className="btn-primary w-full h-11">
                        {vi.auth.backToLogin}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════ TAB: REGISTER */}
          {activeTab === 'register' && (
            <motion.div
              key="register"
              custom={tabDirection}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: EASE_SMOOTH }}
            >
              {regError && <Alert type="error" msg={regError} />}
              {regInfo && <Alert type="info" msg={regInfo} />}

              {/* Step 1: Form */}
              {registerStep === 'form' && (
                <>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <input
                      type="text"
                      placeholder={vi.auth.displayNamePlaceholder}
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      required
                      className={inputCls}
                    />
                    <input
                      type="email"
                      placeholder={vi.auth.emailPlaceholder}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className={inputCls}
                    />
                    <PasswordInput
                      value={regPassword}
                      onChange={setRegPassword}
                      placeholder={vi.auth.passwordPlaceholder}
                      show={regShowPassword}
                      onToggle={() => setRegShowPassword((v) => !v)}
                    />
                    <PasswordStrength password={regPassword} />
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      placeholder={vi.auth.confirmPasswordPlaceholder}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      className={inputCls}
                    />
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="btn-primary w-full h-11 disabled:opacity-40"
                    >
                      {regLoading ? vi.auth.registerLoading : vi.auth.registerButton}
                    </button>
                  </form>

                  <Divider />
                  <OAuthButtons />
                </>
              )}

              {/* Step 2: OTP verify */}
              {registerStep === 'verify-otp' && (
                <div className="space-y-4">
                  <p className="text-sm text-dp-text-muted">
                    {vi.auth.enterOtp} <strong className="text-dp-text-secondary">{storedRegEmail}</strong>
                  </p>
                  <form onSubmit={handleVerifyRegOtp} className="space-y-4">
                    <input
                      type="text"
                      placeholder="000000"
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className={otpInputCls}
                    />
                    <button
                      type="submit"
                      disabled={regLoading || regOtpCode.length < 6}
                      className="btn-primary w-full h-11 disabled:opacity-40"
                    >
                      {regLoading ? vi.auth.confirmingOtp : vi.auth.confirmOtpButton}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={handleResendRegOtp}
                    disabled={regLoading}
                    className="w-full text-sm text-dp-primary/70 hover:text-dp-primary hover:underline disabled:opacity-50 transition-colors"
                  >
                    {vi.auth.resendOtp}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('form');
                      setRegOtpCode('');
                      setRegError('');
                      setRegInfo('');
                    }}
                    className="w-full text-sm text-dp-text-ghost hover:text-dp-text-secondary transition-colors"
                  >
                    &larr; {vi.auth.backToLogin}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
