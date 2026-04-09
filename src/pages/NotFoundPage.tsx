import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="page not-found-page">
      <h1>{t('common.notFound')}</h1>
      <p>{t('common.notFoundDesc')}</p>
      <Link to="/" className="btn-primary">{t('common.backHome')}</Link>
    </div>
  );
}
