import React, { useRef, useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'

import { useSelector, useDispatch } from 'react-redux'

import {
  selectSubtitleByIndex
} from './features/subtitles/subtitlesSlice'

// import { Navbar } from './app/Navbar'
import { SubtitleList } from './features/subtitles/SubtitleList'
import { Player } from './features/videoPlayer/Player'

import './App.css'

function App() {
  const playerRef = useRef('')
  const [videoStatus, setVideoStatus] = useState(false);
  // const currentSeconds = useRef()
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [currentSub, setCurrentSub] = useState('')
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [hotkeyMode, setHotkeyMode] = useState(true)
  const [AP, setAP] = useState(false)

  // get start of subtitles
  const firstSub = useSelector((state) => selectSubtitleByIndex(state, 0))

  const onProgress = (progress) => {
    setCurrentSeconds(progress.playedSeconds)
  }

  const onEnded = () => {
    // Save the time of the earliest sub.
    // Move auto pause here, and turn it on.
    // Move hotkeymode here, and turn it off
    // Seek earliest sub start time
    // set playing true
    playerRef.current.seekTo(firstSub.start)
    setAP(true)
    setHotkeyMode(false)
    setPlaying(true)
  }

  return (
    <Router>
      {/* <Navbar /> */}
      <div className="App">
        <Switch>
          <Route
            exact
            path="/"
            render={() => (
              <React.Fragment>
                <Player 
                  playerRef={playerRef} 
                  setVideoStatus={setVideoStatus}
                  onProgress={onProgress} 
                  onEnded={onEnded}
                  currentSub={currentSub} 
                  playbackRate={playbackRate}
                  muted={muted} 
                  playing={playing} 
                  setPlaying={setPlaying} 
                  tabIndex="-1"
                />
                <SubtitleList 
                  playerRef={playerRef}
                  videoStatus={videoStatus} 
                  currentSeconds={currentSeconds} 
                  playbackRate={playbackRate}
                  setCurrentSeconds={setCurrentSeconds} 
                  setCurrentSub={setCurrentSub} 
                  setPlaybackRate={setPlaybackRate}
                  setMuted={setMuted} 
                  setPlaying={setPlaying} 
                  AP={AP}
                  setAP={setAP}
                  hotkeyMode={hotkeyMode}
                  setHotkeyMode={setHotkeyMode}
                  tabIndex="-1"
                />
              </React.Fragment>
            )}
          />
          <Redirect to="/" />
        </Switch>
      </div>
    </Router>
  )
}

export default App