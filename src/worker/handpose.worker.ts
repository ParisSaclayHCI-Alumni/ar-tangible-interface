import * as Comlink from 'comlink';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { MediaPipeHandsTfjsModelConfig } from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import { TsWorker } from './worker';

export class HandWorker extends TsWorker {

  private detector? : any;

  public async init() {
    console.log("initiating...")
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig : MediaPipeHandsTfjsModelConfig = {
      runtime: 'tfjs', // or 'mediapipe',
    }
    this.detector = await handPoseDetection.createDetector(model, detectorConfig);
    console.log(this.detector)
    console.log("ready");
  }

  public ready() {
    return this.detector !== undefined;
  }
  
  public async estimate(imageData = null, flipHorizontal = false) {
    // console.log(this.detector, "estimate")
    if(this.detector === undefined) return null;
    const predictions = await this.detector.estimateHands(imageData);
    return predictions
  }
  public getWorkerInfo() {
    return {
        name: 'HandPose',
        ready: this.ready()
    }
  }
}


Comlink.expose(new HandWorker())