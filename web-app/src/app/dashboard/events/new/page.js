'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, getStoredToken } from '../../../../lib/auth';
import { createEvent } from '../../../../lib/events';
import EventForm from '../../../../components/EventForm';

export default function NewEventPage() {
  const router = useRouter();
  const [organizerName, setOrganizerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const resp = await getMe(token);
        setOrganizerName(resp?.user?.name || resp?.user?.email || 'Organizer');
      } catch {
        setOrganizerName('Organizer');
      }
    })();
  }, [router]);

  const onSubmit = async (payload) => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await createEvent(token, payload);
      router.replace('/dashboard/events');
    } catch (e) {
      setSubmitError(e?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="glass-morphism rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">Create Event</h1>
              <p className="text-white/70">Fill in details and publish your event</p>
            </div>
            <Link
              href="/dashboard/events"
              className="glass-morphism px-6 py-3 rounded-xl hover:glass-morphism-strong transition-all duration-300 text-white font-medium"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-8">
          <EventForm
            mode="create"
            initialEvent={null}
            organizerName={organizerName}
            onSubmit={onSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      </div>
    </div>
  );
}
