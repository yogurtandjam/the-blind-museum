const SANITY_PROJECT = "cctd4ker";
const SANITY_DATASET = "production";
const SANITY_API = `https://${SANITY_PROJECT}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}`;
const SANITY_CDN = `https://cdn.sanity.io/files/${SANITY_PROJECT}/${SANITY_DATASET}`;

export type MetAudioResult = {
  url: string;
  title: string;
  transcript: string;
  description: string;
};

type SanityBlock = {
  children?: { text?: string }[];
};

type SanityAudioFile = {
  title: string;
  rank: number;
  file?: { asset?: { _ref?: string } };
  transcript?: SanityBlock[];
  meta?: { description?: string };
};

const cache = new Map<string, MetAudioResult | null>();

function buildSanityFileUrl(fileRef: string): string | null {
  // "file-{hash}-{ext}" → "{hash}.{ext}"
  const match = fileRef.match(/^file-(.+)-(\w+)$/);
  if (!match) return null;
  return `${SANITY_CDN}/${match[1]}.${match[2]}`;
}

function flattenTranscript(blocks?: SanityBlock[]): string {
  if (!blocks) return "";
  return blocks
    .flatMap((block) =>
      (block.children || []).map((child) => child.text || "")
    )
    .join(" ")
    .trim();
}

export async function fetchAudioForArtwork(
  objectID: string,
  signal?: AbortSignal
): Promise<MetAudioResult | null> {
  if (cache.has(objectID)) {
    return cache.get(objectID)!;
  }

  try {
    const query = `*[_type == "audioFile" && crdId == "${objectID}" && language == "en"] | order(rank asc)`;
    const res = await fetch(
      `${SANITY_API}?query=${encodeURIComponent(query)}`,
      { signal }
    );

    if (!res.ok) {
      console.error(`[MetAudio] Sanity query failed: ${res.status}`);
      cache.set(objectID, null);
      return null;
    }

    const data = await res.json();
    const results: SanityAudioFile[] = data.result || [];

    if (results.length === 0) {
      cache.set(objectID, null);
      return null;
    }

    // Pick the first (lowest rank) audio file
    const best = results[0];
    const fileRef = best.file?.asset?._ref;
    if (!fileRef) {
      cache.set(objectID, null);
      return null;
    }

    const url = buildSanityFileUrl(fileRef);
    if (!url) {
      cache.set(objectID, null);
      return null;
    }

    const result: MetAudioResult = {
      url,
      title: best.title || "",
      transcript: flattenTranscript(best.transcript),
      description: best.meta?.description || "",
    };

    cache.set(objectID, result);
    return result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.error("[MetAudio] Fetch error:", err);
    cache.set(objectID, null);
    return null;
  }
}
