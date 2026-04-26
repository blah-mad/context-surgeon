import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/context-surgeon/server/store";

export async function GET() {
  return NextResponse.json(await getSnapshot());
}
