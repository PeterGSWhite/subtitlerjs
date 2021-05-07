import React, { useRef, useState } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'

// import { Navbar } from './app/Navbar'
import { SubtitleList } from './features/subtitles/SubtitleList'
import { Player } from './features/videoPlayer/Player'

import './App.css'

function App() {
  const playerRef = useRef(null);
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const onProgress = (progress) => {
    return setCurrentSeconds(progress.playedSeconds);
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
                <Player playerRef={playerRef} onProgress={onProgress}/>
                <SubtitleList playerRef={playerRef} currentSeconds={currentSeconds} />
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