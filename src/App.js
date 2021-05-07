import React, { useRef } from 'react'
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
                <Player playerRef={playerRef}/>
                <SubtitleList playerRef={playerRef} />
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