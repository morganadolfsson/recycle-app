import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function toggleLang() {
    const next = i18n.language === 'en' ? 'sv' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  }

  function handleLogout() {
    logout();
    navigate('/login');
    setOpen(false);
  }

  function closeMenu() { setOpen(false); }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>{t('app.title')}</Link>

      <button
        className="navbar-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <span className="navbar-toggle__bar" />
        <span className="navbar-toggle__bar" />
        <span className="navbar-toggle__bar" />
      </button>

      <div className={`navbar-links ${open ? 'navbar-links--open' : ''}`}>
        {user ? (
          <>
            <Link to="/" onClick={closeMenu}>{t('nav.home')}</Link>
            {user.role === 'donor' && <Link to="/create-post" onClick={closeMenu}>{t('nav.createPost')}</Link>}
            {user.role === 'donor' && <Link to="/beneficiaries" onClick={closeMenu}>{t('nav.beneficiaries')}</Link>}
            {user.role === 'caretaker' && <Link to="/my-beneficiaries" onClick={closeMenu}>{t('nav.myBeneficiaries')}</Link>}
            <Link to="/stats" onClick={closeMenu}>{t('nav.stats')}</Link>
            {user.role === 'admin' && <Link to="/admin" onClick={closeMenu}>{t('nav.admin')}</Link>}
            <Link to="/change-password" onClick={closeMenu}>{t('nav.changePassword')}</Link>
            <span className="navbar-alias">@{user.alias}</span>
            <button onClick={handleLogout} className="btn-link">{t('nav.logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>{t('nav.login')}</Link>
          </>
        )}
        <button onClick={toggleLang} className="btn-lang" aria-label="Toggle language">
          {i18n.language === 'en' ? 'SV' : 'EN'}
        </button>
      </div>
    </nav>
  );
}
