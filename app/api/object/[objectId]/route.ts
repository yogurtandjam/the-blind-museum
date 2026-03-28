import { NextRequest, NextResponse } from "next/server";

const MET_OBJECTS = "https://collectionapi.metmuseum.org/public/collection/v1/objects";

export async function GET(
  _req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  const { objectId } = params;

  try {
    const res = await fetch(`${MET_OBJECTS}/${objectId}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API /object] Error:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
