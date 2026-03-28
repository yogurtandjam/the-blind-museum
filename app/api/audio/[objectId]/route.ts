import { NextRequest, NextResponse } from "next/server";

const SANITY_PROJECT = "cctd4ker";
const SANITY_DATASET = "production";
const SANITY_API = `https://${SANITY_PROJECT}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}`;
const SANITY_CDN = `https://cdn.sanity.io/files/${SANITY_PROJECT}/${SANITY_DATASET}`;

function buildSanityFileUrl(fileRef: string): string | null {
  const match = fileRef.match(/^file-(.+)-(\w+)$/);
  if (!match) return null;
  return `${SANITY_CDN}/${match[1]}.${match[2]}`;
}

type SanityBlock = {
  children?: { text?: string }[];
};

function flattenTranscript(blocks?: SanityBlock[]): string {
  if (!blocks) return "";
  return blocks
    .flatMap((block) =>
      (block.children || []).map((child) => child.text || "")
    )
    .join(" ")
    .trim();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  const { objectId } = params;

  try {
    const query = `*[_type == "audioFile" && crdId == "${objectId}" && language == "en"] | order(rank asc)`;
    const res = await fetch(
      `${SANITY_API}?query=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
      return NextResponse.json(null, { status: res.status });
    }

    const data = await res.json();
    const results = data.result || [];

    if (results.length === 0) {
      return NextResponse.json(null);
    }

    const best = results[0];
    const fileRef = best.file?.asset?._ref;
    if (!fileRef) {
      return NextResponse.json(null);
    }

    const url = buildSanityFileUrl(fileRef);
    if (!url) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      url,
      title: best.title || "",
      transcript: flattenTranscript(best.transcript),
      description: best.meta?.description || "",
    });
  } catch (err) {
    console.error("[API /audio] Error:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
