import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

type Env = Record<string, string | undefined>;

function cfEnv(): Env {
  try {
    return getCloudflareContext().env as Env;
  } catch {
    return {};
  }
}

function readEnv(name: string) {
  const env = cfEnv();
  return env[name] ?? process.env[name];
}

export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = readEnv("FIREBASE_API_KEY") ?? readEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const authDomain =
    readEnv("FIREBASE_AUTH_DOMAIN") ?? readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = readEnv("FIREBASE_PROJECT_ID") ?? readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const appId = readEnv("FIREBASE_APP_ID") ?? readEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId };
}

export function requireFirebaseWebConfig(): FirebaseWebConfig {
  const config = getFirebaseWebConfig();
  if (!config) {
    throw new Error(
      "Firebase Auth is not configured. Set FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, and FIREBASE_APP_ID."
    );
  }
  return config;
}
