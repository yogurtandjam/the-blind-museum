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

const detectorPromise = fld.createDetector(
  fld.SupportedModels.MediaPipeFaceMesh,
  DETECTOR_CONFIG
);

function App() {
  const [eyesClosed, setEyesClosed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<fld.FaceLandmarksDetector | null>(null);

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
    const initTensorFlow = async () => {
      const video = videoRef.current;
      if (!video) return;
      const stream = await navigator.mediaDevices.getUserMedia(
        USER_MEDIA_CONSTRAINTS
      );
      video.srcObject = stream;
      detectorRef.current = await detectorPromise;
    };
    initTensorFlow();
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
