import jsQR from "jsqr";
import * as Comlink from 'comlink';

export class QRScanWorker {
  public async scan(imageData = null) {
    if(imageData === null) return null;

    const { width, height } = imageData;

    const rgba = new Uint8ClampedArray(imageData.data);

    const code = jsQR(rgba, width, height);

    if(code === null) {
        return null;
    }
    
    return code;
  }
}

Comlink.expose(new QRScanWorker())