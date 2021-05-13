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
        let removeCRRE = /[\r]+/gm
        filebody = filebody.replace(removeCRRE, '')
        let re = /(\d+)\n(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})\n((?:[^\n]+\n?)+)/g
        let subtitles = []
        let index = 0
        for(let match of filebody.matchAll(re)){
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


export const selectIdBySeconds =  (state, seconds) => {
  let currentSub = {};
  for(const el of Object.values(state.subtitles.entities)) {
    if(seconds >= el.start && seconds < (el.next_start || 99999999)) {
      currentSub = el
      break
    }
  }
  return currentSub.id
}

export const selectIndexbyId =  (state, currentId) => {
  if(currentId && state.subtitles.ids.length){
    return state.subtitles.ids.indexOf(currentId)
  }
  else {
    return 0
  }
  
}

export const selectSubtitleByIndex =  (state, index) => {
  if(state.subtitles.ids.length){
    if(index < 0) {
      index = 0
    }
    if(index >= state.subtitles.ids.length) {
      index = state.subtitles.ids.length - 1
    }
    return state.subtitles.entities[state.subtitles.ids[index]]
  }
  else {
    return {'error': 'no subtitles'}
  }
  
}

export const {
  initFromFile
} = subtitlesSlice.actions

export default subtitlesSlice.reducer