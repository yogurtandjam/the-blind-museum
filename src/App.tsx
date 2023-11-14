import { useEffect, useRef, useState } from "react";
import { useStyletron } from "baseui";
import { HeadingXSmall } from "baseui/typography";
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

const MAX_EYES_CLOSED_COUNT = 10;
const DETECTOR_SMOOTHING = 0.7;

function App() {
  const [css, theme] = useStyletron();
  const [eyesClosedCount, setEyesClosedCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<fld.FaceLandmarksDetector | null>(null);

  const animate = async () => {
    const { closed } = await detectEyeClosure(
      detectorRef.current,
      videoRef.current
    );
    setEyesClosedCount((prev) => {
      const next = closed ? prev + 1 : prev - 1;
      if (next < 0) {
        return 0;
      } else if (next > MAX_EYES_CLOSED_COUNT) {
        return MAX_EYES_CLOSED_COUNT;
      } else {
        return next;
      }
    });
    await tf.nextFrame();
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const initTensorFlow = async () => {
      if (!videoRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia(
        USER_MEDIA_CONSTRAINTS
      );
      videoRef.current.srcObject = stream;
      detectorRef.current = await detectorPromise;
    };
    initTensorFlow();
  }, []);

  const eyesClosed =
    eyesClosedCount > MAX_EYES_CLOSED_COUNT * DETECTOR_SMOOTHING;

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: theme.sizing.scale650,
      })}
    >
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
      <HeadingXSmall marginTop={0} marginBottom={theme.sizing.scale650}>
        The Blind Museum
      </HeadingXSmall>
      <Search eyesClosed={eyesClosed} />
    </div>
  );
}

export default App;
