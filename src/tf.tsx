// https://stackoverflow.com/questions/61412000/do-i-need-to-use-the-import-type-feature-of-typescript-3-8-if-all-of-my-import
import type { FaceLandmarksDetector } from "@tensorflow-models/face-landmarks-detection";

type Keypoint = {
  x: number;
  y: number;
};
type Keypoints = Keypoint[];

type EyeKeypoints = {
  bottomLandmark: Keypoint;
  topLandmark: Keypoint;
  leftLandmark: Keypoint;
  rightLandmark: Keypoint;
};

// Average EAR for eyes open is 0.141 and for eyes closed is 0.339
const EAR_THRESHOLD = 0.141;

const rightEyeKeyPoints = (keypoints: Keypoints): EyeKeypoints => {
  return {
    bottomLandmark: keypoints[145],
    topLandmark: keypoints[159],
    leftLandmark: keypoints[33],
    rightLandmark: keypoints[133],
  };
};
const leftEyeKeyPoints = (keypoints: Keypoints): EyeKeypoints => {
  return {
    bottomLandmark: keypoints[374],
    topLandmark: keypoints[386],
    leftLandmark: keypoints[362],
    rightLandmark: keypoints[263],
  };
};

export const detectEyeClosure = async (
  detector: FaceLandmarksDetector | null,
  video: HTMLVideoElement | null
) => {
  if (!detector || !video) {
    return { closed: false };
  }
  const faces = await detector.estimateFaces(video);

  if (!faces || faces.length === 0) {
    return { closed: false };
  }

  const closed = faces.every((face) => {
    const { keypoints } = face;

    const rightEAR = calculateEAR(rightEyeKeyPoints(keypoints));
    const leftEAR = calculateEAR(leftEyeKeyPoints(keypoints));

    // true if both eyes are closed
    return leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;
  });
  return { closed };
};

function euclideanDistance(point1: Keypoint, point2: Keypoint) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

function calculateEAR({
  topLandmark,
  bottomLandmark,
  leftLandmark,
  rightLandmark,
}: EyeKeypoints) {
  const verticalDist = euclideanDistance(topLandmark, bottomLandmark);
  const horizontalDist = euclideanDistance(leftLandmark, rightLandmark);
  const ear = verticalDist / horizontalDist;
  return ear;
}
