import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { postsApi, type PostItem, type ItemType } from '../lib/api';
import PostMap from '../components/PostMap';

const ITEM_TYPES: ItemType[] = ['can', 'pet_small', 'pet_large', 'glass_small', 'glass_large'];
const PANT_PRICES: Record<ItemType, number> = {
  can: 1, pet_small: 1, pet_large: 2, glass_small: 1, glass_large: 2,
};

function estimateSEK(items: PostItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity * PANT_PRICES[i.type], 0);
}

export default function CreatePostPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<PostItem[]>([{ type: 'can', quantity: 1 }]);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [instructions, setInstructions] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function addItem() {
    const used = new Set(items.map(i => i.type));
    const next = ITEM_TYPES.find(t => !used.has(t));
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
    const start = new Date(timeStart);
    const end = new Date(timeEnd);
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
          <p className="create-post__estimate">
            {t('posts.estimatedValue')}: <strong>{estimateSEK(items)} {t('common.kr')}</strong>
          </p>
        </fieldset>

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
          <div className="create-post__time-row">
            <label>
              {t('posts.from')}
              <input type="datetime-local" value={timeStart} onChange={e => setTimeStart(e.target.value)} required />
            </label>
            <label>
              {t('posts.to')}
              <input type="datetime-local" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} required />
            </label>
          </div>
        </fieldset>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" disabled={submitting || !pin || !timeStart || !timeEnd}>
          {submitting ? t('posts.creating') : t('posts.submit')}
        </button>
      </form>
    </div>
  );
}
