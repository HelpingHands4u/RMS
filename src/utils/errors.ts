import { FirebaseNotConfiguredError } from "@/firebase/config";

/** Business-rule error whose message is safe to show to users. */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

const FIREBASE_MESSAGES: Record<string, string> = {
  "permission-denied": "You do not have permission to perform this action.",
  unauthenticated: "Your session has expired. Please log in again.",
  unavailable: "Network problem — unable to reach the database. Please try again.",
  "not-found": "The requested record was not found.",
  "already-exists": "This record already exists.",
  aborted: "The operation conflicted with another update. Please try again.",
  "failed-precondition": "The database is not ready for this query. Please contact the administrator.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network problem. Please check your connection.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase.",
};

/** Convert any thrown value into a friendly message. Never exposes stack traces. */
export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof FirebaseNotConfiguredError) return "Database not connected yet. Add your Firebase configuration (see FIREBASE_SETUP.md).";
  const code = (error as { code?: string } | null)?.code;
  if (code) {
    const key = code.replace(/^firestore\//, "");
    if (FIREBASE_MESSAGES[key]) return FIREBASE_MESSAGES[key];
  }
  return fallback;
}
