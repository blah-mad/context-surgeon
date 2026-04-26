import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;
  return NextResponse.redirect(
    new URL(
      `/demo?integration=connected&connected_account_id=${encodeURIComponent(
        params.get("connected_account_id") ?? params.get("id") ?? ""
      )}`,
      url.origin
    )
  );
}
