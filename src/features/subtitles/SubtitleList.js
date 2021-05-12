import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { unwrapResult, nanoid } from '@reduxjs/toolkit'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";
import Fab from '@material-ui/core/Fab';
import VerticalAlignCenterIcon from '@material-ui/icons/VerticalAlignCenter';

import {
  selectSubtitleIds,
  selectSubtitleById,
  selectSubtitleBySeconds,
  selectPrevSubtitleBySeconds,
  selectNextSubtitleBySeconds,
  initFromFile,
} from './subtitlesSlice'


const Subtitle = ({ subtitleId, playerRef, currentSeconds, setCurrentSeconds }) => {
  const subtitle = useSelector((state) => selectSubtitleById(state, subtitleId))

  const handlePlayClick = () => {
    playerRef.current.seekTo(subtitle.start, "seconds");
    setCurrentSeconds(subtitle.start)
  }

  return (
    <React.Fragment>
      <div 
        className={`subtitle ${currentSeconds < (subtitle.next_start || 99999999) && currentSeconds >= subtitle.start ? 'selected' : ''}`}
        onClick={handlePlayClick} 
      >
        <div className="subtitle-play">
          <i className="fa fa-play-circle"></i>
        </div>
        <div className="subtitle-text">{subtitle.text}</div>
      </div>
      <div className={`gap`} style={{ height: (subtitle.next_start-subtitle.end) + 'em' }}></div>
    </React.Fragment>
  )
}

export const SubtitleList = ({playerRef, currentSeconds, setCurrentSeconds}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const status = useSelector((state) => state.subtitles.status)
  const error = useSelector((state) => state.subtitles.error)
  const dispatch = useDispatch()
  const currentSub = useSelector((state) => selectSubtitleBySeconds(state, currentSeconds))
  const prevSub = useSelector((state) => selectPrevSubtitleBySeconds(state, currentSeconds))
  const nextSub = useSelector((state) => selectNextSubtitleBySeconds(state, currentSeconds))
  const [addDeleteRequestStatus, setAddDeleteRequestStatus] = useState('idle') // To stop double adds/deletes

  // useEffect(() => {
  //   if (status === 'idle') {
  //     dispatch(fetchSubtitles())
  //   }
  // }, [status, dispatch])

  // Autopause functionality
  const [apStatus, setApStatus] = useState(true);
  const handleToggleAP = () => {
    setApStatus(!apStatus);
  }

  // Focus selected functionality
  const handleFocusSelected = () => {
    document.getElementsByClassName("subtitles-list")[0].focus();
    console.log(document.getElementsByClassName("selected")[0])
    try {
      document.getElementsByClassName("selected")[0].scrollIntoView({behavior: 'smooth'});
    } catch {

    }
    
  }

  // Add subtitle functionality
  const handleAddSubtitle = async () => {
   
  }

  // Delete subtitle functionality
  const handleDeleteSubtitle = async () => {
    
  }

  const seedFromSRT = async (e) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => { 
      const text = (e.target.result)
      dispatch(initFromFile(text))
    };
    reader.readAsText(e.target.files[0])
  }

  let content
  if (subtitleIds.length) {
    content = subtitleIds.map((subtitleId) => (
      <Subtitle key={subtitleId} subtitleId={subtitleId} playerRef={playerRef} currentSeconds={currentSeconds} setCurrentSeconds={setCurrentSeconds}/>
    ))
  } else {
    content = <div> No subtitles </div>
  }


  return (
    <section className="subtitles">
      <div className={`options ${subtitleIds.length ? '': 'hidden'}`}>
        <div className="option option-autopause">
          <span>Auto Pause</span><br/>
          <Switch onChange={handleToggleAP} checked={apStatus} />
        </div>
        <div className="option option-addabove" onClick={handleAddSubtitle}>
          <span>Add above</span><br/>
          <i className="fa fa-arrow-circle-up"></i>
        </div>
        <div className="option option-addbelow" onClick={handleFocusSelected}>
          <span>Add below</span><br/>
          <i className="fa fa-arrow-circle-down"></i>
        </div>
        <div className="option option-edit" onClick={handleToggleAP} >
          <span>Edit</span><br/>
          <i className="fa fa-edit"></i>
        </div>
        <div className="option option-delete" onClick={handleDeleteSubtitle}>
          <span>Delete</span><br/>
          <i className="fa fa-trash"></i>
        </div>
      </div >
      <div className={`options ${subtitleIds.length ? 'hidden': ''}`}>
        <div className="option"> 
          <span>Seed from SRT</span><br/>
          <input type="file" onChange={seedFromSRT} />
        </div>
      </div>
      <Fab color="primary" id="fab" aria-label="add" onClick={handleFocusSelected}>
        <VerticalAlignCenterIcon />
      </Fab>
      <div className="subtitles-list">
        <p className="debugstring">{currentSub.start}</p>
        {content}
      </div>
    </section>
  )
}