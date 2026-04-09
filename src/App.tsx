import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ApplyPage from './pages/ApplyPage';
import './i18n';
import './App.css';

// Lazy-load heavy pages (mapbox-gl ~550kb)
const HomePage = lazy(() => import('./pages/HomePage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MyDonationsPage = lazy(() => import('./pages/MyDonationsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const BeneficiariesPage = lazy(() => import('./pages/BeneficiariesPage'));
const BeneficiaryProfilePage = lazy(() => import('./pages/BeneficiaryProfilePage'));
const DonorDashboardPage = lazy(() => import('./pages/DonorDashboardPage'));
const CaretakerBeneficiariesPage = lazy(() => import('./pages/CaretakerBeneficiariesPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function DonorOrCaretakerHome() {
  const { user } = useAuth();
  if (user?.role === 'donor') return <MyDonationsPage />;
  return <HomePage />;
}

function PageLoader() {
  const { t } = useTranslation();
  return <div className="page page-loader">{t('common.loading')}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><DonorOrCaretakerHome /></ProtectedRoute>} />
              <Route path="/create-post" element={<ProtectedRoute roles={['donor']}><CreatePostPage /></ProtectedRoute>} />
              <Route path="/apply" element={<ProtectedRoute roles={['donor']}><ApplyPage /></ProtectedRoute>} />
              <Route path="/my-donations" element={<ProtectedRoute roles={['donor']}><MyDonationsPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute roles={['donor']}><MessagesPage /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
              <Route path="/beneficiaries" element={<ProtectedRoute><BeneficiariesPage /></ProtectedRoute>} />
              <Route path="/beneficiaries/:id" element={<ProtectedRoute><BeneficiaryProfilePage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute roles={['donor']}><DonorDashboardPage /></ProtectedRoute>} />
              <Route path="/my-beneficiaries" element={<ProtectedRoute roles={['caretaker']}><CaretakerBeneficiariesPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
