const BASE = import.meta.env.VITE_API_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

function getToken() {
  return localStorage.getItem('access_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-apikey': API_KEY,
  };
  if (auth) {
    const token = getToken();
    if (token) headers['x-access-token'] = token;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status });
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('POST', '/auth/login', { email, password }, false),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('PATCH', '/api/my/password', { currentPassword, newPassword }),
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
  targetBeneficiaryId: string | null;
  assignedBeneficiaryId: string | null;
  createdAt: string;
  distanceKm?: number;
}

export interface CreatePostPayload {
  items: PostItem[];
  meetingPoint: { lat: number; lng: number };
  meetingInstructions?: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  targetBeneficiaryId?: string;
}

export const caretakerApi = {
  myPickups: () => request<Post[]>('GET', '/api/my/pickups'),
};

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

  complete: (id: string, beneficiaryId: string) => request<Post>('POST', `/api/posts/${id}/complete`, { beneficiaryId }),
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
  role: 'donor' | 'caretaker' | 'admin';
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
  caretakers: number;
  pendingApplications: number;
  totalSEK: number;
}

export const adminApi = {
  applications: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Application[]>('GET', `/api/admin/applications${qs}`);
  },
  decide: (id: string, decision: 'approved' | 'rejected') =>
    request<{ success: boolean }>('PUT', `/api/admin/applications/${id}`, { decision }),
  stats: () => request<AdminStats>('GET', '/api/admin/stats'),
  createUser: (data: { email: string; password: string; alias: string; role?: 'donor' | 'caretaker' }) =>
    request<User>('POST', '/api/admin/users', data),
  users: (role?: string) => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    return request<User[]>('GET', `/api/admin/users${qs}`);
  },
  updateUser: (id: string, data: { role?: string; alias?: string; displayName?: string | null }) =>
    request<User>('PATCH', `/api/admin/users/${id}`, data),
  beneficiaries: () => request<Beneficiary[]>('GET', '/api/admin/beneficiaries'),
  updateBeneficiary: (id: string, data: { name?: string; bio?: string; photoUrl?: string; isActive?: boolean }) =>
    request<Beneficiary>('PATCH', `/api/admin/beneficiaries/${id}`, data),
  posts: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Post[]>('GET', `/api/admin/posts${qs}`);
  },
  messages: () => request<Message[]>('GET', '/api/admin/messages'),
};

// ─── Pant prices ──────────────────────────────────────────────────────────────
export const pantApi = {
  prices: () => request<Record<string, number>>('GET', '/pant-prices', undefined, false),
};

// ─── Beneficiaries ───────────────────────────────────────────────────────────
export interface Beneficiary {
  _id: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  caretakerId: string;
  organizationName: string;
  totalReceivedSEK: number;
  supporterCount: number;
  isActive: boolean;
  createdAt: string;
}

export const beneficiariesApi = {
  list: (caretakerId?: string) => {
    const qs = caretakerId ? `?caretakerId=${encodeURIComponent(caretakerId)}` : '';
    return request<Beneficiary[]>('GET', `/api/beneficiaries${qs}`);
  },
  get: (id: string) => request<Beneficiary>('GET', `/api/beneficiaries/${id}`),
  create: (data: { name: string; bio?: string; photoUrl?: string }) =>
    request<Beneficiary>('POST', '/api/beneficiaries', data),
  update: (id: string, data: { name?: string; bio?: string; photoUrl?: string; isActive?: boolean }) =>
    request<Beneficiary>('PATCH', `/api/beneficiaries/${id}`, data),
  messages: (id: string) => request<Message[]>('GET', `/api/beneficiaries/${id}/messages`),
};

// ─── Favorites ───────────────────────────────────────────────────────────────
export const favoritesApi = {
  list: () => request<Beneficiary[]>('GET', '/api/my/favorites'),
  add: (beneficiaryId: string) => request<{ _id: string }>('POST', '/api/favorites', { beneficiaryId }),
  remove: (beneficiaryId: string) => request<{ success: boolean }>('DELETE', `/api/favorites/${beneficiaryId}`),
};

// ─── Donor-Beneficiary Stats ─────────────────────────────────────────────────
export interface DonorBeneficiaryStat {
  _id: string;
  donorId: string;
  beneficiaryId: string;
  beneficiaryName?: string;
  beneficiaryPhotoUrl?: string | null;
  organizationName?: string;
  totalSEK: number;
  donationCount: number;
  level: number;
}

export const donorBeneficiaryApi = {
  myStats: () => request<DonorBeneficiaryStat[]>('GET', '/api/my/beneficiary-stats'),
  myMessages: () => request<Message[]>('GET', '/api/my/messages'),
};

// ─── Messages ────────────────────────────────────────────────────────────────
export interface Message {
  _id: string;
  beneficiaryId: string;
  caretakerId: string;
  donorId: string | null;
  donorAlias: string | null;
  postId: string | null;
  text: string;
  photoUrl: string | null;
  beneficiaryName?: string;
  createdAt: string;
}

export const messagesApi = {
  create: (data: { beneficiaryId: string; text: string; photoUrl?: string; donorId?: string; postId?: string }) =>
    request<Message>('POST', '/api/messages', data),
  like: (id: string) => request<{ liked: boolean }>('POST', `/api/messages/${id}/like`),
  unlike: (id: string) => request<{ liked: boolean }>('DELETE', `/api/messages/${id}/like`),
  myLiked: () => request<string[]>('GET', '/api/my/liked-messages'),
  reply: (id: string, text: string) => request<MessageReply>('POST', `/api/messages/${id}/reply`, { text }),
  replies: (id: string) => request<MessageReply[]>('GET', `/api/messages/${id}/replies`),
};

// ─── Message Replies ────────────────────────────────────────────────────────
export interface MessageReply {
  _id: string;
  messageId: string;
  beneficiaryId: string;
  userId: string;
  userAlias: string;
  userRole: string;
  text: string;
  createdAt: string;
}

// ─── Beneficiary Activity ───────────────────────────────────────────────────
export interface ActivityItem {
  _id: string;
  type: 'like' | 'reply';
  messageId: string;
  userId: string;
  userAlias: string;
  text?: string;
  createdAt: string;
}

export const activityApi = {
  forBeneficiary: (id: string) => request<ActivityItem[]>('GET', `/api/beneficiaries/${id}/activity`),
};
