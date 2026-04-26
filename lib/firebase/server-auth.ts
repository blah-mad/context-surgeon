import type { NextRequest } from "next/server";
import { requireFirebaseWebConfig } from "./config";

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
}

interface AccountLookupResponse {
  users?: Array<{
    localId: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
  }>;
  error?: { message?: string };
}

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export async function verifyFirebaseRequest(request: NextRequest): Promise<VerifiedFirebaseUser> {
  const idToken = bearerToken(request);
  if (!idToken) {
    throw new Error("Missing Firebase ID token.");
  }

  const { apiKey } = requireFirebaseWebConfig();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken })
    }
  );
  const payload = (await response.json().catch(() => ({}))) as AccountLookupResponse;
  const user = payload.users?.[0];

  if (!response.ok || !user?.localId) {
    throw new Error(payload.error?.message ?? "Invalid Firebase session.");
  }

  return {
    uid: user.localId,
    email: user.email ?? "",
    emailVerified: Boolean(user.emailVerified),
    displayName: user.displayName
  };
}
