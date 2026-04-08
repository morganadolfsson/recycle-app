import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ApplyPage from './pages/ApplyPage';
import './i18n';
import './App.css';

// Placeholders — filled in Phase 3+
const HomePage = () => <div className="page"><p>Home — coming in Phase 3</p></div>;
const MyDonationsPage = () => <div className="page"><p>My Donations — coming in Phase 5</p></div>;
const StatsPage = () => <div className="page"><p>Stats — coming in Phase 5</p></div>;
const AdminPage = () => <div className="page"><p>Admin — coming in Phase 4</p></div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/apply" element={<ProtectedRoute><ApplyPage /></ProtectedRoute>} />
            <Route path="/my-donations" element={<ProtectedRoute><MyDonationsPage /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
