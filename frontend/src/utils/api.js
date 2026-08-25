// VITE_API_URL must be set to your deployed backend URL (e.g. https://your-app.onrender.com/api)
// On mobile (Capacitor), localhost is unreachable — always use the env var in production builds
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('token')

const headers = (auth = false) => {
  const h = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) h['Authorization'] = `Bearer ${token}`
  }
  return h
}

const handleResponse = async (res) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

export const authAPI = {
  register: (formData) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify(formData),
    }).then(handleResponse),

  login: (formData) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify(formData),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${BASE_URL}/auth/me`, { headers: headers(true) }).then(handleResponse),

  updateProfile: (formData) =>
    fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify(formData),
    }).then(handleResponse),

  changePassword: (formData) =>
    fetch(`${BASE_URL}/auth/change-password`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify(formData),
    }).then(handleResponse),

  logout: () =>
    fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST', headers: headers(true),
    }).then(handleResponse),

  getAllUsers: () =>
    fetch(`${BASE_URL}/auth/users`, { headers: headers(true) }).then(handleResponse),

  toggleUserStatus: (userId) =>
    fetch(`${BASE_URL}/auth/users/${userId}/toggle`, {
      method: 'PUT', headers: headers(true),
    }).then(handleResponse),
}

export const bookingAPI = {
  create: (bookingData) =>
    fetch(`${BASE_URL}/bookings`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(bookingData),
    }).then(handleResponse),

  getMyBookings: (status = '') =>
    fetch(`${BASE_URL}/bookings/my-bookings${status ? `?status=${status}` : ''}`, {
      headers: headers(true),
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${BASE_URL}/bookings/${id}`, { headers: headers(true) }).then(handleResponse),

  cancel: (id, reason) =>
    fetch(`${BASE_URL}/bookings/${id}/cancel`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify({ cancellationReason: reason }),
    }).then(handleResponse),

  getAvailableDates: (startDate, endDate) =>
    fetch(`${BASE_URL}/bookings/available-dates?startDate=${startDate}&endDate=${endDate}`)
      .then(handleResponse),

  getStats: () =>
    fetch(`${BASE_URL}/bookings/stats`, { headers: headers(true) }).then(handleResponse),

  createPaymentOrder: (bookingId) =>
    fetch(`${BASE_URL}/bookings/${bookingId}/create-order`, {
      method: 'POST', headers: headers(true),
    }).then(handleResponse),

  verifyPayment: (bookingId, paymentData) =>
    fetch(`${BASE_URL}/bookings/${bookingId}/verify-payment`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(paymentData),
    }).then(handleResponse),
}

export const adminAPI = {
  getAllBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${BASE_URL}/bookings/admin/all${query ? `?${query}` : ''}`, {
      headers: headers(true),
    }).then(handleResponse)
  },

  getPendingBookings: () =>
    fetch(`${BASE_URL}/bookings/admin/pending`, { headers: headers(true) }).then(handleResponse),

  approveBooking: (id, totalAmount, adminNotes = '') =>
    fetch(`${BASE_URL}/bookings/${id}/approve`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify({ totalAmount, adminNotes }),
    }).then(handleResponse),

  rejectBooking: (id, rejectionReason) =>
    fetch(`${BASE_URL}/bookings/${id}/reject`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify({ rejectionReason }),
    }).then(handleResponse),

  setBookingPrice: (id, totalAmount) =>
    fetch(`${BASE_URL}/bookings/${id}/set-price`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify({ totalAmount }),
    }).then(handleResponse),

  getCalendarBookings: (startDate, endDate) =>
    fetch(`${BASE_URL}/bookings/admin/calendar?startDate=${startDate}&endDate=${endDate}`, {
      headers: headers(true),
    }).then(handleResponse),

  getAdminStats: () =>
    fetch(`${BASE_URL}/bookings/admin/stats`, { headers: headers(true) }).then(handleResponse),

  getAllUsers: () =>
    fetch(`${BASE_URL}/auth/users`, { headers: headers(true) }).then(handleResponse),

  toggleUserStatus: (userId) =>
    fetch(`${BASE_URL}/auth/users/${userId}/toggle`, {
      method: 'PUT', headers: headers(true),
    }).then(handleResponse),

  getLockedDates: () =>
    fetch(`${BASE_URL}/locked-dates`, { headers: headers(true) }).then(handleResponse),

  createLockedDate: (data) =>
    fetch(`${BASE_URL}/locked-dates`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  releaseLockedDate: (id) =>
    fetch(`${BASE_URL}/locked-dates/${id}`, {
      method: 'DELETE', headers: headers(true),
    }).then(handleResponse),



  getRefunds: () =>
    fetch(`${BASE_URL}/bookings/admin/refunds`, { headers: headers(true) }).then(handleResponse),

  processRefund: (id) =>
    fetch(`${BASE_URL}/bookings/${id}/process-refund`, {
      method: 'PUT', headers: headers(true),
    }).then(handleResponse),
}

export const cashbookAPI = {
  getEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${BASE_URL}/cashbook${query ? `?${query}` : ''}`, {
      headers: headers(true),
    }).then(handleResponse)
  },

  createEntry: (data) =>
    fetch(`${BASE_URL}/cashbook`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateEntry: (id, data) =>
    fetch(`${BASE_URL}/cashbook/${id}`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteEntry: (id) =>
    fetch(`${BASE_URL}/cashbook/${id}`, {
      method: 'DELETE', headers: headers(true),
    }).then(handleResponse),

  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${BASE_URL}/cashbook/summary${query ? `?${query}` : ''}`, {
      headers: headers(true),
    }).then(handleResponse)
  },

  getNextReceipt: (year) =>
    fetch(`${BASE_URL}/cashbook/next-receipt?year=${year}`, {
      headers: headers(true),
    }).then(handleResponse),

  getAnnualRituals: (year) =>
    fetch(`${BASE_URL}/cashbook/annual-rituals/${year}`, {
      headers: headers(true),
    }).then(handleResponse),

  recordRitualPayment: (data) =>
    fetch(`${BASE_URL}/cashbook/annual-rituals`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateRitualPayment: (id, data) =>
    fetch(`${BASE_URL}/cashbook/annual-rituals/${id}`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),
}

export const daanPetiAPI = {
  createOrder: (data) =>
    fetch(`${BASE_URL}/daan-peti/create-order`, {
      method: 'POST',
      headers: headers(!!getToken()),
      body: JSON.stringify(data),
    }).then(handleResponse),

  verifyPayment: (data) =>
    fetch(`${BASE_URL}/daan-peti/verify-payment`, {
      method: 'POST',
      headers: headers(!!getToken()),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getReceipt: (id) =>
    fetch(`${BASE_URL}/daan-peti/receipt/${id}`).then(handleResponse),

  getMyDonations: () =>
    fetch(`${BASE_URL}/daan-peti/my-donations`, {
      headers: headers(true),
    }).then(handleResponse),
}

export const settingsAPI = {
  getRitualFee: () =>
    fetch(`${BASE_URL}/settings/ritual-fee`, { headers: headers(true) }).then(handleResponse),

  getAll: () =>
    fetch(`${BASE_URL}/settings`, { headers: headers(true) }).then(handleResponse),

  update: (key, value, description = '') =>
    fetch(`${BASE_URL}/settings`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify({ key, value, description }),
    }).then(handleResponse),
}

export const memberAPI = {
  getAll: (search = '') =>
    fetch(`${BASE_URL}/members${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
      headers: headers(true),
    }).then(handleResponse),

  create: (data) =>
    fetch(`${BASE_URL}/members`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  bulkCreate: (members) =>
    fetch(`${BASE_URL}/members/bulk`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({ members }),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${BASE_URL}/members/${id}`, {
      method: 'PUT', headers: headers(true),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${BASE_URL}/members/${id}`, {
      method: 'DELETE', headers: headers(true),
    }).then(handleResponse),
}

export const ritualAPI = {
  getMyStatus: () =>
    fetch(`${BASE_URL}/ritual/my-status`, { headers: headers(true) }).then(handleResponse),

  createOrder: () =>
    fetch(`${BASE_URL}/ritual/create-order`, {
      method: 'POST', headers: headers(true),
    }).then(handleResponse),

  verifyPayment: (paymentData) =>
    fetch(`${BASE_URL}/ritual/verify-payment`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(paymentData),
    }).then(handleResponse),

  submitCashPayment: () =>
    fetch(`${BASE_URL}/ritual/cash-payment`, {
      method: 'POST', headers: headers(true),
    }).then(handleResponse),

  getReceipt: (entryId) =>
    fetch(`${BASE_URL}/ritual/receipt/${entryId}`, { headers: headers(true) }).then(handleResponse),
}
