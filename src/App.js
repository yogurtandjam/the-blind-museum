import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { detectEyeClosure, setup } from "./tf";
import * as tf from "@tensorflow/tfjs";
import * as fld from "@tensorflow-models/face-landmarks-detection";
import { Search } from "./Search";

function App() {
  const [eyesClosed, setEyesClosed] = useState(false);
  const videoRef = useRef(null);
  const detectorRef = useRef(null);

  const initTensorFlow = async () => {
    const video = videoRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
      },
    });
    video.srcObject = stream;
    const detectorConfig = {
      runtime: "mediapipe", // or 'tfjs'
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    };
    detectorRef.current = await fld.createDetector(
      fld.SupportedModels.MediaPipeFaceMesh,
      detectorConfig
    );
  };
  const processVideo = async () => {
    const { closed } = await detectEyeClosure(
      detectorRef.current,
      videoRef.current
    );
    setEyesClosed(closed);
    await tf.nextFrame();
    requestAnimationFrame(processVideo);
  };
  useEffect(() => {
    initTensorFlow(); // Initialize TensorFlow and start the animation loop
  }, []);
  return (
    <div className="App">
      <video
        ref={videoRef}
        width="640"
        height="480"
        autoPlay
        playsInline
        muted
        onLoadedMetadata={processVideo}
        style={{ visibility: "hidden", position: "absolute" }}
      />
      <Search eyesClosed={eyesClosed} />
    </div>
  );
}

export default App;
