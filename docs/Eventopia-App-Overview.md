# Eventopia – App Overview and Feature Guide

This document describes what Eventopia is, who it serves, how it works for attendees and organizers, and what each screen displays. It also summarizes core features such as search, offline behavior, favorites, and organizer tools.

- Codebase root: `EventopiaNew/`
- Navigation entry: `App.js`
- Screens directory: `screens/`
- Shared providers and components: `providers/`, `components/`
- API client: `services/api.js`


## 1) What Eventopia Is
Eventopia is a mobile app for discovering, saving, and managing events. Users can browse featured and upcoming events, search by name/category/location, view event details, and favorite events. Organizers can sign in, create and manage their events, and see insights.


## 2) Audience and Primary Use Cases
- Attendees
  - Discover what’s happening around them
  - Filter and search by category, city/venue, and date
  - Save favorites for quick access
  - View details, share events, and get directions
- Organizers
  - Sign in and verify their organizer session
  - Create, update, and manage events
  - See simple insights like total views, likes, growth, and top category


## 3) Key Features (User)
- Search with suggestions and recent history using `components/EnhancedSearch.js`
- Category chips and sort controls on `screens/EventsScreen.js`
- Calendar view with quick stats on `screens/CalendarScreen.js`
- Detailed event view with share and directions on `screens/EventDetailsScreen.js`
- Favorites persistence via `providers/FavoritesProvider.js` (stored in AsyncStorage)
- Offline-first behavior on Home/Events/Calendar/Favorites using local caches (AsyncStorage)
- Clean, modern UI with gradients and Feather icons


## 4) Key Features (Organizer)
- Auth integrated with Firebase via `providers/AuthProvider.js`
- Organizer flow under the `Organizer` tab (see `App.js` stacks)
- Create Event with validation and Cloudinary image upload in `screens/CreateEventScreen.js`
- Organizer Dashboard with basic insights and list of events in `screens/OrganizerDashboard.js`
- Profile update and verification flows


## 5) Navigation Structure
Defined in `App.js` using a bottom tab bar with nested stacks:

- Tabs: `Home`, `Events`, `Calendar`, `Favorites`, `Organizer`
- Each tab is a stack:
  - `HomeStack`: `HomeMain` -> `EventDetails`
  - `EventsStack`: `EventsList` -> `EventDetails`
  - `CalendarStack`: `CalendarList` -> `EventDetails`
  - `FavoritesStack`: `FavoritesList` -> `EventDetails`
  - `OrganizerStack`: `OrganizerLogin` -> `OrganizerDashboard` -> `CreateEvent` -> `UpdateProfile` -> `Verification` -> `HelpSupport` -> `TermsPrivacy`
- Initial route: `Welcome` screen (then `Main` for tabs)


## 6) Screen-by-Screen Overview

### 6.1 Welcome Screen (`screens/WelcomeScreen.js`)
- Purpose: First-run landing experience; introduces brand and CTA to start
- Displays: App logo, tagline, VIP art, simple stats, Get Started button
- Action: “Get Started” navigates to `Main` (tabs)

### 6.2 Home Screen (`screens/HomeScreen.js`)
- Purpose: High-level discovery and quick access
- Displays:
  - Enhanced search bar (toggleable)
  - Featured events (subset of events with `featured: true`)
  - Upcoming events (soonest events sorted by date)
  - Connection error banner if offline or API fails
- Behavior:
  - Loads from cache for instant UI, then refreshes from API
  - Uses `NetInfo` to detect offline and show helpful messaging

### 6.3 Events Screen (`screens/EventsScreen.js`)
- Purpose: Browse and filter the full catalog
- Displays:
  - Hero header with actions (search toggle, refresh, sort)
  - Category chips (e.g., Music, Culture, Education, Sports, etc.)
  - Optional search panel using `EnhancedSearch`
  - Sort menu (date, price low/high, popular, name)
  - Event cards with title, date/time, price, location, category, and favorite toggle
- Behavior:
  - Debounced search (waits ~500 ms after typing)
  - Filters by category and event type (e.g., upcoming/featured)
  - Caches the first page and full results in AsyncStorage for offline use
  - Shows friendly error messages when offline (uses `NetInfo`)

### 6.4 Calendar Screen (`screens/CalendarScreen.js`)
- Purpose: Date-first discovery
- Displays:
  - Header with quick actions (search, today)
  - Stats cards: Today, This Week, This Month counts
  - Month selector and compact “days grid”
  - List of events for the selected date
- Behavior:
  - Sorts events by date and caches calendar events
  - Search filters by title, city, venue, category
  - Offline fallback with banner messages

### 6.5 Event Details Screen (`screens/EventDetailsScreen.js`)
- Purpose: Deep dive into a single event
- Displays:
  - Hero image or gradient placeholder
  - Key details (schedule, mode, venue, price, organizer)
  - Description
  - Badges (e.g., category, city)
  - Actions: Share and Get Directions
- Behavior:
  - “Share” opens OS share sheet with event info
  - “Directions” opens Google Maps to the event’s coordinates
  - Offline banner if the device is not connected

### 6.6 Favorites Screen (`screens/FavoritesScreen.js`)
- Purpose: Personal list of saved events
- Displays:
  - Search (optional)
  - Grid/list of favorite events with details
- Behavior:
  - Uses AsyncStorage to persist favorite IDs
  - Maps IDs to event details using cached events

### 6.7 Organizer Login Screen (`screens/OrganizerLoginScreen.js`)
- Purpose: Authenticate organizers (Firebase)
- Likely Displays: Email/password fields, sign in/up, reset password
- Behavior:
  - On successful auth, organizer can navigate to dashboard and create events

### 6.8 Organizer Dashboard (`screens/OrganizerDashboard.js`)
- Purpose: Manage events and view insights
- Displays:
  - List of organizer events with status (Ended, Today, This Week, Upcoming)
  - Simple insights: total views, total likes, growth rate, top category
- Behavior:
  - Attempts to verify session in background
  - Loads organizer events; falls back to public events if none available

### 6.9 Create Event (`screens/CreateEventScreen.js`)
- Purpose: Create and publish a new event
- Displays:
  - Form fields: title, description, category, mode, address, city, country, date, time, capacity, price, featured, image URL, organizer name, important info
  - Image picker (uploads to Cloudinary)
- Behavior:
  - Validations (e.g., required fields, future date, `YYYY-MM-DD`, `hh:mm AM/PM`)
  - Requires backend connection and organizer verification
  - On errors like rate limiting, shows user-friendly messaging (e.g., “Rate Limit Exceeded”)

### 6.10 Update Profile (`screens/UpdateProfileScreen.js`)
- Purpose: Update organizer profile info
- Behavior: Reads/writes organizer data via API

### 6.11 Verification (`screens/VerificationScreen.js`)
- Purpose: Email/identity checks for organizer actions
- Behavior: Uses Firebase auth verification helpers

### 6.12 Help & Support (`screens/HelpSupportScreen.js`)
- Purpose: In-app support reference
- Behavior: Guidance, links, possibly contact info

### 6.13 Terms & Privacy (`screens/TermsPrivacyScreen.js`)
- Purpose: Legal docs and policies


## 7) How Users Use the App (Attendee Flow)
1. Open app and tap “Get Started” on the Welcome screen
2. Explore via `Home` or switch to the `Events` tab to browse
3. Use search (magnifying glass) or category chips; optionally sort
4. Tap an event to open details
5. Share the event or open directions
6. Favorite events to save them for later in `Favorites`
7. When offline, continue browsing cached content (banners indicate offline mode)


## 8) How Organizers Use the App (Organizer Flow)
1. Go to the `Organizer` tab and sign in (Firebase)
2. Verify your organizer session (app tries in background; prompts if needed)
3. Open `CreateEvent` to submit a new event
   - Provide title, description, date/time, venue, price, category, etc.
   - Optionally upload an image via Cloudinary or paste an image URL
   - The form enforces validations and requires a future date
4. Manage events and see insights in `OrganizerDashboard`
5. Update profile and review verification if needed


## 9) Data Layer & Offline
- API service: `services/api.js`
  - Base URL is set to production Render URL by default
  - Uses `fetch` with an abort timeout
  - Adds Firebase auth token when `requireAuth` is true
- Offline caching:
  - `HomeScreen`, `EventsScreen`, `CalendarScreen`, and `FavoritesScreen` store events in AsyncStorage
  - When offline (detected by `@react-native-community/netinfo`), screens fallback to cache and show a banner
- Favorites:
  - Stored in `@eventopia_favorites` via `providers/FavoritesProvider.js`


## 10) Error Handling & UX Polishing
- User-friendly rate limiting message in `CreateEventScreen` for errors containing “Too many requests”
- Timeouts and offline checks surface actionable, minimal banners or alerts
- Loading states shown during fetches; cached data used for instant UI when possible


## 11) Technologies
- React Native (Expo)
- Firebase Authentication
- Fetch-based API client to Render-hosted backend
- AsyncStorage for persistent caching and favorites
- NetInfo for network status
- Expo ImagePicker + Cloudinary upload for event images
- Feather icons & LinearGradient for UI polish


## 12) Glossary
- Featured Event: An event flagged as highlighted in lists
- Upcoming: Events happening on or after “now” (filtered by date)
- Favorites: Locally saved list of event IDs, mapped to details using cached events


## 13) Appendix – Key Files
- `App.js`: Navigation container, tabs, and stacks
- `screens/WelcomeScreen.js`: First-run experience
- `screens/HomeScreen.js`: Discovery landing, featured/upcoming
- `screens/EventsScreen.js`: Filters, categories, sort, and full list
- `screens/CalendarScreen.js`: Month view and date-based discovery
- `screens/EventDetailsScreen.js`: Sharing, directions, full details
- `screens/FavoritesScreen.js`: Saved events
- `screens/OrganizerDashboard.js`: Organizer insights and events
- `screens/CreateEventScreen.js`: Create and validate event details
- `providers/AuthProvider.js`: Firebase auth + backend sync
- `providers/FavoritesProvider.js`: Favorites persistence
- `components/EnhancedSearch.js`: Suggestions, recent searches, UX
- `services/api.js`: API wrapper with auth and timeouts


---
This document is maintained alongside the codebase to provide a high-level overview for product, QA, and developer onboarding. Update it when adding new screens or flows.
