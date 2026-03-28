export type MetAudioResult = {
  url: string;
  title: string;
  transcript: string;
  description: string;
};

const cache = new Map<string, MetAudioResult | null>();

export async function fetchAudioForArtwork(
  objectID: string,
  signal?: AbortSignal
): Promise<MetAudioResult | null> {
  if (cache.has(objectID)) {
    return cache.get(objectID)!;
  }

  try {
    const res = await fetch(`/api/audio/${objectID}`, { signal });

    if (!res.ok) {
      cache.set(objectID, null);
      return null;
    }

    const data = await res.json();
    if (!data || !data.url) {
      cache.set(objectID, null);
      return null;
    }

    cache.set(objectID, data);
    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.error("[MetAudio] Fetch error:", err);
    cache.set(objectID, null);
    return null;
  }
}
