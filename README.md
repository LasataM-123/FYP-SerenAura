# SerenAura Backend

Backend API for SerenAura, a mental wellness platform with patient, counselor, and admin workflows. The server provides authentication, profile management, mood tracking, media recommendations, playlists, chat, subscriptions, reviews, support questions, notifications, and admin reporting.

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Cloudinary for media storage
- Nodemailer for email/OTP flows
- Google Gemini API for mood insights
- eSewa payment integration
- node-cron background jobs

## Project Structure

```text
Backend/
  config/        Database and Cloudinary configuration
  controllers/   Request handlers and business logic
  jobs/          Scheduled jobs for moods and subscriptions
  middlewares/   Auth, role validation, and error handling
  models/        Mongoose schemas
  routes/        Express route definitions
  service/       Email, notification, and payment services
  utils/         Shared helper data/functions
  server.js      App entry point, middleware, routes, sockets, jobs
```

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB database connection string
- Cloudinary account
- Email account/app password for Nodemailer
- Google Gemini API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `Backend` directory. Do not commit this file.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string

JWT_SECRET_KEY=your_jwt_secret
JWT_REFRESH_SECRET_KEY=your_refresh_jwt_secret

EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key

ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
ADMIN_HASH_PASSWORD=your_bcrypt_hashed_admin_password

FRONTEND_URL=http://localhost:3000/

ESEWA_MERCHANT_CODE=your_esewa_merchant_code
ESEWA_SECRET_KEY=your_esewa_secret_key
```

### Run the Server

```bash
npm run dev
```

By default, the API runs on:

```text
http://localhost:5000
```

## API Overview

All main API routes are mounted under `/api`.

| Area | Base Route | Description |
| --- | --- | --- |
| Auth | `/api/auth` | Register, login, OTP verification, refresh token, Google auth |
| Users | `/api/users` | Profile, DOB, password reset/change, account deletion |
| Counselors | `/api/counselors` | Counselor listing, profile, update, deletion |
| Admin | `/api/admin` | Admin login, counselor management, support answers, earnings, reports, payouts |
| Onboarding | `/api/onboarding` | Patient onboarding data |
| Meditation | `/api/meditation` | Meditation content management |
| Music | `/api/music` | Music content and preferences |
| Media | `/api/media` | Recommendations, search, filtering, media details |
| Recent Search | `/api/recent-search` | Add, list, delete, and suggest recent searches |
| Favourites | `/api/favourite` | Add, list, remove, and check favourites |
| Playlist | `/api/playlist` | Create playlists and manage playlist media |
| Mood | `/api/mood` | Mood check-ins, calendar entries, today mood, monthly insights |
| Breathing | `/api/breathe` | Breathing exercise content |
| Chat | `/api/chat` | Chat requests, acceptance, cancellation, history, ended chats |
| Messages | `/api/messages` | Send and fetch chat messages |
| FAQ | `/api/faq` | Top questions and support questions |
| Subscription | `/api/subscription` | Subscribe, renew, cancel, payment initiation, status |
| Reviews | `/api/reviews` | Add reviews and view counselor reviews |

## Authentication and Roles

Protected routes use JWT authentication through `tokenHandler`. Some routes also require role-specific middleware:

- `validPatient`
- `validCounselor`
- `validAdmin`

Send the access token according to the token handling logic used by the frontend and `middlewares/tokenHandler.js`.

## Real-Time Events

The backend uses Socket.IO for chat status updates and notifications.

Important socket events include:

- `registerNotifications`
- `joinChat`
- `chatAccepted`
- `chatCancelled`
- `chatStatusUpdated`
- `new_notification`

## Background Jobs

The server starts scheduled jobs after MongoDB connects:

- Mood reminder job from `jobs/moodJob.js`
- Subscription expiration job from `jobs/subscriptionJob.js`

## Notes

- `.env` is ignored by Git and should stay private.
- `node_modules` is ignored by Git and should be installed with `npm install`.
- The current `test` script is a placeholder and does not run automated tests yet.
