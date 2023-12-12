import jsQR from "jsqr";
import * as Comlink from 'comlink';
import { TsWorker } from './worker';


export class QRScanWorker extends TsWorker {
  public async init() {
    console.log("initiating...")
    console.log("ready");
  }

  public async estimate(imageData = null) {
    if(imageData === null) return null;

    const { width, height } = imageData;

    const rgba = new Uint8ClampedArray(imageData.data);

    const code = jsQR(rgba, width, height);

    if(code === null) {
        return null;
    }
    
    return code;
  }

  public getWorkerInfo() {
    return {
        name: 'QRScan',
        ready: this.ready()
    }
  }
}

Comlink.expose(new QRScanWorker())