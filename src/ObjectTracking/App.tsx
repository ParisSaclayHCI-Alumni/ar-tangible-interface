
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
import { EcoObject, Rect, checkInsideRadius, checkOverlap } from './util';
import { Particle, Particles } from './Particle';
import switchImg from '../../assets/switch.png';
import particleImg from '../../assets/particle.png';

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
  const particles = new Particles();
  const [switchPos, setSwitchPos] = useState<{x: number, y: number}>(null);
  const [showEcoBox, setShowEcoBox] = useState<boolean>(true);

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
        if(switchPos) {
          if(checkInsideRadius(keypoints[4], switchPos, 20) 
              && checkInsideRadius(keypoints[8], switchPos, 20)) {
            setShowEcoBox(!showEcoBox);
          }
        }
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
    setSwitchPos({
      x: topLeftCorner.x + width / 2,
      y: topLeftCorner.y + height / 2,
    })
    for(let i = 0; i < 5; i++) {
      const particle : Particle = {
        x: ecoBox.x + Math.random() * 20 - 10,
        y: ecoBox.y + Math.random() * 20 - 10,
        vx: Math.random() * 20 - 10,
        vy: Math.random() * 20 - 10,
        life: 100,
        size: 10,
        update: () => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 1;
        },
        draw: (ctx : CanvasRenderingContext2D) => {
          ctx.fillText("🌟", particle.x, particle.y);
          ctx.drawImage(particleImg, particle.x, particle.y, 10, 10);
        }
      };
      particles.addParticle(particle);
    }

    ctx.rect(topLeftCorner.x, topLeftCorner.y, width, height);
    ctx.stroke();
    ctx.drawImage(switchImg, ecoBox.x, ecoBox.y, 50, 50);

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
          } else continue;

      } else continue;
    }
  }

  const draw = (
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
      <PlayerHeader score={stored.reduce((sum : number, cur : EcoObject) => sum += cur.score, 0)}/>
      <div className="canvas-container">
        {video ? <Canvas draw={draw} video={video} workers={[cocoWorker, qrWorker, handWorker]}/> : null }
      </div>
    </div>
    )
}

export default App