import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Post, type Beneficiary } from '../lib/api';
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

  const itemSummary = formatItemSummary(post, t);
  const timeRange = formatTimeRange(post);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content claim-modal" onClick={e => e.stopPropagation()}>
        <h2>{t('claim.title')}</h2>

        <div className="claim-modal__details">
          <p className="claim-modal__items">{itemSummary}</p>
          <p className="claim-modal__meta">
            {post.estimatedSEK} {t('common.kr')} &middot; {timeRange}
          </p>
          <p className="claim-modal__donor">{t('posts.postedBy')} @{post.donorAlias}</p>
          {targetBeneficiaryName && (
            <p className="claim-modal__targeted">
              {t('posts.targetedTo', { name: targetBeneficiaryName })}
            </p>
          )}
        </div>

        <BeneficiarySelector
          beneficiaries={beneficiaries}
          selected={selected}
          onSelect={setSelected}
          label={t('claim.assignBeneficiary')}
        />

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
