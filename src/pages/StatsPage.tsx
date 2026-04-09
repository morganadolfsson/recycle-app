import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { donorApi, type DonorStats } from '../lib/api';
import StatCard from '../components/StatCard';

const BADGE_ORDER = [
  'first_donation', 'regular_donor', 'dedicated_donor',
  '100kr_club', '500kr_club', '1000kr_hero',
] as const;

export default function StatsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    donorApi.myStats()
      .then(setStats)
      .catch(() => setError('fetch_error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;
  if (error) return <div className="page"><p className="error-msg">{t('common.error')}</p></div>;
  if (!stats) return null;

  return (
    <div className="page stats-page">
      <h1>{t('stats.title')}</h1>

      <div className="stats-grid">
        <StatCard label={t('stats.totalSEK')} value={`${stats.totalSEK} ${t('common.kr')}`} />
        <StatCard label={t('stats.totalItems')} value={stats.totalItems} />
        <StatCard label={t('stats.postCount')} value={stats.postCount} />
      </div>

      <h2 className="stats-badges__title">{t('stats.badges')}</h2>
      <div className="stats-badges">
        {BADGE_ORDER.map(badge => {
          const earned = stats.badges.includes(badge);
          return (
            <div
              key={badge}
              className={`badge-card ${earned ? 'badge-card--earned' : 'badge-card--locked'}`}
            >
              <span className="badge-card__icon" aria-hidden="true">
                {earned ? '\u{1F3C6}' : '\u{1F512}'}
              </span>
              <span className="badge-card__name">
                {t(`stats.badgeNames.${badge}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
