import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../lib/api';
import { getErrorStatus } from '../lib/errors';

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      setError(getErrorStatus(err) === 401 ? t('auth.wrongPassword') : t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('auth.changePasswordTitle')}</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="current-password">
            {t('auth.currentPassword')}
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label htmlFor="new-password">
            {t('auth.newPassword')}
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{t('auth.passwordChanged')}</p>}
          <button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.changePasswordButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
