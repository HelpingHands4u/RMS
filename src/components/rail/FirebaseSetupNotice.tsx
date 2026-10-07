import { Database } from "lucide-react";

export function FirebaseSetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Database className="h-5 w-5" />
        <h2 className="text-lg font-bold">Connect your Firebase project</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        RailReserve stores everything in Cloud Firestore and signs users in with Firebase Authentication.
        The database is not connected yet, so sign-in and bookings are unavailable.
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
        <li>Create a Firebase project with Email/Password sign-in and Firestore enabled.</li>
        <li>Copy <code className="font-mono text-xs">.env.example</code> to <code className="font-mono text-xs">.env.local</code> and fill the <code className="font-mono text-xs">VITE_FIREBASE_*</code> values.</li>
        <li>Deploy <code className="font-mono text-xs">firestore.rules</code> and restart the app.</li>
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">Full step-by-step guide: FIREBASE_SETUP.md</p>
    </div>
  );
}
