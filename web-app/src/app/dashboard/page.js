'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, getStoredToken, logout } from '../../lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const token = getStoredToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const resp = await getMe(token);
        if (!mounted) return;
        setMe(resp?.user || resp?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [router]);

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="glass-morphism rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Organizer Dashboard</h1>
              <p className="text-white/70">Manage your events and profile with style</p>
            </div>
            <button
              onClick={onLogout}
              className="glass-morphism px-6 py-3 rounded-xl hover:glass-morphism-strong transition-all duration-300 text-white font-medium"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-morphism-strong rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-blue-400 text-sm font-medium">Profile</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{me?.name || me?.email || '—'}</div>
            <div className="text-white/60 text-sm">{me?.email || ''}</div>
          </div>

          <div className="glass-morphism-strong rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-green-400 text-sm font-medium">Status</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{me?.isVerified ? 'Verified' : 'Not verified'}</div>
            <div className="text-white/60 text-sm">Account verification</div>
          </div>

          <div className="glass-morphism-strong rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-purple-400 text-sm font-medium">Events</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{me?.totalEvents ?? '—'}</div>
            <div className="text-white/60 text-sm">Total events created</div>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading ? (
          <div className="glass-morphism rounded-2xl p-8 text-center">
            <div className="text-white/70">Loading your dashboard…</div>
          </div>
        ) : null}

        {error ? (
          <div className="glass-morphism border-red-500/30 bg-red-500/10 rounded-2xl p-6 mb-8">
            <div className="text-red-200">{error}</div>
          </div>
        ) : null}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-morphism rounded-2xl p-8 card-hover">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Events</h2>
                <p className="text-white/70">Create and manage your events</p>
              </div>
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/events"
                className="glass-morphism px-6 py-3 rounded-xl hover:glass-morphism-strong transition-all duration-300 text-white font-medium text-center"
              >
                View events
              </Link>
              <Link
                href="/dashboard/events/new"
                className="btn-primary px-6 py-3 rounded-xl text-white font-medium text-center"
              >
                + New event
              </Link>
            </div>
          </div>

          <div className="glass-morphism rounded-2xl p-8 card-hover">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
                <p className="text-white/70">Manage your organizer profile</p>
              </div>
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-2">Coming soon</div>
              <div className="text-white/40 text-xs">Backend endpoint: PUT /organizers/profile</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
