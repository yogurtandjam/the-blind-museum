import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { detectEyes } from './tf';


function App() {
  const [isClosed, setClosed] = useState(false)
  const [pic, setPic] = useState({})
  useEffect(() => {
    setInterval(() => {
      detectEyes(setClosed)
    }, 1000/60)
    
    
    fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects/436530').then(
      res => res.json()
    ).then(
      res => setPic(res.primaryImage)
    )

    fetch('/ping')
  }, [])
  return (
    <div className="App">
      <header className="App-header">
      {isClosed ? <img src={pic}/>:
      'please close your eyes to properly simulate the experience'
      }
      </header>
    </div>
  );
}

export default App;
