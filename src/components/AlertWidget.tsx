import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alertsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onViewAll?: () => void;
}

export default function AlertWidget({ onViewAll }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'caretaker') return;

    const params = user.savedLat && user.savedLng
      ? { lat: user.savedLat, lng: user.savedLng, radius: 5 }
      : undefined;

    alertsApi.get(params)
      .then(data => setCount(data.count))
      .catch(() => setCount(null));
  }, [user]);

  if (user?.role !== 'caretaker' || count === null) return null;

  return (
    <div className="alert-widget" role="status">
      <div className="alert-widget__content">
        <span className="alert-widget__icon" aria-hidden="true">
          {count > 0 ? '\u{1F4E6}' : '\u{2705}'}
        </span>
        <span>
          {count > 0
            ? t('alerts.count', { count })
            : t('alerts.none')}
        </span>
      </div>
      {count > 0 && onViewAll && (
        <button className="btn-link alert-widget__link" onClick={onViewAll}>
          {t('alerts.viewAll')}
        </button>
      )}
    </div>
  );
}
