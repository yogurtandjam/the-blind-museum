import { useEffect, useRef, useCallback } from "react";
import { Art } from "../models/Art";
import { Wing } from "../models/Wing";
import { playNarration, speakText, StopHandle } from "../audio/tts";

export function useNarration(
  currentArtwork: Art | null,
  currentWing: Wing | null,
  eyesClosed: boolean,
  artworkIndex: number,
  wingIndex: number
) {
  const prevWingIndexRef = useRef(wingIndex);
  const prevArtworkIndexRef = useRef(artworkIndex);
  const prevEyesClosedRef = useRef(eyesClosed);
  const activeSpeechRef = useRef<StopHandle | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasAnnouncedArrivalRef = useRef(false);

  const eyesClosedRef = useRef(eyesClosed);
  eyesClosedRef.current = eyesClosed;

  const cancelAll = useCallback(() => {
    // Abort any in-flight fetches (Sanity, OpenAI, CDN downloads)
    abortRef.current?.abort();
    abortRef.current = null;

    // Stop any playing audio
    activeSpeechRef.current?.stop();
    activeSpeechRef.current = null;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      cancelAll();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        activeSpeechRef.current = await speakText(text, ac.signal, onEnd);
      } catch {
        // Aborted or failed — ignore
      }
    },
    [cancelAll]
  );

  const narrateArtwork = useCallback(
    async (artwork: Art, onEnd?: () => void) => {
      cancelAll();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        activeSpeechRef.current = await playNarration(
          artwork.objectID,
          artwork.narrationText,
          ac.signal,
          onEnd
        );
      } catch {
        // Aborted or failed — ignore
      }
    },
    [cancelAll]
  );

  // Wing change → announce wing name
  useEffect(() => {
    const wingChanged = wingIndex !== prevWingIndexRef.current;
    prevWingIndexRef.current = wingIndex;

    if (wingChanged && currentWing) {
      hasAnnouncedArrivalRef.current = false;
      speak(`Entering ${currentWing.displayName}.`);
    }
  }, [wingIndex, currentWing, speak]);

  // Artwork change → narrate if eyes closed
  useEffect(() => {
    const artworkChanged = artworkIndex !== prevArtworkIndexRef.current;
    prevArtworkIndexRef.current = artworkIndex;

    if (!currentWing || !currentArtwork) return;

    if (artworkChanged || !hasAnnouncedArrivalRef.current) {
      hasAnnouncedArrivalRef.current = true;
      if (eyesClosedRef.current) {
        narrateArtwork(currentArtwork);
      }
    }
  }, [artworkIndex, wingIndex, currentWing, currentArtwork, narrateArtwork, cancelAll]);

  // Eyes close → narrate artwork
  // Eyes open → cancel all audio + abort fetches
  useEffect(() => {
    const wasOpen = !prevEyesClosedRef.current;
    const justClosed = eyesClosed && wasOpen;
    const justOpened = !eyesClosed && prevEyesClosedRef.current;
    prevEyesClosedRef.current = eyesClosed;

    if (justClosed && currentArtwork) {
      narrateArtwork(currentArtwork);
      return;
    }

    if (justOpened) {
      cancelAll();
    }
  }, [eyesClosed, currentArtwork, narrateArtwork, cancelAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAll();
  }, [cancelAll]);
}
