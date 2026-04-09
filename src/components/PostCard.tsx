import { useTranslation } from 'react-i18next';
import { type Post } from '../lib/api';
import { formatItemSummary, formatTimeRange } from '../lib/formatters';

interface Props {
  post: Post;
  onClaim?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSelect?: (post: Post) => void;
  claiming?: boolean;
  completing?: boolean;
  showActions?: boolean;
  selected?: boolean;
  targetBeneficiaryName?: string;
}

export default function PostCard({
  post, onClaim, onComplete, onSelect,
  claiming, completing, showActions = true, selected, targetBeneficiaryName,
}: Props) {
  const { t } = useTranslation();

  const itemSummary = formatItemSummary(post, t);
  const timeRange = formatTimeRange(post);

  return (
    <div
      className={`post-card ${selected ? 'post-card--selected' : ''}`}
      onClick={() => onSelect?.(post)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(post); } }}
    >
      <div className="post-card__header">
        <span className={`post-card__status post-card__status--${post.status}`}>
          {t(`posts.status.${post.status}`)}
        </span>
        <span className="post-card__sek">{post.estimatedSEK} {t('common.kr')}</span>
      </div>

      <p className="post-card__items">{itemSummary}</p>
      <p className="post-card__meta">
        {t('posts.postedBy')} @{post.donorAlias} &middot; {timeRange}
      </p>

      {targetBeneficiaryName && (
        <p className="post-card__beneficiary">
          {t('posts.targetedTo', { name: targetBeneficiaryName })}
        </p>
      )}

      {post.distanceKm !== undefined && (
        <p className="post-card__distance">
          {t('posts.distanceAway', { distance: post.distanceKm.toFixed(1) })}
        </p>
      )}

      {post.status === 'claimed' && post.meetingInstructions && (
        <p className="post-card__instructions">{post.meetingInstructions}</p>
      )}

      {showActions && (
        <div className="post-card__actions">
          {post.status === 'open' && onClaim && (
            <button
              className="btn-primary btn-sm"
              onClick={e => { e.stopPropagation(); onClaim(post._id); }}
              disabled={claiming}
            >
              {claiming ? t('posts.claiming') : t('posts.claimButton')}
            </button>
          )}
          {post.status === 'claimed' && onComplete && (
            <button
              className="btn-primary btn-sm"
              onClick={e => { e.stopPropagation(); onComplete(post._id); }}
              disabled={completing}
            >
              {completing ? t('posts.completing') : t('posts.completeButton')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
