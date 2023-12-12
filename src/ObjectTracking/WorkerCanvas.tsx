import React, { useRef, useEffect } from 'react';
import { getImageFromVideo } from '../utils';
import * as Comlink from 'comlink'
import { TsWorker } from 'src/worker/worker';

type CanvasProps = {
  video: HTMLVideoElement,
  draw: Function,
  workers: Comlink.Remote<TsWorker>[],
}

const Canvas = (props: CanvasProps) => {

  const { video, draw, workers} = props;

  const canvasRef = useRef(null);

  useEffect(() => {

    (async () => {
        for (let worker of workers) await worker.init();
    })();

  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    canvas.height = 480;
    canvas.width = 640;

    let frameCount = 0;
    let animationFrameId = -1;
    let res = {};
    
    //Our draw came here
    const render = async () => {
      frameCount++;
      const imageData = getImageFromVideo(video);

      for (let worker of workers) {
        await worker.ready();
        const { name } = await worker.getWorkerInfo();
        res[name] = await worker.estimate(imageData);
      }
      draw(context, imageData, res, frameCount);
      
      animationFrameId = window.requestAnimationFrame(render);
    }
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    }
  }, [draw, workers, video])
  
  return <canvas ref={canvasRef} />
}

export default Canvas