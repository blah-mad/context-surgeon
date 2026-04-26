import { NextResponse } from "next/server";
import { qontextDatasetProof } from "@/lib/context-surgeon/qontext-proof";

export async function GET() {
  return NextResponse.json(qontextDatasetProof);
}
