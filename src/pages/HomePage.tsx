import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { postsApi, beneficiariesApi, type Post, type Beneficiary } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import PostMap from '../components/PostMap';
import AlertWidget from '../components/AlertWidget';
import ErrorBlock from '../components/ErrorBlock';
import CompletionModal from '../components/CompletionModal';
import ClaimModal from '../components/ClaimModal';

type Period = 'today' | 'week' | undefined;

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allBeneficiaries, setAllBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<Period>(undefined);
  const [selected, setSelected] = useState<Post | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingPost, setCompletingPost] = useState<Post | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [preSelectedBeneficiary, setPreSelectedBeneficiary] = useState<string | null>(null);

  const isCaretaker = user?.role === 'caretaker';

  const fetchPosts = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await postsApi.list(period ? { period } : undefined);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    beneficiariesApi.list().then(setAllBeneficiaries).catch(() => {});
  }, []);

  const beneficiaries = useMemo(
    () => isCaretaker ? allBeneficiaries.filter(b => b.caretakerId === user?._id) : [],
    [allBeneficiaries, isCaretaker, user?._id]
  );

  const beneficiaryNames = useMemo(
    () => allBeneficiaries.reduce<Record<string, string>>((acc, b) => {
      acc[b._id] = b.name;
      return acc;
    }, {}),
    [allBeneficiaries]
  );

  const claimingPost = isCaretaker && selected?.status === 'open' ? selected : null;

  async function handleClaim(id: string, beneficiaryId?: string | null) {
    setClaimingId(id);
    if (beneficiaryId) setPreSelectedBeneficiary(beneficiaryId);
    try {
      const updated = await postsApi.claim(id);
      setPosts(prev => prev.map(p => p._id === id ? updated : p));
      setSelected(updated);
    } catch {
      setError('fetch_error');
    } finally {
      setClaimingId(null);
    }
  }

  function handleCompleteClick(id: string) {
    if (preSelectedBeneficiary) {
      handleComplete(id, preSelectedBeneficiary);
      return;
    }
    const post = posts.find(p => p._id === id);
    if (post) setCompletingPost(post);
  }

  async function handleComplete(postId: string, beneficiaryId: string) {
    setIsCompleting(true);
    try {
      const updated = await postsApi.complete(postId, beneficiaryId);
      setPosts(prev => prev.map(p => p._id === postId ? updated : p));
      setCompletingPost(null);
      setSelected(null);
      setPreSelectedBeneficiary(null);
    } catch {
      setError('fetch_error');
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h1>{t('posts.title')}</h1>
        <div className="home-page__filters">
          {([undefined, 'today', 'week'] as Period[]).map(p => (
            <button
              key={p ?? 'all'}
              className={`btn-filter ${period === p ? 'btn-filter--active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {t(`posts.filters.${p ?? 'all'}`)}
            </button>
          ))}
        </div>
      </div>

      {isCaretaker && <AlertWidget onViewAll={() => setPeriod('today')} />}

      <div className="home-page__body">
        <PostMap
          posts={posts}
          selectedPostId={selected?._id}
          onPostClick={setSelected}
          className="home-page__map"
        />

        <div className="home-page__list">
          {error && <ErrorBlock onRetry={fetchPosts} />}
          {loading && <p>{t('common.loading')}</p>}
          {!loading && posts.length === 0 && <p>{t('posts.empty')}</p>}
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              selected={selected?._id === post._id}
              onSelect={setSelected}
              onClaim={isCaretaker ? (id) => { const p = posts.find(x => x._id === id); if (p) setSelected(p); } : undefined}
              onComplete={isCaretaker && post.claimedBy === user?._id ? handleCompleteClick : undefined}
              claiming={claimingId === post._id}
              completing={completingPost?._id === post._id && isCompleting}
              showActions={isCaretaker}
              targetBeneficiaryName={post.targetBeneficiaryId ? beneficiaryNames[post.targetBeneficiaryId] : undefined}
            />
          ))}
        </div>
      </div>

      {claimingPost && (
        <ClaimModal
          post={claimingPost}
          beneficiaries={beneficiaries}
          onClaim={handleClaim}
          onClose={() => setSelected(null)}
          claiming={claimingId === claimingPost._id}
          targetBeneficiaryName={claimingPost.targetBeneficiaryId ? beneficiaryNames[claimingPost.targetBeneficiaryId] : undefined}
        />
      )}

      {completingPost && (
        <CompletionModal
          post={completingPost}
          beneficiaries={beneficiaries}
          onComplete={handleComplete}
          onClose={() => setCompletingPost(null)}
          completing={isCompleting}
          preSelectedBeneficiary={preSelectedBeneficiary}
        />
      )}
    </div>
  );
}
