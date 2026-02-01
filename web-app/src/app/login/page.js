'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmail } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-morphism rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Organizer Login</h1>
          <p className="text-white/70">Sign in to manage your events</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-medium">Email</label>
            <input
              className="w-full glass-morphism-strong rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-white/40 border border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70 font-medium">Password</label>
            <input
              className="w-full glass-morphism-strong rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-white/40 border border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="glass-morphism border-red-500/30 bg-red-500/10 rounded-xl px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full btn-primary rounded-xl py-3 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-white/50">
            This portal uses the same Firebase + backend auth as the mobile app
          </p>
        </div>
      </div>
    </div>
  );
}
