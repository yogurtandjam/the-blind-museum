import "./App.css";
import { useEffect, useRef, useState } from "react";
import { detectEyeClosure } from "./tf";
import * as tf from "@tensorflow/tfjs";
import * as fld from "@tensorflow-models/face-landmarks-detection";
import { Search } from "./Search";

const USER_MEDIA_CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: "user",
  },
};

const DETECTOR_CONFIG: fld.MediaPipeFaceMeshMediaPipeModelConfig = {
  runtime: "mediapipe", // or 'tfjs'
  solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
  refineLandmarks: true,
};

function App() {
  const [eyesClosed, setEyesClosed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<fld.FaceLandmarksDetector | null>(null);

  const initTensorFlow = async () => {
    const video = videoRef.current;
    const stream = await navigator.mediaDevices.getUserMedia(
      USER_MEDIA_CONSTRAINTS
    );
    if (!video) return;
    video.srcObject = stream;

    detectorRef.current = await fld.createDetector(
      fld.SupportedModels.MediaPipeFaceMesh,
      DETECTOR_CONFIG
    );
  };

  const animate = async () => {
    const { closed } = await detectEyeClosure(
      detectorRef.current,
      videoRef.current
    );
    setEyesClosed(closed);
    await tf.nextFrame();
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    initTensorFlow(); // Initialize TensorFlow and start the animation loop
  }, []);

  return (
    <div className="App">
      <video
        ref={videoRef}
        width="1"
        height="1"
        autoPlay
        playsInline
        muted
        onLoadedMetadata={animate}
        style={{ position: "fixed" }}
      />
      <Search eyesClosed={eyesClosed} />
    </div>
  );
}

export default App;
