'use client';

import { useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  'music',
  'culture',
  'education',
  'sports',
  'art',
  'business',
  'food',
  'technology',
  'health',
  'fashion',
  'travel',
  'photography',
  'gaming',
  'automotive',
  'charity',
  'networking',
  'workshop',
  'conference',
  'religious',
];

function formatTo12Hour(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours + 11) % 12) + 1;
  const mm = String(minutes).padStart(2, '0');
  const hh = String(hours12).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

function toDateTimeLocalValue(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function EventForm({
  mode,
  initialEvent,
  organizerName,
  onSubmit,
  submitting,
  submitError,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [modeValue, setModeValue] = useState('In-person');
  const [category, setCategory] = useState('music');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const [dateTimeLocal, setDateTimeLocal] = useState('');
  const [time, setTime] = useState('');

  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [vipPrice, setVipPrice] = useState('');
  const [vvipPrice, setVvipPrice] = useState('');
  const [onDoorPrice, setOnDoorPrice] = useState('');
  const [earlyBirdPrice, setEarlyBirdPrice] = useState('');
  const [featured, setFeatured] = useState(false);
  const [ticketsAvailableAt, setTicketsAvailableAt] = useState('');
  const [importantInfo, setImportantInfo] = useState('');
  const [tags, setTags] = useState('');

  // Image upload state
  const [imageUris, setImageUris] = useState([]);
  const [isPricingExpanded, setIsPricingExpanded] = useState(false);

  useEffect(() => {
    if (!initialEvent) return;

    setTitle(initialEvent.title || '');
    setDescription(initialEvent.description || '');
    setImage(initialEvent.image || '');
    setModeValue(initialEvent.mode || 'In-person');
    setCategory(initialEvent.category || 'music');

    setAddress(initialEvent.location?.address || '');
    setCity(initialEvent.location?.city || '');
    setCountry(initialEvent.location?.country || '');
    setLat(
      initialEvent.location?.coordinates?.lat !== undefined
        ? String(initialEvent.location?.coordinates?.lat)
        : ''
    );
    setLng(
      initialEvent.location?.coordinates?.lng !== undefined
        ? String(initialEvent.location?.coordinates?.lng)
        : ''
    );

    setDateTimeLocal(toDateTimeLocalValue(initialEvent.date));
    setTime(initialEvent.time || '');

    setCapacity(initialEvent.capacity !== undefined && initialEvent.capacity !== null ? String(initialEvent.capacity) : '');
    setPrice(initialEvent.price !== undefined && initialEvent.price !== null ? String(initialEvent.price) : '');
    setVipPrice(initialEvent.vipPrice ? String(initialEvent.vipPrice) : '');
    setVvipPrice(initialEvent.vvipPrice ? String(initialEvent.vvipPrice) : '');
    setOnDoorPrice(initialEvent.onDoorPrice ? String(initialEvent.onDoorPrice) : '');
    setEarlyBirdPrice(initialEvent.earlyBirdPrice ? String(initialEvent.earlyBirdPrice) : '');
    setFeatured(initialEvent.featured || false);
    setTicketsAvailableAt(initialEvent.ticketsAvailableAt || '');
    setImportantInfo(initialEvent.importantInfo || '');
    setTags(Array.isArray(initialEvent.tags) ? initialEvent.tags.join(', ') : '');
  }, [initialEvent]);

  const computedTimeFromDateTime = useMemo(() => {
    if (!dateTimeLocal) return '';
    const d = new Date(dateTimeLocal);
    if (Number.isNaN(d.getTime())) return '';
    return formatTo12Hour(d);
  }, [dateTimeLocal]);

  useEffect(() => {
    if (!dateTimeLocal) return;
    if (!time) {
      const auto = computedTimeFromDateTime;
      if (auto) setTime(auto);
    }
  }, [computedTimeFromDateTime, dateTimeLocal, time]);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length >= 3 &&
      description.trim().length >= 10 &&
      modeValue &&
      category &&
      address.trim() &&
      city.trim() &&
      country.trim() &&
      dateTimeLocal &&
      time.trim() &&
      lat !== '' &&
      lng !== ''
    );
  }, [
    title,
    description,
    modeValue,
    category,
    address,
    city,
    country,
    dateTimeLocal,
    time,
    lat,
    lng,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    const latNum = Number(lat);
    const lngNum = Number(lng);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      image: image.trim() ? image.trim() : undefined,
      mode: modeValue,
      category,
      location: {
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        coordinates: {
          lat: latNum,
          lng: lngNum,
        },
        geo: {
          type: 'Point',
          coordinates: [lngNum, latNum],
        },
      },
      date: new Date(dateTimeLocal).toISOString(),
      time: time.trim(),
      organizerName: organizerName || 'Organizer',
      capacity: capacity !== '' ? Number(capacity) : undefined,
      price: price !== '' ? Number(price) : undefined,
      vipPrice: vipPrice !== '' ? Number(vipPrice) : undefined,
      vvipPrice: vvipPrice !== '' ? Number(vvipPrice) : undefined,
      onDoorPrice: onDoorPrice !== '' ? Number(onDoorPrice) : undefined,
      earlyBirdPrice: earlyBirdPrice !== '' ? Number(earlyBirdPrice) : undefined,
      featured,
      ticketsAvailableAt: ticketsAvailableAt.trim() ? ticketsAvailableAt.trim() : undefined,
      importantInfo: importantInfo.trim() ? importantInfo.trim() : undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),
    };

    await onSubmit(payload);
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <div className="text-sm text-white/70">{label}</div>
      {children}
    </div>
  );

  const inputClass =
    'w-full glass-morphism-strong rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-white/40 border border-transparent';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
        </Field>

        <Field label="Category">
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-[140px]`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your event..."
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Mode">
          <select
            className={inputClass}
            value={modeValue}
            onChange={(e) => setModeValue(e.target.value)}
          >
            <option value="In-person">In-person</option>
            <option value="Online">Online</option>
          </select>
        </Field>

        <Field label="Image URL (optional)">
          <input
            className={inputClass}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>

      <div className="glass-morphism-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="font-bold text-white text-lg">Location</div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Address">
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
          </Field>
          <Field label="City">
            <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          </Field>
          <Field label="Country">
            <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
          </Field>
          <div className="grid gap-6 grid-cols-2">
            <Field label="Latitude">
              <input className={inputClass} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="8.9806" />
            </Field>
            <Field label="Longitude">
              <input className={inputClass} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="38.7578" />
            </Field>
          </div>
        </div>
      </div>

      <div className="glass-morphism-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="font-bold text-white text-lg">Date & Time</div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Date & time">
            <input
              type="datetime-local"
              className={inputClass}
              value={dateTimeLocal}
              onChange={(e) => setDateTimeLocal(e.target.value)}
            />
          </Field>
          <Field label="Time (hh:mm AM/PM)">
            <input
              className={inputClass}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="07:30 PM"
            />
            {computedTimeFromDateTime && (
              <div className="text-xs text-white/50 mt-1">
                Auto from date/time: {computedTimeFromDateTime}
              </div>
            )}
          </Field>
        </div>
      </div>

      <div className="glass-morphism-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="font-bold text-white text-lg">Tickets & Pricing</div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Capacity">
            <input
              className={inputClass}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="500"
            />
          </Field>
          <Field label="Price">
            <input
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Tickets available at">
            <input
              className={inputClass}
              value={ticketsAvailableAt}
              onChange={(e) => setTicketsAvailableAt(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="music, weekend, addis"
            />
          </Field>
        </div>

        <div className="mt-6">
          <Field label="Important info">
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={importantInfo}
              onChange={(e) => setImportantInfo(e.target.value)}
              placeholder="Additional information for attendees"
            />
          </Field>
        </div>
      </div>

      {submitError ? (
        <div className="glass-morphism border-red-500/30 bg-red-500/10 rounded-2xl p-6 mb-6">
          <div className="text-red-200">{submitError}</div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="btn-primary rounded-xl px-8 py-3 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : mode === 'edit' ? 'Update event' : 'Create event'}
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-amber-300 text-sm">Image upload coming soon — use image URL for now</div>
        </div>
      </div>
    </form>
  );
}
