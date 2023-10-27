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

  console.log({ artworkIds });

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

  const debouncedFetch = useCallback(
    debounce((q) => search(q).then((res) => setArt(res as TArtPieces)), 500),
    []
  );

  useEffect(() => {
    if (query.length > 0) {
      debouncedFetch(query);
    }
  }, [query]);

  useEffect(() => {
    console.log({ art });
  }, [art]);
  const handleChangeQuery = (e: ChangeEvent<HTMLInputElement>) =>
    setQuery(e.target.value);
  return (
    <div>
      <label htmlFor="search">Search for an art piece:</label>
      <input id="search" value={query} onChange={handleChangeQuery} />
      {!eyesClosed && (
        <div>
          Please close your eyes to fully immerse yourself in the blind museum
          experience
        </div>
      )}
      <div style={{ visibility: eyesClosed ? "visible" : "hidden" }}>
        {art.map((artPiece) => (
          <div key={artPiece.objectID}>
            <Image src={artPiece.primaryImageSmall} />
          </div>
        ))}
      </div>
    </div>
  );
};
