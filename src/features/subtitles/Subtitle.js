import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import 'font-awesome/css/font-awesome.min.css';
import TextField from '@material-ui/core/TextField';

import {
    selectSubtitleById,
    updateSubtitle,
  } from './subtitlesSlice'

export const Subtitle = ({ subtitleId, playerRef, isCurrent_AllData, isPrev_NextStart, setCurrentSeconds, hotkeyMode, handleInsertHotkey }) => {
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
                if (
                    event.key == 'Escape' ||
                    (event.shiftKey && event.key == 'ArrowDown') || 
                    (event.ctrlKey && event.key  === 'ArrowDown') || 
                    (event.ctrlKey && event.key == 'ArrowLeft') ||
                    (event.ctrlKey && event.key  === 'ArrowRight') ||
                    (event.ctrlKey && event.key  === 'ArrowUp') ||
                    (!event.shiftKey && event.key  === 'Enter') ||
                    (event.key  === '"Delete"')
                )
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