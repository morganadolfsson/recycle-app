import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { beneficiariesApi, favoritesApi, type Beneficiary } from '../lib/api';
import BeneficiaryCard from '../components/BeneficiaryCard';
import ErrorBlock from '../components/ErrorBlock';

export default function BeneficiariesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [all, favs] = await Promise.all([
        beneficiariesApi.list(),
        favoritesApi.list(),
      ]);
      setBeneficiaries(all);
      setFavIds(new Set(favs.map(f => f._id)));
    } catch {
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleFavorite(id: string) {
    try {
      if (favIds.has(id)) {
        await favoritesApi.remove(id);
        setFavIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        await favoritesApi.add(id);
        setFavIds(prev => new Set(prev).add(id));
      }
    } catch { /* ignore */ }
  }

  const filtered = search
    ? beneficiaries.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : beneficiaries;

  return (
    <div className="page beneficiaries-page">
      <h1>{t('beneficiaries.title')}</h1>

      <input
        type="search"
        className="beneficiaries-search"
        placeholder={t('beneficiaries.search')}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {error && <ErrorBlock onRetry={fetchData} />}
      {loading && <p>{t('common.loading')}</p>}
      {!loading && filtered.length === 0 && <p>{t('beneficiaries.empty')}</p>}

      <div className="beneficiaries-grid">
        {filtered.map(b => (
          <BeneficiaryCard
            key={b._id}
            beneficiary={b}
            isFavorited={favIds.has(b._id)}
            onToggleFavorite={toggleFavorite}
            onClick={() => navigate(`/beneficiaries/${b._id}`)}
          />
        ))}
      </div>
    </div>
  );
}
