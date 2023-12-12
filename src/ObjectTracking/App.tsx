
import React, { useEffect, useState }from 'react';
import Canvas from './WorkerCanvas';
import { isMobile, setupCamera } from '../utils';
import { CocoSsdWorker } from 'src/worker/cocossd.worker';
import { cocoSsdPrediction } from 'src/types';
import { QRScanWorker } from 'src/worker/qrscan.worker';
import { HandWorker } from '../worker/handpose.worker';
import { QRCode } from 'jsqr';

import * as tags from './classtags.json';
import * as Comlink from 'comlink';
import './App.css';
import PlayerHeader from './Header';
import { EcoObject, Rect, checkOverlap } from './util';

function App() {

  const cocoWorker : Comlink.Remote<CocoSsdWorker> = Comlink.wrap(
    new Worker(new URL(`../worker/cocossd.worker.ts`, import.meta.url))
  );

  const qrWorker : Comlink.Remote<QRScanWorker> = Comlink.wrap(
    new Worker(new URL(`../worker/qrscan.worker.ts`, import.meta.url))
  );

  const handWorker : Comlink.Remote<HandWorker> = Comlink.wrap(
    new Worker(new URL(`../worker/handpose.worker.ts`, import.meta.url))
  );

  const [video, setVideo] = useState<HTMLVideoElement>(null);
  const [ecoBox, setEcoBox] = useState<Rect>(null);
  const [handKeypoints, setHandKeypoints] = useState<any[]>([]);
  const [cocoDetections, setCocoDetections] = useState<cocoSsdPrediction[]>([]);
  const [stored, setStored] = useState<EcoObject[]>([]);
  const [storeTags, setStoreTags] = useState<string[]>(['e-waste', 'recyclable']);

  useEffect(() => {
    async function initCamera() {
      const mobile = isMobile;
      const vid = await setupCamera(mobile);
      setVideo(vid);
      vid.play();
    }

    initCamera();

  }, [])

  const drawHands = (ctx : CanvasRenderingContext2D, hands : any[]) => {
    if(hands) setHandKeypoints(hands);
    for (let hand of handKeypoints) {
      const {keypoints} = hand;
      if(keypoints) {
        // thumb finger tip
        ctx.arc(keypoints[4].x, keypoints[4].y, 10, 0, 2*Math.PI)

        // index finger tip
        ctx.arc(keypoints[8].x, keypoints[8].y, 10, 0, 2*Math.PI)    
        ctx.stroke();    
      }
    }
  }

  const drawEcoBox = (ctx : CanvasRenderingContext2D, code : QRCode) => {
    if(!code) return;
    const { location } = code;
    const { topLeftCorner, bottomLeftCorner, bottomRightCorner } = location;

    const width = bottomLeftCorner.x - topLeftCorner.x;
    const height = bottomRightCorner.y - bottomLeftCorner.y;
    setEcoBox({
      x: topLeftCorner.x + width / 2,
      y: topLeftCorner.y + height / 2,
      width,
      height,
    })

    ctx.rect(topLeftCorner.x, topLeftCorner.y, width, height);
    ctx.stroke();
  }

  const drawCocoObj = (ctx : CanvasRenderingContext2D, detections : cocoSsdPrediction[], frameCount: number) => {
    if(detections) setCocoDetections(detections);
    if(!ecoBox) return;
    const { x, y } = ecoBox;
    for (let detection of cocoDetections) {
      const { bbox, class: name } = detection;
      const objRect = {
        x: bbox[0],
        y: bbox[1],
        width: bbox[2],
        height: bbox[3],
      }

      if(bbox && tags[name] !== null) {
        ctx.fillText(tags[name], bbox[0], bbox[1]);
        ctx.rect(bbox[0], bbox[1], bbox[2], bbox[3]);
        ctx.stroke();

          if(bbox && tags[name] !== null) {
            if(checkOverlap(ecoBox, objRect)) {
              console.log(name);
              if (storeTags.includes(tags[name])) {
                ctx.fillText("✅", x, y);
                setStored([...stored, {name, ecoTag: tags[name], score: 10}]);
              } else ctx.fillText("❌", x, y);
            }

            for(let i = 0; i < 5; i++) {
              const vx = Math.random() * 20 - 10;
              const vy = Math.random() * 20 - 5;
              ctx.fillText("🌟", x - 10 * i - vx, y - vy);
              ctx.fillText("💎", x - 20 * i - vx, y - vy);
            }
          } else continue;

      } else continue;
    }
  }

  const drawbbox = (
      ctx : CanvasRenderingContext2D, 
      imageData, 
      results : any,
      frameCount?: number,
    ) => {
      ctx.clearRect(0, 0, imageData.width, imageData.height);
      ctx.putImageData(imageData, 0, 0);
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#FF0000';

      if (!results) {
        return;
      }
      // console.log(results)
      const detections = results['CocoSsd'] as cocoSsdPrediction[];
      const code = results['QRScan'] as QRCode;
      const hands = results['HandPose'];

      ctx.beginPath();
      drawEcoBox(ctx, code);
      drawCocoObj(ctx, detections, frameCount);
      drawHands(ctx, hands);

      ctx.closePath();
        
  }

  
  
  return (
    <div>
      <PlayerHeader score={20}/>
      <div className="canvas-container">
        {video ? <Canvas draw={drawbbox} video={video} workers={[cocoWorker, qrWorker, handWorker]}/> : null }
      </div>
    </div>
    )
}

export default App