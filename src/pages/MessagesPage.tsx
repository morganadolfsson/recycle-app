import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { donorBeneficiaryApi, messagesApi, type Message, type MessageReply } from '../lib/api';
import MessageCard from '../components/MessageCard';

export default function MessagesPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, MessageReply[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      donorBeneficiaryApi.myMessages(),
      messagesApi.myLiked(),
    ]).then(([m, liked]) => {
      setMessages(m);
      setLikedIds(new Set(liked));

      if (m.length > 0) {
        Promise.all(m.slice(0, 20).map(msg =>
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

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;

  return (
    <div className="page messages-page">
      <h1>{t('nav.messages')}</h1>

      {messages.length === 0
        ? <p>{t('dashboard.noMessages')}</p>
        : messages.map(m => (
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
    </div>
  );
}
