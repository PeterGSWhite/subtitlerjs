import React, { useRef, useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'

import { useSelector, useDispatch } from 'react-redux'

// import { Navbar } from './app/Navbar'
import { SubtitleList } from './features/subtitles/SubtitleList'
import { Player } from './features/videoPlayer/Player'

import './App.css'

function App() {
  const playerRef = useRef(null);
  // const currentSeconds = useRef()
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [currentSub, setCurrentSub] = useState('')
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const onProgress = (progress) => {
    setCurrentSeconds(progress.playedSeconds)
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
                  onProgress={onProgress} 
                  currentSub={currentSub} 
                  playbackRate={playbackRate}
                  muted={muted} 
                  playing={playing} 
                  setPlaying={setPlaying} 
                  tabIndex="-1"
                />
                <SubtitleList 
                  playerRef={playerRef} 
                  currentSeconds={currentSeconds} 
                  setCurrentSeconds={setCurrentSeconds} 
                  setCurrentSub={setCurrentSub} 
                  setPlaybackRate={setPlaybackRate}
                  setMuted={setMuted} 
                  setPlaying={setPlaying} 
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