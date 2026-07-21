const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://treckwari-backend.onrender.com/api';

/**
 * Custom error class for API responses.
 */
export class APIError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

/**
 * Base fetch function that handles headers, tokens, and errors.
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Base fetch function that handles headers, tokens, and errors.
 */
async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});

  // Add Authorization token if present in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tw_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Include credentials for HTTP-only cookies
  options.credentials = 'include';

  // Set Content-Type to JSON if sending body and not already set
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Intercept 401 Unauthorized errors and attempt a silent token refresh
    if (
      response.status === 401 &&
      !path.includes('/auth/refresh') &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/register')
    ) {
      if (typeof window !== 'undefined') {
        const hasToken = !!localStorage.getItem('tw_token');
        if (hasToken) {
          if (!isRefreshing) {
            isRefreshing = true;
            fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: localStorage.getItem('tw_refresh') || undefined }),
              credentials: 'include'
            })
              .then((res) => {
                if (!res.ok) throw new Error('Session refresh failed');
                return res.json();
              })
              .then((data) => {
                isRefreshing = false;
                localStorage.setItem('tw_token', data.token);
                if (data.refreshToken) {
                  localStorage.setItem('tw_refresh', data.refreshToken);
                }
                onRefreshed(data.token);
              })
              .catch((err) => {
                isRefreshing = false;
                localStorage.removeItem('tw_token');
                localStorage.removeItem('tw_refresh');
                window.dispatchEvent(new Event('tw-logout'));
                refreshSubscribers = [];
              });
          }

          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              headers.set('Authorization', `Bearer ${newToken}`);
              fetch(url, { ...options, headers })
                .then((res) => {
                  const contentType = res.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    return res.json();
                  }
                  return res.text();
                })
                .then((data) => {
                  if (data && (data as any).error) {
                    reject(new APIError((data as any).error, 401, data));
                  } else {
                    resolve(data);
                  }
                })
                .catch((err) => reject(err));
            });
          });
        }
      }
    }

    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMsg = responseData?.error || responseData || 'A network error occurred.';
      throw new APIError(errorMsg, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (details: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
    getProfile: () => apiFetch('/auth/profile'),
    updateProfile: (profile: any) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    forgotPassword: (email: string) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    googleLogin: (credential: string, rememberMe: boolean = false) => apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ credential, rememberMe }) }),
    refresh: (refreshToken?: string) => apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    verifyEmail: (token: string) => apiFetch(`/auth/verify-email?token=${token}`),
    resendVerification: (email: string) => apiFetch('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, newPassword: string) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password: newPassword }) }),
    uploadAvatar: (avatarBase64: string) => apiFetch('/auth/profile/avatar', { method: 'POST', body: JSON.stringify({ avatar: avatarBase64 }) }),
    removeAvatar: () => apiFetch('/auth/profile/avatar', { method: 'DELETE' }),
    getSessions: () => apiFetch('/auth/sessions'),
    revokeSession: (id: string) => apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' }),
    logout: (refreshToken?: string) => apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    logoutAll: () => apiFetch('/auth/logout-all', { method: 'POST' })
  },

  // Organization Settings
  settings: {
    get: () => apiFetch('/settings'),
    update: (settings: any) => apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) })
  },

  // Events / Treks
  events: {
    list: (filters: Record<string, any> = {}) => {
      const query = new URLSearchParams(filters).toString();
      return apiFetch(`/events${query ? `?${query}` : ''}`);
    },
    get: (slug: string) => apiFetch(`/events/${slug}`),
    create: (data: any) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) => apiFetch(`/events/${id}/duplicate`, { method: 'POST' })
  },

  // Trek Policies & Preparation CMS
  policies: {
    list: (isTemplate?: boolean) => apiFetch(`/policies${isTemplate !== undefined ? `?isTemplate=${isTemplate}` : ''}`),
    get: (id: string) => apiFetch(`/policies/${id}`),
    create: (data: any) => apiFetch('/policies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    duplicate: (id: string) => apiFetch(`/policies/${id}/duplicate`, { method: 'POST' }),
    delete: (id: string) => apiFetch(`/policies/${id}`, { method: 'DELETE' }),
    assign: (policyId: string, eventIds: string[]) => apiFetch('/policies/assign', { method: 'POST', body: JSON.stringify({ policyId, eventIds }) })
  },

  // Bookings
  bookings: {
    create: (data: any) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    validateCoupon: (code: string, subtotal: number) => apiFetch('/bookings/coupons/validate', { 
      method: 'POST', 
      body: JSON.stringify({ code, subtotal }) 
    }),
    confirmPayment: (bookingId: string, paymentId: string, razorpayOrderId?: string, razorpaySignature?: string) => 
      apiFetch('/bookings/confirm-payment', { 
        method: 'POST', 
        body: JSON.stringify({ bookingId, paymentId, razorpayOrderId, razorpaySignature }) 
      }),
    myBookings: () => apiFetch('/bookings/my-bookings'),
    verify: (id: string) => apiFetch(`/bookings/verify/${id}`),
    all: () => apiFetch('/bookings/admin/all'),
    downloadTicketPdf: async (id: string) => {
      const token = localStorage.getItem('tw_token');
      const res = await fetch(`${API_URL}/bookings/${id}/ticket/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to download ticket PDF');
      return res.blob();
    },
    verifyQR: (qrPayload: any) => apiFetch('/bookings/scan/verify', { method: 'POST', body: JSON.stringify({ qrPayload }) }),
    checkIn: (bookingMemberId: string, deviceInfo?: string, location?: string) => 
      apiFetch('/bookings/scan/checkin', { 
        method: 'POST', 
        body: JSON.stringify({ bookingMemberId, deviceInfo, location }) 
      }),
    getAttendanceStats: (eventId?: string, search?: string) => {
      const params: any = {};
      if (eventId) params.eventId = eventId;
      if (search) params.search = search;
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/bookings/admin/attendance-stats${query ? `?${query}` : ''}`);
    }
  },

  // Notifications
  notifications: {
    list: () => apiFetch('/notifications'),
    markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiFetch('/notifications/read-all', { method: 'PUT' })
  },

  weather: {
    get: (params: { location?: string; eventId?: string; slug?: string }) => {
      const queryParams = new URLSearchParams(params as any).toString();
      return apiFetch(`/weather?${queryParams}`);
    }
  },

  // Reviews
  reviews: {
    submit: (slug: string, data: any) => apiFetch(`/events/${slug}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    getPending: () => apiFetch('/events/admin/reviews/pending'),
    approve: (id: string) => apiFetch(`/events/admin/reviews/${id}/approve`, { method: 'PUT' }),
    delete: (id: string) => apiFetch(`/events/reviews/${id}`, { method: 'DELETE' }),
    edit: (id: string, data: any) => apiFetch(`/events/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, data: { pinned?: boolean; hidden?: boolean; replyComment?: string }) => 
      apiFetch(`/events/admin/reviews/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    getAnalytics: () => apiFetch('/events/admin/reviews/analytics')
  },

  // Trek Leaders
  leader: {
    getMyEvents: () => apiFetch('/leader/my-events'),
    getRoster: (eventId: string) => apiFetch(`/leader/roster/${eventId}`),
    markAttendance: (memberId: string, status: string) => apiFetch('/leader/attendance', { method: 'POST', body: JSON.stringify({ memberId, status }) })
  },

  // Adventure Memories (Mini-Instagram)
  memories: {
    list: (eventId?: string, search?: string, filterStatus?: string, sortBy?: string) => {
      let query = '';
      const params = [];
      if (eventId) params.push(`eventId=${eventId}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (filterStatus) params.push(`filterStatus=${filterStatus}`);
      if (sortBy) params.push(`sortBy=${sortBy}`);
      if (params.length > 0) query = `?${params.join('&')}`;
      return apiFetch(`/memories${query}`);
    },
    create: (data: any) => apiFetch('/memories', { method: 'POST', body: JSON.stringify(data) }),
    toggleLike: (memoryId: string) => apiFetch(`/memories/${memoryId}/like`, { method: 'POST' }),
    comment: (memoryId: string, text: string) => apiFetch(`/memories/${memoryId}/comment`, { method: 'POST', body: JSON.stringify({ text }) }),
    delete: (id: string) => apiFetch(`/memories/${id}`, { method: 'DELETE' }),
    toggleHide: (id: string) => apiFetch(`/memories/${id}/toggle-hide`, { method: 'PUT' }),
    togglePin: (id: string) => apiFetch(`/memories/${id}/toggle-pin`, { method: 'PUT' })
  },

  // Blogs
  blogs: {
    list: (query?: string) => apiFetch(`/blogs${query ? `?${query}` : ''}`),
    adminAll: () => apiFetch('/blogs/admin/all'),
    get: (slug: string) => apiFetch(`/blogs/${slug}`),
    create: (data: any) => apiFetch('/blogs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    togglePublish: (id: string) => apiFetch(`/blogs/${id}/publish`, { method: 'PATCH' }),
    toggleFeatured: (id: string) => apiFetch(`/blogs/${id}/featured`, { method: 'PATCH' }),
    duplicate: (id: string) => apiFetch(`/blogs/${id}/duplicate`, { method: 'POST' }),
    delete: (id: string) => apiFetch(`/blogs/${id}`, { method: 'DELETE' }),
    share: (id: string) => apiFetch(`/blogs/${id}/share`, { method: 'POST' }),
    like: (id: string) => apiFetch(`/blogs/${id}/like`, { method: 'POST' }),
    versions: (id: string) => apiFetch(`/blogs/${id}/versions`),
    restoreVersion: (id: string, versionId: string) => apiFetch(`/blogs/${id}/versions/${versionId}/restore`, { method: 'POST' }),
    categories: () => apiFetch('/blogs/categories'),
    createCategory: (data: any) => apiFetch('/blogs/categories', { method: 'POST', body: JSON.stringify(data) }),
    deleteCategory: (id: string) => apiFetch(`/blogs/categories/${id}`, { method: 'DELETE' }),
    addComment: (id: string, content: string) => apiFetch(`/blogs/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    deleteComment: (commentId: string) => apiFetch(`/blogs/comments/${commentId}`, { method: 'DELETE' })
  },

  // Gallery CMS
  gallery: {
    list: (category?: string) => apiFetch(`/gallery${category ? `?category=${category}` : ''}`),
    upload: (data: any) => apiFetch('/gallery', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/gallery/${id}`, { method: 'DELETE' })
  },

  // Admin Dashboard Statistics
  dashboard: {
    getStats: () => apiFetch('/dashboard/stats')
  },

  // Admin User & Session Controls
  admin: {
    getUsers: (search?: string) => apiFetch(`/admin/users${search ? `?search=${search}` : ''}`),
    toggleUserStatus: (id: string, isActive: boolean) => apiFetch(`/admin/users/${id}/status`, { method: 'POST', body: JSON.stringify({ isActive }) }),
    verifyUserEmail: (id: string) => apiFetch(`/admin/users/${id}/verify`, { method: 'POST' }),
    resetUserPassword: (id: string) => apiFetch(`/admin/users/${id}/reset-password`, { method: 'POST' }),
    getUserSessions: (id: string) => apiFetch(`/admin/users/${id}/sessions`),
    revokeUserSession: (sessionId: string) => apiFetch(`/admin/sessions/${sessionId}`, { method: 'DELETE' }),
    getAuditLogs: (limit?: number, offset?: number) => {
      const query = new URLSearchParams({
        ...(limit && { limit: String(limit) }),
        ...(offset && { offset: String(offset) })
      }).toString();
      return apiFetch(`/admin/audit-logs${query ? `?${query}` : ''}`);
    },
    updateUserRole: (id: string, role: string) => apiFetch(`/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
    deleteUser: (id: string) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
  }
};
