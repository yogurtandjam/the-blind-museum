import { NextRequest, NextResponse } from "next/server";

const MET_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1/search";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();

  try {
    const res = await fetch(`${MET_SEARCH}?${params}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API /search] Error:", err);
    return NextResponse.json({ objectIDs: null }, { status: 500 });
  }
}
