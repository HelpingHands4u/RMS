# Firebase setup (RailReserve)
1. Create a project at console.firebase.google.com.
2. Authentication → Sign-in method → enable **Email/Password**.
3. Firestore Database → Create database (production mode).
4. Project settings → Add **Web app** → copy the config values.
5. Copy `.env.example` to `.env.local` and fill every `VITE_FIREBASE_*` value.
6. Deploy rules: `npm i -g firebase-tools && firebase login && firebase init firestore && firebase deploy --only firestore:rules` (uses `firestore.rules`).
7. Run `npm install && npm run dev`, register your first account in the app.
8. Make it admin securely: Firestore console → `users/{yourUid}` → set `role` to `ADMIN`. The app cannot do this itself; rules block clients from changing roles.
9. Sign in again → Admin → **Load DEMO data**.
