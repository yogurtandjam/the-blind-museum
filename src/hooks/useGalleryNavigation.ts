import { useReducer, useEffect } from "react";
import { Art } from "../models/Art";
import { Wing } from "../models/Wing";

export type GalleryState = {
  wings: Wing[];
  currentWingIndex: number;
  currentArtworkIndex: number;
  loadingState: "idle" | "loading-departments" | "ready" | "error";
};

export type GalleryAction =
  | { type: "LOAD_DEPARTMENTS_START" }
  | { type: "LOAD_DEPARTMENTS_DONE"; wings: Wing[] }
  | { type: "LOAD_DEPARTMENTS_ERROR" }
  | { type: "LOAD_WING_ARTWORKS"; departmentId: number; artworks: Art[] }
  | { type: "NAVIGATE_LEFT" }
  | { type: "NAVIGATE_RIGHT" }
  | { type: "NAVIGATE_UP" }
  | { type: "NAVIGATE_DOWN" };

const initialState: GalleryState = {
  wings: [],
  currentWingIndex: 0,
  currentArtworkIndex: 0,
  loadingState: "idle",
};

function findNextNonEmptyWing(
  wings: Wing[],
  fromIndex: number,
  direction: 1 | -1
): number {
  let i = fromIndex + direction;
  while (i >= 0 && i < wings.length) {
    const wing = wings[i];
    if (wing.loadingState !== "loaded" || wing.artworks.length > 0) {
      return i;
    }
    i += direction;
  }
  return fromIndex;
}

function reducer(state: GalleryState, action: GalleryAction): GalleryState {
  switch (action.type) {
    case "LOAD_DEPARTMENTS_START":
      return { ...state, loadingState: "loading-departments" };

    case "LOAD_DEPARTMENTS_DONE":
      return { ...state, wings: action.wings, loadingState: "ready" };

    case "LOAD_DEPARTMENTS_ERROR":
      return { ...state, loadingState: "error" };

    case "LOAD_WING_ARTWORKS": {
      const wings = state.wings.map((w) =>
        w.departmentId === action.departmentId
          ? { ...w, artworks: action.artworks, loadingState: "loaded" as const }
          : w
      );
      return { ...state, wings };
    }

    case "NAVIGATE_LEFT": {
      const newIndex = state.currentArtworkIndex - 1;
      if (newIndex < 0) return state;
      return { ...state, currentArtworkIndex: newIndex };
    }

    case "NAVIGATE_RIGHT": {
      const wing = state.wings[state.currentWingIndex];
      const max = wing ? wing.artworks.length - 1 : 0;
      const newIndex = state.currentArtworkIndex + 1;
      if (newIndex > max) return state;
      return { ...state, currentArtworkIndex: newIndex };
    }

    case "NAVIGATE_UP": {
      const nextIndex = findNextNonEmptyWing(state.wings, state.currentWingIndex, -1);
      if (nextIndex === state.currentWingIndex) return state;
      return {
        ...state,
        currentWingIndex: nextIndex,
        currentArtworkIndex: 0,
      };
    }

    case "NAVIGATE_DOWN": {
      const nextIndex = findNextNonEmptyWing(state.wings, state.currentWingIndex, 1);
      if (nextIndex === state.currentWingIndex) return state;
      return {
        ...state,
        currentWingIndex: nextIndex,
        currentArtworkIndex: 0,
      };
    }

    default:
      return state;
  }
}

export function useGalleryNavigation(active: boolean) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, GalleryAction["type"]> = {
        ArrowLeft: "NAVIGATE_LEFT",
        ArrowRight: "NAVIGATE_RIGHT",
        ArrowUp: "NAVIGATE_UP",
        ArrowDown: "NAVIGATE_DOWN",
      };
      const actionType = keyMap[e.key];
      if (actionType) {
        e.preventDefault();
        dispatch({ type: actionType } as GalleryAction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  const currentWing = state.wings[state.currentWingIndex] || null;
  const currentArtwork = currentWing?.artworks[state.currentArtworkIndex] || null;

  return {
    state,
    dispatch,
    currentWing,
    currentArtwork,
  };
}
