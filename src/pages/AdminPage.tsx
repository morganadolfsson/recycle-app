import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi, type Application, type AdminStats } from '../lib/api';
import ErrorBlock from '../components/ErrorBlock';
import StatCard from '../components/StatCard';

type StatusFilter = 'pending' | 'approved' | 'rejected' | undefined;

export default function AdminPage() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.applications(filter);
      setApps(data);
    } catch {
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
  }, []);

  async function handleDecision(id: string, decision: 'approved' | 'rejected') {
    setDecidingId(id);
    try {
      await adminApi.decide(id, decision);
      setApps(prev => prev.filter(a => a._id !== id));
    } catch {
      setError(t('common.error'));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="page admin-page">
      <h1>{t('admin.title')}</h1>

      {stats && (
        <div className="admin-stats">
          <StatCard label={t('admin.totalPosts')} value={stats.totalPosts} />
          <StatCard label={t('admin.openPosts')} value={stats.openPosts} />
          <StatCard label={t('admin.completedPosts')} value={stats.completedPosts} />
          <StatCard label={t('admin.totalUsers')} value={stats.totalUsers} />
          <StatCard label={t('admin.caretakers')} value={stats.caretakers} />
          <StatCard label={t('admin.pendingApplications')} value={stats.pendingApplications} />
          <StatCard label={t('admin.totalSEK')} value={`${stats.totalSEK} kr`} />
        </div>
      )}

      <section className="admin-apps">
        <div className="admin-apps__header">
          <h2>{t('admin.applications')}</h2>
          <div className="admin-apps__filters">
            {([undefined, 'pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
              <button
                key={s ?? 'all'}
                className={`btn-filter ${filter === s ? 'btn-filter--active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {t(`admin.filter${s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}`)}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBlock onRetry={fetchApps} />}
        {loading && <p>{t('common.loading')}</p>}
        {!loading && apps.length === 0 && <p>{t('admin.noApplications')}</p>}

        <div className="admin-apps__list">
          {apps.map(app => (
            <ApplicationCard
              key={app._id}
              app={app}
              deciding={decidingId === app._id}
              onDecide={handleDecision}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ApplicationCard({ app, deciding, onDecide }: {
  app: Application;
  deciding: boolean;
  onDecide: (id: string, decision: 'approved' | 'rejected') => void;
}) {
  const { t } = useTranslation();

  return (
    <div className={`app-card app-card--${app.status}`}>
      <div className="app-card__header">
        <strong>{app.name}</strong>
        <span className={`app-card__status app-card__status--${app.status}`}>
          {t(`admin.filter${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`)}
        </span>
      </div>
      <p className="app-card__email">{app.email}</p>
      {app.organization && (
        <p className="app-card__org">{t('admin.organization')}: {app.organization}</p>
      )}
      {app.message && (
        <p className="app-card__message">{t('admin.message')}: {app.message}</p>
      )}
      <p className="app-card__date">
        {t('admin.appliedOn')} {new Date(app.createdAt).toLocaleDateString()}
      </p>

      {app.status === 'pending' && (
        <div className="app-card__actions">
          <button
            className="btn-primary btn-sm"
            onClick={() => onDecide(app._id, 'approved')}
            disabled={deciding}
          >
            {deciding ? t('admin.approving') : t('admin.approve')}
          </button>
          <button
            className="btn-danger btn-sm"
            onClick={() => onDecide(app._id, 'rejected')}
            disabled={deciding}
          >
            {deciding ? t('admin.rejecting') : t('admin.reject')}
          </button>
        </div>
      )}
    </div>
  );
}
