const EAR_THRESHOLD = 0.2;

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

export const detectEyeClosure = async (model, video) => {
  if (!model || !video) {
    return {};
  }
  const faces = await model.estimateFaces(video);
  let obj = {};
  if (faces && faces.length > 0) {
    faces.forEach(({ keypoints }) => {
      const rightEAR = calculateEAR(rightEyeKeyPoints(keypoints));
      const leftEAR = calculateEAR(leftEyeKeyPoints(keypoints));

      // True if the eye is closed
      const closed = leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;
      obj = {
        closed,
      };
    });
  }
  return obj;
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
