import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { apiFetch } from './api';

const STORAGE_KEY = 'eventopia.organizer.idToken';

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  if (!token) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, token);
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const token = await result.user.getIdToken();
  setStoredToken(token);

  await apiFetch('/auth/verify', {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });

  return token;
}

export async function logout() {
  await signOut(auth);
  setStoredToken(null);
}

export async function getMe(token) {
  return apiFetch('/auth/me', { token, method: 'GET' });
}
