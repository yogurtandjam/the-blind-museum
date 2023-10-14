import * as fld from '@tensorflow-models/face-landmarks-detection';

let hasRun = false
const EAR_THRESHOLD = 0.2
let detector
const videl = document.getElementById('webcam');

// TODO: use these. maybe add typescript too so this is more clear
const rightEyeKeyPoints = keypoints => {
    return {
        lower: keypoints[145],
        upper: keypoints[159],
        left: keypoints[33],
        right: keypoints[133],
    }
}
const leftEyeKeyPoints = keypoints => {
    return {
        lower: keypoints[374],
        upper: keypoints[386],
        left: keypoints[362],
        right: keypoints[263],
    }
}

const setup = async() => {
    if (hasRun) return
    hasRun = true
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videl.srcObject = stream;
    const model = fld.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
        runtime: 'mediapipe', // or 'tfjs'
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    }
    detector = await fld.createDetector(model, detectorConfig);
}
export const detectEyes = async(cb) => {
    await setup()
    if (!detector) return
    const faces = await detector.estimateFaces(videl);
    console.log(faces)
    if (faces && faces.length > 0) {
        // console.log('faces', faces[0].keypoints.map((kp, i) => ({name:kp.name, i})).filter(kp => ['leftEye', 'rightEye'].includes(kp.name)))
        faces.forEach((prediction) => {
            // console.log('face', prediction)
            let e
            // Right eye parameters
            const lowerRight = prediction.keypoints[145];
            const upperRight = prediction.keypoints[159];
            const leftRight = prediction.keypoints[33];
            const rightRight = prediction.keypoints[133];
            const rightEAR = calculateEAR(upperRight, lowerRight, leftRight, rightRight);
            // console.log('right ear', rightEAR)
            // Left eye parameters
            const lowerLeft = prediction.keypoints[374];
            const upperLeft = prediction.keypoints[386];
            const leftLeft = prediction.keypoints[362];
            const rightLeft = prediction.keypoints[263];
            const leftEAR = calculateEAR(upperLeft, lowerLeft, leftLeft, rightLeft);
            // console.log('left ear', rightEAR)
        
            // True if the eye is closed
            const closed = leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;
        
            console.log('isclosed', closed)
            cb(state => state != closed ? closed : state)
        });
    }
}

function euclideanDistance(point1, point2) {
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
  }

function calculateEAR(topLandmark, bottomLandmark, leftLandmark, rightLandmark) {
    const verticalDist = euclideanDistance(topLandmark, bottomLandmark);
    const horizontalDist = euclideanDistance(leftLandmark, rightLandmark);
    // console.log('veri dist', verticalDist)
    // console.log('ohriz dist', horizontalDist)
    const ear = verticalDist / horizontalDist;
    return ear;
}