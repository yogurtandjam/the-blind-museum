import debounce from "lodash.debounce"
import { useEffect, useMemo, useState } from "react"
import { OBJ_URL, SEARCH_URL } from "./consts"
import { Art } from "./models/Art"
import Image from "./Image"


export const Search = ({eyesClosed}) => {
    const [query, setQuery] = useState('')
    const [art, setArt] = useState([])

    const search = q => {
        fetch(`${SEARCH_URL}?q=${q}`)
            .then(res => res.json())
            .then(artworkIds => {
                console.log(artworkIds)
                Promise.all((artworkIds.objectIDs|| []).slice(0, 10).map(id => {
                    return fetch(`${OBJ_URL}/${id}`).then(res => res.json())
                })).then(responses => responses.filter(res => res.objectID)).then(
                    validObjs => validObjs.map(validObj => new Art(validObj))
                ).then(setArt)
            })
    }
    const debouncedFetch = useMemo(() => debounce(search, 500), [])
    useEffect(() => {
        debouncedFetch(query)
    }, [query])

    useEffect(() => {
        console.log(art)
    }, [art])
    const handleChangeQuery = e => setQuery(e.target.value)
    return (
        <div>
            <input value={query} onChange={handleChangeQuery}/>
            {!eyesClosed && <div>Please close your eyes to fully immerse yourself in the blind museum experience</div>}
            <div style={{visibility: eyesClosed ? "visible": "hidden"}}>
             {art.map(artPiece => (
                <div>
                    <Image src={artPiece.primaryImageSmall}/>
                </div>
            ))}
            </div>
        </div>
    )
}