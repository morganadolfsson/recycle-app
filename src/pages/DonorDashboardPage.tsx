import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  donorApi, donorBeneficiaryApi, favoritesApi, messagesApi, beneficiariesApi,
  type DonorBeneficiaryStat, type Beneficiary, type Message, type Post, type MessageReply,
} from '../lib/api';
import LevelBadge from '../components/LevelBadge';
import MessageCard from '../components/MessageCard';

export default function DonorDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DonorBeneficiaryStat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [favorites, setFavorites] = useState<Beneficiary[]>([]);
  const [recentDonations, setRecentDonations] = useState<(Post & { beneficiaryName?: string })[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, MessageReply[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      donorBeneficiaryApi.myStats(),
      donorBeneficiaryApi.myMessages(),
      favoritesApi.list(),
      donorApi.myPosts(),
      messagesApi.myLiked(),
      beneficiariesApi.list(),
    ]).then(([s, m, f, posts, liked, allBen]) => {
      setStats(s);
      setMessages(m);
      setFavorites(f);
      setLikedIds(new Set(liked));

      const benMap = Object.fromEntries(allBen.map(b => [b._id, b.name]));
      const completed = posts
        .filter(p => p.status === 'completed' && p.assignedBeneficiaryId)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 5)
        .map(p => ({ ...p, beneficiaryName: benMap[p.assignedBeneficiaryId!] }));
      setRecentDonations(completed);

      // Fetch replies for visible messages
      if (m.length > 0) {
        Promise.all(m.slice(0, 10).map(msg =>
          messagesApi.replies(msg._id)
            .then(replies => ({ id: msg._id, replies }))
            .catch(() => ({ id: msg._id, replies: [] as MessageReply[] }))
        )).then(results => {
          const map: Record<string, MessageReply[]> = {};
          results.forEach(r => { map[r.id] = r.replies; });
          setRepliesMap(map);
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  async function toggleLike(messageId: string) {
    try {
      const isLiked = likedIds.has(messageId);
      if (isLiked) {
        await messagesApi.unlike(messageId);
        setLikedIds(prev => { const s = new Set(prev); s.delete(messageId); return s; });
      } else {
        await messagesApi.like(messageId);
        setLikedIds(prev => new Set(prev).add(messageId));
      }
    } catch { /* silent — button state unchanged on failure */ }
  }

  async function handleReply(messageId: string, text: string) {
    const reply = await messagesApi.reply(messageId, text);
    setRepliesMap(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), reply],
    }));
  }

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;

  return (
    <div className="page dashboard-page">
      <h1>{t('dashboard.title')}</h1>

      {recentDonations.length > 0 && (
        <section className="dashboard-section">
          <h2>{t('dashboard.recentDonations')}</h2>
          <div className="dashboard-donations">
            {recentDonations.map(d => (
              <div key={d._id} className="donation-card">
                <div className="donation-card__amount">{d.estimatedSEK} {t('common.kr')}</div>
                <div className="donation-card__info">
                  <span className="donation-card__beneficiary">
                    {t('posts.assignedTo', { name: d.beneficiaryName || '?' })}
                  </span>
                  <span className="donation-card__date">
                    {new Date(d.completedAt!).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <h2>{t('dashboard.connections')}</h2>
        {stats.length === 0 ? (
          <p>{t('dashboard.noConnections')}</p>
        ) : (
          <div className="dashboard-connections">
            {stats.map(s => (
              <div
                key={s._id}
                className="connection-card"
                onClick={() => navigate(`/beneficiaries/${s.beneficiaryId}`)}
                role="button"
                tabIndex={0}
              >
                <div className="connection-card__photo">
                  {s.beneficiaryPhotoUrl
                    ? <img src={s.beneficiaryPhotoUrl} alt={s.beneficiaryName} />
                    : <span>{(s.beneficiaryName || '?').charAt(0)}</span>
                  }
                </div>
                <div className="connection-card__info">
                  <strong>{s.beneficiaryName}</strong>
                  <LevelBadge level={s.level} size="sm" />
                  <span className="connection-card__amount">{s.totalSEK} {t('common.kr')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2>{t('dashboard.recentMessages')}</h2>
        {messages.length === 0
          ? <p>{t('dashboard.noMessages')}</p>
          : messages.slice(0, 10).map(m => (
            <MessageCard
              key={m._id}
              message={m}
              liked={likedIds.has(m._id)}
              onToggleLike={toggleLike}
              showActions
              replies={repliesMap[m._id]}
              onReply={handleReply}
            />
          ))
        }
      </section>

      <section className="dashboard-section">
        <h2>{t('dashboard.favorites')}</h2>
        {favorites.length === 0 ? (
          <p>{t('dashboard.noFavorites')}</p>
        ) : (
          <div className="dashboard-connections">
            {favorites.map(b => (
              <div
                key={b._id}
                className="connection-card"
                onClick={() => navigate(`/beneficiaries/${b._id}`)}
                role="button"
                tabIndex={0}
              >
                <div className="connection-card__photo">
                  {b.photoUrl
                    ? <img src={b.photoUrl} alt={b.name} />
                    : <span>{b.name.charAt(0)}</span>
                  }
                </div>
                <div className="connection-card__info">
                  <strong>{b.name}</strong>
                  <span className="connection-card__org">{b.organizationName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
