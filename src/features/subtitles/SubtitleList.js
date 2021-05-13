import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { unwrapResult, nanoid } from '@reduxjs/toolkit'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";
import Fab from '@material-ui/core/Fab';
import VerticalAlignCenterIcon from '@material-ui/icons/VerticalAlignCenter';
import { useHotkeys } from "react-hotkeys-hook";

import {
  initFromFile,
  selectSubtitleIds,
  selectSubtitleById,
  selectIdBySeconds,
  selectIndexbyId,
  selectSubtitleByIndex
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

export const SubtitleList = ({playerRef, currentSeconds, setCurrentSeconds, setCurrentSub, setPlaying}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const dispatch = useDispatch()
  const currentId = useSelector((state) => selectIdBySeconds(state, currentSeconds))
  const currentIndex = useSelector((state) => selectIndexbyId(state, currentId))
  const prev = useSelector((state) => selectSubtitleByIndex(state, currentIndex - 1))
  const current = useSelector((state) => selectSubtitleByIndex(state, currentIndex))
  const next = useSelector((state) => selectSubtitleByIndex(state, currentIndex + 1))
  const [AP, setAP] = useState(true)
  const [ignoreAPUntil, setIgnoreAPUntil] = useState(-1)
  const [addDeleteRequestStatus, setAddDeleteRequestStatus] = useState('idle') // To stop double adds/deletes
  
  // Hotkey logic
  useHotkeys('left,a', () => {
    playerRef.current.seekTo(prev.start, "seconds");
    setCurrentSeconds(prev.start)
    setPlaying(true)
  }, [prev]);
  useHotkeys('right,d', () => {
    playerRef.current.seekTo(next.start, "seconds");
    setCurrentSeconds(next.start)
    setPlaying(true)
  }, [next]);
  useHotkeys('down,s', () => {
    playerRef.current.seekTo(current.start, "seconds");
    setCurrentSeconds(current.start)
    setPlaying(true)
  }, [current]);
  useHotkeys('up,w', () => {
    setIgnoreAPUntil(current.end)
    setPlaying(true)
  }, [current]);
  
  useEffect(() => {
    setCurrentSub(current.text);
  }, [current])

  // Auto pause logic
  useEffect(() => {
    let boundary = 0.12;
    console.log(currentSeconds, current, boundary, ignoreAPUntil)
    if(ignoreAPUntil > -1) {
      if(currentSeconds > ignoreAPUntil){
        setIgnoreAPUntil(-1)
      }
    }
    else if(AP && currentSeconds >= current.end - boundary) {
      console.log('hit!!')
      setPlaying(false)
    }
  }, [currentSeconds, AP, ignoreAPUntil])

  // Autopause functionality
  const handleToggleAP = () => {
    setAP(!AP);
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
          <Switch onChange={handleToggleAP} checked={AP} />
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
        {prev.start}
        {content}
      </div>
    </section>
  )
}