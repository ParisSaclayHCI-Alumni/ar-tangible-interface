import * as Comlink from 'comlink';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
// Register CPU backend
import '@tensorflow/tfjs-backend-cpu';
import { TsWorker } from './worker';


export class CocoSsdWorker extends TsWorker {

  private model? : any;

  public async init() {
    console.log("initiating...")
    this.model = await cocoSsd.load();
    console.log(this.model)
    console.log("ready");
  }

  public ready() {
    return this.model !== undefined;
  }
  
  public async estimate(imageData : ImageData, flipHorizontal = false) {
    // console.log(this.detector, "estimate")
    if(this.model === undefined) return null;
    const predictions = await this.model.detect(imageData);
    return predictions
  }

  public getWorkerInfo() {
    return {
        name: 'CocoSsd',
        ready: this.ready()
    }
  }
}


Comlink.expose(new CocoSsdWorker())