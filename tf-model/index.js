import * as tf from "@tensorflow/tfjs";
import { dataset } from "./dataset.js";

const mouse = {
  x: 0,
  y: 0,

  handleMouseMove: function(event) {
    // Get the mouse position and normalize it to [-1, 1]
    mouse.x = (event.clientX / window.width()) * 2 - 1;
    mouse.y = (event.clientY / window.height()) * 2 - 1;
  }
};

//create testing data
export const getEyeImageryFromHTML = () => {
  // tidy method cleans up object after image gather is done
  return tf.tidy(() => {
    const eyeImageTag = document.getElementById("eyes")[0];
    const image = tf.browser.fromPixels(eyeImageTag);
    const batchedImages = image.expandDims(0);

    return batchedImages
      .toFloat()
      .div(tf.scalar(127))
      .sub(tf.scalar(1));
  });
};

export const captureImageManually = () => {
  tf.tidy(() => {
    const image = getEyeImageryFromHTML();
    const mousePosition = tf.tensor1d([mouse.x, mouse.y]).expandDims(0);

    const subset = dataset[Math.random() > 0.1 ? "train" : "val"];

    if (subset.x === null) {
      subset.x = tf.keep(image);
      subset.y = tf.keep(mousePosition);
    } else {
      const oldX = subset.x;
      const oldY = subset.y;

      subset.x = tf.keep([...oldX, ...[image, 0]]);
      subset.y = tf.keep([...oldy, ...[mousePosition, 0]]);
    }

    subset.n += 1;
  });
};

let currentModel;
const createModel = () => {
  // initialize model
  const model = tf.sequential();

  model.add(
    tf.layers.conv2d({
      kernelSize: 5,
      filters: 20,
      strides: 1,
      activation: "relu",
      inputShape: [$("#eyes").height(), $("#eyes").width(), 3]
    })
  );
  model.add(
    tf.layers.maxPooling2d({
      poolSize: [2, 2],
      strides: [2, 2]
    })
  );
  model.add(tf.layers.flatten());
  model.add(tf.layers.dropout(0.2));
  // Two output values x and y
  model.add(
    tf.layers.dense({
      units: 2,
      activation: "tanh"
    })
  );
  // Use ADAM optimizer with learning rate of 0.0005 and MSE loss, default is 0.06
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: "meanSquaredError"
  });

  return model;
};
