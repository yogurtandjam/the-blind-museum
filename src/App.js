import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { detectEyes } from './tf';


function App() {
  const [isClosed, setClosed] = useState(false)
  useEffect(() => {
    setInterval(() => detectEyes(setClosed), 1000)
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        eyes are {isClosed ? 'closed': 'open'}
      </header>
    </div>
  );
}

export default App;
