'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMe, getStoredToken } from '../../../../../lib/auth';
import { cancelEvent, deleteEvent, getEventById, updateEvent } from '../../../../../lib/events';
import EventForm from '../../../../../components/EventForm';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [event, setEvent] = useState(null);

  const [organizerName, setOrganizerName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!eventId) return;

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [meResp, eventResp] = await Promise.all([
          getMe(token).catch(() => null),
          getEventById(token, eventId),
        ]);

        setOrganizerName(meResp?.user?.name || meResp?.user?.email || 'Organizer');
        setEvent(eventResp?.data || null);
      } catch (e) {
        setLoadError(e?.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, router]);

  const onSubmit = async (payload) => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await updateEvent(token, eventId, payload);
      router.replace('/dashboard/events');
    } catch (e) {
      setSubmitError(e?.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async () => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const ok = window.confirm('Cancel this event? (It will remain visible as cancelled)');
    if (!ok) return;

    try {
      await cancelEvent(token, eventId);
      router.replace('/dashboard/events');
    } catch (e) {
      alert(e?.message || 'Cancel failed');
    }
  };

  const onDelete = async () => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const ok = window.confirm('Delete this event permanently?');
    if (!ok) return;

    try {
      await deleteEvent(token, eventId);
      router.replace('/dashboard/events');
    } catch (e) {
      alert(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Edit Event</h1>
            <p className="text-sm text-white/60 mt-1">Update your event details.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/15 transition"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/15 transition"
            >
              Delete
            </button>
            <Link
              href="/dashboard/events"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
            >
              Back
            </Link>
          </div>
        </div>

        {loading ? <div className="mt-6 text-sm text-white/60">Loading…</div> : null}

        {loadError ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {loadError}
          </div>
        ) : null}

        {!loading && !loadError ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <EventForm
              mode="edit"
              initialEvent={event}
              organizerName={organizerName}
              onSubmit={onSubmit}
              submitting={submitting}
              submitError={submitError}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
