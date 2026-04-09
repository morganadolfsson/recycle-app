import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { beneficiariesApi, messagesApi, activityApi, caretakerApi, type Beneficiary, type Message, type MessageReply, type ActivityItem, type Post } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import MessageCard from '../components/MessageCard';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function CaretakerBeneficiariesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);

  // Detail/edit state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'edit'>('overview');
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoError, setEditPhotoError] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Messages + activity state
  const [messages, setMessages] = useState<Message[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [completedPosts, setCompletedPosts] = useState<Post[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, MessageReply[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgPostId, setMsgPostId] = useState<string>('');
  const [msgSent, setMsgSent] = useState(false);
  const [lastSentMsg, setLastSentMsg] = useState<Message | null>(null);

  useEffect(() => {
    if (!user) return;
    beneficiariesApi.list(user._id)
      .then(setBeneficiaries)
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch messages, activity, and completed posts when a beneficiary is selected
  useEffect(() => {
    if (!selectedId) { setMessages([]); setActivity([]); setCompletedPosts([]); setRepliesMap({}); return; }
    setMessagesLoading(true);
    Promise.all([
      beneficiariesApi.messages(selectedId).catch(() => []),
      activityApi.forBeneficiary(selectedId).catch(() => []),
      caretakerApi.myPickups().catch(() => []),
    ]).then(([msgs, act, pickups]) => {
      setMessages(msgs);
      setActivity(act);
      setCompletedPosts(
        pickups.filter(p => p.status === 'completed' && p.assignedBeneficiaryId === selectedId)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      );
      // Fetch replies for each message
      if (msgs.length > 0) {
        Promise.all(msgs.map(m =>
          messagesApi.replies(m._id)
            .then(replies => ({ id: m._id, replies }))
            .catch(() => ({ id: m._id, replies: [] as MessageReply[] }))
        )).then(results => {
          const map: Record<string, MessageReply[]> = {};
          results.forEach(r => { map[r.id] = r.replies; });
          setRepliesMap(map);
        });
      }
    }).finally(() => setMessagesLoading(false));
  }, [selectedId]);

  function handlePhotoFile(e: ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') {
    const file = e.target.files?.[0];
    if (!file) return;
    const setError = target === 'create' ? setPhotoError : setEditPhotoError;
    const setUrl = target === 'create' ? setPhotoUrl : setEditPhotoUrl;
    const ref = target === 'create' ? fileInputRef : editFileRef;
    setError('');
    if (file.size > MAX_FILE_SIZE) {
      setError(t('beneficiaries.photoTooLarge'));
      if (ref.current) ref.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.onerror = () => setError(t('common.error'));
    reader.readAsDataURL(file);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const b = await beneficiariesApi.create({ name, bio: bio || undefined, photoUrl: photoUrl || undefined });
      setBeneficiaries(prev => [...prev, b]);
      setName(''); setBio(''); setPhotoUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  function selectBeneficiary(b: Beneficiary) {
    if (selectedId === b._id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(b._id);
    setDetailTab('overview');
    setEditName(b.name);
    setEditBio(b.bio || '');
    setEditPhotoUrl(b.photoUrl || '');
    setEditPhotoError('');
    setSaveSuccess(false);
    if (editFileRef.current) editFileRef.current.value = '';
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await beneficiariesApi.update(selectedId, {
        name: editName,
        bio: editBio || undefined,
        photoUrl: editPhotoUrl || undefined,
      });
      setBeneficiaries(prev => prev.map(b => b._id === selectedId ? updated : b));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: Beneficiary) {
    try {
      const updated = await beneficiariesApi.update(b._id, { isActive: !b.isActive });
      setBeneficiaries(prev => prev.map(x => x._id === b._id ? updated : x));
    } catch { /* silent */ }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !msgText) return;
    const selectedPost = completedPosts.find(p => p._id === msgPostId);
    try {
      const msg = await messagesApi.create({
        beneficiaryId: selectedId,
        text: msgText,
        donorId: selectedPost?.donorId || undefined,
        postId: msgPostId || undefined,
      });
      setMessages(prev => [msg, ...prev]);
      setMsgText('');
      setMsgPostId('');
      setLastSentMsg(msg);
      setMsgSent(true);
      setTimeout(() => { setMsgSent(false); setLastSentMsg(null); }, 5000);
    } catch { /* silent — form stays open for retry */ }
  }

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;

  const selected = beneficiaries.find(b => b._id === selectedId);

  return (
    <div className="page caretaker-page">
      <div className="caretaker-page__header">
        <h1>{t('beneficiaries.myBeneficiaries')}</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setSelectedId(null); }}>
          + {t('beneficiaries.registerTitle')}
        </button>
      </div>

      {showForm && (
        <form className="form caretaker-form" onSubmit={handleCreate}>
          <label>
            {t('beneficiaries.name')}
            <input value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
          </label>
          <label>
            {t('beneficiaries.bio')}
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={3} />
          </label>
          <label>
            {t('beneficiaries.photo')}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => handlePhotoFile(e, 'create')}
            />
          </label>
          {photoError && <p className="error-msg">{photoError}</p>}
          {photoUrl && (
            <div className="caretaker-form__photo-preview">
              <img src={photoUrl} alt={t('beneficiaries.photoPreview')} />
              <button type="button" className="btn-link" onClick={() => { setPhotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                {t('common.remove')}
              </button>
            </div>
          )}
          <button type="submit" disabled={creating}>
            {creating ? t('common.loading') : t('beneficiaries.register')}
          </button>
        </form>
      )}

      {beneficiaries.length === 0 && !showForm && <p>{t('beneficiaries.noBeneficiaries')}</p>}

      <div className="caretaker-list">
        {beneficiaries.map(b => (
          <div key={b._id}>
            <div
              className={`caretaker-card ${!b.isActive ? 'caretaker-card--inactive' : ''} ${selectedId === b._id ? 'caretaker-card--selected' : ''}`}
              onClick={() => { selectBeneficiary(b); setShowForm(false); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectBeneficiary(b); setShowForm(false); } }}
            >
              <div className="caretaker-card__photo">
                {b.photoUrl
                  ? <img src={b.photoUrl} alt={b.name} />
                  : b.name.charAt(0).toUpperCase()}
              </div>
              <div className="caretaker-card__info">
                <strong>{b.name}</strong>
                {b.bio && <p>{b.bio}</p>}
                <span className="caretaker-card__stats">
                  {b.totalReceivedSEK} {t('common.kr')} &middot; {b.supporterCount} {t('beneficiaries.supporters')}
                </span>
              </div>
              <div className="caretaker-card__actions">
                <button className="btn-link" onClick={e => { e.stopPropagation(); toggleActive(b); }}>
                  {b.isActive ? t('beneficiaries.deactivate') : t('beneficiaries.activate')}
                </button>
              </div>
            </div>

            {selectedId === b._id && selected && (
              <div className="caretaker-detail">
                <div className="caretaker-detail__tabs">
                  <button
                    className={`caretaker-detail__tab ${detailTab === 'overview' ? 'caretaker-detail__tab--active' : ''}`}
                    onClick={() => setDetailTab('overview')}
                  >
                    {t('beneficiaries.overviewTab')}
                  </button>
                  <button
                    className={`caretaker-detail__tab ${detailTab === 'edit' ? 'caretaker-detail__tab--active' : ''}`}
                    onClick={() => setDetailTab('edit')}
                  >
                    {t('beneficiaries.editTab')}
                  </button>
                </div>

                {detailTab === 'overview' && (
                  <>
                    <div className="caretaker-detail__section">
                      <h3>{t('beneficiaries.statsTitle')}</h3>
                      <div className="caretaker-detail__stats-grid">
                        <div className="stat-card">
                          <span className="stat-card__value">{selected.totalReceivedSEK}</span>
                          <span className="stat-card__label">{t('beneficiaries.totalReceived')} ({t('common.kr')})</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-card__value">{selected.supporterCount}</span>
                          <span className="stat-card__label">{t('beneficiaries.supporters')}</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-card__value">{selected.isActive ? '✓' : '✗'}</span>
                          <span className="stat-card__label">{t('beneficiaries.statusLabel')}</span>
                        </div>
                      </div>
                      {selected.bio && <p className="caretaker-detail__bio">{selected.bio}</p>}
                      <p className="caretaker-detail__meta">
                        {t('beneficiaries.registeredOn', { date: new Date(selected.createdAt).toLocaleDateString() })}
                      </p>
                    </div>

                    <div className="caretaker-detail__section">
                      <h3>{t('beneficiaries.messages')} ({messages.length})</h3>
                      <form className="caretaker-detail__msg-compose" onSubmit={handleSendMessage}>
                        {completedPosts.length > 0 && (
                          <select value={msgPostId} onChange={e => setMsgPostId(e.target.value)}>
                            <option value="">{t('messages.selectPickup')}</option>
                            {completedPosts.map(p => (
                              <option key={p._id} value={p._id}>
                                {p.estimatedSEK} {t('common.kr')} — @{p.donorAlias} ({new Date(p.completedAt!).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                        )}
                        <textarea
                          value={msgText}
                          onChange={e => setMsgText(e.target.value)}
                          placeholder={t('messages.messageText')}
                          maxLength={500}
                          rows={2}
                          required
                        />
                        <button type="submit" className="btn-primary btn-sm">
                          {t('messages.postMessage')}
                        </button>
                      </form>
                      {msgSent && lastSentMsg && (
                        <div className="success-msg">
                          {t('messages.sentTo', { donor: lastSentMsg.donorAlias || t('messages.allDonors') })}:
                          "{lastSentMsg.text}"
                        </div>
                      )}
                      {messagesLoading && <p>{t('common.loading')}</p>}
                      {!messagesLoading && messages.length === 0 && <p>{t('beneficiaries.noMessages')}</p>}
                      {messages.map(m => (
                        <MessageCard key={m._id} message={m} replies={repliesMap[m._id]} />
                      ))}
                    </div>

                    <div className="caretaker-detail__section">
                      <h3>{t('beneficiaries.activityTitle')} ({activity.length})</h3>
                        <div className="activity-feed">
                      {activity.length === 0 && <p className="caretaker-detail__empty">{t('beneficiaries.noActivity')}</p>}
                          {activity.map(a => (
                            <div key={a._id} className={`activity-item activity-item--${a.type}`}>
                              <span className="activity-item__icon">
                                {a.type === 'like' ? '\u2764\uFE0F' : '\uD83D\uDCAC'}
                              </span>
                              <div className="activity-item__content">
                                <span className="activity-item__user">@{a.userAlias}</span>
                                {a.type === 'like'
                                  ? <span> {t('beneficiaries.likedMessage')}</span>
                                  : <span> {t('beneficiaries.replied')}: "{a.text}"</span>
                                }
                                <span className="activity-item__date">
                                  {' '}&middot; {new Date(a.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                  </>
                )}

                {detailTab === 'edit' && (
                  <div className="caretaker-detail__section">
                    <h3>{t('beneficiaries.editInfo')}</h3>
                    <form className="form" onSubmit={handleSaveEdit}>
                      <label>
                        {t('beneficiaries.name')}
                        <input value={editName} onChange={e => setEditName(e.target.value)} required maxLength={100} />
                      </label>
                      <label>
                        {t('beneficiaries.bio')}
                        <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={500} rows={3} />
                      </label>
                      <label>
                        {t('beneficiaries.photo')}
                        <input
                          ref={editFileRef}
                          type="file"
                          accept="image/*"
                          onChange={e => handlePhotoFile(e, 'edit')}
                        />
                      </label>
                      {editPhotoError && <p className="error-msg">{editPhotoError}</p>}
                      {editPhotoUrl && (
                        <div className="caretaker-form__photo-preview">
                          <img src={editPhotoUrl} alt={t('beneficiaries.photoPreview')} />
                          <button type="button" className="btn-link" onClick={() => { setEditPhotoUrl(''); if (editFileRef.current) editFileRef.current.value = ''; }}>
                            {t('common.remove')}
                          </button>
                        </div>
                      )}
                      <div className="caretaker-detail__save-row">
                        <button type="submit" className="btn-primary" disabled={saving}>
                          {saving ? t('common.loading') : t('common.save')}
                        </button>
                        {saveSuccess && <span className="success-msg">{t('beneficiaries.saved')}</span>}
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
