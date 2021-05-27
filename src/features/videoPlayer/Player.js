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
  if(hotkeyMode === 1) {
    hotkeyHint = 
    <div className="hotkeyhints">
        <div className="hint">   
          <Key icon="I"/>
          <div className="hint-text">Insert mode</div>
        </div>
        <div className="hint">
          <Key icon="E"/>
          <div className="hint-text">Edit mode</div>
        </div>
        <div className="hint">
          <Key icon="F"/>
          <div className="hint-text">Add sub here</div>
        </div>
        <div className="hint">
          <Key icon="G"/>
          <div className="hint-text">End sub early</div>
        </div>
        <div className="hint">
          <Key icon="W"/>
          <div className="hint-text">Unpause</div>
        </div>
        <div className="hint">
          <Key icon="S"/>
          <div className="hint-text">Replay current sub</div>
        </div>
        <div className="hint">
          <Key icon="A"/>
          <div className="hint-text">Prev Sub</div>
        </div>
        <div className="hint">
          <Key icon="D"/>
          <div className="hint-text">Next Sub</div>
        </div>
        <div className="hint">
          <Key icon="Del"/>
          <div className="hint-text">Delete current sub</div>
        </div>
      </div>
  } else if(hotkeyMode === 2) {
    hotkeyHint = 
      <div className="hotkeyhints">
        <div className="hint">
          <Key icon="Esc"/>
          <div className="hint-text">Nav mode</div>
        </div>
        <span className="multikeycontainer">
          <div>
            <Key icon="none"/>
            <div className="hint-text">Move</div>
          </div>
          <div> </div>
          <div>
            <Key icon="Ctrl"/>
            <div className="hint-text">Extend</div>
          </div>
          <div> </div>
          <div>
            <Key icon="Shift"/>
            <div className="hint-text">Shrink</div>
          </div>
        </span>
        <span className="multikeycontainer">
        <div>
          <Key icon="J"/>
          <div className="hint-text">Back 1s</div>
        </div>
        <div>
          <Key icon="L"/>
          <div className="hint-text">Foward 1s</div>
        </div>
        </span>
        <span className="multikeycontainer">
          <div>
            <Key icon="<"/>
            <div className="hint-text">Back 0.1s</div>
          </div>
          <div>
            <Key icon=">"/>
            <div className="hint-text">Forward 0.1s</div>
          </div>
        </span>
      </div>
    
    
  } else {
    hotkeyHint = 
    <div className="hotkeyhints">
        <div className="hint">
          <Key icon="Esc"/>
          <div className="hint-text">Nav mode</div>
        </div>
        <div className="hint">
          <Key icon="Enter"/>
          <div className="hint-text">Next sub</div>
        </div>
        <div className="hint">
          <span className="multikeycontainer"><Key icon="Shift"/> <Key icon="Enter"/></span>
          <div className="hint-text">Newline</div>
        </div>
        <div className="hint">
          <span className="multikeycontainer"><Key icon="Ctrl"/> <Key icon="←"/></span>
          <div className="hint-text">Prev Sub</div>
        </div>
        <div className="hint">
          <span className="multikeycontainer"><Key icon="Shift"/> <Key icon="↓"/></span>
          <div className="hint-text">Replay</div>
        </div>
        <div className="hint">
          <span className="multikeycontainer"><Key icon="Ctrl"/> <Key icon="↓"/></span>
          <div className="hint-text">Slomo</div>
        </div>
        <div className="hint">
          <span className="multikeycontainer"><Key icon="Ctrl"/> <Key icon="↑"/></span>
          <div className="hint-text">Unpause</div>
        </div>
        <div className="hint">
          <Key icon="Del"/>
          <div className="hint-text">Delete current sub</div>
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
