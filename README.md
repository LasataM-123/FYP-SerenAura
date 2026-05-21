# SerenAura Mobile App

Expo/React Native mobile app for SerenAura, a mental wellness platform for patients and counselors. The app connects to the SerenAura backend for authentication, onboarding, mood tracking, breathing exercises, meditation/music content, counselor chat, subscriptions, reviews, and support.

## Tech Stack

- Expo 54
- React Native
- Expo Router
- TypeScript
- Zustand state management
- Socket.IO client
- AsyncStorage
- Expo Auth Session for Google sign in
- Expo Audio / AV for media playback
- EAS build configuration

## Project Structure

```text
FrontendUI/
  app/           Expo Router screens and route groups
  assets/        Images, icons, fonts, and bundled mood music
  components/    Shared UI components
  constants/     Shared constants
  context/       React context providers
  lib/           Backend API clients, sockets, and hooks
  store/         Zustand stores
  app.json       Expo app configuration and runtime extras
  config.ts      Reads API/socket/auth config from Expo extras
  types.ts       Shared TypeScript types
```

## Main App Areas

- Authentication, OTP verification, Google sign in, password reset
- Patient onboarding
- Home, media, breathing, chat, and profile tabs
- Mood tracker and mood logbook
- Music, meditation, playlists, favourites, and recent search
- Counselor discovery and counselor chat
- Counselor request handling and counselor profile
- Chat history
- Subscription and eSewa payment flow
- Help/contact and support questions
- Reviews

## Getting Started

### Prerequisites

- Node.js
- npm
- Expo CLI through `npx expo`
- Android Studio/emulator, iOS simulator, or Expo Go
- SerenAura backend running on a reachable URL

### Installation

```bash
npm install
```

### Configure Backend URLs

The app reads runtime config from `app.json` through `config.ts`.

Update the `expo.extra` values in `app.json`:

```json
{
  "extra": {
    "API_URL": "http://your-local-ip:5000/api",
    "SOCKET_URL": "http://your-local-ip:5000",
    "GOOGLE_CLIENT_ID": "your_google_client_id",
    "WEB_CLIENT_ID": "your_web_client_id"
  }
}
```

When testing on a physical phone, use your computer's LAN IP address instead of `localhost`.

## Run Locally

```bash
npm start
```

Then choose one of the Expo options:

- Press `a` for Android
- Press `i` for iOS
- Press `w` for web
- Scan the QR code with Expo Go

You can also run platform-specific scripts:

```bash
npm run android
npm run ios
npm run web
```

## Available Scripts

```bash
npm start
```

Starts the Expo development server.

```bash
npm run android
```

Starts the app on Android.

```bash
npm run ios
```

Starts the app on iOS.

```bash
npm run web
```

Starts the web version.

```bash
npm run lint
```

Runs Expo linting.

## Backend Integration

API helper modules live in `lib/api/` and call the backend routes under `/api`, including:

- `/auth`
- `/users`
- `/counselors`
- `/onboarding`
- `/media`
- `/music`
- `/mood`
- `/breathe`
- `/chat`
- `/messages`
- `/playlist`
- `/favourite`
- `/recent-search`
- `/subscription`
- `/reviews`
- `/faq`

Socket.IO is used for real-time chat and notification behavior through `SOCKET_URL`.

## Build

The project includes `eas.json` with Android build profiles:

```bash
eas build --profile development --platform android
eas build --profile production --platform android
```

The development profile creates an APK. The production profile creates an Android app bundle.

## Notes

- Keep API URLs and OAuth client IDs aligned with the backend and Google Console configuration.
- For physical-device testing, the backend server and phone must be on the same network unless the backend is deployed.
- The app uses Expo Router file-based routing from the `app` directory.
