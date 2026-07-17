const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});

  // Add Authorization token if present in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tw_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set Content-Type to JSON if sending body and not already set
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

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
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (details: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
    getProfile: () => apiFetch('/auth/profile'),
    updateProfile: (profile: any) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    forgotPassword: (email: string) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
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
    confirmPayment: (bookingId: string, paymentId: string, razorpayOrderId?: string, razorpaySignature?: string) => 
      apiFetch('/bookings/confirm-payment', { 
        method: 'POST', 
        body: JSON.stringify({ bookingId, paymentId, razorpayOrderId, razorpaySignature }) 
      }),
    myBookings: () => apiFetch('/bookings/my-bookings'),
    verify: (id: string) => apiFetch(`/bookings/verify/${id}`),
    all: () => apiFetch('/bookings/admin/all')
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
    delete: (id: string) => apiFetch(`/events/reviews/${id}`, { method: 'DELETE' })
  },

  // Trek Leaders
  leader: {
    getMyEvents: () => apiFetch('/leader/my-events'),
    getRoster: (eventId: string) => apiFetch(`/leader/roster/${eventId}`),
    markAttendance: (memberId: string, status: string) => apiFetch('/leader/attendance', { method: 'POST', body: JSON.stringify({ memberId, status }) })
  },

  // Adventure Memories (Mini-Instagram)
  memories: {
    list: (eventId?: string) => apiFetch(`/memories${eventId ? `?eventId=${eventId}` : ''}`),
    create: (data: any) => apiFetch('/memories', { method: 'POST', body: JSON.stringify(data) }),
    toggleLike: (memoryId: string) => apiFetch(`/memories/${memoryId}/like`, { method: 'POST' }),
    comment: (memoryId: string, text: string) => apiFetch(`/memories/${memoryId}/comment`, { method: 'POST', body: JSON.stringify({ text }) }),
    delete: (id: string) => apiFetch(`/memories/${id}`, { method: 'DELETE' })
  },

  // Blogs
  blogs: {
    list: () => apiFetch('/blogs'),
    get: (slug: string) => apiFetch(`/blogs/${slug}`),
    create: (data: any) => apiFetch('/blogs', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/blogs/${id}`, { method: 'DELETE' })
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
  }
};
