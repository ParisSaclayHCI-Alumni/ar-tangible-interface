
import React, { useEffect, useState }from 'react';
import Canvas from '../components/Canvas';
import { isMobile, setupCamera } from '../utils';
import { HandWorker } from '../worker/handpose.worker';
import * as Comlink from 'comlink';

function App() {
  const worker : Comlink.Remote<HandWorker> = Comlink.wrap(
    new Worker(new URL(`../worker/handpose.worker.ts`, import.meta.url))
  );
  const [video, setVid] = useState();

  useEffect(() => {
    async function initCamera() {
      const mobile = isMobile;
      const vid = await setupCamera(mobile);
      setVid(vid);
      // console.log(vid.play());
      vid.play();
    }

    initCamera();

    return () => {}

  }, [])

  const draw = (ctx : CanvasRenderingContext2D, imageData, results) => {
    ctx.clearRect(0, 0, imageData.width, imageData.height)
    ctx.putImageData(imageData, 0, 0);
    ctx.fillStyle = '#000000';
    if (!results) {
      console.warn('model not ready');
      return;
    }
    for (let hand of results) {
      const {keypoints} = hand;
      if(keypoints) {
        ctx.beginPath()
        // thumb finger tip
        ctx.arc(keypoints[4].x, keypoints[4].y, 10, 0, 2*Math.PI)

        // index finger tip
        ctx.arc(keypoints[8].x, keypoints[8].y, 10, 0, 2*Math.PI)
        ctx.fill()
      }
    }
  }
  
  return (
    <>
      {video ? <Canvas draw={draw} video={video} worker={worker}/> : null }
    </>
    )
}

export default App