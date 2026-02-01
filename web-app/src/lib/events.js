import { apiFetch } from './api';

export async function listMyEvents(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/organizers/profile/events${suffix}`, { token, method: 'GET' });
}

export async function getEventById(token, id) {
  return apiFetch(`/events/${id}`, { token, method: 'GET' });
}

export async function createEvent(token, payload) {
  return apiFetch('/events', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(token, id, payload) {
  return apiFetch(`/events/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function cancelEvent(token, id) {
  return updateEvent(token, id, { status: 'cancelled' });
}

export async function deleteEvent(token, id) {
  return apiFetch(`/events/${id}`, {
    token,
    method: 'DELETE',
  });
}
