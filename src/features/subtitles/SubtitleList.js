import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { unwrapResult, nanoid } from '@reduxjs/toolkit'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";
import Fab from '@material-ui/core/Fab';
import VerticalAlignCenterIcon from '@material-ui/icons/VerticalAlignCenter';

import {
  fetchSubtitles,
  selectAllSubtitles,
  selectSubtitleIds,
  selectSubtitleById,
  selectSubtitleBySeconds,
  selectPrevSubtitleBySeconds,
  selectNextSubtitleBySeconds,
  addNewSubtitle,
  updateSubtitle
} from './subtitlesSlice'


const Subtitle = ({ subtitleId, playerRef, currentSeconds, setCurrentSeconds }) => {
  const subtitle = useSelector((state) => selectSubtitleById(state, subtitleId))

  const handlePlayClick = () => {
    playerRef.current.seekTo(subtitle.start, "seconds");
    setCurrentSeconds(subtitle.start)
    console.log(subtitle.start)
  }

  return (
    <React.Fragment>
      <div 
        className={`subtitle ${currentSeconds < (subtitle.nextStart || 99999999) && currentSeconds >= subtitle.start ? 'selected' : ''}`}
        onClick={handlePlayClick} 
      >
        <div className="subtitle-play">
          <i className="fa fa-play-circle"></i>
        </div>
        <div className="subtitle-text">Goodbye sanity{subtitle.text}</div>
      </div>
      <div className={`gap`} style={{ height: (subtitle.nextStart-subtitle.end) + 'em' }}></div>
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

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSubtitles())
    }
  }, [status, dispatch])

  // Autopause functionality
  const [apStatus, setApStatus] = useState(true);
  const handleToggleAP = () => {
    setApStatus(!apStatus);
  }

  // Focus selected functionality
  const handleFocusSelected = () => {
    document.getElementsByClassName("subtitles-list")[0].focus();
    console.log(document.getElementsByClassName("selected")[0])
    document.getElementsByClassName("selected")[0].scrollIntoView({behavior: 'smooth'});
  }

  // Add subtitle functionality
  const addSubtitle = async () => {
    const prevSubFrozen = {...prevSub}
    const nextSubFrozen = {...nextSub}
    const currentSubFrozen = {...currentSub}
    const newStart = currentSubFrozen.prevEnd + 0.1
    const newEnd = currentSubFrozen.start - 0.1
    const newNextStart = currentSubFrozen.start
    const newPrevEnd = currentSubFrozen.prevEnd
    if (addDeleteRequestStatus === 'idle') {
      try {
        setAddDeleteRequestStatus('pending')
        const newSubAction = await dispatch(
          addNewSubtitle({ 
            start: newStart, 
            end: newEnd, 
            nextstart: newNextStart, 
            prevEnd: newPrevEnd, 
            text: '', 
            id: nanoid()
          })
        )
        unwrapResult(newSubAction)
        const prevSubUpdateAction = await dispatch(
          updateSubtitle({ 
            nextstart: newStart,
            id: prevSubFrozen.id
          })
        )
        unwrapResult(prevSubUpdateAction)
        const currentSubUpdateAction = await dispatch(
          updateSubtitle({ 
            prevEnd: newEnd,
            id: currentSubFrozen.id
          })
        )
        unwrapResult(currentSubUpdateAction)
      } catch (err) {
        console.error('Failed to add a subtitle: ', err)
      } finally {
        setAddDeleteRequestStatus('idle')
        setCurrentSeconds(newStart)
        handleFocusSelected()
      }
    }
  }

  let content
  if (status === 'loading') {
    content = <div className="loader">Loading...</div>
  } else if (status === 'succeeded') {
    content = subtitleIds.map((subtitleId) => (
      <Subtitle key={subtitleId} subtitleId={subtitleId} playerRef={playerRef} currentSeconds={currentSeconds} setCurrentSeconds={setCurrentSeconds}/>
    ))
  } else if (status === 'error') {
    content = <div>{error}</div>
  }


  return (
    <section className="subtitles">
      <div className="options">
        <div className="option option-autopause">
          <span>Auto Pause</span><br/>
          <Switch onChange={handleToggleAP} checked={apStatus} />
        </div>
        <div className="option option-addabove" onClick={addSubtitle}>
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
        <div className="option option-delete" onClick={handleToggleAP}>
          <span>Delete</span><br/>
          <i className="fa fa-trash"></i>
        </div>
      </div >
      <Fab color="primary" id="fab" aria-label="add" onClick={handleFocusSelected}>
        <VerticalAlignCenterIcon />
      </Fab>
      <div className="subtitles-list">
        <p class="debugstring">{currentSub.start}</p>
        {content}
      </div>
    </section>
  )
}