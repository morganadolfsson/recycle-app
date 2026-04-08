import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { applicationsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function ApplyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role === 'collector') {
    return (
      <div className="page">
        <p className="success-msg">{t('apply.approved')}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page">
        <p className="success-msg">{t('apply.success')}</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applicationsApi.submit({ name, organization, message });
      setSubmitted(true);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setError(t('apply.pending'));
      } else {
        setError(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>{t('apply.title')}</h1>
      <p className="description">{t('apply.description')}</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          {t('apply.name')}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label>
          {t('apply.organization')}
          <input
            type="text"
            value={organization}
            onChange={e => setOrganization(e.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          {t('apply.message')}
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('apply.submit')}
        </button>
      </form>
    </div>
  );
}
