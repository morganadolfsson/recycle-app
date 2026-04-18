import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { postsApi, favoritesApi, type PostItem, type ItemType, type Beneficiary } from '../lib/api';
import PostMap from '../components/PostMap';

const ITEM_TYPES: ItemType[] = ['can', 'pet_small', 'pet_large', 'glass_small', 'glass_large'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreatePostPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<PostItem[]>([{ type: 'can', quantity: 1 }]);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [instructions, setInstructions] = useState('');
  const [pickupDate, setPickupDate] = useState(todayStr());
  const [timeFrom, setTimeFrom] = useState('13:00');
  const [timeTo, setTimeTo] = useState('14:00');
  const [targetBeneficiaryId, setTargetBeneficiaryId] = useState('');
  const [favorites, setFavorites] = useState<Beneficiary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    favoritesApi.list().then(setFavorites).catch(err => console.error('favorites fetch failed', err));
  }, []);

  function addItem() {
    const used = new Set(items.map(i => i.type));
    const next = ITEM_TYPES.find(type => !used.has(type));
    if (next) setItems([...items, { type: next, quantity: 1 }]);
  }

  function updateItem(idx: number, field: 'type' | 'quantity', value: string | number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      if (field === 'type') return { ...item, type: value as ItemType };
      return { ...item, quantity: Math.max(1, Math.min(9999, Number(value))) };
    }));
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    const start = new Date(`${pickupDate}T${timeFrom}`);
    const end = new Date(`${pickupDate}T${timeTo}`);
    if (start >= end) { setError(t('posts.errorTimeOrder')); return; }
    if (start < new Date()) { setError(t('posts.errorTimePast')); return; }
    setSubmitting(true);
    setError('');
    try {
      await postsApi.create({
        items,
        meetingPoint: pin,
        meetingInstructions: instructions || undefined,
        timeWindowStart: start.toISOString(),
        timeWindowEnd: end.toISOString(),
        targetBeneficiaryId: targetBeneficiaryId || undefined,
      });
      navigate('/');
    } catch {
      setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page create-post-page">
      <h1>{t('posts.createTitle')}</h1>

      <form onSubmit={handleSubmit} className="form">
        <fieldset className="create-post__items">
          <legend>{t('posts.items')}</legend>
          {items.map((item, idx) => (
            <div key={idx} className="create-post__item-row">
              <select
                value={item.type}
                onChange={e => updateItem(idx, 'type', e.target.value)}
                aria-label={t('posts.items')}
              >
                {ITEM_TYPES.map(type => (
                  <option key={type} value={type}>{t(`posts.itemTypes.${type}`)}</option>
                ))}
              </select>
              <label className="create-post__qty-label">
                {t('posts.quantity')}
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                />
              </label>
              {items.length > 1 && (
                <button type="button" className="btn-link" onClick={() => removeItem(idx)}>
                  {t('posts.removeItem')}
                </button>
              )}
            </div>
          ))}
          {items.length < ITEM_TYPES.length && (
            <button type="button" className="btn-link" onClick={addItem}>
              + {t('posts.addItem')}
            </button>
          )}
        </fieldset>

        {favorites.length > 0 && (
          <label>
            {t('posts.targetBeneficiary')}
            <select value={targetBeneficiaryId} onChange={e => setTargetBeneficiaryId(e.target.value)}>
              <option value="">{t('posts.generalDonation')}</option>
              {favorites.map(b => (
                <option key={b._id} value={b._id}>{b.name} — {b.organizationName}</option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="create-post__location">
          <legend>{t('posts.meetingPoint')}</legend>
          <p className="create-post__hint">{t('posts.pinDropHint')}</p>
          <PostMap
            pinDrop
            pinPosition={pin}
            onPinDrop={(lat, lng) => setPin({ lat, lng })}
            className="create-post__map"
          />
        </fieldset>

        <label>
          {t('posts.meetingInstructions')}
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={t('posts.meetingInstructionsHint')}
          />
        </label>

        <fieldset className="create-post__time">
          <legend>{t('posts.timeWindow')}</legend>
          <label>
            {t('posts.pickupDate')}
            <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} required min={todayStr()} />
          </label>
          <div className="create-post__time-row">
            <label>
              {t('posts.from')}
              <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} required />
            </label>
            <label>
              {t('posts.to')}
              <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} required />
            </label>
          </div>
        </fieldset>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" disabled={submitting || !pin || !pickupDate || !timeFrom || !timeTo}>
          {submitting ? t('posts.creating') : t('posts.submit')}
        </button>
      </form>
    </div>
  );
}
