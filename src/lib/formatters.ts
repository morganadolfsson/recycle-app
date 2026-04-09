import { type TFunction } from 'i18next';
import { type Post } from './api';

export function formatItemSummary(post: Post, t: TFunction): string {
  return post.items
    .map(i => `${i.quantity}x ${t(`posts.itemTypes.${i.type}`)}`)
    .join(', ');
}

export function formatTimeRange(post: Post): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const start = new Date(post.timeWindowStart).toLocaleTimeString([], opts);
  const end = new Date(post.timeWindowEnd).toLocaleTimeString([], opts);
  return `${start} – ${end}`;
}
