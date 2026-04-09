import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { beneficiariesApi, favoritesApi, donorBeneficiaryApi, type Beneficiary, type DonorBeneficiaryStat, type Message } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LevelBadge from '../components/LevelBadge';
import MessageCard from '../components/MessageCard';
import StatCard from '../components/StatCard';

export default function BeneficiaryProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myStats, setMyStats] = useState<DonorBeneficiaryStat | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      beneficiariesApi.get(id),
      beneficiariesApi.messages(id),
      favoritesApi.list(),
      user?.role === 'donor' ? donorBeneficiaryApi.myStats() : Promise.resolve([]),
    ]).then(([b, msgs, favs, stats]) => {
      setBeneficiary(b);
      setMessages(msgs);
      setIsFav(favs.some(f => f._id === id));
      const s = (stats as DonorBeneficiaryStat[]).find(s => s.beneficiaryId === id);
      if (s) setMyStats(s);
    }).finally(() => setLoading(false));
  }, [id, user?.role]);

  async function toggleFav() {
    if (!id) return;
    if (isFav) {
      await favoritesApi.remove(id);
      setIsFav(false);
    } else {
      await favoritesApi.add(id);
      setIsFav(true);
    }
  }

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;
  if (!beneficiary) return <div className="page"><p>{t('common.error')}</p></div>;

  return (
    <div className="page beneficiary-profile">
      <div className="beneficiary-profile__header">
        <div className="beneficiary-profile__photo">
          {beneficiary.photoUrl
            ? <img src={beneficiary.photoUrl} alt={beneficiary.name} />
            : <span className="beneficiary-profile__initials">{beneficiary.name.charAt(0)}</span>
          }
        </div>
        <div>
          <h1>{beneficiary.name}</h1>
          <p className="beneficiary-profile__org">{beneficiary.organizationName}</p>
          <button className={`favorite-btn ${isFav ? 'favorite-btn--active' : ''}`} onClick={toggleFav}>
            {isFav ? '\u2764\uFE0F' : '\u{1F90D}'} {isFav ? t('beneficiaries.unfavorite') : t('beneficiaries.favorite')}
          </button>
        </div>
      </div>

      {beneficiary.bio && <p className="beneficiary-profile__bio">{beneficiary.bio}</p>}

      <div className="beneficiary-profile__stats">
        <StatCard label={t('beneficiaries.totalReceived')} value={`${beneficiary.totalReceivedSEK} ${t('common.kr')}`} />
        <StatCard label={t('beneficiaries.supporters')} value={beneficiary.supporterCount} />
      </div>

      {myStats && (
        <div className="beneficiary-profile__connection">
          <h2>{t('beneficiaries.yourConnection')}</h2>
          <LevelBadge level={myStats.level} />
          <p>{t('beneficiaries.totalDonated', { amount: myStats.totalSEK, name: beneficiary.name })}</p>
        </div>
      )}

      <h2>{t('beneficiaries.messages')}</h2>
      {messages.length === 0
        ? <p>{t('beneficiaries.noMessages')}</p>
        : messages.map(m => <MessageCard key={m._id} message={m} />)
      }
    </div>
  );
}
