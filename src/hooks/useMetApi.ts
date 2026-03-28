import { useRef, useCallback } from "react";
import { SEARCH_URL, OBJ_URL } from "../consts";
import { Art } from "../models/Art";
import { Wing } from "../models/Wing";

type SearchResponse = {
  objectIDs: number[] | null;
};

const BATCH_SIZE = 10;

/**
 * Hardcoded Met Museum departments. These are stable and rarely change.
 * If they do, fetch the current list from:
 *   https://collectionapi.metmuseum.org/public/collection/v1/departments
 * and update this array.
 */
const DEPARTMENTS = [
  { departmentId: 1, displayName: "American Decorative Arts" },
  { departmentId: 3, displayName: "Ancient Near Eastern Art" },
  { departmentId: 4, displayName: "Arms and Armor" },
  { departmentId: 5, displayName: "Arts of Africa, Oceania, and the Americas" },
  { departmentId: 6, displayName: "Asian Art" },
  { departmentId: 7, displayName: "The Cloisters" },
  { departmentId: 8, displayName: "The Costume Institute" },
  { departmentId: 9, displayName: "Drawings and Prints" },
  { departmentId: 10, displayName: "Egyptian Art" },
  { departmentId: 11, displayName: "European Paintings" },
  { departmentId: 12, displayName: "European Sculpture and Decorative Arts" },
  { departmentId: 13, displayName: "Greek and Roman Art" },
  { departmentId: 14, displayName: "Islamic Art" },
  { departmentId: 15, displayName: "The Robert Lehman Collection" },
  { departmentId: 16, displayName: "The Libraries" },
  { departmentId: 17, displayName: "Medieval Art" },
  { departmentId: 19, displayName: "Photographs" },
  { departmentId: 21, displayName: "Modern and Contemporary Art" },
];

const artworkCache = new Map<number, Art>();

export function useMetApi() {
  const wingsRef = useRef<Map<number, Wing>>(new Map());

  const fetchDepartments = useCallback((): Promise<Wing[]> => {
    const wings: Wing[] = DEPARTMENTS.map((dept) => ({
      departmentId: dept.departmentId,
      displayName: dept.displayName,
      artworks: [],
      objectIds: [],
      loadingState: "idle" as const,
    }));

    wings.forEach((w) => wingsRef.current.set(w.departmentId, w));
    return Promise.resolve(wings);
  }, []);

  const fetchArtwork = useCallback(async (objectId: number): Promise<Art | null> => {
    if (artworkCache.has(objectId)) {
      return artworkCache.get(objectId)!;
    }
    try {
      const res = await fetch(`${OBJ_URL}/${objectId}`);
      const data = await res.json();
      if (!data.objectID || !data.primaryImageSmall) return null;
      const art = new Art(data);
      artworkCache.set(objectId, art);
      return art;
    } catch {
      return null;
    }
  }, []);

  const fetchWingArtworks = useCallback(
    async (departmentId: number): Promise<Art[]> => {
      const wing = wingsRef.current.get(departmentId);
      if (!wing) return [];
      if (wing.loadingState === "loaded") return wing.artworks;

      wing.loadingState = "loading";

      try {
        const res = await fetch(
          `${SEARCH_URL}?departmentId=${departmentId}&isHighlight=true&hasImages=true&q=*`
        );
        const data: SearchResponse = await res.json();
        const objectIds = data.objectIDs || [];
        wing.objectIds = objectIds;

        const batch = objectIds.slice(0, BATCH_SIZE);
        const results = await Promise.all(batch.map(fetchArtwork));
        const artworks = results.filter((a): a is Art => a !== null);

        wing.artworks = artworks;
        wing.loadingState = "loaded";
        return artworks;
      } catch {
        wing.loadingState = "idle";
        return [];
      }
    },
    [fetchArtwork]
  );

  const fetchMoreArtworks = useCallback(
    async (departmentId: number): Promise<Art[]> => {
      const wing = wingsRef.current.get(departmentId);
      if (!wing || wing.loadingState !== "loaded") return [];

      const loaded = wing.artworks.length;
      const nextBatch = wing.objectIds.slice(loaded, loaded + BATCH_SIZE);
      if (nextBatch.length === 0) return wing.artworks;

      const results = await Promise.all(nextBatch.map(fetchArtwork));
      const newArtworks = results.filter((a): a is Art => a !== null);
      wing.artworks = [...wing.artworks, ...newArtworks];
      return wing.artworks;
    },
    [fetchArtwork]
  );

  return { fetchDepartments, fetchWingArtworks, fetchMoreArtworks };
}
