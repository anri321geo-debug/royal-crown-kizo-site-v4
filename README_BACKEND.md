# Kizo Full System: Website + Backend + Android App

This project now includes a complete connected system:

- Public website (`index.html`) with compact nested gallery window
- Full gallery modal (photos/videos shown only when opened)
- Contact form backend (`/api/contact`) via Netlify Functions
- Supabase DB + Storage
- Admin web app (`admin.html`) for media upload + live messages
- Android app (`android-app/`) with:
  - Admin tab (WebView)
  - Messages tab (full details + timestamps stored in app)
  - App notifications for new messages

## 1) Supabase setup

1. Create a Supabase project.
2. Run SQL in Supabase SQL Editor:
   - `supabase/schema.sql`
3. Create one admin user in Supabase Auth (email/password) to use `admin.html`.

## 2) Website config

Edit `site-config.js` with your values:

- `supabaseUrl`
- `supabaseAnonKey`
- keep `contactEndpoint: '/api/contact'`

## 3) Netlify setup

`netlify.toml` is already configured for:

- `/api/contact` -> `netlify/functions/contact-submit.js`
- `/api/register-device` -> `netlify/functions/register-device.js`
- `/api/app-messages` -> `netlify/functions/app-messages.js`

Set these Netlify environment variables:

### Required
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_MESSAGES_API_KEY`

### Optional table names
- `CONTACT_MESSAGES_TABLE` (default: `contact_messages`)
- `DEVICE_TOKENS_TABLE` (default: `device_tokens`)

### Optional extra notifications
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `PHONE_NOTIFY_WEBHOOK_URL`

## 4) Firebase (optional but recommended for closed-app push)

Without Firebase, message tab sync still works while app is active (polling).
With Firebase configured, closed/background push becomes reliable.

If using Firebase:

1. Create Firebase project.
2. Add Android app package: `com.kizogroup.mobile`
3. Download `google-services.json` and place in:
   - `android-app/app/google-services.json`
4. Add Netlify env vars:
   - `FCM_PROJECT_ID`
   - `FCM_CLIENT_EMAIL`
   - `FCM_PRIVATE_KEY`

## 5) Android app setup (Android Studio -> APK)

Project folder:
- `android-app/`

Steps:

1. Open `android-app` in Android Studio.
2. Copy `android-app/local.properties.example` to `android-app/local.properties` and set:
   - `sdk.dir`
   - `KIZO_ADMIN_URL=https://YOUR_NETLIFY_DOMAIN/admin.html`
   - `KIZO_REGISTER_DEVICE_URL=https://YOUR_NETLIFY_DOMAIN/api/register-device`
   - `KIZO_APP_MESSAGES_URL=https://YOUR_NETLIFY_DOMAIN/api/app-messages`
   - `KIZO_APP_MESSAGES_API_KEY=<same as APP_MESSAGES_API_KEY in Netlify>`
3. (Optional) add `google-services.json`.
4. Sync Gradle.
5. Build APK:
   - Build -> Build Bundle(s)/APK(s) -> Build APK(s)

## 6) App behavior

- **Admin tab**: opens `/admin.html` inside app.
- **Messages tab**:
  - shows full details (name, phone, email, message, exact time)
  - auto-synces every ~20 seconds
  - keeps cached messages in app storage
  - can refresh manually

## 7) Admin usage

1. Open:
   - `https://YOUR_NETLIFY_DOMAIN/admin.html`
2. Login with Supabase Auth admin account.
3. Upload photos/videos.
4. Gallery on public site updates from Supabase media table.
5. Incoming messages appear live in admin panel.

---

## Quick diagnostics

If message form fails:
- check Netlify function logs for `/api/contact`
- confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

If app messages tab fails:
- confirm `/api/app-messages` is deployed
- confirm `APP_MESSAGES_API_KEY` in Netlify
- confirm `KIZO_APP_MESSAGES_API_KEY` in Android local.properties matches exactly

If Android push doesn’t arrive in background/closed app:
- confirm Firebase env vars exist in Netlify
- confirm device token row exists in `device_tokens`
- check `/api/contact` logs for FCM errors
