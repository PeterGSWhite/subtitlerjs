import React, { useState, useRef, useEffect  } from "react";
import ReactPlayer from "react-player";

export const Player = ({playerRef, onProgress}) => {
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
      <ReactPlayer className="player"
        url={videoFilePath}
        ref={playerRef}
        onProgress={onProgress}
        width="100%"
        height="100%"
        controls={true}
      />
    </div>
  );
}

export default Player;
