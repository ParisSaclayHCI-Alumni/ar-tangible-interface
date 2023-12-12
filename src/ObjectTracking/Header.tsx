
import React, { useEffect, useState } from 'react';
import boxImg from '../../assets/sample.png';
import userProfile from '../../assets/user-profile.svg';
import star from '../../assets/star.svg';
import './App.css';

function PlayerHeader({ score } : { score: number }) {


  return (
    <div className="header">
    <div className="player-container">
            <img src={userProfile} className="player-img"></img>
        <div className="player">
        Radu
        </div>
    </div>
    <div className="profile">
        <img className="profile-img" src={boxImg}></img>
    </div>
    <dis className="progress-container">
        <div className="level"> Lv. {Math.floor(score / 100)}</div>
        <div className="player-container">
            <img src={star} className="star-img"></img>
            <div className="score-bar">
            <div className="score" style={{width: `${score}%`}}></div>
        </div>
    </div>
    </dis>
    </div>
    )
}

export default PlayerHeader;