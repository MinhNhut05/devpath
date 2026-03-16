import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AiChat from './pages/AiChat';
import Explore from './pages/Explore';
import Lesson from './pages/Lesson';
import Quiz from './pages/Quiz';
import LessonLayout from './pages/LessonLayout';
import Plans from './pages/Plans';
import PaymentResult from './pages/PaymentResult';
import Settings from './pages/Settings';

export default function App() {
  const token = useAuthStore((s) => s.accessToken);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
      <Route path="/lesson/:slug/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/lesson/:slug" element={
        <ProtectedRoute>
          <LessonLayout><Lesson /></LessonLayout>
        </ProtectedRoute>
      } />
      <Route path="/plans/result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
