import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { unwrapResult, nanoid } from '@reduxjs/toolkit'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";
import Fab from '@material-ui/core/Fab';
import VerticalAlignCenterIcon from '@material-ui/icons/VerticalAlignCenter';
import { useHotkeys } from "react-hotkeys-hook";
import TextField from '@material-ui/core/TextField';

import {
  initFromFile,
  selectSubtitleIds,
  selectSubtitleById,
  selectIdBySeconds,
  selectIndexbyId,
  selectSubtitleByIndex,
  deleteSubtitle,
  updateSubtitle
} from './subtitlesSlice'


const Subtitle = ({ subtitleId, playerRef, selected, setCurrentSeconds, hotkeyMode, setHotkeyMode }) => {
  const dispatch = useDispatch()
  const subtitle = useSelector((state) => selectSubtitleById(state, subtitleId))
  // var selected = currentSeconds < (subtitle.next_start || 99999999) && currentSeconds >= subtitle.start
  var gap = (subtitle.next_start-subtitle.end) + 'em'

  const handlePlayClick = () => {
    playerRef.current.seekTo(subtitle.start, "seconds");
    setCurrentSeconds(subtitle.start)
  }
  const handleTextChange = (e) => {
    dispatch(updateSubtitle({
      id: subtitle.id,
      changes: {text: e.target.value}
    }))
  }
  const handleSwitchMode = (e) => {
    e.preventDefault()
    setHotkeyMode(true)
  }
  if(hotkeyMode || !selected) {
    return (
      <React.Fragment>
        <div 
          className={`subtitle ${selected ? 'selected' : ''}`}
          onClick={handlePlayClick} 
        >
          <div className="subtitle-play">
            <i className="fa fa-play-circle"></i>
          </div>
          <div className="subtitle-text">{subtitle.text}</div>
        </div>
        <div className={`gap`} style={{ height: gap }}></div>
      </React.Fragment>
    )
  } else {
    return (
      <React.Fragment>
        <div 
          className={`subtitle ${selected ? 'selected' : ''}`}
        >
          <TextField 
            InputProps={{ style: {  color: 'white'}}} 
            className="selected-input"
            label="Edit subtitle" 
            value={subtitle.text} 
            onChange={handleTextChange}
            autoFocus
            fullWidth
            multiline
            onKeyDown={(event) => {
              if (event.key == 'Escape' || !event.shiftKey && event.key == 'Enter')
                handleSwitchMode(event)
            }}
          />
        </div>
        <div className={`gap`} style={{ height: gap }}></div>
      </React.Fragment>
    )
  }
}

export const SubtitleList = ({playerRef, currentSeconds, setCurrentSeconds, setCurrentSub, setPlaybackRate, setMuted, setPlaying}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const dispatch = useDispatch()
  const currentId = useSelector((state) => selectIdBySeconds(state, currentSeconds))
  const currentIndex = useSelector((state) => selectIndexbyId(state, currentId))
  const prev = useSelector((state) => selectSubtitleByIndex(state, currentIndex - 1))
  const current = useSelector((state) => selectSubtitleByIndex(state, currentIndex))
  const next = useSelector((state) => selectSubtitleByIndex(state, currentIndex + 1))
  const [hotkeyMode, setHotkeyMode] = useState(true)
  const [AP, setAP] = useState(true)
  const [alreadyPausedId, setAlreadyPausedId] = useState('')
  const [addDeleteRequestStatus, setAddDeleteRequestStatus] = useState('idle') // To stop double adds/deletes
  
  const setPlayhead = (seconds) => {
    playerRef.current.seekTo(seconds, "seconds");
    setCurrentSeconds(seconds)
    setPlaying(true)
    setAlreadyPausedId('')
  }

  // Hotkey logic
  // Subtitle navigation
  useHotkeys('left, a', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      setPlayhead(prev.start)
    }
  }, [prev, hotkeyMode]);
  useHotkeys('right, d', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      setPlayhead(next.start)
    }
  }, [next, hotkeyMode]);
  useHotkeys('down, s', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      setPlayhead(current.start)
    }
  }, [current, alreadyPausedId, hotkeyMode]);
  useHotkeys('up, w', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      setPlaying(true) 
    }
  }, [hotkeyMode]);
  useHotkeys('i', (e) => {
    e.preventDefault()
    setHotkeyMode(false)
  });

  // Video controls
  useHotkeys('m', (e) => {
    e.preventDefault()
    setMuted(prev => !prev)
  });
  useHotkeys('shift+.', (e) => {
    e.preventDefault()
    setPlaybackRate(prev => Math.min(2, prev+0.25))
  });
  useHotkeys('shift+,', (e) => {
    e.preventDefault()
    setPlaybackRate(prev => Math.max(0.25, prev-0.25))
  });
  useEffect(() => {
    setCurrentSub(current.text);
  }, [current])

  useEffect(() => {
    if(subtitleIds.length) {
      if(hotkeyMode) {
        // document.getElementsByClassName("selected")[0].focus();
      }
    }
  }, [hotkeyMode, subtitleIds])

  // Auto pause logic
  useEffect(() => {
    let boundary = 0.15;
    if(alreadyPausedId === current.id) {
      console.log('already paused here')
    }
    else if(AP && currentSeconds >= current.end - boundary) {
      console.log('hit!!')
      setPlaying(false)
      setAlreadyPausedId(current.id)
    }
  }, [currentSeconds, current, AP, alreadyPausedId])

  // Autopause functionality
  const handleToggleAP = () => {
    setAP(!AP);
  }

  // Focus selected functionality
  const handleFocusSelected = () => {
    document.getElementsByClassName("subtitles-list")[0].focus();
    try {
      document.getElementsByClassName("selected")[0].scrollIntoView({behavior: 'smooth'});
    } catch {

    }
    
  }

  // Add subtitle functionality
  const handleAddSubtitle = async () => {
   
  }

  // Delete subtitle functionality
  const handleDeleteSubtitle = () => {
    dispatch(deleteSubtitle({
      currentId: current.id,
      nextSub: {
        id: next.id,
        changes: {prev_end: prev.end}
      },
      prevSub: {
        id: prev.id,
        changes: {next_start: next.start}
      }

    }))
    setPlayhead(next.start)
  }

  const handleEditSubtitle = () => {
    dispatch(updateSubtitle({
      id: current.id,
      changes: {text:'booooogoooowaaaaa'}

    }))
    setPlayhead(current.start)
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

  // Subtitles
  let content
  if (subtitleIds.length) {
    content = subtitleIds.map((subtitleId) => (
      <Subtitle key={subtitleId} subtitleId={subtitleId} playerRef={playerRef} selected={subtitleId === current.id} setCurrentSeconds={setCurrentSeconds} hotkeyMode={hotkeyMode} setHotkeyMode={setHotkeyMode}/>
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
        <div className="option option-edit" onClick={handleEditSubtitle} >
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