import React, { useState, useRef, useEffect, useCallback  } from "react";
import ReactPlayer from "react-player";
import {useDropzone} from 'react-dropzone'
import {Key} from '../otherComponents/Key'

export const Player = ({playerRef, setVideoStatus, onProgress, onEnded, currentSub, playbackRate, muted, playing, setPlaying, hotkeyMode}) => {
  const [videoFilePath, setVideoPath] = useState(null);

  // useEffect(() => {
  //   const fn = 'bald.mp4'
  //   setVideoPath(`video/${fn}`)
  // }, []);
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0]
    // const reader = new FileReader() // <-- access file contents (deets: https://github.com/react-dropzone/react-dropzone)
    const url = URL.createObjectURL(file)
    setVideoPath(url)
    setVideoStatus(true)
    console.log(acceptedFiles, file)
  }, [])



  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  let hotkeyHint;
  if(hotkeyMode) {
    hotkeyHint = 
    <div class="hotkeyhints">
        <div class="hint">
          <div class="hint-text">Insert mode</div>
          <Key icon="I"/>
        </div>
        <div class="hint">
          <div class="hint-text">Add sub here</div>
          <Key icon="F"/>
        </div>
        <div class="hint">
          <div class="hint-text">End sub early</div>
          <Key icon="G"/>
        </div>
        <div class="hint">
          <div class="hint-text">Unpause</div>
          <Key icon="W"/>
        </div>
        <div class="hint">
          <div class="hint-text">Replay current sub</div>
          <Key icon="S"/>
        </div>
        <div class="hint">
          <div class="hint-text">Prev Sub</div>
          <Key icon="A"/>
        </div>
        <div class="hint">
          <div class="hint-text">Next Sub</div>
          <Key icon="D"/>
        </div>
        <div class="hint">
          <div class="hint-text">Delete current sub</div>
          <Key icon="Del"/>
        </div>
      </div>
  } else {
    hotkeyHint = 
    hotkeyHint = 
    <div class="hotkeyhints">
        <div class="hint">
          <div class="hint-text">Nav mode</div>
          <Key icon="Esc"/>
        </div>
        <div class="hint">
          <div class="hint-text">Next sub</div>
          <Key icon="Enter"/>
        </div>
        <div class="hint">
          <div class="hint-text">Newline</div>
          <span className="multikeycontainer"><Key icon="Shift"/> <Key icon="Enter"/></span>
        </div>
        <div class="hint">
          <div class="hint-text">Prev Sub</div>
          <span className="multikeycontainer"><Key icon="Ctrl"/> <Key icon="←"/></span>
        </div>
        <div class="hint">
          <div class="hint-text">Replay</div>
          <span className="multikeycontainer"><Key icon="Shift"/> <Key icon="↓"/></span>
        </div>
        <div class="hint">
          <div class="hint-text">Slomo</div>
          <span className="multikeycontainer"><Key icon="Ctrl"/> <Key icon="↓"/></span>
        </div>
        <div class="hint">
          <div class="hint-text">Unpause</div>
          <span className="multikeycontainer"><Key icon="Ctrl"/> <Key icon="↑"/></span>
        </div>
        <div class="hint">
          <div class="hint-text">Delete current sub</div>
          <Key icon="Del"/>
        </div>
      </div>
    
  }
 
  if(videoFilePath) {
    return (
      <div className="playerContainer">
        
          {hotkeyHint}
        <div className="display-current-sub">
          <em>{currentSub}</em>
        </div>
        <ReactPlayer className="player"
          url={videoFilePath}
          ref={playerRef}
          onProgress={onProgress}
          onEnded={onEnded}
          progressInterval={50}
          width="100%"
          height="100%"
          controls={true}
          playbackRate={playbackRate}
          muted={muted}
          playing={playing}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          pip={false}
        />
      </div>
    );
  }
  else {
    return (
    <div className="videoUploadContainer">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        {
          isDragActive ?
          <p>Drop your video here ...</p>:
          <p>Drag and drop a video here, or click to select it<br/><br/>Please note: the video will not be saved on the site <br/><br/> Make sure to keep your local copy</p>
        }
      </div>
    </div>
    )
  }
}

export default Player;
