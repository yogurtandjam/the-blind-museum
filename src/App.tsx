import { useCallback, useEffect, useRef, useState } from "react";
import { initFaceDetection, detectEyesClosed } from "./tf";
import { Search } from "./Search";
import { Lobby } from "./components/Lobby";
import { GalleryWalk } from "./components/GalleryWalk";
import { useAudioEngine } from "./hooks/useAudioEngine";

const MAX_EYES_CLOSED_COUNT = 10;
const DETECTOR_SMOOTHING = 0.7;

type AppMode = "lobby" | "search" | "gallery";

function App() {
  const [eyesClosedCount, setEyesClosedCount] = useState(0);
  const [mode, setMode] = useState<AppMode>("lobby");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let running = true;

    const init = async () => {
      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = stream;

      await new Promise<void>((resolve) => {
        const video = videoRef.current!;
        if (video.readyState >= 2) resolve();
        else video.onloadeddata = () => resolve();
      });

      await initFaceDetection();

      const animate = () => {
        if (!running) return;
        const closed = detectEyesClosed(videoRef.current!);
        setEyesClosedCount((prev) => {
          const next = closed ? prev + 1 : prev - 1;
          if (next < 0) return 0;
          if (next > MAX_EYES_CLOSED_COUNT) return MAX_EYES_CLOSED_COUNT;
          return next;
        });
        requestAnimationFrame(animate);
      };

      animate();
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
      {/* IMPORTANT: Video element MUST remain on-screen for MediaPipe face
         detection to work. Moving it offscreen (top:-9999px) or hiding it
         (display:none, visibility:hidden) breaks the detection pipeline.
         1x1px with position:fixed keeps it invisible to the user while
         the video stream still sends full-resolution frames to the landmarker. */}
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "1rem",
          }}
        >
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
