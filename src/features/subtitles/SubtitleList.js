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
  updateSubtitle,
  selectAllSubtitles
} from './subtitlesSlice'

const Subtitle = ({ subtitleId, playerRef, isCurrent_AllData, isPrev_NextStart, setCurrentSeconds, hotkeyMode, handleInsertHotkey }) => {
  const dispatch = useDispatch()
  const subtitle = useSelector((state) => selectSubtitleById(state, subtitleId))

  // Need prev to adjust it's gap size when current extends up
  let next_start
  if(isPrev_NextStart) {
    next_start = isPrev_NextStart
  } else {
    next_start = subtitle.next_start
  }
  var gap = Math.min(Math.max(((next_start|subtitle.end)-subtitle.end), 0.1), 50) + 'px'

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
                if (event.key == 'Escape' || event.shiftKey && event.key == 'i' || event.shiftKey && event.key == 'ArrowDown')
                  handleInsertHotkey(event)
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

export const SubtitleList = ({playerRef, videoStatus, currentSeconds, playbackRate, setCurrentSeconds, setCurrentSub, setPlaybackRate, setMuted, setPlaying}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const dispatch = useDispatch()
  const currentId = useSelector((state) => selectIdBySeconds(state, currentSeconds))
  const currentIndex = useSelector((state) => selectIndexbyId(state, currentId))
  const prev = useSelector((state) => selectSubtitleByIndex(state, currentIndex - 1))
  const current = useSelector((state) => selectSubtitleByIndex(state, currentIndex))
  const next = useSelector((state) => selectSubtitleByIndex(state, currentIndex + 1))
  const [hotkeyMode, setHotkeyMode] = useState(true)
  const [AP, setAP] = useState(false)
  const [userReady, setUserReady] = useState(false)
  const [filename, setFilename] = useState('defaultfilename')
  const [alreadyPausedId, setAlreadyPausedId] = useState('')
  const [addDeleteRequestStatus, setAddDeleteRequestStatus] = useState('idle') // To stop double adds/deletes
  const [recordStart, setRecordStart] = useState(null) 
  const [lastRecordEvent, setLastRecordEvent] = useState('recordend') 
  const [defaultPlaybackRate, setDefaultPlaybackRate] = useState(1.25)
  const [defaultInsertPlaybackRate, setDefaultInsertPlaybackRate] = useState(2)
  const [defaultInsertVerifyRate, setDefaultInsertVerifyRate] = useState(1)
  const [defaultInsertSlomoRate, setDefaultInsertSlomoRate] = useState(0.5)
  
  useEffect(() => {
    setPlaybackRate(defaultPlaybackRate)
  }, [])
  
  const setPlayhead = (seconds, playheadBuffer=0.05) => {
    seconds = Math.max(seconds + playheadBuffer, 0)
    console.log('setting playhead', seconds)
    playerRef.current.seekTo(seconds, "seconds");
    setCurrentSeconds(seconds)
    setPlaying(true)
    setAlreadyPausedId('')
  }

  // Insert mode
  useHotkeys('i', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setHotkeyMode(false)
      setAP(true)
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(current.start)
      setPlaying(true)
    }
  }, [defaultInsertPlaybackRate, hotkeyMode, userReady, current]);
  const handleInsertHotkey = (event) => {
    event.preventDefault()
    console.log(event.key)
    if(event.key === 'Escape') {
      console.log('im in here dog')
      setPlaybackRate(defaultPlaybackRate)
      setHotkeyMode(true)
    }
    else if(event.key  === 'ArrowDown') {
      console.log('hmmmmm')
      setPlaybackRate(defaultInsertVerifyRate)
      setPlayhead(current.start)
    }
  }
  useHotkeys('ctrl+down, command+down', (e) => {
    e.preventDefault()
    if(!hotkeyMode && userReady) {
      setPlaybackRate(defaultInsertSlomoRate)
      setPlayhead(current.start)
    }
  }, [defaultInsertSlomoRate, hotkeyMode, userReady, current]);
  useHotkeys('shift+left', (e) => {
    e.preventDefault()
    if(!hotkeyMode && userReady) {
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(prev.start)
    }
  }, [defaultInsertPlaybackRate, prev, hotkeyMode, userReady]);
  useHotkeys('shift+right, enter', (e) => {
    e.preventDefault()
    if(!hotkeyMode && userReady) {
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(next.start)
    }
  }, [defaultInsertPlaybackRate, next, hotkeyMode, userReady]);
  // Subtitle navigation
  useHotkeys('left, a', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setPlayhead(prev.start)
    }
  }, [prev, hotkeyMode, userReady]);
  useHotkeys('right, d', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setPlayhead(next.start)
    }
  }, [next, hotkeyMode, userReady]);
  useHotkeys('down, s', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setPlayhead(current.start)
    }
  }, [current, alreadyPausedId, hotkeyMode, userReady]);
  useHotkeys('up, w, space, k', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setPlaying(true) 
    }
  }, [hotkeyMode, userReady]);

  // Insert Delete && Alter Timestamps (maybe allow them to 'eat' into adjacents, up to the boundary of the next adjacent?)
  const paddingSeconds = 0
  const extensionAmount = 0.20
  const defaultSubSize = 2
  const minSubSize = 0.05
  const maxSubSize = 500
  const reactionTime = 0.26
  // Stepin
  useHotkeys('f', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      let stepInAt = currentSeconds - reactionTime*playbackRate;
      console.log(stepInAt)
      // Start new sub
      if(lastRecordEvent === 'recordend') {
        setLastRecordEvent('recordstart');
        setRecordStart(stepInAt)
        console.log('oiii')
      } 
      // End current sub and immediately start a new one
      else {
        let recordEnd = currentSeconds - reactionTime*playbackRate;
        insertSubtitle(recordStart, recordEnd);
        setRecordStart(recordEnd)
      }
    }
  }, [currentSeconds, playbackRate, lastRecordEvent, recordStart, hotkeyMode, userReady])
  // Stepout
  useHotkeys('j', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      if(lastRecordEvent === 'recordstart') {
        let recordEnd = currentSeconds - reactionTime*playbackRate;
        console.log(recordEnd)
        setLastRecordEvent('recordend');
        insertSubtitle(recordStart, recordEnd);
      } 
    }
  }, [currentSeconds, playbackRate, lastRecordEvent, recordStart, hotkeyMode, userReady])
  // Insert with start and end times
  const insertSubtitle = (start, end) => {
      console.log('inserting', start, end)
      let default_start = Math.max(start, 0)
      let default_end = end
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
        let end =  Math.min(default_end, next.start)
        dispatch(addSubtitle({
          start: default_start,
          end: end,
          next_start: next.start,
          text: ''
        }))
        dispatch(updateSubtitle({
          id: next.id,
          changes: {prev_end: end}
        }))
      }
      // Case 2: user inserts after all other subtitles <- prev.id, current.id = realid, next.id = lastpos
      else if(next.id === 'lastpos' && default_start >= current.end) {
        let prev_end = current.end
        dispatch(addSubtitle({
          start: default_start,
          end: default_end,
          prev_end: prev_end,
          text: ''
        }))
        dispatch(updateSubtitle({
          id: current.id,
          changes: {next_start: default_start}
        }))
      }
      // Case 3: user inserts in between subtitles <- current.id, next.id = realid
      else if(!current.id.includes('stpos') && !next.id.includes('pos') && default_start >= current.end && default_start < next.start - minSubSize) {
        let end = Math.min(default_end, next.start)
        dispatch(addSubtitle({
          start: default_start,
          end: end,
          prev_end: current.end,
          next_start: next.start,
          text: ''
        }))
        dispatch(updateSubtitle({
          id: current.id,
          changes: {next_start: default_start}
        }))
        dispatch(updateSubtitle({
          id: next.id,
          changes: {prev_end: end}
        }))
      }
      else {
        console.log('else statement:', prev, current, next, currentSeconds)
      }
  }
  // Insert At Playhead
  useHotkeys('enter', (e) => { 
    e.preventDefault()
    if(hotkeyMode && userReady) {
      console.log(prev, current, next)
      let default_start = currentSeconds
      let default_end = currentSeconds + defaultSubSize
      insertSubtitle(default_start, default_end)
    }
  }, [hotkeyMode, userReady, current, prev, next]);
  // Extend up
  useHotkeys('control+w, control+up', (e) => { 
    e.preventDefault()
    if(hotkeyMode && userReady) {
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
  }, [hotkeyMode, userReady , current, prev]);
  // Extend down
  useHotkeys('control+s, control+down', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
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
  }, [hotkeyMode, userReady , current, next]);
  // Shrink down
  useHotkeys('alt+s, alt+down', (e) => { 
    e.preventDefault()
    if(hotkeyMode && userReady) {
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
  }, [hotkeyMode, userReady , current, prev]);
  // Shrink up
  useHotkeys('alt+w, alt+up', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
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
  }, [hotkeyMode, userReady , current, next]);
  // Move up
  useHotkeys('shift+w, shift+up', (e) => { 
    e.preventDefault()
    if(hotkeyMode && userReady) {
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
  }, [hotkeyMode, userReady , current, prev, next]);
  // Move down
  useHotkeys('shift+s, shift+down', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
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
  }, [hotkeyMode, userReady , current, prev, next]);


  // Video controls
  useHotkeys('m', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setMuted(prev => !prev)
    }
  }, [hotkeyMode, userReady]);
  useHotkeys('k, space', (e) => {
    e.preventDefault()
    if(hotkeyMode && userReady) {
      setPlaying(prev => !prev)
    }
  }, [hotkeyMode, userReady]);
  useHotkeys('shift+.', (e) => {
    e.preventDefault()
    setPlaybackRate(prev => Math.min(2, prev+0.25))
    if(hotkeyMode) {
      setDefaultPlaybackRate(prev => Math.min(2, prev+0.25))
    }
  }, [hotkeyMode]);
  useHotkeys('shift+,', (e) => {
    e.preventDefault()
    setPlaybackRate(prev => Math.max(0.25, prev-0.25))
    if(hotkeyMode) {
      setDefaultPlaybackRate(prev => Math.min(2, prev+0.25))
    }
  }, [hotkeyMode]);
  useEffect(() => {
    if(currentSeconds <= current.end) {
      setCurrentSub(current.text);
    } else {
      setCurrentSub('')
    }
  }, [current, currentSeconds])

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
    setFilename('srt_' + file.name.replace('.', '_'))
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

  let subtitles = useSelector(selectAllSubtitles)
  const secondsToTime = (seconds) => {
    let ms = ("00" + Math.floor(1000*(seconds % 1))).slice(-3);
    let s = ("0" +Math.floor(seconds % 60)).slice(-2);
    let m = ("0" +Math.floor((seconds/60) % 60)).slice(-2);
    let h = ("0" +Math.floor(seconds/3600)).slice(-2);
    return h + ':' + m + ':' + s + ',' + ms
  }
  const generateSRT = () => {
    let outputlines = []
    let index = 1
    subtitles.forEach((subtitle) => {
      outputlines.push(index)
      outputlines.push(secondsToTime(subtitle.start) + ' --> ' + secondsToTime(subtitle.end))
      outputlines.push(subtitle.text)
      outputlines.push('')
      index++
    })  
    outputlines.pop()
    return outputlines.join('\n')
  }

  const downloadSRTFile =  () => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generateSRT()));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
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
        handleInsertHotkey={handleInsertHotkey}
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
          <div className="option option-download" onClick={downloadSRTFile}>
            <span>Download SRT</span><br/>
            <i className="fa fa-download"></i>
          </div>
        </div >
        <Fab color="primary" id="fab" aria-label="add" onClick={handleFocusSelected}>
          <VerticalAlignCenterIcon />
        </Fab>
        <div className={`subtitles-list ${lastRecordEvent}`}>
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