import {
    createSlice,
    createEntityAdapter,
    nanoid
  } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
const axios = require('axios');


const subtitlesAdapter = createEntityAdapter({
  // Sort chronologically
  sortComparer: (a, b) => a.start - b.start,
})
  
export const {
  selectAll: selectAllSubtitles,
  selectIds: selectSubtitleIds,
  selectById: selectSubtitleById,
} = subtitlesAdapter.getSelectors((state) => state.subtitles)
  
const subtitlesSlice = createSlice({
  name: 'subtitles',
  initialState: subtitlesAdapter.getInitialState(
    {
      subtitles: []
    }  
  ),
  reducers: {
    initFromFile: {
      reducer(state, action) {
        subtitlesAdapter.addMany(state, action.payload.subtitles);
      },
      prepare(filebody) {
        // let re = /(\d+)[\n\r\\n\\r](\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})[\n\r\\n\\r]((?:.+[\n\r\\]?)+)/g;
        let removeCRRE = /[\r]+/gm
        filebody = filebody.replace(removeCRRE, '')
        let re = /(\d+)\n(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})\n((?:[^\n]+\n?)+)/g
        let subtitles = []
        let index = 0
        for(let match of filebody.matchAll(re)){
          console.log('called', match)
          let startSeconds = parseInt(match[2])*3600 + parseInt(match[3])*60 + parseInt(match[4]) + parseInt(match[5])/1000;
          let endSeconds = parseInt(match[6])*3600 + parseInt(match[7])*60 + parseInt(match[8]) + parseInt(match[9])/1000;
          let text = match[10]
          let prevEnd = null
          
          if(index > 0) {
            subtitles[index - 1].next_start = startSeconds
            prevEnd = subtitles[index - 1].end
          }
          let subtitle = {
            id: nanoid(),
            start: startSeconds,
            end: endSeconds,
            text: text.trim().trim(),
            prev_end: prevEnd
          }
          console.log(subtitle)
          subtitles.push(subtitle)
          index++;
        }
        return {
          payload: {
            subtitles: subtitles
          }
        }
      }
    }  
  },
})


export const selectSubtitleBySeconds =  (state, currentSeconds) => {
  let currentSub = {};
  for(const el of Object.values(state.subtitles.entities)) {
    if(currentSeconds >= el.start && currentSeconds < (el.next_start || 99999999)) {
      currentSub = el
      break
    }
  }
  
  return currentSub
}
export const selectPrevSubtitleBySeconds =  (state, currentSeconds) => {
  let prevSub = {};
  let prevEl = null
  for(const el of Object.values(state.subtitles.entities)) {
    if(currentSeconds >= el.start && currentSeconds < (el.next_start || 99999999)) {
      prevSub = prevEl
      break
    }
    prevEl = el
  }

  return prevSub
}

export const selectNextSubtitleBySeconds =  (state, currentSeconds) => {
  let nextSub = {};
  let foundCurrent = false
  for(const el of Object.values(state.subtitles.entities)) {
    if(foundCurrent) {
      nextSub = el
      break
    }
    if(currentSeconds >= el.start && currentSeconds < (el.next_start || 99999999)) {
      foundCurrent = true
    }
  }

  return nextSub
}

export const {
  initFromFile
} = subtitlesSlice.actions

export default subtitlesSlice.reducer