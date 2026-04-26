import { NextResponse } from "next/server";
import { getFirebaseWebConfig } from "@/lib/firebase/config";

export async function GET() {
  const config = getFirebaseWebConfig();
  return NextResponse.json(
    config ? { configured: true, ...config } : { configured: false },
    { headers: { "cache-control": "no-store" } }
  );
}
