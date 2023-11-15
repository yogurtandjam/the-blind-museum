import debounce from "lodash.debounce";
import { useEffect, useCallback, useState, ChangeEvent } from "react";
import { OBJ_URL, SEARCH_URL } from "./consts";
import { Art } from "./models/Art";
import Image from "./Image";
import { Input } from "baseui/input";
import { ParagraphLarge } from "baseui/typography";

type TArtworkIds = {
  objectIDs: string[];
};
type TArtPiece = {
  objectID: string;
  primaryImageSmall: string;
};
type TArtPieces = TArtPiece[];

const MAX_WIDTH = 500;

const EMPTRY_RESULT: string[] = [];

// Search for objectIDs
const searchObjectIDs = async (q: string) => {
  const res = await fetch(`${SEARCH_URL}?q=${q}`);
  const response: TArtworkIds = await res.json();

  console.log({ response });

  return response.objectIDs ?? EMPTRY_RESULT;
};

// Fetch artworks data from the objectIDs
const fetchArtworks = async (objectIDs: string[]) => {
  const responses = await Promise.all(
    objectIDs.map(async (id) => {
      const res = await fetch(`${OBJ_URL}/${id}`);
      const artworks = await res.json();
      return artworks;
    })
  );
  console.log({ responses });

  const validObjs = responses.filter(
    (res) => res.objectID && res.primaryImageSmall
  );
  return validObjs.map((validObj) => new Art(validObj));
};

export const Search = ({ eyesClosed }: { eyesClosed: boolean }) => {
  const [query, setQuery] = useState("");
  const [objectIDs, setObjectIDs] = useState<string[]>([]);
  const [artworks, setArtworks] = useState<TArtPieces | []>([]);

  const debouncedFetchObjectIDs = useCallback(
    debounce((q) => searchObjectIDs(q).then((res) => setObjectIDs(res)), 500),
    []
  );

  // Find new objectIDs when the search query changes
  useEffect(() => {
    if (query.length > 0) {
      debouncedFetchObjectIDs(query);
    }
  }, [query]);

  // Fetch artworks data when the objectIDs change
  useEffect(() => {
    fetchArtworks(objectIDs.slice(0, 10)).then((res) => setArtworks(res));
  }, [objectIDs]);

  // Log the artworks when they change
  useEffect(() => {
    console.log({ artworks });
  }, [artworks]);

  const handleChangeQuery = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setQuery(e.target.value);

  return (
    <>
      <Input
        id="search"
        value={query}
        onChange={handleChangeQuery}
        placeholder="Search for an art piece"
        overrides={{
          Root: {
            style: {
              maxWidth: `${MAX_WIDTH}px`,
            },
          },
        }}
      />
      {!eyesClosed && (
        <ParagraphLarge>
          Please close your eyes to fully immerse yourself in the blind museum
          experience.
        </ParagraphLarge>
      )}
      <div style={{ visibility: eyesClosed ? "visible" : "hidden" }}>
        {artworks.map((artwork) => (
          <Image key={artwork.objectID} src={artwork.primaryImageSmall} />
        ))}
      </div>
    </>
  );
};
