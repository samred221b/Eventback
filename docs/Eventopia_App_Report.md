# EventopiaNew – Comprehensive App Report

## Executive Summary

EventopiaNew is a mobile-first event discovery and organizer platform built with Expo (React Native) and a Node.js/Express backend using MongoDB and Firebase authentication. It enables attendees to discover, save, and view event details, and organizers to create and manage events.

- Name: EventopiaNew
- Target users: Event attendees and event organizers
- Core problem: Discovering events, viewing details, saving favorites, and enabling organizers to create/manage events
- Architecture: Client-server monorepo (frontend in Expo, backend in Express + MongoDB)
- Notable: Offline cache for events, rich UI with gradients, Firebase-based auth, organizer tools
- Status: Active development; core flows implemented; deployment/readiness tasks remain

---

## App Features and Functionality

### Home
- File: `screens/HomeScreen.js`
- Features:
  - Featured and upcoming events list
  - Toggleable search (`EnhancedSearch`) with live suggestions
  - Stats cards (Total events, Featured, Favorites)
  - Organizer CTA card
- Logic:
  - Fetches events via `services/api.js.getEvents()`
  - Transforms/filters for featured and upcoming
  - Pull-to-refresh with cooldown; loading states

### Events List
- File: `screens/EventsScreen.js`
- Features:
  - EnhancedSearch bar (on filter toggle)
  - Horizontal category chips
  - Sort menu (date, price, popularity, name)
  - Pull-to-refresh
  - Offline cache fallback via AsyncStorage
- Logic:
  - Fetch events with optional `search` param
  - On API failure, load cached events and show offline message
  - Local category/type filters; client-side sorting

### Calendar View
- File: `screens/CalendarScreen.js`
- Features:
  - Header moved inside ScrollView so it scrolls away
  - Today / This Week / This Month stats
  - Month selector with chevrons
  - Calendar grid; dots show days with events
  - Optional search section
- Logic:
  - Fetch all events; filter client-side for display and search
  - Focus refresh with cooldown

### Favorites
- Provider: `providers/FavoritesProvider.js`
- Features:
  - Toggle favorites with optimism
  - Persist favorites in AsyncStorage
  - Sync like/unlike to backend via `api.likeEvent`

### Event Details
- File: `screens/EventDetailsScreen.js`
- Features:
  - Hero image, metadata blocks (schedule, mode, venue, price, organizer)
  - Share action; open Google Maps for directions
  - Favorite toggle

### Organizer Workflow
- Files:
  - `screens/OrganizerLoginScreen.js` (Firebase auth, sign in/up)
  - `screens/OrganizerDashboard.js` (insights, events list)
  - `screens/CreateEventScreen.js` (form with image upload)
  - `screens/UpdateProfileScreen.js`, `screens/VerificationScreen.js`
- Features:
  - Login/signup using Firebase Web SDK and backend verification `/api/auth/verify`
  - Dashboard: lists organizer’s events with metrics (views, likes)
  - Create Event: date/time pickers, category selection, image upload (server or URL), important info
  - Update Profile: name, bio, phone, location, social links, profile image

### Enhanced Search Component
- File: `components/EnhancedSearch.js`
- Features:
  - Recent searches (AsyncStorage)
  - Suggestions by event, location, category
  - Pluggable into Home/Events/Calendar

### Utilities
- File: `utils/dataProcessor.js`
- Features:
  - Price formatting, date/time formatting
  - Event serialization helpers
  - Boolean parsing helpers

### Planned (Inferred)
- Payments/ticketing, push notifications, CDN-backed image storage, nearby with distances, real-time updates, admin portal.
- Priority: medium-high for production
- Effort: medium-large

---

## Technical Architecture

### Overview
- Client-server monorepo
- Frontend: Expo React Native app
- Backend: Express server + MongoDB
- Auth: Firebase (client) + Firebase Admin validation (server)

### Frontend Stack
- Expo: `~54.0.27`
- React: `19.1.0`
- React Native: `0.81.5`
- Navigation: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
- UI: `expo-linear-gradient`, `@expo/vector-icons`
- Storage: `@react-native-async-storage/async-storage`
- Networking: fetch via `services/api.js`

### Backend Stack
- Express, Mongoose (MongoDB), Helmet, Rate Limiting, CORS, Joi validation
- Firebase Admin for token verification
- Multer-based image upload to local `/uploads` (no image resizing/cropping server-side)

### Data Flow
- Frontend → `services/api.js` → `/api/...` → Mongoose Models → MongoDB
- Auth tokens: Firebase ID token attached as `Authorization: Bearer <token>`; backend verifies and issues organizer profile data

```text
Attendee/Organizer App (Expo RN)
       |         ^
       v         |
   services/api.js (fetch)
       |  HTTPS  |
       v         |
  Node/Express backend
   - auth / organizers / events / upload
       |
       v
     MongoDB
```

### Scalability, Security, Performance
- Scalability: Stateless backend; can scale horizontally; move static images to S3/Cloudinary + CDN
- Security: Helmet, rate limiting, Firebase token verification; tighten CORS for production (currently permissive in dev)
- Performance: Event indexes in place; consider compound indexes and consistent pagination; use thumbnails

---

## Code Structure and Organization

### Directory (key items)
```
EventopiaNew/
  App.js
  index.js
  app.json
  eas.json
  firebase.config.js
  services/api.js
  providers/
    AuthProvider.js
    FavoritesProvider.js
    QueryProvider.js
  components/
    EnhancedSearch.js
    DatePickerModal.js
    TimePickerModal.js
    SafeComponents.js
  screens/
    HomeScreen.js
    EventsScreen.js
    CalendarScreen.js
    FavoritesScreen.js
    EventDetailsScreen.js
    OrganizerLoginScreen.js
    OrganizerDashboard.js
    CreateEventScreen.js
    UpdateProfileScreen.js
    VerificationScreen.js
    HelpSupportScreen.js
    TermsPrivacyScreen.js
    WelcomeScreen.js
  styles/
    homeStyles.js
    createEventStyles.js
    OrganizerDashboardStyle.js
    organizerLoginStyles.js
    eventScreenStyles.js
  backend/
    server.js
    routes/
      auth.js
      event.js
      organizer.js
      upload.js
    models/
      Event.js
      Organizer.js
    middleware/
      auth.js
      validation.js
      errorHandler.js
    config/
      database.js
      firebase.js
    uploads/
    .env
```

### Dependencies (Frontend)
- `expo ~54.0.27`, `react 19.1.0`, `react-native 0.81.5`
- `expo-image-picker ~17.0.9`, `expo-linear-gradient ^15.0.8`, `expo-status-bar ~3.0.9`
- `@react-navigation/* ^7.x`, `@react-native-async-storage/async-storage 2.2.0`
- `react-native-gesture-handler ^2.22.1`, `react-native-safe-area-context ^5.1.0`, `react-native-screens ~4.16.0`

### Dependencies (Backend)
- `express ^4.18.2`, `mongoose ^8`, `firebase-admin ^12`
- `helmet ^7`, `express-rate-limit ^7`, `cors ^2.8.5`, `dotenv ^16`
- `joi ^17`, `multer ^1.4.5-lts.1`, `cloudinary ^1.41.0` (present, not wired in `upload.js`)

---

## UI/UX

- Framework: React Native with gradients and icons
- Navigation: 5 tabs (Home, Events, Calendar, Favorites, Organizer)
- Screens:
  - Home: Featured/upcoming lists, search, stats, organizer CTA
  - Events: Search/filter/sort; grid of cards; offline cache
  - Calendar: Scrollable header; month selector; calendar grid; upcoming list
  - Event Details: Hero image; key details; share + directions; favorite toggle
  - Organizer: Auth, dashboard with insights, create event, update profile
- Accessibility: Add accessibility labels/testIDs for key controls as an improvement
- Responsiveness: Works across common device sizes; verify font scaling
- Suggestions: Use `resizeMode="contain"` and `aspectRatio` for uploaded images to avoid cropping in previews

---

## Testing and Quality Assurance

- Tests: None committed (no Jest/CI detected)
- Recommendations:
  - Add Jest + React Native Testing Library for unit/UI tests
  - Add backend route tests with `supertest`
  - Add simple E2E smoke (Detox/Maestro)
  - Add error boundary and toast notifications for network issues

---

## Deployment and Operations

### Local Development
- Backend: `cd backend && npm install && npm run dev` (requires `.env` with Mongo URI and Firebase Admin config)
- Frontend: `npm install && npm start`
- Frontend dev API base: `services/api.js` → `getApiBaseUrl()` returns your LAN IP for mobile

### Production
- Set production API base to your public backend URL in `services/api.js`
- Tighten CORS in `backend/server.js`
- Prefer cloud storage (S3/Cloudinary) for images and CDN delivery

### EAS Build (Android)
- `app.json` has Android package `com.yourcompany.eventopianew` (update to your domain)
- Build: `eas build -p android --profile production` (AAB by default); for APK use internal/local build

---

## Project History and Metadata
- Git repo present; multiple docs: `BACKEND_DEBUG_GUIDE.md`, `LAN_SETUP.md`, `OFFLINE_MODE.md`, `TEST_INTEGRATION.md`
- Config: `backend/.env` (secrets), `firebase.config.js` (client config)

---

## Risks, Improvements, Recommendations

- Security
  - Lock down CORS in production
  - Remove dev token bypass outside dev
  - Consider signed uploads and cloud storage

- Reliability
  - Move uploads to durable storage (S3/Cloudinary) + CDN
  - Add retries with backoff for critical calls

- Performance
  - Add compound indexes for frequent filters
  - Use thumbnails; lazy load images in lists

- DX
  - Add ESLint/Prettier and Git hooks
  - Centralize environment configuration

- Roadmap
  - Short-term: tighten CORS, set prod API URL, use Cloudinary, add toast errors, APK build checklist
  - Medium-term: tests (unit/route/E2E), react-query integration, accessibility
  - Long-term: payments/ticketing, real-time updates, admin tools

---

## Q&A

- How do I run it locally?
  - Backend: `cd backend && npm install && npm run dev`
  - Frontend: `npm install && npm start`
  - Ensure `services/api.js` dev URL points to your machine’s IP

- How do I build an Android APK?
  - Update Android package in `app.json`
  - `eas build -p android --profile production` (AAB); for APK use internal or local build

- What’s the auth flow?
  - Firebase Web SDK → ID token → backend verify via Firebase Admin → organizer profile created/updated

- Where do images go and are they cropped?
  - Backend saves originals to `/uploads` (no server-side cropping)
  - On Create Event preview, use `resizeMode="contain"` + `aspectRatio` to avoid cropping

- How does offline support work?
  - Events cached via AsyncStorage on success; used when backend is unreachable

- How do I configure the production backend URL?
  - Edit `services/api.js > getApiBaseUrl()` to return your production domain when `!__DEV__`
