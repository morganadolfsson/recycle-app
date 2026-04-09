import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Post, type Beneficiary } from '../lib/api';
import BeneficiarySelector from './BeneficiarySelector';

interface Props {
  post: Post;
  beneficiaries: Beneficiary[];
  onComplete: (postId: string, beneficiaryId: string) => void;
  onClose: () => void;
  completing?: boolean;
  preSelectedBeneficiary?: string | null;
}

export default function CompletionModal({ post, beneficiaries, onComplete, onClose, completing, preSelectedBeneficiary }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(preSelectedBeneficiary || post.targetBeneficiaryId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{t('completion.title')}</h2>
        <p className="modal-hint">{t('completion.hint', { amount: post.estimatedSEK })}</p>

        <BeneficiarySelector
          beneficiaries={beneficiaries}
          selected={selected}
          onSelect={setSelected}
          label={t('completion.selectBeneficiary')}
          required
        />

        <div className="modal-actions">
          <button className="btn-link" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="btn-primary"
            disabled={!selected || completing}
            onClick={() => selected && onComplete(post._id, selected)}
          >
            {completing ? t('posts.completing') : t('completion.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
