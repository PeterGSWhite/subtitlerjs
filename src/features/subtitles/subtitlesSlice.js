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
          let startSeconds = parseFloat((parseInt(match[2])*3600 + parseInt(match[3])*60 + parseInt(match[4]) + parseInt(match[5])/1000).toFixed(6));
          let endSeconds = parseFloat((parseInt(match[6])*3600 + parseInt(match[7])*60 + parseInt(match[8]) + parseInt(match[9])/1000).toFixed(6));
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
    },
    addSubtitle(state, action) {
      let startSeconds = parseFloat(action.payload.start.toFixed(6));
      let endSeconds = parseFloat(action.payload.end.toFixed(6));
      subtitlesAdapter.addOne(state, {...action.payload, id:nanoid(), start: startSeconds, end: endSeconds})
    },
    deleteSubtitle(state, action) {
      subtitlesAdapter.removeOne(state, action.payload.currentId)
      subtitlesAdapter.updateMany(state, [action.payload.nextSub, action.payload.prevSub])
    },
    updateSubtitle:{
      reducer(state, action) {
        subtitlesAdapter.updateOne(state, action.payload)
      },
      prepare(j) {
        let changes = {...j.changes}
        for(let key of ['start', 'end', 'next_start', 'next_end']) {
          if(changes[key]) {
            changes[key] =  parseFloat(changes[key].toFixed(6))
          }
        }
        return {
          payload: {
            id: j.id,
            changes: changes
          }
        }
      }
    }  
  },
})


export const selectIdBySeconds =  (state, seconds) => {
  let currentSub = '';
  for(const el of Object.values(state.subtitles.entities)) {
    if(seconds >= el.start && seconds < (el.next_start || 99999999)) {
      currentSub = el
      break
    }
  }
  if(currentSub.id) {
    return currentSub.id
  } else {
    return null
  }
}

export const selectIndexbyId =  (state, currentId) => {
  if(currentId !== null && state.subtitles.ids.length){
    return state.subtitles.ids.indexOf(currentId)
  }
  else if(currentId === null) {
    return -1
  }
  
}

export const selectSubtitleByIndex =  (state, index) => {
  if(state.subtitles.ids.length){
    if(index < 0) {
      return {'id': 'firstpos'}
    }
    if(index >= state.subtitles.ids.length) {
      return {'id': 'lastpos'}
    }
    return state.subtitles.entities[state.subtitles.ids[index]]
  }
  else {
    return {id: 'emptypos', start: 0}
  }
  
}

export const {
  initFromFile,
  addSubtitle,
  deleteSubtitle,
  updateSubtitle
} = subtitlesSlice.actions

export default subtitlesSlice.reducer