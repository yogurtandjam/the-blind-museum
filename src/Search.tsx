import debounce from "lodash.debounce";
import { useEffect, useCallback, useState, ChangeEvent } from "react";
import { OBJ_URL, SEARCH_URL } from "./consts";
import { Art } from "./models/Art";
import Image from "./Image";

type TArtworkIds = {
  objectIDs: string[];
};
type TArtPiece = {
  objectID: string;
  primaryImageSmall: string;
};
type TArtPieces = TArtPiece[];

const search = async (q: string) => {
  const res = await fetch(`${SEARCH_URL}?q=${q}`);
  const artworkIds: TArtworkIds = await res.json();

  const responses = await Promise.all(
    (artworkIds.objectIDs || [])
      .slice(0, 10)
      .map((id) => fetch(`${OBJ_URL}/${id}`).then((res) => res.json()))
  );

  const validObjs = responses.filter(
    (res) => res.objectID && res.primaryImageSmall
  );
  return validObjs.map((validObj) => new Art(validObj));
};

export const Search = ({ eyesClosed }: { eyesClosed: boolean }) => {
  const [query, setQuery] = useState("");
  const [art, setArt] = useState<TArtPieces | []>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((q) => search(q).then((res) => setArt(res as TArtPieces)), 500),
    []
  );

  useEffect(() => {
    if (query.length > 0) {
      debouncedFetch(query);
    }
  }, [query, debouncedFetch]);

  const handleChangeQuery = (e: ChangeEvent<HTMLInputElement>) =>
    setQuery(e.target.value);

  return (
    <>
      <input
        id="search"
        value={query}
        onChange={handleChangeQuery}
        placeholder="Search for an art piece"
        style={{
          maxWidth: "500px",
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      {!eyesClosed && (
        <p style={{ fontSize: "1.1rem" }}>
          Please close your eyes to fully immerse yourself in the blind museum
          experience.
        </p>
      )}
      <div style={{ visibility: eyesClosed ? "visible" : "hidden" }}>
        {art.map((artPiece) => (
          <Image key={artPiece.objectID} src={artPiece.primaryImageSmall} />
        ))}
      </div>
    </>
  );
};
