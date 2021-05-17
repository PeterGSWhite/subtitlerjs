import React, { useState, useRef, useEffect, useCallback  } from "react";
import ReactPlayer from "react-player";
import {useDropzone} from 'react-dropzone'

export const Player = ({playerRef, setVideoStatus, onProgress, currentSub, playbackRate, muted, playing, setPlaying}) => {
  const [videoFilePath, setVideoPath] = useState(null);

  // useEffect(() => {
  //   const fn = 'bald.mp4'
  //   setVideoPath(`video/${fn}`)
  // }, []);
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0]
    // const reader = new FileReader() // <-- access file contents (deets: https://github.com/react-dropzone/react-dropzone)
    setVideoPath(URL.createObjectURL(file))
    setVideoStatus(true)
    console.log(acceptedFiles, file)
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  if(videoFilePath) {
    return (
      <div className="playerContainer">
        <div className="display-current-sub">
          <em>{currentSub}</em>
        </div>
        <ReactPlayer className="player"
          url={videoFilePath}
          ref={playerRef}
          onProgress={onProgress}
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
