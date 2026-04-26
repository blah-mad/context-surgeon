"use client";

export interface FirebaseAuthConfig {
  configured: boolean;
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
}

export interface AuthSession {
  idToken: string;
  refreshToken: string;
  uid: string;
  email: string;
  displayName?: string;
  expiresAt: number;
}

interface AuthResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
  email?: string;
  displayName?: string;
  expiresIn: string;
  error?: { message?: string };
}

interface RefreshResponse {
  id_token: string;
  refresh_token: string;
  user_id: string;
  expires_in: string;
  error?: { message?: string };
}

const STORAGE_KEY = "context_surgeon_firebase_session";

function authError(message?: string) {
  const readable: Record<string, string> = {
    EMAIL_EXISTS: "An account already exists for this email.",
    EMAIL_NOT_FOUND: "No account exists for this email.",
    INVALID_PASSWORD: "The password is incorrect.",
    INVALID_LOGIN_CREDENTIALS: "The email or password is incorrect.",
    OPERATION_NOT_ALLOWED: "Email/password sign-in is not enabled in this Firebase project.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Try again later.",
    WEAK_PASSWORD: "Use a stronger password."
  };
  return readable[message ?? ""] ?? message ?? "Firebase Auth request failed.";
}

async function requestJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(authError(payload.error?.message));
  return payload;
}

function toSession(payload: AuthResponse): AuthSession {
  return {
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    uid: payload.localId,
    email: payload.email ?? "",
    displayName: payload.displayName,
    expiresAt: Date.now() + Number(payload.expiresIn) * 1000
  };
}

export async function loadFirebaseAuthConfig(): Promise<FirebaseAuthConfig> {
  const response = await fetch("/api/auth/config");
  if (!response.ok) return { configured: false };
  return (await response.json()) as FirebaseAuthConfig;
}

export function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession | null) {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function signInWithEmail(
  config: FirebaseAuthConfig,
  email: string,
  password: string
) {
  if (!config.apiKey) throw new Error("Firebase Auth is not configured.");
  const payload = await requestJson<AuthResponse>(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`,
    { email, password, returnSecureToken: true }
  );
  const session = toSession(payload);
  storeSession(session);
  return session;
}

export async function signUpWithEmail(
  config: FirebaseAuthConfig,
  email: string,
  password: string,
  displayName: string
) {
  if (!config.apiKey) throw new Error("Firebase Auth is not configured.");
  const payload = await requestJson<AuthResponse>(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(config.apiKey)}`,
    { email, password, returnSecureToken: true }
  );

  if (displayName.trim()) {
    await requestJson<AuthResponse>(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(config.apiKey)}`,
      {
        idToken: payload.idToken,
        displayName: displayName.trim(),
        returnSecureToken: false
      }
    );
  }

  const session = toSession({ ...payload, displayName: displayName.trim() || payload.email });
  storeSession(session);
  return session;
}

export async function refreshSession(config: FirebaseAuthConfig, session: AuthSession) {
  if (!config.apiKey) throw new Error("Firebase Auth is not configured.");
  if (session.expiresAt - Date.now() > 90_000) return session;

  const payload = await requestJson<RefreshResponse>(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,
    {
      grant_type: "refresh_token",
      refresh_token: session.refreshToken
    }
  );
  const refreshed: AuthSession = {
    ...session,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    uid: payload.user_id,
    expiresAt: Date.now() + Number(payload.expires_in) * 1000
  };
  storeSession(refreshed);
  return refreshed;
}

export async function sendPasswordReset(config: FirebaseAuthConfig, email: string) {
  if (!config.apiKey) throw new Error("Firebase Auth is not configured.");
  await requestJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(config.apiKey)}`,
    { requestType: "PASSWORD_RESET", email }
  );
}

let firebaseAppPromise:
  | Promise<{
      app: import("firebase/app").FirebaseApp;
      auth: import("firebase/auth").Auth;
    }>
  | undefined;

async function firebaseClient(config: FirebaseAuthConfig) {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Firebase Auth is not configured.");
  }

  firebaseAppPromise ??= (async () => {
    const [{ initializeApp, getApps, getApp }, { getAuth }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth")
    ]);
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId
    };
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return { app, auth: getAuth(app) };
  })();

  return firebaseAppPromise;
}

export async function signInWithGoogle(config: FirebaseAuthConfig) {
  const { auth } = await firebaseClient(config);
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();
  const session: AuthSession = {
    idToken,
    refreshToken: credential.user.refreshToken,
    uid: credential.user.uid,
    email: credential.user.email ?? "",
    displayName: credential.user.displayName ?? credential.user.email ?? "Google user",
    expiresAt: Date.now() + 55 * 60 * 1000
  };
  storeSession(session);
  return session;
}
