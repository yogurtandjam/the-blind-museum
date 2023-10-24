// Average EAR for eyes open is 0.141 and for eyes closed is 0.339
const EAR_THRESHOLD = 0.141;

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

export const detectEyeClosure = async (detector, video) => {
  if (!detector || !video) {
    return false;
  }
  const faces = await detector.estimateFaces(video);

  if (!faces || faces.length === 0) {
    return false;
  }

  return faces.every((face) => {
    const { keypoints } = face;

    const rightEAR = calculateEAR(rightEyeKeyPoints(keypoints));
    const leftEAR = calculateEAR(leftEyeKeyPoints(keypoints));

    // true if both eyes are closed
    return leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;
  });
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
