import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import 'font-awesome/css/font-awesome.min.css';
import Switch from "react-switch";

import {
  fetchSubtitles,
  selectAllSubtitles,
  selectSubtitleIds,
  selectSubtitleById,
} from './subtitlesSlice'


const Subtitle = ({ subtitleId, playerRef }) => {
  const subtitle = useSelector((state) => selectSubtitleById(state, subtitleId))

  const handlePlayClick = () => {
    playerRef.current.seekTo(subtitle.start);
  }

  return (
    <React.Fragment>
      <div className="subtitle">
        <div className="subtitle-play">
          <i onClick={handlePlayClick} className="fa fa-play-circle"></i>
        </div>
        <div className="subtitle-text">asdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsada{subtitle.text}</div>
      </div>
      <div className="gap" style={{ height: (subtitle.nextStart-subtitle.end) + 'em' }}></div>
    </React.Fragment>
  )
}

export const SubtitleList = ({playerRef}) => {
  const subtitleIds = useSelector(selectSubtitleIds)
  const status = useSelector((state) => state.subtitles.status)
  const error = useSelector((state) => state.subtitles.error)
  const dispatch = useDispatch()

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSubtitles())
    }
  }, [status, dispatch])

  let content

  if (status === 'loading') {
    content = <div className="loader">Loading...</div>
  } else if (status === 'succeeded') {
    content = subtitleIds.map((subtitleId) => (
      <Subtitle key={subtitleId} subtitleId={subtitleId} playerRef={playerRef} />
    ))
  } else if (status === 'error') {
    content = <div>{error}</div>
  }

  const [apStatus, setApStatus] = useState(true);
  const handleToggleAP = () => {
    setApStatus(!apStatus);
  }

  return (
    <section class="subtitles">
      <div className="options">
        <div className="option option-autopause">
          <span>Auto Pause</span><br/>
          <Switch onChange={handleToggleAP} checked={apStatus} />
        </div>
        <div className="option option-addabove">
          <span>Add above</span><br/>
          <i onClick={handleToggleAP} className="fa fa-arrow-circle-up"></i>
        </div>
        <div className="option option-addbelow">
          <span>Add below</span><br/>
          <i onClick={handleToggleAP} className="fa fa-arrow-circle-down"></i>
        </div>
        <div className="option option-edit">
          <span>Edit</span><br/>
          <i onClick={handleToggleAP} className="fa fa-edit"></i>
        </div>
        <div className="option option-delete">
          <span>Delete</span><br/>
          <i onClick={handleToggleAP} className="fa fa-trash"></i>
        </div>
      </div >
      <div class="subtitles-list">
        {content}
      </div>
    </section>
  )
}