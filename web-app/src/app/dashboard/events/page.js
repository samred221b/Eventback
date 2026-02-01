'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '../../../lib/auth';
import { cancelEvent, deleteEvent, listMyEvents } from '../../../lib/events';

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString();
  } catch {
    return dateStr;
  }
}

export default function EventsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const resp = await listMyEvents(token, { status, search, limit: 50 });
      setItems(resp?.data || []);
    } catch (e) {
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const onCancel = async (id) => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const ok = window.confirm('Cancel this event? (It will remain visible as cancelled)');
    if (!ok) return;

    try {
      await cancelEvent(token, id);
      await load();
    } catch (e) {
      alert(e?.message || 'Cancel failed');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDelete = async (id) => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const ok = window.confirm('Delete this event permanently?');
    if (!ok) return;

    try {
      await deleteEvent(token, id);
      await load();
    } catch (e) {
      alert(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">My Events</h1>
            <p className="text-sm text-white/60 mt-1">Create, edit, and delete your events.</p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="rounded-xl bg-sky-600 hover:bg-sky-500 transition px-4 py-2 text-sm font-medium"
          >
            + New event
          </Link>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <select
            className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/20"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <input
            className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title/description…"
          />

          <button
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition"
          >
            Apply
          </button>
        </div>

        {loading ? <div className="mt-6 text-sm text-white/60">Loading…</div> : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {items.map((ev) => (
            <div key={ev._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{ev.title}</div>
                  <div className="text-sm text-white/60 mt-1">
                    {ev.category} · {ev.mode} · {formatDate(ev.date)} · {ev.time}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {ev.location?.city}, {ev.location?.country}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/events/${ev._id}/edit`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onCancel(ev._id)}
                    disabled={ev.status === 'cancelled'}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/15 disabled:opacity-50 disabled:hover:bg-amber-500/10 transition"
                  >
                    {ev.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => onDelete(ev._id)}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && !error && items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              No events found.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
