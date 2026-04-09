import { useTranslation } from 'react-i18next';

interface Props {
  onRetry?: () => void;
}

export default function ErrorBlock({ onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div className="error-block" role="alert">
      <p>{t('common.error')}</p>
      {onRetry && (
        <button className="btn-primary btn-sm" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
