import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import 'font-awesome/css/font-awesome.min.css';
import HamburgerMenu from 'react-hamburger-menu';

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
  const [optionsOpen, setOptionsOpen] = useState(false)
  const handleOptionsClick = () => {
    setOptionsOpen(!optionsOpen)
  }

  return (
    <React.Fragment>
      <div className="subtitle">
        <div className="subtitle-play">
          <i onClick={handlePlayClick} className="fa fa-play-circle"></i>
        </div>
        <div className="subtitle-text">asdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsadaasdsada{subtitle.text}</div>
        <div className="subtitle-options">
          <HamburgerMenu
              isOpen={optionsOpen}
              menuClicked={handleOptionsClick}
              width={18}
              height={15}
              strokeWidth={1}
              rotate={0}
              color='white'
              borderRadius={0}
              animationDuration={0.5}
            />
        </div >
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

  return (
    <section class="subtitles">
      {content}
    </section>
  )
}