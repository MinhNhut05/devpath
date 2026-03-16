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
import AdminGuard from './components/AdminGuard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLearningPaths from './pages/admin/AdminLearningPaths';
import AdminTracks from './pages/admin/AdminTracks';
import AdminLessons from './pages/admin/AdminLessons';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAIContent from './pages/admin/AdminAIContent';

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

      {/* Admin */}
      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="learning-paths" element={<AdminLearningPaths />} />
        <Route path="tracks" element={<AdminTracks />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="ai-content" element={<AdminAIContent />} />
      </Route>

      {/* Default */}
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
