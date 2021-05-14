import React, { useState, useRef, useEffect  } from "react";
import ReactPlayer from "react-player";

export const Player = ({playerRef, onProgress, currentSub, playbackRate, muted, playing, setPlaying}) => {
  const [videoFilePath, setVideoPath] = useState(null);

  useEffect(() => {
    const fn = 'bald.mp4'
    setVideoPath(`video/${fn}`)
  }, []);
  // const handleVideoUpload = (event) => {
  //   console.log(event.target.files)
  //   setVideoPath(URL.createObjectURL(event.target.files[0]))
  // };

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
      />
    </div>
  );
}

export default Player;
