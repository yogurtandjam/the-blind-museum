import { fetchAudioForArtwork } from "./metAudio";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const STORAGE_KEY = "blind-museum-openai-key";

const blobUrlCache = new Map<string, string>();

export type StopHandle = { stop: () => void };

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

const audioElementCache = new Map<string, HTMLAudioElement>();

/** Play an audio URL via HTML Audio element, reusing cached elements */
function playAudioUrl(
  url: string,
  signal?: AbortSignal,
  onEnd?: () => void
): Promise<StopHandle> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));

    let audio = audioElementCache.get(url);
    if (!audio) {
      audio = new Audio(url);
      audioElementCache.set(url, audio);
    }

    const stopHandle: StopHandle = {
      stop: () => {
        audio!.pause();
        audio!.currentTime = 0;
      },
    };

    // Abort listener — stop download + playback if signal fires
    signal?.addEventListener("abort", () => {
      stopHandle.stop();
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });

    audio.currentTime = 0;
    audio.onended = () => onEnd?.();
    audio.onerror = (e) => {
      console.error("[Audio] Playback error:", e);
      reject(e);
    };
    audio.play().then(() => resolve(stopHandle)).catch(reject);
  });
}

/**
 * Main narration entry point.
 * Priority: Met audio guide → OpenAI TTS → SpeechSynthesis
 */
export async function playNarration(
  objectID: string,
  fallbackText: string,
  signal?: AbortSignal,
  onEnd?: () => void
): Promise<StopHandle> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // 1. Try Met museum audio guide (only ~500 objects have audio, mostly major highlights)
  try {
    const metAudio = await fetchAudioForArtwork(objectID, signal);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (metAudio) {
      return await playAudioUrl(metAudio.url, signal, onEnd);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // Fall through to TTS
  }

  // 2. Try OpenAI TTS
  const blobUrl = await fetchSpeechBlob(fallbackText, "nova", signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (blobUrl) {
    try {
      return await playAudioUrl(blobUrl, signal, onEnd);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      // Fall through to SpeechSynthesis
    }
  }

  // 3. Fallback to SpeechSynthesis
  return playSpeechSynthesis(fallbackText, onEnd);
}

/** Speak short text via TTS or SpeechSynthesis (for wing names, etc.) */
export async function speakText(
  text: string,
  signal?: AbortSignal,
  onEnd?: () => void
): Promise<StopHandle> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const blobUrl = await fetchSpeechBlob(text, "nova", signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (blobUrl) {
    try {
      return await playAudioUrl(blobUrl, signal, onEnd);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
    }
  }
  return playSpeechSynthesis(text, onEnd);
}

async function fetchSpeechBlob(
  text: string,
  voice: string = "nova",
  signal?: AbortSignal
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const cacheKey = `${voice}:${text}`;
  if (blobUrlCache.has(cacheKey)) {
    return blobUrlCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice,
        input: text,
        response_format: "mp3",
        speed: 0.95,
      }),
      signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[TTS] API error ${res.status}: ${body}`);
      if (res.status === 401) clearApiKey();
      return null;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    blobUrlCache.set(cacheKey, url);
    return url;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.error("[TTS] Fetch failed:", err);
    return null;
  }
}

function playSpeechSynthesis(
  text: string,
  onEnd?: () => void
): StopHandle {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return { stop: () => {} };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.onend = () => onEnd?.();
  window.speechSynthesis.speak(utterance);

  return {
    stop: () => window.speechSynthesis.cancel(),
  };
}
