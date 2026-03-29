import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarker: FaceLandmarker | null = null;

const BLINK_THRESHOLD = 0.5;

export async function initFaceDetection(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
  });
}

export function detectEyesClosed(video: HTMLVideoElement): boolean {
  if (!landmarker || video.readyState < 2) return false;

  const result = landmarker.detectForVideo(video, performance.now());

  if (
    !result.faceBlendshapes ||
    result.faceBlendshapes.length === 0
  ) {
    return false;
  }

  const shapes = result.faceBlendshapes[0].categories;
  const leftBlink = shapes.find((s) => s.categoryName === "eyeBlinkLeft");
  const rightBlink = shapes.find((s) => s.categoryName === "eyeBlinkRight");

  if (!leftBlink || !rightBlink) return false;

  return leftBlink.score > BLINK_THRESHOLD && rightBlink.score > BLINK_THRESHOLD;
}
