import * as fld from "@tensorflow-models/face-landmarks-detection";

let hasRun = false;
const EAR_THRESHOLD = 0.2;
let detector;
const videl = document.getElementById("webcam");

const rightEyeKeyPoints = (keypoints) => {
  return {
    bottomLandmark: keypoints[145],
    topLandmark: keypoints[159],
    leftLandmark: keypoints[33],
    rightLandmark: keypoints[133],
  };
};
const leftEyeKeyPoints = (keypoints) => {
  return {
    bottomLandmark: keypoints[374],
    topLandmark: keypoints[386],
    leftLandmark: keypoints[362],
    rightLandmark: keypoints[263],
  };
};

const setup = async () => {
  if (hasRun) return;
  hasRun = true;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videl.srcObject = stream;
  const model = fld.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: "mediapipe", // or 'tfjs'
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
  };
  detector = await fld.createDetector(model, detectorConfig);
};
export const detectEyes = async (cb) => {
  await setup();
  if (!detector) return;
  const faces = await detector.estimateFaces(videl);
  if (faces && faces.length > 0) {
    faces.forEach(({ keypoints }) => {
      const rightEAR = calculateEAR(rightEyeKeyPoints(keypoints));
      const leftEAR = calculateEAR(leftEyeKeyPoints(keypoints));

      // True if the eye is closed
      const closed = leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;

      cb((state) => (state != closed ? closed : state));
    });
  }
};

function euclideanDistance(point1, point2) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

function calculateEAR({
  topLandmark,
  bottomLandmark,
  leftLandmark,
  rightLandmark,
}) {
  const verticalDist = euclideanDistance(topLandmark, bottomLandmark);
  const horizontalDist = euclideanDistance(leftLandmark, rightLandmark);
  const ear = verticalDist / horizontalDist;
  return ear;
}
