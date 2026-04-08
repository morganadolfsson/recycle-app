const BASE = import.meta.env.VITE_API_URL as string;

function getToken() {
  return localStorage.getItem('access_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status });
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('POST', '/auth/register', { email, password }, false),

  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('POST', '/auth/login', { email, password }, false),
};

// ─── Posts ────────────────────────────────────────────────────────────────────
export type ItemType = 'can' | 'pet_small' | 'pet_large' | 'glass_small' | 'glass_large';

export interface PostItem {
  type: ItemType;
  quantity: number;
}

export interface Post {
  _id: string;
  donorId: string;
  donorAlias: string;
  items: PostItem[];
  estimatedSEK: number;
  meetingPoint: { lat: number; lng: number } | null;
  meetingInstructions: string | null;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: 'open' | 'claimed' | 'completed';
  claimedBy: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  distanceKm?: number;
}

export interface CreatePostPayload {
  items: PostItem[];
  meetingPoint: { lat: number; lng: number };
  meetingInstructions?: string;
  timeWindowStart: string;
  timeWindowEnd: string;
}

export const postsApi = {
  list: (params?: { lat?: number; lng?: number; radius?: number; period?: 'today' | 'week' }) => {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined) qs.set('lat', String(params.lat));
    if (params?.lng !== undefined) qs.set('lng', String(params.lng));
    if (params?.radius !== undefined) qs.set('radius', String(params.radius));
    if (params?.period) qs.set('period', params.period);
    const query = qs.toString() ? `?${qs}` : '';
    return request<Post[]>('GET', `/api/posts${query}`);
  },

  get: (id: string) => request<Post>('GET', `/api/posts/${id}`),

  create: (payload: CreatePostPayload) => request<Post>('POST', '/api/posts', payload),

  claim: (id: string) => request<Post>('POST', `/api/posts/${id}/claim`),

  complete: (id: string) => request<Post>('POST', `/api/posts/${id}/complete`),
};

// ─── Donor ────────────────────────────────────────────────────────────────────
export interface DonorStats {
  userId: string;
  totalSEK: number;
  totalItems: number;
  postCount: number;
  badges: string[];
}

export interface User {
  _id: string;
  email: string;
  role: 'donor' | 'collector' | 'admin';
  alias: string;
  displayName?: string;
  savedLat?: number;
  savedLng?: number;
}

export const donorApi = {
  myPosts: () => request<Post[]>('GET', '/api/my/posts'),
  myStats: () => request<DonorStats>('GET', '/api/my/stats'),
  updateProfile: (data: { alias?: string; displayName?: string | null }) =>
    request<User>('PATCH', '/api/my/profile', data),
  saveLocation: (lat: number, lng: number) =>
    request<{ success: boolean }>('PATCH', '/api/my/location', { lat, lng }),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  get: (params?: { lat?: number; lng?: number; radius?: number }) => {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined) qs.set('lat', String(params.lat));
    if (params?.lng !== undefined) qs.set('lng', String(params.lng));
    if (params?.radius !== undefined) qs.set('radius', String(params.radius));
    const query = qs.toString() ? `?${qs}` : '';
    return request<{ count: number; posts: Post[] }>('GET', `/api/alerts${query}`);
  },
};

// ─── Applications ─────────────────────────────────────────────────────────────
export interface Application {
  _id: string;
  userId: string;
  email: string;
  name: string;
  organization: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const applicationsApi = {
  submit: (data: { name: string; organization?: string; message?: string }) =>
    request<Application>('POST', '/api/applications', data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalPosts: number;
  openPosts: number;
  completedPosts: number;
  totalUsers: number;
  collectors: number;
  pendingApplications: number;
  totalSEK: number;
}

export const adminApi = {
  applications: (status = 'pending') =>
    request<Application[]>('GET', `/api/admin/applications?status=${status}`),
  decide: (id: string, decision: 'approved' | 'rejected') =>
    request<{ success: boolean }>('PUT', `/api/admin/applications/${id}`, { decision }),
  stats: () => request<AdminStats>('GET', '/api/admin/stats'),
};

// ─── Pant prices ──────────────────────────────────────────────────────────────
export const pantApi = {
  prices: () => request<Record<string, number>>('GET', '/pant-prices', undefined, false),
};
