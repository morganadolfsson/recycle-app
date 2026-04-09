import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Message, type MessageReply } from '../lib/api';

interface Props {
  message: Message;
  liked?: boolean;
  onToggleLike?: (messageId: string) => void;
  showActions?: boolean;
  replies?: MessageReply[];
  onReply?: (messageId: string, text: string) => void;
}

export default function MessageCard({ message, liked, onToggleLike, showActions, replies, onReply }: Props) {
  const { t } = useTranslation();
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [sending, setSending] = useState(false);

  const date = new Date(message.createdAt).toLocaleDateString();

  async function handleReply() {
    if (!replyText.trim() || !onReply) return;
    setSending(true);
    try {
      await onReply(message._id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } catch { /* leave form open so user can retry */ }
    finally { setSending(false); }
  }

  return (
    <div className="message-card">
      {message.photoUrl && (
        <img src={message.photoUrl} alt="" className="message-card__photo" />
      )}
      <div className="message-card__body">
        <p className="message-card__text">{message.text}</p>
        <p className="message-card__meta">
          {message.beneficiaryName && <strong>{message.beneficiaryName}</strong>}
          {message.donorAlias && <span> &rarr; @{message.donorAlias}</span>}
          {' '}&middot; {date}
        </p>

        {showActions && (
          <div className="message-card__actions">
            {onToggleLike && (
              <button
                className={`message-card__like ${liked ? 'message-card__like--active' : ''}`}
                onClick={() => onToggleLike(message._id)}
              >
                {liked ? '\u2764\uFE0F' : '\u2661'} {t('messages.like')}
              </button>
            )}
            {onReply && (
              <button className="message-card__reply-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
                {t('messages.reply')}
              </button>
            )}
          </div>
        )}

        {showReplyForm && (
          <div className="message-card__reply-form">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={t('messages.replyPlaceholder')}
              maxLength={500}
              rows={2}
            />
            <button
              className="btn-primary btn-sm"
              onClick={handleReply}
              disabled={!replyText.trim() || sending}
            >
              {sending ? t('common.loading') : t('messages.sendReply')}
            </button>
          </div>
        )}

        {replies && replies.length > 0 && (
          <div className="message-card__replies">
            {replies.map(r => (
              <div key={r._id} className="message-card__reply">
                <span className="message-card__reply-author">@{r.userAlias}</span>
                <p className="message-card__reply-text">{r.text}</p>
                <span className="message-card__reply-date">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
