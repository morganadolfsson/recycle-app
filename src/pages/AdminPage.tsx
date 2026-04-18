import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  adminApi,
  type Application, type AdminStats, type User, type Beneficiary, type Post, type Message,
} from '../lib/api';
import StatCard from '../components/StatCard';
import ErrorBlock from '../components/ErrorBlock';
import { formatItemSummary } from '../lib/formatters';

type Tab = 'overview' | 'users' | 'beneficiaries' | 'posts' | 'messages' | 'applications';

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: t('admin.tabOverview') },
    { key: 'users', label: t('admin.tabUsers') },
    { key: 'applications', label: t('admin.tabApplications') },
    { key: 'beneficiaries', label: t('admin.tabBeneficiaries') },
    { key: 'posts', label: t('admin.tabPosts') },
    { key: 'messages', label: t('admin.tabMessages') },
  ];

  return (
    <div className="page admin-page">
      <h1>{t('admin.title')}</h1>
      <div className="admin-tabs">
        {tabs.map(tb => (
          <button
            key={tb.key}
            className={`admin-tab ${tab === tb.key ? 'admin-tab--active' : ''}`}
            onClick={() => setTab(tb.key)}
          >
            {tb.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'applications' && <ApplicationsTab />}
      {tab === 'beneficiaries' && <BeneficiariesTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'messages' && <MessagesTab />}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);

  const loadStats = () => {
    setError(false);
    adminApi.stats().then(setStats).catch(() => setError(true));
  };

  useEffect(() => {
    let cancelled = false;
    adminApi.stats()
      .then(data => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorBlock onRetry={loadStats} />;
  if (!stats) return <p>{t('common.loading')}</p>;

  return (
    <div className="admin-stats">
      <StatCard label={t('admin.totalPosts')} value={stats.totalPosts} />
      <StatCard label={t('admin.openPosts')} value={stats.openPosts} />
      <StatCard label={t('admin.completedPosts')} value={stats.completedPosts} />
      <StatCard label={t('admin.totalUsers')} value={stats.totalUsers} />
      <StatCard label={t('admin.caretakers')} value={stats.caretakers} />
      <StatCard label={t('admin.pendingApplications')} value={stats.pendingApplications} />
      <StatCard label={t('admin.totalSEK')} value={`${stats.totalSEK} kr`} />
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

function UsersTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [role, setRole] = useState<'donor' | 'caretaker'>('caretaker');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi.users(roleFilter || undefined)
      .then(setUsers)
      .catch(() => setError('fetch_error'))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg('');
    setCreateSuccess(false);
    try {
      const user = await adminApi.createUser({ email, password, alias, role });
      setUsers(prev => [...prev, user]);
      setEmail(''); setPassword(''); setAlias('');
      setShowForm(false);
      setCreateMsg(t('auth.userCreated'));
      setCreateSuccess(true);
      setTimeout(() => setCreateMsg(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setCreateMsg(msg);
      setCreateSuccess(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(userId: string) {
    if (!editRole) return;
    try {
      const updated = await adminApi.updateUser(userId, { role: editRole });
      setUsers(prev => prev.map(u => u._id === userId ? updated : u));
      setEditingId(null);
    } catch { /* silent */ }
  }

  return (
    <div>
      <div className="admin-section__header">
        <div className="admin-section__filters">
          {['', 'donor', 'caretaker', 'admin'].map(r => (
            <button
              key={r || 'all'}
              className={`btn-filter ${roleFilter === r ? 'btn-filter--active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r ? t(`admin.role_${r}`) : t('admin.filterAll')}
            </button>
          ))}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          + {t('admin.createUser')}
        </button>
      </div>

      {showForm && (
        <form className="form admin-create-form" onSubmit={handleCreate}>
          <label>
            {t('auth.email')}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            {t('auth.password')}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </label>
          <label>
            {t('auth.alias')}
            <input value={alias} onChange={e => setAlias(e.target.value)} required maxLength={50} />
          </label>
          <label>
            {t('auth.role')}
            <select value={role} onChange={e => setRole(e.target.value as 'donor' | 'caretaker')}>
              <option value="caretaker">{t('admin.role_caretaker')}</option>
              <option value="donor">{t('admin.role_donor')}</option>
            </select>
          </label>
          <button type="submit" disabled={creating}>
            {creating ? t('common.loading') : t('admin.createUser')}
          </button>
        </form>
      )}

      {createMsg && <p className={createSuccess ? 'success-msg' : 'error-msg'}>{createMsg}</p>}
      {error && <ErrorBlock onRetry={fetchUsers} />}
      {loading && <p>{t('common.loading')}</p>}

      <div className="admin-table">
        {users.map(u => (
          <div key={u._id} className="admin-row">
            <div className="admin-row__main">
              <strong>@{u.alias}</strong>
              <span className="admin-row__email">{u.email}</span>
            </div>
            <div className="admin-row__actions">
              {editingId === u._id ? (
                <>
                  <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="donor">{t('admin.role_donor')}</option>
                    <option value="caretaker">{t('admin.role_caretaker')}</option>
                    <option value="admin">{t('admin.role_admin')}</option>
                  </select>
                  <button className="btn-primary btn-sm" onClick={() => handleRoleChange(u._id)}>
                    {t('common.save')}
                  </button>
                  <button className="btn-link" onClick={() => setEditingId(null)}>
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <span className={`admin-role-badge admin-role-badge--${u.role}`}>{u.role}</span>
                  <button className="btn-link" onClick={() => { setEditingId(u._id); setEditRole(u.role); }}>
                    {t('beneficiaries.edit')}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Applications ────────────────────────────────────────────────────────────

type StatusFilter = 'pending' | 'approved' | 'rejected' | undefined;

function ApplicationsTab() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setApps(await adminApi.applications(filter));
    } catch {
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  async function handleDecision(id: string, decision: 'approved' | 'rejected') {
    setDecidingId(id);
    try {
      await adminApi.decide(id, decision);
      setApps(prev => prev.filter(a => a._id !== id));
    } catch {
      setError(t('common.error'));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div>
      <div className="admin-section__header">
        <div className="admin-section__filters">
          {([undefined, 'pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
            <button
              key={s ?? 'all'}
              className={`btn-filter ${filter === s ? 'btn-filter--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {t(`admin.filter${s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}`)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBlock onRetry={fetchApps} />}
      {loading && <p>{t('common.loading')}</p>}
      {!loading && apps.length === 0 && <p>{t('admin.noApplications')}</p>}

      <div className="admin-table">
        {apps.map(app => (
          <div key={app._id} className="admin-row">
            <div className="admin-row__main">
              <strong>{app.name}</strong>
              <span className="admin-row__email">{app.email}</span>
              {app.organization && <span className="admin-row__sub">{app.organization}</span>}
              {app.message && <span className="admin-row__sub admin-row__sub--italic">"{app.message}"</span>}
            </div>
            <div className="admin-row__actions">
              <span className={`admin-role-badge admin-role-badge--${app.status}`}>{app.status}</span>
              {app.status === 'pending' && (
                <>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleDecision(app._id, 'approved')}
                    disabled={decidingId === app._id}
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDecision(app._id, 'rejected')}
                    disabled={decidingId === app._id}
                  >
                    {t('admin.reject')}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Beneficiaries ───────────────────────────────────────────────────────────

function BeneficiariesTab() {
  const { t } = useTranslation();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const fetchBeneficiaries = () => {
    setError('');
    setLoading(true);
    adminApi.beneficiaries()
      .then(setBeneficiaries)
      .catch(() => setError('fetch_error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    adminApi.beneficiaries()
      .then(data => { if (!cancelled) setBeneficiaries(data); })
      .catch(() => { if (!cancelled) setError('fetch_error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSave(id: string) {
    setSaveError(false);
    try {
      const updated = await adminApi.updateBeneficiary(id, { name: editName, bio: editBio });
      setBeneficiaries(prev => prev.map(b => b._id === id ? updated : b));
      setEditingId(null);
    } catch { setSaveError(true); }
  }

  async function toggleActive(b: Beneficiary) {
    setSaveError(false);
    try {
      const updated = await adminApi.updateBeneficiary(b._id, { isActive: !b.isActive });
      setBeneficiaries(prev => prev.map(x => x._id === b._id ? updated : x));
    } catch { setSaveError(true); }
  }

  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <ErrorBlock onRetry={fetchBeneficiaries} />;

  return (
    <div className="admin-table">
      {saveError && <p className="error-msg">{t('common.error')}</p>}
      {beneficiaries.map(b => (
        <div key={b._id} className={`admin-row ${!b.isActive ? 'admin-row--inactive' : ''}`}>
          <div className="admin-row__main">
            {editingId === b._id ? (
              <div className="admin-inline-edit">
                <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={100} />
                <input value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={500} placeholder={t('beneficiaries.bio')} />
              </div>
            ) : (
              <>
                <strong>{b.name}</strong>
                {b.bio && <span className="admin-row__sub">{b.bio}</span>}
              </>
            )}
            <span className="admin-row__sub">
              {b.organizationName} &middot; {b.totalReceivedSEK} {t('common.kr')} &middot; {b.supporterCount} {t('beneficiaries.supporters')}
            </span>
          </div>
          <div className="admin-row__actions">
            <span className={`admin-role-badge ${b.isActive ? 'admin-role-badge--approved' : 'admin-role-badge--rejected'}`}>
              {b.isActive ? t('beneficiaries.activate') : t('beneficiaries.deactivate')}
            </span>
            {editingId === b._id ? (
              <>
                <button className="btn-primary btn-sm" onClick={() => handleSave(b._id)}>{t('common.save')}</button>
                <button className="btn-link" onClick={() => setEditingId(null)}>{t('common.cancel')}</button>
              </>
            ) : (
              <>
                <button className="btn-link" onClick={() => { setEditingId(b._id); setEditName(b.name); setEditBio(b.bio || ''); }}>
                  {t('beneficiaries.edit')}
                </button>
                <button className="btn-link" onClick={() => toggleActive(b)}>
                  {b.isActive ? t('beneficiaries.deactivate') : t('beneficiaries.activate')}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Posts ────────────────────────────────────────────────────────────────────

function PostsTab() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    adminApi.posts(statusFilter || undefined)
      .then(data => { if (!cancelled) setPosts(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [statusFilter]);

  return (
    <div>
      <div className="admin-section__header">
        <div className="admin-section__filters">
          {['', 'open', 'claimed', 'completed'].map(s => (
            <button
              key={s || 'all'}
              className={`btn-filter ${statusFilter === s ? 'btn-filter--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s ? t(`posts.status.${s}`) : t('admin.filterAll')}
            </button>
          ))}
        </div>
      </div>
      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="error-msg">{t('common.error')}</p>}
      <div className="admin-table">
        {posts.map(p => (
          <div key={p._id} className="admin-row">
            <div className="admin-row__main">
              <strong>{p.estimatedSEK} {t('common.kr')}</strong>
              <span className="admin-row__sub">
                @{p.donorAlias} &middot; {formatItemSummary(p, t)}
              </span>
              <span className="admin-row__sub">{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="admin-row__actions">
              <span className={`post-status-badge post-status-badge--${p.status}`}>
                {t(`posts.status.${p.status}`)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────

function MessagesTab() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi.messages()
      .then(setMessages)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <p className="error-msg">{t('common.error')}</p>;
  if (messages.length === 0) return <p>{t('dashboard.noMessages')}</p>;

  return (
    <div className="admin-table">
      {messages.map(m => (
        <div key={m._id} className="admin-row">
          <div className="admin-row__main">
            <p className="admin-row__msg-text">"{m.text}"</p>
            <span className="admin-row__sub">
              {m.beneficiaryName || '?'} {m.donorAlias ? `→ @${m.donorAlias}` : ''} &middot; {new Date(m.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
