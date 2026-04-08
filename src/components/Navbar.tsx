import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function toggleLang() {
    const next = i18n.language === 'en' ? 'sv' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">{t('app.title')}</Link>

      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/my-donations">{t('nav.myDonations')}</Link>
            <Link to="/stats">{t('nav.stats')}</Link>
            {user.role === 'admin' && <Link to="/admin">{t('nav.admin')}</Link>}
            {user.role === 'donor' && <Link to="/apply">{t('apply.title')}</Link>}
            <span className="navbar-alias">@{user.alias}</span>
            <button onClick={handleLogout} className="btn-link">{t('nav.logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login">{t('nav.login')}</Link>
            <Link to="/register">{t('nav.register')}</Link>
          </>
        )}
        <button onClick={toggleLang} className="btn-lang" aria-label="Toggle language">
          {i18n.language === 'en' ? 'SV' : 'EN'}
        </button>
      </div>
    </nav>
  );
}
