import React, { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";
import Fab from '@material-ui/core/Fab';
import VerticalAlignCenterIcon from '@material-ui/icons/VerticalAlignCenter';
import { useHotkeys } from "react-hotkeys-hook";
import TextField from '@material-ui/core/TextField';
import {useDropzone} from 'react-dropzone'
import {useInterval} from '../../utitliies'
import {Subtitle} from './Subtitle'

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

export const SubtitleList = ({
  playerRef, videoStatus, currentSeconds, playbackRate, setCurrentSeconds, setCurrentSub, setPlaybackRate, setMuted, setPlaying,
  AP, setAP, hotkeyMode, setHotkeyMode
}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const dispatch = useDispatch()
  const currentId = useSelector((state) => selectIdBySeconds(state, currentSeconds))
  const currentIndex = useSelector((state) => selectIndexbyId(state, currentId))
  const prev = useSelector((state) => selectSubtitleByIndex(state, currentIndex - 1))
  const current = useSelector((state) => selectSubtitleByIndex(state, currentIndex))
  const next = useSelector((state) => selectSubtitleByIndex(state, currentIndex + 1))
  const [userReady, setUserReady] = useState(false)
  const [filename, setFilename] = useState('defaultfilename')
  const [alreadyPausedId, setAlreadyPausedId] = useState('')
  const [addDeleteRequestStatus, setAddDeleteRequestStatus] = useState('idle') // To stop double adds/deletes
  const [recordStart, setRecordStart] = useState(null) 
  const [lastRecordEvent, setLastRecordEvent] = useState('recordend') 
  const [defaultPlaybackRate, setDefaultPlaybackRate] = useState(1.25)
  const [defaultInsertPlaybackRate, setDefaultInsertPlaybackRate] = useState(1.75)
  const [defaultInsertVerifyRate, setDefaultInsertVerifyRate] = useState(1)
  const [defaultInsertSlomoRate, setDefaultInsertSlomoRate] = useState(0.75)
  const [verifyOn, setVerifyOn] = useState(false)
  const [defaultSubLength, setDefaultSubLength] = useState(4)
  const [savedCookieExists, setSavedCookieExists] = useState(false)

  useEffect(() => {
    setPlaybackRate(defaultPlaybackRate)
    if (document.cookie.split(';').some(function(item) {
      return item.trim().indexOf('saved_progress=') == 0
    })) {
      setSavedCookieExists(true)
    }
  }, [])

  useEffect(() => {
    if(lastRecordEvent === 'recordstart') {
      if(currentSeconds > recordStart + defaultSubLength || currentSeconds > playerRef.current.getDuration() - 0.5) {
        setLastRecordEvent('recordend');
        console.log(recordStart, currentSeconds)
        insertSubtitle(recordStart, currentSeconds);
      }
      else if(currentSeconds < recordStart) {
        setLastRecordEvent('recordend');
      }
    } 
  }, [currentSeconds, recordStart, lastRecordEvent, defaultSubLength, playerRef])
  
  const setPlayhead = (seconds, playheadBuffer=0.05) => {
    if(lastRecordEvent !== 'recordstart') {
      seconds = Math.max(seconds + playheadBuffer, 0)
      console.log('setting playhead', seconds)
      if(!isNaN(seconds)) {
        playerRef.current.seekTo(seconds, "seconds");
        setCurrentSeconds(seconds)
        setPlaying(true)
        setAlreadyPausedId('')
      }
    }
    
  }

  // Insert Delete && Alter Timestamps (maybe allow them to 'eat' into adjacents, up to the boundary of the next adjacent?)
  const paddingSeconds = 0
  const defaultSubSize = 3
  const minSubSize = 0.3
  const maxSubSize = 500
  const reactionTime = 0.25
  const [pressedRecordEpoch, setPressedRecordEpoch] = useState(0)
  // Stepin
  useHotkeys('f', (e) => {
    e.preventDefault()
    setPressedRecordEpoch(Date.now())
    if(hotkeyMode == 1  && userReady && currentSeconds < playerRef.current.getDuration() - 0.5) {
      let stepInAt = Math.max(currentSeconds - reactionTime*playbackRate, 0);
      // Start new sub
      if(lastRecordEvent === 'recordend') { 
        setRecordStart(stepInAt)
        setLastRecordEvent('recordstart');
      } 
      // End current sub and immediately start a new one
      else if(currentSeconds > recordStart + 0.3) {
        let recordEnd = currentSeconds - reactionTime*playbackRate;
        setRecordStart(recordEnd) 
        insertSubtitle(recordStart, recordEnd);
      }
    }
  }, 
  {enabled: Date.now() - pressedRecordEpoch > 300},
  [currentSeconds, playbackRate, lastRecordEvent, recordStart, hotkeyMode, userReady, reactionTime, playerRef])

  useHotkeys('g', (e) => {
    e.preventDefault()
    if(hotkeyMode == 1  && userReady) {
      // Start new sub
      if(lastRecordEvent === 'recordstart') { 
        let recordEnd = Math.max(currentSeconds - reactionTime*playbackRate, 0);
        setLastRecordEvent('recordend');
        if(recordEnd > recordStart) {
          insertSubtitle(recordStart, recordEnd);
        }
      } 
    }
  }, 
  {enabled: Date.now() - pressedRecordEpoch > 300},
  [currentSeconds, playbackRate, lastRecordEvent, recordStart, hotkeyMode, userReady, reactionTime])

  // Edit mode
  useHotkeys('e', (e) => {
    e.preventDefault()
    if(hotkeyMode == 1 && userReady) {
      setHotkeyMode(2)
      setPlaying(false)
      setAP(true)
    }
  }, [defaultInsertPlaybackRate, hotkeyMode, userReady, current]);

  // Insert mode
  useHotkeys('escape', (e) => {
    e.preventDefault()
    if(hotkeyMode !== 1 && userReady) {
      setHotkeyMode(1)
      setAP(false)
    }
  }, [defaultInsertPlaybackRate, hotkeyMode, userReady, current]);
  useHotkeys('i', (e) => {
    e.preventDefault()
    if(hotkeyMode == 1  && userReady && lastRecordEvent !== 'recordstart') {
      setHotkeyMode(0)
      setAP(true)
      setVerifyOn(false)
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(current.start)
    }
  }, [defaultInsertPlaybackRate, hotkeyMode, userReady, current, lastRecordEvent]);
  const handleInsertHotkey = (event) => {
    event.preventDefault()
    console.log(event)
    if(event.key === 'Escape') {
      setVerifyOn(false)
      setPlaybackRate(defaultPlaybackRate)
      setHotkeyMode(1)
    }
    else if(event.key  === 'Delete') {
      handleDeleteSubtitle()
    }
    else if(event.shiftKey && event.key  === 'ArrowDown') {
      if(verifyOn) {
        setPlaybackRate(defaultInsertVerifyRate)
        setPlayhead(current.start)
      }
      else {
        setPlaybackRate(defaultInsertPlaybackRate)
        setPlayhead(current.start)
        setVerifyOn(true)
      }
    }
    else if(event.ctrlKey && event.key  === 'ArrowDown') {
      setPlaybackRate(defaultInsertSlomoRate)
      setPlayhead(current.start)
    }
    else if(event.ctrlKey && event.key  === 'ArrowLeft') {
      setVerifyOn(false)
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(prev.start)
    }
    else if(event.ctrlKey && event.key  === 'ArrowRight') {
      setVerifyOn(false)
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(next.start)
    }
    else if(event.ctrlKey && event.key  === 'ArrowUp') {
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlaying(true)
    }
    else if(!event.shiftKey && event.key  === 'Enter') {
      setVerifyOn(false)
      setPlaybackRate(defaultInsertPlaybackRate)
      setPlayhead(next.start)
      setPlaying(true)
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
    if(hotkeyMode  && userReady && !e.shiftKey && !e.altKey && !e.ctrlkey && currentSeconds < playerRef.current.getDuration() - 0.5) {
      setPlayhead(prev.start)
    }
  }, [prev, hotkeyMode, userReady]);
  useHotkeys('right, d', (e) => {
    e.preventDefault()
    if(hotkeyMode  && userReady && !e.shiftKey && !e.altKey && !e.ctrlkey && currentSeconds < playerRef.current.getDuration() - 0.5) {
      setPlayhead(next.start)
    }
  }, [next, hotkeyMode, userReady]);
  useHotkeys('down, s', (e) => {
    e.preventDefault()
    if(hotkeyMode  && userReady && !e.shiftKey && !e.altKey && !e.ctrlkey && currentSeconds < playerRef.current.getDuration() - 0.5) {
      setPlayhead(current.start)
    }
  }, [current, hotkeyMode, userReady]);
  useHotkeys('up, w, space, k', (e) => {
    e.preventDefault()
    if(hotkeyMode  && userReady && !e.shiftKey && !e.altKey && !e.ctrlkey && currentSeconds < playerRef.current.getDuration() - 0.5) {
      setPlaying(true) 
    }
  }, [hotkeyMode, userReady]);
  useHotkeys('delete', (e) => {
    e.preventDefault()
    if(hotkeyMode == 1  && userReady && !e.shiftKey && !e.altKey && !e.ctrlkey && currentSeconds < playerRef.current.getDuration() - 0.5) {
      handleDeleteSubtitle() 
    }
  }, [hotkeyMode, userReady]);
  // Insert with start and end times
  const insertSubtitle = (start, end) => {
      if(current.end !== undefined && start < current.end + minSubSize) {
        return
      }
      let default_start = Math.max(start, 0)
      let default_end = end
      console.log(default_start, default_end)
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

  // Extend up
  useHotkeys('shift+j, shift+,', (e) => {
    console.log(e)
    e.preventDefault()
    if(hotkeyMode == 2  && userReady) {
      let extensionAmount
      if(e.key === 'j') {
        extensionAmount = 1
      } else if(e.key === ',') {
        extensionAmount = 0.1
      }
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
      }
    }
  }, [hotkeyMode, userReady , current, prev]);
  // Extend down
  useHotkeys('control+l, control+.', (e) => {
    e.preventDefault()
    if(hotkeyMode == 2  && userReady) {
      let extensionAmount
      if(e.key === 'l') {
        extensionAmount = 1
      } else if(e.key === '.') {
        extensionAmount = 0.1
      }
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
      }
    }
  }, [hotkeyMode, userReady , current, next]);
  // Shrink down
  useHotkeys('L, >', (e) => { 
    console.log(e)
    e.preventDefault()
    if(hotkeyMode == 2  && userReady) {
      let extensionAmount
      if(e.key === 'L') {
        extensionAmount = 1
      } else if(e.key === '>') {
        extensionAmount = 0.1
      }
      let newStart = Math.min(current.start + extensionAmount, current.end - 0.25); // MIN SUB SIZE !?!?!?!
      if(current.start - newStart) {
        dispatch(updateSubtitle({
          id: current.id,
          changes: {start: newStart}
        }))
        dispatch(updateSubtitle({
          id: prev.id,
          changes: {next_start: newStart}
        }))
      }
      
    }
  }, [hotkeyMode, userReady , current, prev]);
  // Shrink up
  useHotkeys('control+j, control+,', (e) => {
    e.preventDefault()
    if(hotkeyMode == 2  && userReady) {
      let extensionAmount
      if(e.key === 'j') {
        extensionAmount = 1
      } else if(e.key === ',') {
        extensionAmount = 0.1
      }
      let newEnd = Math.max(current.end - extensionAmount, current.start + 0.25);
      if(newEnd - current.end) {
        dispatch(updateSubtitle({
          id: current.id,
          changes: {end: newEnd}
        }))
        dispatch(updateSubtitle({
          id: next.id,
          changes: {prev_end: newEnd}
        }))
      }
    }
  }, [hotkeyMode, userReady , current, next]);
  // Move up
  useHotkeys('j, ,', (e) => {
    e.preventDefault()
    if(hotkeyMode == 2  && userReady) {
      let extensionAmount
      if(e.key === 'j') {
        extensionAmount = 1
      } else if(e.key === ',') {
        extensionAmount = 0.1
      }
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
    }
  }, [hotkeyMode, userReady , current, prev, next]);
  // Move down
  useHotkeys('l, .', (e) => {
    e.preventDefault()
    if(hotkeyMode == 2  && userReady) {
      let extensionAmount
      if(e.key === 'l') {
        extensionAmount = 1
      } else if(e.key === '.') {
        extensionAmount = 0.1
      }
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
    }
  }, [hotkeyMode, userReady , current, prev, next]);

  // Video controls
  useHotkeys('m', (e) => {
    e.preventDefault()
    if(hotkeyMode == 1 ) {
      setMuted(prev => !prev)
    }
  }, [hotkeyMode]);
  useHotkeys('k', (e) => {
    e.preventDefault()
    setPlaying(prev => !prev)
  }, [hotkeyMode]);
  useHotkeys('space', (e) => {
    e.preventDefault()
    if(hotkeyMode == 1 ) {
      setPlaying(prev => !prev)
    }
  }, [hotkeyMode]);
  useHotkeys('shift+.', (e) => {
    e.preventDefault()
    setPlaybackRate(prev => Math.min(2, prev+0.25))
    if(hotkeyMode == 1 ) {
      setDefaultPlaybackRate(prev => Math.min(2, prev+0.25))
    }
  }, [hotkeyMode]);
  useHotkeys('shift+,', (e) => {
    e.preventDefault()
    setPlaybackRate(prev => Math.max(0.25, prev-0.25))
    if(hotkeyMode == 1 ) {
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
  useHotkeys('j', (e) => {
    if(hotkeyMode !== 2 ) {
      e.preventDefault()
      console.log('oiii')
      setPlayhead(Math.max(currentSeconds - 10, 0))
    }
  }, [hotkeyMode, currentSeconds]);
  useHotkeys('l', (e) => {
    if(hotkeyMode !== 2 ) {
      e.preventDefault()
      setPlayhead(currentSeconds + 10)
    }
  }, [hotkeyMode, currentSeconds]);

 
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

  useInterval(() => {
    if(userReady) {     
      let savedProgress = generateSRT('//', false)
      if(savedProgress) {
        document.cookie = `saved_progress=${savedProgress};max-age=604800`
      }
    }
  }, 60 * 1000); // 60 * 1000 milsec
  
  const handleUserReady = () => {
    setUserReady(true)
  }

  const handleCookieLoad = () => {
    let srt_file = document.cookie
                  .split('; ')
                  .find(row => row.startsWith('saved_progress'))
                  .split('=')[1].replace('//', '\n')
    dispatch(initFromFile(srt_file))
    handleUserReady()
  }

  let subtitles = useSelector(selectAllSubtitles)
  const secondsToTime = (seconds) => {
    let ms = ("00" + Math.floor(1000*(seconds % 1))).slice(-3);
    let s = ("0" +Math.floor(seconds % 60)).slice(-2);
    let m = ("0" +Math.floor((seconds/60) % 60)).slice(-2);
    let h = ("0" +Math.floor(seconds/3600)).slice(-2);
    return h + ':' + m + ':' + s + ',' + ms
  }
  const generateSRT = (joinwith='\n', ignore_empty=true) => {
    console.log(subtitles.length)
    let outputlines = []
    let index = 1
    subtitles.forEach((subtitle) => {
      if(!ignore_empty || subtitle.text) {
        outputlines.push(index)
        outputlines.push(secondsToTime(subtitle.start) + ' --> ' + secondsToTime(subtitle.end))
        outputlines.push(subtitle.text)
        outputlines.push('')
        index++
      }
    })  
    outputlines.pop()
    return outputlines.join(joinwith)
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

  let resumeButton
  if (savedCookieExists) {
    resumeButton = 
      <div className="welcome-message clickable" onClick={handleCookieLoad}>
        <h4>Resume from auto-saved progress</h4>
      </div>
  } else {
    resumeButton = ''
  }

  if(userReady && videoStatus) {
    return (
      <section className="subtitles">
        <div className="options">
          <div className="option option-autopause">
            <span>Auto Pause</span><br/>
            <Switch onChange={handleToggleAP} checked={AP} />
          </div>
          <div className="option option-edit">
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
        {resumeButton}
        {/* <div className="welcome-gap"></div>
        <div className="welcome-message">
          <h4><del>(in development) Detect speech zones</del></h4>
        </div> */}
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