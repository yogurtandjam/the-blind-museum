import { useEffect, useRef, useCallback } from "react";
import { useStyletron } from "baseui";
import { useGalleryNavigation } from "../hooks/useGalleryNavigation";
import { useMetApi } from "../hooks/useMetApi";
import { useNarration } from "../hooks/useNarration";
import Image from "../Image";

type GalleryWalkProps = {
  eyesClosed: boolean;
  onExit: () => void;
  onWingNavigate: (departmentId: number) => void;
  startAmbient: (departmentId: number) => void;
};

const SWIPE_THRESHOLD = 50;

export function GalleryWalk({
  eyesClosed,
  onExit,
  onWingNavigate,
  startAmbient,
}: GalleryWalkProps) {
  const [css] = useStyletron();
  const { state, dispatch, currentWing, currentArtwork } =
    useGalleryNavigation(true);
  const { fetchDepartments, fetchWingArtworks, fetchMoreArtworks } = useMetApi();
  const prevWingIndexRef = useRef(state.currentWingIndex);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load departments on mount
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "LOAD_DEPARTMENTS_START" });
    fetchDepartments().then((wings) => {
      if (!cancelled) {
        dispatch({ type: "LOAD_DEPARTMENTS_DONE", wings });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchDepartments, dispatch]);

  // Load artworks when wing changes
  useEffect(() => {
    if (!currentWing || currentWing.loadingState !== "idle") return;

    fetchWingArtworks(currentWing.departmentId).then((artworks) => {
      dispatch({
        type: "LOAD_WING_ARTWORKS",
        departmentId: currentWing.departmentId,
        artworks,
      });
    });
  }, [currentWing, fetchWingArtworks, dispatch]);

  // Pre-fetch adjacent wings
  useEffect(() => {
    if (state.loadingState !== "ready") return;
    const adjacentIndices = [
      state.currentWingIndex - 1,
      state.currentWingIndex + 1,
    ].filter((i) => i >= 0 && i < state.wings.length);

    adjacentIndices.forEach((i) => {
      const wing = state.wings[i];
      if (wing && wing.loadingState === "idle") {
        fetchWingArtworks(wing.departmentId).then((artworks) => {
          dispatch({
            type: "LOAD_WING_ARTWORKS",
            departmentId: wing.departmentId,
            artworks,
          });
        });
      }
    });
  }, [state.currentWingIndex, state.loadingState, state.wings, fetchWingArtworks, dispatch]);

  // Fetch more artworks when nearing the end of current batch
  useEffect(() => {
    if (!currentWing || currentWing.loadingState !== "loaded") return;
    const remaining = currentWing.artworks.length - state.currentArtworkIndex;
    if (remaining <= 3 && currentWing.objectIds.length > currentWing.artworks.length) {
      fetchMoreArtworks(currentWing.departmentId).then((artworks) => {
        dispatch({
          type: "LOAD_WING_ARTWORKS",
          departmentId: currentWing.departmentId,
          artworks,
        });
      });
    }
  }, [state.currentArtworkIndex, currentWing, fetchMoreArtworks, dispatch]);

  // Narration
  useNarration(
    currentArtwork,
    currentWing,
    eyesClosed,
    state.currentArtworkIndex,
    state.currentWingIndex
  );

  // Audio: start ambient when first wing loads
  useEffect(() => {
    if (currentWing && currentWing.loadingState === "loaded") {
      startAmbient(currentWing.departmentId);
    }
  }, [currentWing?.loadingState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Audio: wing navigation — ambient crossfade
  useEffect(() => {
    if (
      state.currentWingIndex !== prevWingIndexRef.current &&
      currentWing
    ) {
      onWingNavigate(currentWing.departmentId);
    }
    prevWingIndexRef.current = state.currentWingIndex;
  }, [state.currentWingIndex, currentWing, onWingNavigate]);

  // Escape to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  // Touch/swipe support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

      if (absDx > absDy) {
        dispatch({ type: dx > 0 ? "NAVIGATE_LEFT" : "NAVIGATE_RIGHT" });
      } else {
        dispatch({ type: dy > 0 ? "NAVIGATE_UP" : "NAVIGATE_DOWN" });
      }
    },
    [dispatch]
  );

  const isLoading =
    state.loadingState !== "ready" ||
    (currentWing && currentWing.loadingState !== "loaded");

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#e0e0e0",
        padding: "2rem",
        touchAction: "none",
      })}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="application"
      aria-label="Gallery walk. Use arrow keys to navigate."
    >
      {/* Screen reader announcements */}
      <div aria-live="polite" className={css({ position: "absolute", left: "-9999px" })}>
        {currentWing && currentArtwork && (
          <span>
            {currentWing.displayName}. {currentArtwork.title} by{" "}
            {currentArtwork.artistDisplayName}.
          </span>
        )}
      </div>

      {/* Artwork — only visible when eyes closed */}
      <div
        className={css({
          opacity: eyesClosed ? 1 : 0,
          transition: "opacity 0.5s ease",
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
        })}
      >
        {currentArtwork && (
          <>
            <Image src={currentArtwork.primaryImageSmall} />
            <p
              className={css({
                color: "#e0e0e0",
                marginTop: "1rem",
                fontSize: "1.1rem",
              })}
            >
              {currentArtwork.title}
            </p>
            <p className={css({ color: "#888", fontSize: "0.9rem" })}>
              {currentArtwork.artistDisplayName}
              {currentArtwork.objectDate && ` · ${currentArtwork.objectDate}`}
            </p>
            {currentArtwork.medium && (
              <p className={css({ color: "#666", fontSize: "0.85rem" })}>
                {currentArtwork.medium}
              </p>
            )}
          </>
        )}
      </div>

      {/* Minimal loading indicator */}
      {isLoading && (
        <p className={css({ color: "#444", fontSize: "0.85rem" })}>
          Loading...
        </p>
      )}
    </div>
  );
}
