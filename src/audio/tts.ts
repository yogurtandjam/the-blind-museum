import { fetchAudioForArtwork } from "./metAudio";

export type StopHandle = { stop: () => void };

const audioElementCache = new Map<string, HTMLAudioElement>();
const ttsBlobCache = new Map<string, string>();

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

async function fetchTTSBlob(
  text: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (ttsBlobCache.has(text)) {
    return ttsBlobCache.get(text)!;
  }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    ttsBlobCache.set(text, url);
    return url;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return null;
  }
}

/**
 * Main narration entry point.
 * Priority: Met audio guide → OpenAI TTS (server-side) → SpeechSynthesis
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
  }

  // 2. Try OpenAI TTS via server-side API route
  try {
    const blobUrl = await fetchTTSBlob(fallbackText, signal);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (blobUrl) {
      return await playAudioUrl(blobUrl, signal, onEnd);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
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

  try {
    const blobUrl = await fetchTTSBlob(text, signal);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (blobUrl) {
      return await playAudioUrl(blobUrl, signal, onEnd);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
  }

  return playSpeechSynthesis(text, onEnd);
}

function playSpeechSynthesis(
  text: string,
  onEnd?: () => void
): StopHandle {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
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
