import React, { useState, useRef, useEffect, useCallback  } from "react";
import ReactPlayer from "react-player";
import {useDropzone} from 'react-dropzone'

export const Player = ({playerRef, setVideoStatus, onProgress, currentSub, playbackRate, muted, playing, setPlaying}) => {
  const [videoFilePath, setVideoPath] = useState(null);
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  const [waveformData, setWaveformData] = useState([]);

  const filterData = audioBuffer => {
    const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
    const samples = Math.floor(audioBuffer.duration/0.2); // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
  }
  const normalizeData = filteredData => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => Math.floor(100*(n * multiplier)));
  }
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
    let fileReader = new FileReader();
    let arrayBuffer;

    fileReader.onloadend = () => {
        arrayBuffer = fileReader.result;
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {

          // Do something with audioBuffer
          setWaveformData(normalizeData(filterData(audioBuffer)))
    
        })
    }
    fileReader.readAsArrayBuffer(file);
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  if(videoFilePath) {
    return (
      <div className="playerContainer">
        <div className="display-current-sub">
          <em>{currentSub}</em>
        </div>
        <div className="waveformContainer">
          {waveformData.map(
            (p, i) => (
              <div
                key={`${p}-${i}`}
                className={"wavePoint"}
                style={{ height: `${p}%` }}
              />
            ),
          )}
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
