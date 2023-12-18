
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
import { checkInsideRadius, checkOverlap } from './util';
import { Particle, Particles } from './Particle';
import switchImg from '../../assets/switch.png';
import switchOffImg from '../../assets/switch-flip.png';
import particleImg from '../../assets/green-particle.png';
import altParticleImg from '../../assets/yellow-particle.png';

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

  const particles = new Particles();
  const switchImgObj = new Image();
  switchImgObj.src = switchImg;
  const switchOffImgObj = new Image();
  switchOffImgObj.src = switchOffImg;
  const particleImgObj = new Image();
  particleImgObj.src = particleImg;
  const altParticleImgObj = new Image();
  altParticleImgObj.src = altParticleImg;

  localStorage.setItem('items', JSON.stringify([]));
  localStorage.setItem('switchPos', JSON.stringify({x: 0, y: 0}));
  localStorage.setItem('score', JSON.stringify(20));
  localStorage.setItem('ecoBox', JSON.stringify({
    storeTags: ['recyclable', 'e-waste'],
    status: 'on',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }));

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
    if(!hands) return;
    const switchPos = JSON.parse(localStorage.getItem('switchPos'));
    for (let hand of hands) {
      const {keypoints} = hand;
      if(keypoints) {
        // thumb finger tip
        ctx.beginPath();
        ctx.arc(keypoints[4].x, keypoints[4].y, 10, 0, 2*Math.PI)
        ctx.stroke(); 

        // index finger tip
        ctx.beginPath();
        ctx.arc(keypoints[8].x, keypoints[8].y, 10, 0, 2*Math.PI)    
        ctx.stroke(); 
        if(switchPos) {
          if(checkInsideRadius(keypoints[4], switchPos, 20) 
              && checkInsideRadius(keypoints[8], switchPos, 20)) {
            console.log('switch');
            const ecoBox = JSON.parse(localStorage.getItem('ecoBox'));
            // localStorage.setItem('ecoBox', JSON.stringify({...ecoBox, config: ['organic']}));
            // showEcoBox = false;
            // setStoreTags(['e-waste', 'recyclable']);
            localStorage.setItem('ecoBox', JSON.stringify({
              ...ecoBox, 
              storeTags: ['organic']}));
              // status: ecoBox.status === 'on' ? 'off' : 'on'}));
          }
        }
      }
    }
  }

  const drawEcoBox = (ctx : CanvasRenderingContext2D, code : QRCode) => {
    if(!code) return;
    const { location } = code;
    const { topLeftCorner,topRightCorner, bottomLeftCorner } = location;

    const width = topRightCorner.x - topLeftCorner.x;
    const height = bottomLeftCorner.y - topLeftCorner.y;
    const ecoBox = JSON.parse(localStorage.getItem('ecoBox'));
    if(!ecoBox) {
      // save ecobox to local storage
      localStorage.setItem('ecoBox', JSON.stringify({
        storeTags: ['e-waste', 'recyclable'],
        status: 'on',
        x: topLeftCorner.x,
        y: topLeftCorner.y,
        width,
        height,
      }));
    } else {
      localStorage.setItem('ecoBox', JSON.stringify({
        ...ecoBox,
        x: topLeftCorner.x,
        y: topLeftCorner.y,
        width,
        height,
      }));
    }
    if(ecoBox.status === 'off') {
      ctx.drawImage(switchOffImgObj, topRightCorner.x, topLeftCorner.y, 50, 50);
      return;
    }

    for(let i = 0; i < 5; i++) {
      const particle : Particle = {
        x: topLeftCorner.x + width / 2 + Math.random() * 20 - 10,
        y: topLeftCorner.y + Math.random() * 20 - 10,
        vx: Math.random() * 10 - 5,
        vy: - Math.random() * 10,
        life: 100,
        size: Math.random() * 20 + 20,
        update: () => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 1;
        },
        draw: (ctx : CanvasRenderingContext2D) => {
          if(ecoBox.storeTags.includes('organic')) {
            ctx.drawImage(altParticleImgObj, particle.x, particle.y, particle.size, particle.size);
          } else {
            ctx.drawImage(particleImgObj, particle.x, particle.y, particle.size, particle.size);
          }
        }
      };
      particles.addParticle(particle);
    }
    particles.update();
    particles.draw(ctx);
    ctx.rect(topLeftCorner.x, topLeftCorner.y, width, height);
    ctx.stroke();
    ctx.drawImage(switchImgObj, topRightCorner.x, topRightCorner.y, 50, 50);
    localStorage.setItem('switchPos', JSON.stringify({x: topRightCorner.x, y: topRightCorner.y}));
  }

  const drawCocoObj = (ctx : CanvasRenderingContext2D, detections : cocoSsdPrediction[], frameCount: number) => {
    if(!detections) return;
    const ecoBox = JSON.parse(localStorage.getItem('ecoBox'));
    if(!ecoBox) return;
    const { x, y } = ecoBox;
    for (let detection of detections) {
      const { bbox, class: name } = detection;
      const objRect = {
        x: bbox[0],
        y: bbox[1],
        width: bbox[2],
        height: bbox[3],
      }

      if(bbox && tags[name] !== null) {
        ctx.fillText(tags[name], bbox[0], bbox[1]);
        ctx.fillText(name, bbox[0], bbox[1]-10);
        ctx.beginPath();
        ctx.rect(bbox[0], bbox[1], bbox[2], bbox[3]);
        ctx.stroke();

          if(bbox && tags[name] !== null) {
            if(checkOverlap(ecoBox, objRect)) {
              console.log(name);
              const items = JSON.parse(localStorage.getItem('items'))

              if (ecoBox.storeTags.includes(tags[name][0])) {
                console.log(items, name);
                console.log(items.length === 0, items.includes(name))
                if((items.length === 0 || !items.includes(name))) {
                  ctx.fillText("✅✅✅✅✅✅✅", x, y);
                  for(let i = 0; i < 5; i++) {
                    const particle : Particle = {
                      x: ecoBox.x + ecoBox.width / 2 + Math.random() * 20 - 10,
                      y: ecoBox.y + Math.random() * 20 - 10,
                      vx: Math.random() * 20 - 10,
                      vy: - Math.random() * 20,
                      life: 100,
                      size: Math.random() * 20 + 10,
                      update: () => {
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.life -= 1;
                      },
                      draw: (ctx : CanvasRenderingContext2D) => {
                        ctx.fillText("✅", particle.x, particle.y);
                      }
                    };
                    particles.addParticle(particle);
                  }
                  const score = JSON.parse(localStorage.getItem('score'));
                  localStorage.setItem('score', JSON.stringify(20 + score));
                  localStorage.setItem('items', JSON.stringify([...items, name]));
                  document.getElementById('score-bar').style.width = `${(score + 1) % 100}%`;
                } 
                // setStored([...stored, {name, ecoTag: tags[name], score: 10}]);
              } else ctx.fillText("❌❌❌❌❌❌❌", x, y);
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
      <PlayerHeader/>
      <div className="canvas-container">
        {video ? <Canvas draw={draw} video={video} workers={[cocoWorker, qrWorker, handWorker]}/> : null }
      </div>
    </div>
    )
}

export default App