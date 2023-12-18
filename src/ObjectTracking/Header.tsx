
import React, { useEffect, useState } from 'react';
import boxImg from '../../assets/ecobox.png';
import userProfile from '../../assets/user-profile.svg';
import star from '../../assets/star.svg';
import './App.css';

function PlayerHeader() {
  

  return (
    <div className="header">
    <div className="player-container">
            <img src={userProfile} className="player-img"></img>
        <div className="player">
        Player
        </div>
    </div>
    <div className="profile">
        <img className="profile-img" src={boxImg}></img>
    </div>
    <div className="progress-container">
        <div className="level" id="level-number"> Lv. 0</div>
        <div className="player-container">
            <img src={star} className="star-img"></img>
            <div className="score-bar">
            {/* <div className="score" id="score-bar" style={{width: `${score % 100}%`}}></div> */}
            <div className="score" id="score-bar"></div>
        </div>
    </div>
    </div>
    </div>
    )
}

export default PlayerHeader;