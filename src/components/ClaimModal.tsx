import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { messagesApi, type Post, type Beneficiary } from '../lib/api';
import { formatItemSummary, formatTimeRange } from '../lib/formatters';
import BeneficiarySelector from './BeneficiarySelector';

interface Props {
  post: Post;
  beneficiaries: Beneficiary[];
  onClaim: (postId: string, beneficiaryId: string | null) => void;
  onClose: () => void;
  claiming?: boolean;
  targetBeneficiaryName?: string;
}

export default function ClaimModal({ post, beneficiaries, onClaim, onClose, claiming, targetBeneficiaryName }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(post.targetBeneficiaryId);
  const [msgText, setMsgText] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState(false);
  const [sending, setSending] = useState(false);

  const itemSummary = formatItemSummary(post, t);
  const timeRange = formatTimeRange(post);
  const dateStr = new Date(post.timeWindowStart).toLocaleDateString();

  async function handleSendMessage() {
    if (!msgText.trim() || !selected) return;
    setSending(true);
    setMsgError(false);
    try {
      await messagesApi.create({
        beneficiaryId: selected,
        text: msgText.trim(),
        donorId: post.donorId,
        postId: post._id,
      });
      setMsgText('');
      setMsgSent(true);
      setTimeout(() => setMsgSent(false), 3000);
    } catch { setMsgError(true); }
    finally { setSending(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content claim-modal" onClick={e => e.stopPropagation()}>
        <h2>{t('claim.title')}</h2>

        <div className="claim-modal__details">
          <p className="claim-modal__items">{itemSummary}</p>
          <p className="claim-modal__meta">
            {post.estimatedSEK} {t('common.kr')} &middot; {dateStr} &middot; {timeRange}
          </p>
          <p className="claim-modal__donor">{t('posts.postedBy')} @{post.donorAlias}</p>

          {targetBeneficiaryName && (
            <p className="claim-modal__targeted">
              {t('posts.targetedTo', { name: targetBeneficiaryName })}
            </p>
          )}

          {post.meetingInstructions && (
            <div className="claim-modal__instructions">
              <strong>{t('posts.meetingInstructions')}:</strong>
              <p>{post.meetingInstructions}</p>
            </div>
          )}
        </div>

        <BeneficiarySelector
          beneficiaries={beneficiaries}
          selected={selected}
          onSelect={setSelected}
          label={t('claim.assignBeneficiary')}
        />

        <div className="claim-modal__message-section">
          <label>{t('claim.messageDonor')}</label>
          <div className="claim-modal__message-row">
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder={t('claim.messagePlaceholder')}
              maxLength={500}
              rows={2}
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={handleSendMessage}
              disabled={!msgText.trim() || !selected || sending}
            >
              {sending ? '...' : t('messages.sendReply')}
            </button>
          </div>
          {msgSent && <p className="success-msg">{t('messages.posted')}</p>}
          {msgError && <p className="error-msg">{t('common.error')}</p>}
        </div>

        <div className="modal-actions">
          <button className="btn-link" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="btn-primary"
            disabled={claiming}
            onClick={() => onClaim(post._id, selected)}
          >
            {claiming ? t('posts.claiming') : t('claim.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
