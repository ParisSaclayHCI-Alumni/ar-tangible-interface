
import React, { useEffect, useState }from 'react';
import Canvas from './QrCanvas';
import { isMobile, setupCamera } from '../utils';
import { CocoSsdWorker } from 'src/worker/cocossd.worker';
import { cocoSsdPrediction } from 'src/types';
import { QRScanWorker } from 'src/worker/qrscan.worker';
import { QRCode } from 'jsqr';

import * as tags from './classtags.json';
import * as Comlink from 'comlink';
import boxImg from '../../assets/sample.png';
import userProfile from '../../assets/user-profile.svg';
import star from '../../assets/star.svg';
import './App.css';

function App() {

  const cocoWorker : Comlink.Remote<CocoSsdWorker> = Comlink.wrap(
    new Worker(new URL(`../worker/cocossd.worker.ts`, import.meta.url))
  );

  const qrWorker : Comlink.Remote<QRScanWorker> = Comlink.wrap(
    new Worker(new URL(`../worker/qrscan.worker.ts`, import.meta.url))
  );

  const [video, setVideo] = useState<HTMLVideoElement>(null);

  useEffect(() => {
    async function initCamera() {
      const mobile = isMobile;
      const vid = await setupCamera(mobile);
      setVideo(vid);
      vid.play();
    }

    initCamera();

  }, [])

  const drawbbox = (
      ctx : CanvasRenderingContext2D, 
      imageData, 
      results : cocoSsdPrediction[],
      code?: QRCode 
    ) => {
      ctx.clearRect(0, 0, imageData.width, imageData.height)
      ctx.putImageData(imageData, 0, 0);
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#FF0000';

      if (!results) {
        return;
      }
      for (let detection of results) {
        const { bbox, class: name } = detection;

        if(bbox && tags[name] !== null) {
          ctx.beginPath();
          if(code) {
            const { location } = code;
            const { topLeftCorner } = location;

            ctx.fillText("📦🧙‍♀️", topLeftCorner.x, topLeftCorner.y);
          }

          ctx.rect(bbox[0], bbox[1], bbox[2], bbox[3]);
          ctx.stroke();
          ctx.fillText(name, bbox[0], bbox[1] - 10);
          if(tags[name]) {
            ctx.fillText(tags[name], bbox[0], bbox[1] - 30);
          }
          ctx.closePath();
        }
      }

  }
  
  return (
    <div>
      <div className="header">
        <div className="player-container">
          {/* <div className="player-img"> */}
              <img src={userProfile} className="player-img"></img>
            {/* </div> */}
          <div className="player">
            Radu
          </div>
        </div>
        <div className="profile">
          <img className="profile-img" src={boxImg}></img>
        </div>
        <div className="player-container">
          <img src={star} className="star-img"></img>
          <div className="score-bar">
            <div className="score" style={{width: "100px"}}></div>
          </div>
        </div>

      </div>
      <div className="video-container">
        {video ? <Canvas draw={drawbbox} video={video} worker={cocoWorker} qrWorker={qrWorker}/> : null }
      </div>
    </div>
    )
}

export default App