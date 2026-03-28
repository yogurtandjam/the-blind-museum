import { useCallback, useEffect, useRef, useState } from "react";
import { detectEyeClosure } from "./tf";
import { Search } from "./Search";
import { Lobby } from "./components/Lobby";
import { GalleryWalk } from "./components/GalleryWalk";
import { useAudioEngine } from "./hooks/useAudioEngine";

const USER_MEDIA_CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: "user",
  },
};

const MAX_EYES_CLOSED_COUNT = 10;
const DETECTOR_SMOOTHING = 0.7;

type AppMode = "lobby" | "search" | "gallery";

function App() {
  const [eyesClosedCount, setEyesClosedCount] = useState(0);
  const [mode, setMode] = useState<AppMode>("lobby");
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);

  useEffect(() => {
    let running = true;

    const init = async () => {
      if (!videoRef.current) return;

      const [tf, fld] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/face-landmarks-detection"),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia(
        USER_MEDIA_CONSTRAINTS
      );
      videoRef.current.srcObject = stream;

      const detector = await fld.createDetector(
        fld.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "mediapipe" as const,
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
          refineLandmarks: true,
        }
      );
      detectorRef.current = detector;

      const animate = async () => {
        if (!running) return;
        const { closed } = await detectEyeClosure(
          detectorRef.current,
          videoRef.current
        );
        setEyesClosedCount((prev) => {
          const next = closed ? prev + 1 : prev - 1;
          if (next < 0) return 0;
          if (next > MAX_EYES_CLOSED_COUNT) return MAX_EYES_CLOSED_COUNT;
          return next;
        });
        await tf.nextFrame();
        requestAnimationFrame(animate);
      };

      videoRef.current.onloadedmetadata = () => animate();
    };

    init();
    return () => { running = false; };
  }, []);

  const eyesClosed =
    eyesClosedCount > MAX_EYES_CLOSED_COUNT * DETECTOR_SMOOTHING;

  const audioEngine = useAudioEngine();

  const handleEnterMuseum = useCallback(() => {
    audioEngine.initAudio();
    setMode("gallery");
  }, [audioEngine]);
  const handleSearch = useCallback(() => setMode("search"), []);
  const handleExitToLobby = useCallback(() => setMode("lobby"), []);

  return (
    <>
      <video
        ref={videoRef}
        width="1"
        height="1"
        autoPlay
        playsInline
        muted
        style={{ position: "fixed" }}
      />

      {mode === "lobby" && (
        <Lobby onEnterMuseum={handleEnterMuseum} onSearch={handleSearch} />
      )}

      {mode === "search" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "1rem" }}>
          <h3
            style={{ marginTop: 0, marginBottom: "1rem", cursor: "pointer" }}
            onClick={handleExitToLobby}
          >
            The Blind Museum
          </h3>
          <Search eyesClosed={eyesClosed} />
        </div>
      )}

      {mode === "gallery" && (
        <GalleryWalk
          eyesClosed={eyesClosed}
          onExit={handleExitToLobby}
          onWingNavigate={audioEngine.onWingNavigate}
          startAmbient={audioEngine.startAmbient}
        />
      )}
    </>
  );
}

export default App;
