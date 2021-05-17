import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { unwrapResult, nanoid } from '@reduxjs/toolkit'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";
import Fab from '@material-ui/core/Fab';
import VerticalAlignCenterIcon from '@material-ui/icons/VerticalAlignCenter';
import { useHotkeys } from "react-hotkeys-hook";
import TextField from '@material-ui/core/TextField';
import {absoluteMinimum} from './utilityFunctions'
import {useDropzone} from 'react-dropzone'

import {
  initFromFile,
  addSubtitle,
  selectSubtitleIds,
  selectSubtitleById,
  selectIdBySeconds,
  selectIndexbyId,
  selectSubtitleByIndex,
  deleteSubtitle,
  updateSubtitle
} from './subtitlesSlice'

const Subtitle = ({ subtitleId, playerRef, isCurrent_AllData, isPrev_NextStart, isNext_PrevEnd, setCurrentSeconds, hotkeyMode, setHotkeyMode }) => {
  const dispatch = useDispatch()
  const subtitle = useSelector((state) => selectSubtitleById(state, subtitleId))

  // Need prev to adjust it's gap size when current extends up
  let next_start
  if(isPrev_NextStart) {
    next_start = isPrev_NextStart
  } else {
    next_start = subtitle.next_start
  }
  var gap = (next_start-subtitle.end) + 'em'

  // If subtitle is current, select it for focus and rerender when it changes
  let selected, realtimeSubtitle
  if(isCurrent_AllData) {
    selected = true
    realtimeSubtitle = isCurrent_AllData
  } else {
    selected = false
    realtimeSubtitle = subtitle
  }

  const handlePlayClick = () => {
    playerRef.current.seekTo(realtimeSubtitle.start, "seconds");
    setCurrentSeconds(realtimeSubtitle.start)
  }
  const handleTextChange = (e) => {
    dispatch(updateSubtitle({
      id: realtimeSubtitle.id,
      changes: {text: e.target.value}
    }))
  }
  const handleSwitchMode = (e) => {
    e.preventDefault()
    setHotkeyMode(true)
  }
  if(realtimeSubtitle.id !== 'prevanchor' && realtimeSubtitle.id !== 'currentanchor' && realtimeSubtitle.id !== 'nextanchor') {
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
            <div className="subtitle-text">{realtimeSubtitle.text}</div>
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
              value={realtimeSubtitle.text} 
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
  } else {
    return (<p></p>)
  }
}

export const SubtitleList = ({playerRef, videoStatus, currentSeconds, setCurrentSeconds, setCurrentSub, setPlaybackRate, setMuted, setPlaying}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const dispatch = useDispatch()
  const currentId = useSelector((state) => selectIdBySeconds(state, currentSeconds))
  const currentIndex = useSelector((state) => selectIndexbyId(state, currentId))
  const prev = useSelector((state) => selectSubtitleByIndex(state, currentIndex - 1))
  const current = useSelector((state) => selectSubtitleByIndex(state, currentIndex))
  const next = useSelector((state) => selectSubtitleByIndex(state, currentIndex + 1))
  const [hotkeyMode, setHotkeyMode] = useState(true)
  const [AP, setAP] = useState(true)
  const [userReady, setUserReady] = useState(false)
  const [alreadyPausedId, setAlreadyPausedId] = useState('')
  const [addDeleteRequestStatus, setAddDeleteRequestStatus] = useState('idle') // To stop double adds/deletes
  
  const setPlayhead = (seconds, playheadBuffer=0.05) => {
    seconds += playheadBuffer
    playerRef.current.seekTo(seconds, "seconds");
    setCurrentSeconds(seconds)
    setPlaying(true)
    setAlreadyPausedId('')
  }

  // Hotkey logic
  useHotkeys('i', (e) => {
    e.preventDefault()
    setHotkeyMode(false)
  });
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
  useHotkeys('up, w, space, k', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      setPlaying(true) 
    }
  }, [hotkeyMode]);

  // Insert Delete && Alter Timestamps (maybe allow them to 'eat' into adjacents, up to the boundary of the next adjacent?)
  const paddingSeconds = 0
  const extensionAmount = 0.20
  const defaultSubSize = 2
  const minSubSize = 0.05
  const maxSubSize = 500
  // Insert before
  useHotkeys('shift+a, shift+left', (e) => { 
    e.preventDefault()
    if(hotkeyMode) {
      let oldCurrentPrevEnd = current.prev_end
      let newEnd = Math.max(current.start - paddingSeconds, oldCurrentPrevEnd, 0);
      let newStart = Math.max(newEnd - defaultSubSize, oldCurrentPrevEnd, 0)
      if(newEnd - newStart > minSubSize || current.id === 'prevanchor' || current.id === 'currentanchor' || current.id === 'nextanchor') {
        dispatch(addSubtitle({
          start: newStart,
          end: newEnd,
          prev_end: oldCurrentPrevEnd,
          next_start: current.start,
          text: ''
        }))
        dispatch(updateSubtitle({
          id: prev.id,
          changes: {next_start: newStart}
        }))
        dispatch(updateSubtitle({
          id: current.id,
          changes: {prev_end: newEnd}
        }))
        setPlayhead(newStart)
      }
    }
  }, [hotkeyMode, current, prev, next]);
  // Insert After
  useHotkeys('shift+d, shift+right', (e) => { 
    e.preventDefault()
    if(hotkeyMode) {
      let oldCurrentNextStart = current.next_start || current.end + paddingSeconds
      let newStart = Math.min(current.end + paddingSeconds, oldCurrentNextStart);
      let newEnd = Math.min(newStart + defaultSubSize, oldCurrentNextStart);
      if(newEnd - newStart > minSubSize || current.id === 'prevanchor' || current.id === 'currentanchor' || current.id === 'nextanchor') {
        dispatch(addSubtitle({
          start: newStart,
          end: newEnd,
          prev_end: current.end,
          next_start: oldCurrentNextStart,
          text: ''
        }))
        dispatch(updateSubtitle({
          id: next.id,
          changes: {prev_end: newEnd}
        }))
        dispatch(updateSubtitle({
          id: current.id,
          changes: {next_start: newStart}
        }))
        setPlayhead(newStart)
      }
    }
  }, [hotkeyMode, current, prev, next]);
  // Insert At Playhead
  useHotkeys('enter', (e) => { 
    e.preventDefault()
    if(hotkeyMode) {
      console.log(prev, current, next)
      let default_start = currentSeconds
      let default_end = currentSeconds + defaultSubSize
      // Case 0: user inserts first subtitle
      if(current.id === 'emptypos') {
        dispatch(addSubtitle({
          start: default_start,
          end: default_end,
          text: ''
        }))
      }
      // Case 1: user inserts before all other subtitles  <-  currentindex = -1  <-  prev.id, current.id = firstpos, next.id = realid
      else if(current.id === 'firstpos' && default_start < next.start - minSubSize) {
        dispatch(addSubtitle({
          start: default_start,
          end: Math.min(default_end, next.start),
          next_start: next.start,
          text: ''
        }))
      }
      // Case 2: user inserts after all other subtitles <- prev.id, current.id = realid, next.id = lastpos
      else if(next.id === 'lastpos' && default_start >= current.end) {
        dispatch(addSubtitle({
          start: default_start,
          end: default_end,
          prev_end: current.end,
          text: ''
        }))
      }
      // Case 3: user inserts in between subtitles <- current.id, next.id = realid
      else if(!current.id.includes('stpos') && !next.id.includes('pos') && default_start >= current.end && default_start < next.start - minSubSize) {
        dispatch(addSubtitle({
          start: default_start,
          end: Math.min(default_end, next.start),
          prev_end: current.end,
          next_start: next.start,
          text: ''
        }))
      }
      else {
        console.log('else statement:', prev, current, next, currentSeconds)
      }
    }
  }, [hotkeyMode, current, prev, next]);
  // Extend up
  useHotkeys('control+w, control+up', (e) => { 
    e.preventDefault()
    if(hotkeyMode) {
      let newStart = Math.max(current.start - extensionAmount, prev.end);
      if(current.start - newStart) {
        dispatch(updateSubtitle({
          id: current.id,
          changes: {start: newStart}
        }))
        dispatch(updateSubtitle({
          id: prev.id,
          changes: {next_start: newStart}
        }))
        setPlayhead(newStart)
      }
    }
  }, [hotkeyMode, current, prev]);
  // Extend down
  useHotkeys('control+s, control+down', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      let newEnd = Math.min(current.end + extensionAmount, next.start);
      if(newEnd - current.end) {
        dispatch(updateSubtitle({
          id: current.id,
          changes: {end: newEnd}
        }))
        dispatch(updateSubtitle({
          id: next.id,
          changes: {prev_end: newEnd}
        }))
        setPlayhead(newEnd, -0.05)
      }
    }
  }, [hotkeyMode, current, next]);
  // Shrink down
  useHotkeys('alt+s, alt+down', (e) => { 
    e.preventDefault()
    if(hotkeyMode) {
      let newStart = Math.max(current.start + extensionAmount, current.end - 0.25); // MIN SUB SIZE !?!?!?!
      if(current.start - newStart) {
        dispatch(updateSubtitle({
          id: current.id,
          changes: {start: newStart}
        }))
        dispatch(updateSubtitle({
          id: prev.id,
          changes: {next_start: newStart}
        }))
        setPlayhead(newStart)
      }
      
    }
  }, [hotkeyMode, current, prev]);
  // Shrink up
  useHotkeys('alt+w, alt+up', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      let newEnd = Math.min(current.end - extensionAmount, current.start + 0.25);
      if(newEnd - current.end) {
        dispatch(updateSubtitle({
          id: current.id,
          changes: {end: newEnd}
        }))
        dispatch(updateSubtitle({
          id: next.id,
          changes: {prev_end: newEnd}
        }))
        setPlayhead(newEnd, -0.05)
      }
    }
  }, [hotkeyMode, current, next]);
  // Move up
  useHotkeys('shift+w, shift+up', (e) => { 
    e.preventDefault()
    if(hotkeyMode) {
      let newStart = Math.max(current.start - extensionAmount, prev.end);
      let startDiff = current.start - newStart
      let newEnd = current.end - startDiff
      dispatch(updateSubtitle({
        id: current.id,
        changes: {
          start: newStart,
          end: newEnd
        }
      }))
      dispatch(updateSubtitle({
        id: prev.id,
        changes: {next_start: newStart}
      }))
      dispatch(updateSubtitle({
        id: next.id,
        changes: {prev_end: newEnd}
      }))
      setPlayhead(newStart)
    }
  }, [hotkeyMode, current, prev, next]);
  // Move down
  useHotkeys('shift+s, shift+down', (e) => {
    e.preventDefault()
    if(hotkeyMode) {
      let newEnd = Math.min(current.end + extensionAmount, next.start);
      let endDiff = newEnd - current.end
      let newStart = current.start + endDiff
      dispatch(updateSubtitle({
        id: current.id,
        changes: {
          start: newStart,
          end: newEnd
        }
      }))
      dispatch(updateSubtitle({
        id: prev.id,
        changes: {next_start: newStart}
      }))
      dispatch(updateSubtitle({
        id: next.id,
        changes: {prev_end: newEnd}
      }))
      setPlayhead(newStart)
    }
  }, [hotkeyMode, current, prev, next]);


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
    }
    else if(AP && currentSeconds >= current.end - boundary) {
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
  const handleAddSubtitle = () => {
   
  }

  const handleEditSubtitle = () => {

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
  }
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = () => { 
      dispatch(initFromFile(reader.result))
    };
    reader.readAsText(file)
    handleUserReady()
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  const handleUserReady = () => {
    setUserReady(true)
  }

  // Subtitles
  let content
  if (subtitleIds.length) {
    content = subtitleIds.map((subtitleId) => (
      <Subtitle 
        key={subtitleId} 
        subtitleId={subtitleId} 
        playerRef={playerRef} 
        isCurrent_AllData={subtitleId === current.id ? current : false} 
        isPrev_NextStart={subtitleId === prev.id ? prev.next_start : false}
        isNext_PrevEnd={subtitleId === next.id ? next.prev_end : false} 
        setCurrentSeconds={setCurrentSeconds} 
        hotkeyMode={hotkeyMode} 
        setHotkeyMode={setHotkeyMode}
      />
    ))
  } else {
    content = <div> No subtitles </div>
  }

  if(userReady && videoStatus) {
    return (
      <section className="subtitles">
        <div className="options">
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
        <Fab color="primary" id="fab" aria-label="add" onClick={handleFocusSelected}>
          <VerticalAlignCenterIcon />
        </Fab>
        <div className="subtitles-list">
          {/* <p className="debugstring">prev.end: {prev.end} curr.pe: {current.prev_end}  prev.ns: {prev.next_start}  curr.st: {current.start}</p> */}
          {content}
        </div>
      </section>
    )
  }
  else if(videoStatus) {
    return (
      <section className="welcome-container">
      <div className="welcome-message-list">
        <div className="welcome-message">
          <h2>Choose how you want to start</h2>
        </div>
        <div className="welcome-gap"></div>
        <div className="welcome-message clickable">
          <div {...getRootProps()} className="">
            <input {...getInputProps()} />
            {
              isDragActive ?
              <p>Drop your file here ...</p>:
              <h4>Load subtitles from an existing .SRT file</h4>
            }
          </div>
        </div>
        <div className="welcome-gap"></div>
        <div className="welcome-message clickable" onClick={handleUserReady}>
          <h4>Create subtitles from scratch</h4>
        </div>
        <div className="welcome-gap"></div>
        <div className="welcome-message">
          <h4><del>(in development) Detect speech zones</del></h4>
        </div>
      </div>
    </section>
    )
  }
  else {
    return (
      <section className="welcome-container">
        <div className="welcome-message-list">
          <div className="welcome-message">
            <h2>Welcome to subtitlerr</h2>
          </div>
          <div className="welcome-message">
            <h4>The fastest way to subtitle videos</h4>
          </div>
          <div className="welcome-gap"></div>
          <div className="welcome-message">
            <div>Instructions:</div>
          </div>
          <div className="welcome-gap"></div>
          <div className="welcome-message">
            <div>1: Pick the video you wish to subtitle</div>
          </div>
          <div className="welcome-gap"></div>
          <div className="welcome-message">
            <div>2: Choose whether you want to load an existing SRT file, or start from scratch</div>
          </div>
          <div className="welcome-gap"></div>
          <div className="welcome-message">
            <div>3: Begin adding and editing subtitles using hotkeys (link)</div>
          </div>
          <div className="welcome-gap"></div>
          <div className="welcome-message">
            <div>4: Download the .SRT file to use in your editing software of choice</div>
          </div>
          <div className="welcome-gap"></div>
          <div className="welcome-message">
            <div>5: YOUR PROGRESS WON'T BE SAVED IF YOU NAVIGATE AWAY FROM THE SITE - make sure you download the .SRT if you plan to continue where you left off</div>
          </div>
        </div>
      </section>
    )
  }
}