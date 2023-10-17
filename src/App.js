import "./App.css";
import { useEffect, useState } from "react";
import { detectEyes } from "./tf";
import { Search } from "./Search";

function App() {
  const [eyesClosed, setEyesClosed] = useState(false);
  useEffect(() => {
    const intervalId = setInterval(() => detectEyes(setEyesClosed), 1000 / 60);
    return () => clearInterval(intervalId);
  }, []);
  return (
    <div className="App">
      <Search eyesClosed={eyesClosed} />
    </div>
  );
}

export default App;
