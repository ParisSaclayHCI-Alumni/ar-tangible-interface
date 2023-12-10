import React, { useRef, useEffect } from 'react';
import { getImageFromVideo } from '../utils';
import * as Comlink from 'comlink'
import { HandWorker } from '../worker/handpose.worker';
import { QRScanWorker } from '../worker/qrscan.worker';

type CanvasProps = {
  video: HTMLVideoElement,
  draw: Function,
  worker: Comlink.Remote<HandWorker>,
  qrWorker: Comlink.Remote<QRScanWorker>
}

const Canvas = (props: CanvasProps) => {

  const { video, draw, worker, qrWorker} = props;

  const canvasRef = useRef(null);

  useEffect(() => {

    (async () => {
      await worker.init();
    })();

  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    canvas.height = 480;
    canvas.width = 640;

    let frameCount = 0;
    let animationFrameId = -1;
    let res = undefined;
    let code = undefined;
    
    //Our draw came here
    const render = async () => {
      frameCount++
      const imageData = getImageFromVideo(video);
      const ready = await worker.ready();
      if(ready) {
        res = await worker.estimate(imageData);
        code = await qrWorker.scan(imageData);
      }
      draw(context, imageData, res, code);
      
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw, worker, video])
  
  return <canvas ref={canvasRef} />
}

export default Canvas