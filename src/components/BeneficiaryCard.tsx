import { useTranslation } from 'react-i18next';
import { type Beneficiary, type DonorBeneficiaryStat } from '../lib/api';
import LevelBadge from './LevelBadge';

interface Props {
  beneficiary: Beneficiary;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  donorStats?: DonorBeneficiaryStat;
  onClick?: () => void;
}

export default function BeneficiaryCard({
  beneficiary, isFavorited, onToggleFavorite, donorStats, onClick,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="beneficiary-card" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="beneficiary-card__photo">
        {beneficiary.photoUrl
          ? <img src={beneficiary.photoUrl} alt={beneficiary.name} />
          : <span className="beneficiary-card__initials">{beneficiary.name.charAt(0)}</span>
        }
      </div>
      <div className="beneficiary-card__info">
        <div className="beneficiary-card__header">
          <h3>{beneficiary.name}</h3>
          {onToggleFavorite && (
            <button
              className={`favorite-btn ${isFavorited ? 'favorite-btn--active' : ''}`}
              onClick={e => { e.stopPropagation(); onToggleFavorite(beneficiary._id); }}
              aria-label={isFavorited ? t('beneficiaries.unfavorite') : t('beneficiaries.favorite')}
            >
              {isFavorited ? '\u2764\uFE0F' : '\u{1F90D}'}
            </button>
          )}
        </div>
        <p className="beneficiary-card__org">{beneficiary.organizationName}</p>
        {beneficiary.bio && <p className="beneficiary-card__bio">{beneficiary.bio}</p>}
        <div className="beneficiary-card__stats">
          <span>{beneficiary.totalReceivedSEK} {t('common.kr')} {t('beneficiaries.totalReceived')}</span>
          <span>&middot;</span>
          <span>{beneficiary.supporterCount} {t('beneficiaries.supporters')}</span>
        </div>
        {donorStats && (
          <div className="beneficiary-card__connection">
            <LevelBadge level={donorStats.level} size="sm" />
            <span>{t('beneficiaries.totalDonated', { amount: donorStats.totalSEK, name: beneficiary.name })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
