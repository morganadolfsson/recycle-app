import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  donorApi, donorBeneficiaryApi, beneficiariesApi, messagesApi,
  type Post, type Beneficiary, type Message, type MessageReply,
} from '../lib/api';
import MessageCard from '../components/MessageCard';
import ErrorBlock from '../components/ErrorBlock';

export default function MyDonationsPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allBeneficiaries, setAllBeneficiaries] = useState<Beneficiary[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, MessageReply[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      donorApi.myPosts(),
      beneficiariesApi.list(),
      donorBeneficiaryApi.myMessages(),
      messagesApi.myLiked(),
    ]).then(([p, b, msgs, liked]) => {
      setPosts(p.sort((a, c) => new Date(c.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setAllBeneficiaries(b);
      setAllMessages(msgs);
      setLikedIds(new Set(liked));
    }).catch(() => setError('fetch_error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const benNames = useMemo(
    () => allBeneficiaries.reduce<Record<string, string>>((acc, b) => { acc[b._id] = b.name; return acc; }, {}),
    [allBeneficiaries]
  );

  // Messages for a specific post (by postId match) or general messages for that beneficiary
  function messagesForPost(post: Post): Message[] {
    return allMessages.filter(m =>
      m.postId === post._id ||
      (!m.postId && post.assignedBeneficiaryId && m.beneficiaryId === post.assignedBeneficiaryId)
    );
  }

  function handleExpand(postId: string) {
    if (expandedId === postId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(postId);
    // Fetch replies for messages of this post
    const msgs = messagesForPost(posts.find(p => p._id === postId)!);
    if (msgs.length > 0) {
      Promise.all(msgs.map(m =>
        messagesApi.replies(m._id)
          .then(replies => ({ id: m._id, replies }))
          .catch(() => ({ id: m._id, replies: [] as MessageReply[] }))
      )).then(results => {
        const map: Record<string, MessageReply[]> = {};
        results.forEach(r => { map[r.id] = r.replies; });
        setRepliesMap(prev => ({ ...prev, ...map }));
      });
    }
  }

  async function toggleLike(messageId: string) {
    try {
      if (likedIds.has(messageId)) {
        await messagesApi.unlike(messageId);
        setLikedIds(prev => { const s = new Set(prev); s.delete(messageId); return s; });
      } else {
        await messagesApi.like(messageId);
        setLikedIds(prev => new Set(prev).add(messageId));
      }
    } catch { /* silent */ }
  }

  async function handleReply(messageId: string, text: string) {
    const reply = await messagesApi.reply(messageId, text);
    setRepliesMap(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), reply],
    }));
  }

  function statusLabel(post: Post) {
    if (post.status === 'completed' && post.assignedBeneficiaryId) {
      return t('posts.assignedTo', { name: benNames[post.assignedBeneficiaryId] || '?' });
    }
    if (post.status === 'claimed') return t('donations.accepted');
    if (post.status === 'open') return t('donations.waiting');
    return t(`posts.status.${post.status}`);
  }

  return (
    <div className="page donations-page">
      <h1>{t('donations.title')}</h1>

      {error && <ErrorBlock onRetry={fetchData} />}
      {loading && <p>{t('common.loading')}</p>}
      {!loading && posts.length === 0 && !error && <p>{t('donations.empty')}</p>}

      <div className="donations-list">
        {posts.map(post => {
          const items = post.items.map(i => `${i.quantity}x ${t(`posts.itemTypes.${i.type}`)}`).join(', ');
          const isExpanded = expandedId === post._id;
          const postMessages = isExpanded ? messagesForPost(post) : [];

          return (
            <div key={post._id}>
              <div
                className={`donation-row donation-row--${post.status} ${isExpanded ? 'donation-row--expanded' : ''}`}
                onClick={() => handleExpand(post._id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExpand(post._id); } }}
              >
                <div className="donation-row__main">
                  <span className="donation-row__amount">{post.estimatedSEK} {t('common.kr')}</span>
                  <span className="donation-row__items">{items}</span>
                </div>
                <div className="donation-row__status">
                  <span className={`donation-row__badge donation-row__badge--${post.status}`}>
                    {statusLabel(post)}
                  </span>
                  <span className="donation-row__date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="donation-detail">
                  {postMessages.length > 0 ? (
                    <>
                      <h3>{t('donations.messagesForDonation')}</h3>
                      {postMessages.map(m => (
                        <MessageCard
                          key={m._id}
                          message={m}
                          liked={likedIds.has(m._id)}
                          onToggleLike={toggleLike}
                          showActions
                          replies={repliesMap[m._id]}
                          onReply={handleReply}
                        />
                      ))}
                    </>
                  ) : (
                    <p className="donation-detail__empty">{t('donations.noMessages')}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
