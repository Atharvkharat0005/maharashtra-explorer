const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

const TOKEN_STORAGE_KEY = 'me_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage issues
  }
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response from server' }));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `HTTP ${res.status} error`);
  }
  return data;
}

export const apiClient = {
  getDistricts: (params?: { division?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.division) sp.set('division', params.division);
    if (params?.q) sp.set('q', params.q);
    return request(`/api/districts?${sp.toString()}`);
  },
  getDistrictDetail: (id: string) => request(`/api/districts/${encodeURIComponent(id)}`),

  getDestinations: (params?: { category?: string; division?: string; districtId?: string; q?: string; season?: string; hidden?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.division) sp.set('division', params.division);
    if (params?.districtId) sp.set('districtId', params.districtId);
    if (params?.q) sp.set('q', params.q);
    if (params?.season) sp.set('season', params.season);
    if (params?.hidden) sp.set('hidden', 'true');
    return request(`/api/destinations?${sp.toString()}`);
  },
  getDestinationGallery: (id: number) => request(`/api/destinations/${id}/gallery`),
  getWikimediaImages: (title: string) => request(`/api/wikimedia/image?title=${encodeURIComponent(title)}`),
  getHiddenGems: (params?: { filter?: string; districtId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.filter) sp.set('filter', params.filter);
    if (params?.districtId) sp.set('districtId', params.districtId);
    return request(`/api/hidden-gems?${sp.toString()}`);
  },

  getHotels: (districtId?: string) => request(`/api/hotels${districtId ? `?districtId=${encodeURIComponent(districtId)}` : ''}`),
  getRestaurants: (districtId?: string, dietary?: string) => {
    const sp = new URLSearchParams();
    if (districtId) sp.set('districtId', districtId);
    if (dietary) sp.set('dietary', dietary);
    return request(`/api/restaurants?${sp.toString()}`);
  },
  getTravelAgents: () => request('/api/travel-agents'),
  submitAgentInquiry: (payload: { agentName: string; customerName: string; phone: string; message: string }) =>
    request('/api/travel-agents/inquiry', { method: 'POST', body: JSON.stringify(payload) }),
  getBookingLinks: () => request('/api/booking-links'),

  getWeather: (lat: number, lng: number, category?: string) => {
    const sp = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (category) sp.set('category', category);
    return request(`/api/weather?${sp.toString()}`);
  },
  getOsrmRoute: (waypoints: Array<{ lat: number; lng: number }>) => {
    const coords = waypoints.map((w) => `${w.lat},${w.lng}`).join(';');
    return request(`/api/route?coords=${encodeURIComponent(coords)}`);
  },
  getNearbyOsm: (lat: number, lng: number, type: 'hospital' | 'police' | 'pharmacy' | 'hotel' | 'restaurant' | 'fuel') =>
    request(`/api/nearby?lat=${lat}&lng=${lng}&type=${type}`),

  calculateBudget: (payload: any) => request('/api/budget/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  getRecommendations: (payload: any) => request('/api/ai/recommendations', { method: 'POST', body: JSON.stringify(payload) }),
  parseTripPrompt: (prompt: string) => request('/api/ai/parse-prompt', { method: 'POST', body: JSON.stringify({ prompt }) }),
  generateAiItinerary: (payload: any) => request('/api/ai/itinerary', { method: 'POST', body: JSON.stringify(payload) }),
  regenerateDay: (payload: { dayNumber: number; currentItinerary: any; feedback: string; language?: string }) =>
    request('/api/ai/regenerate-day', { method: 'POST', body: JSON.stringify(payload) }),
  chatMahatrip: (payload: {
    message: string;
    language?: string;
    tripContext?: any;
    userLat?: number;
    userLng?: number;
    history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  }) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),

  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: { fullName: string; email: string; password: string; phone?: string; homeCity?: string }) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => request('/api/user/profile'),
  toggleFavorite: (destinationId: number) => request(`/api/user/favorites/${destinationId}`, { method: 'POST' }),
  updateTrustedContact: (name: string, phone: string) =>
    request('/api/user/trusted-contact', { method: 'PUT', body: JSON.stringify({ name, phone }) }),

  getTrips: () => request('/api/trips'),
  saveTrip: (payload: any) => request('/api/trips', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrip: (id: string, payload: any) => request(`/api/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrip: (id: string) => request(`/api/trips/${id}`, { method: 'DELETE' }),
  addTripExpense: (id: string, payload: { category: string; description: string; amount: number }) =>
    request(`/api/trips/${id}/expenses`, { method: 'POST', body: JSON.stringify(payload) }),
  addTripBooking: (id: string, payload: any) =>
    request(`/api/trips/${id}/bookings`, { method: 'POST', body: JSON.stringify(payload) }),
  updateTripBooking: (id: string, bookingId: string, payload: any) =>
    request(`/api/trips/${id}/bookings/${bookingId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTripBooking: (id: string, bookingId: string) =>
    request(`/api/trips/${id}/bookings/${bookingId}`, { method: 'DELETE' })
};
