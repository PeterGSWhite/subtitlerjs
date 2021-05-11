import {
    createSlice,
    createAsyncThunk,
    createEntityAdapter,
  } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
const axios = require('axios');

  
export const fetchSubtitles = createAsyncThunk('subtitles/fetchSubtitles', async () => {
  const response = await axios.get('http://127.0.0.1:5000/api/subtitles')
  console.log(response)
  return response.data.subtitles
})
  
export const addNewSubtitle = createAsyncThunk(
  'subtitles/addNewSubtitle',
  async (initialSubtitle) => {
    try{
      const response = await axios.post('http://127.0.0.1:5000/api/subtitles', { subtitle: initialSubtitle })
      return response.data 
    } catch(e) {
      console.log(e)
    }
  }
)

export const updateSubtitle = createAsyncThunk(
  'subtitles/updateSubtitle',
  async (updated_subtitle) => {
    try{
      const response = await axios.patch(`http://127.0.0.1:5000/api/subtitles`, { subtitle: updated_subtitle })
      return response.data
    } catch(e) {
      console.log(e)
    }
  }
)

//  THIS ONE GAVE ME SO MUCH TROUBLE - IM NOT EVEN HANDLING THE REPONSE - I JUST ASSUME IT DELETES SUCCESFULLY
export const deleteSubtitle = createAsyncThunk(
  'subtitles/deleteSubtitle',
  async (id) => {
    try{
      const response = await axios.delete(`http://127.0.0.1:5000/api/subtitles/`, {data: {
        id: id
      }})
      return id
    } catch(e) {
      console.log(e)
    }
  }
)

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
  initialState: subtitlesAdapter.getInitialState({
    status: 'idle',
    error: null,
  }),
  reducers: {
    // subtitleUpdated(state, action) {
    //   const { id, start, end, text, next_start, prev_end } = action.payload
    //   subtitlesAdapter.updateOne(state, { id, changes: { start, end, next_start, prev_end, text } })
    // },
    // subtitlesCleared: subtitlesAdapter.removeAll,
  },
  extraReducers: {
    [fetchSubtitles.pending]: (state, action) => {
      state.status = 'loading'
      state.error = null
    },
    [fetchSubtitles.fulfilled]: (state, action) => {
      if (state.status === 'loading') {
        subtitlesAdapter.upsertMany(state, action)
        state.status = 'succeeded'
      }
    },
    [fetchSubtitles.rejected]: (state, action) => {
      if (state.status === 'loading') {
        state.status = 'failed'
        state.error = action.payload
      }
    },
    [addNewSubtitle.fulfilled]: (state, action) => {
      console.log(state.status, action)
      subtitlesAdapter.addOne(state, action)
    },
    [updateSubtitle.fulfilled]: (state, action) => {
      console.log(state.status, action)
      subtitlesAdapter.upsertOne(state, action)
    },
    [deleteSubtitle.fulfilled]: (state, action) => {
      console.log(state.status, action)
      subtitlesAdapter.removeOne(state, action)
    }
  },
})
  
export const selectSubtitleBySeconds =  (state, currentSeconds) => {
    let currentSub = {};
    if(state.subtitles.status === 'succeeded') {
      for(const el of Object.values(state.subtitles.entities)) {
        if(currentSeconds >= el.start && currentSeconds < (el.next_start || 99999999)) {
          currentSub = el
          break
        }
      }
    }
    return currentSub
  }
export const selectPrevSubtitleBySeconds =  (state, currentSeconds) => {
  let prevSub = {};
  let prevEl = null
  if(state.subtitles.status === 'succeeded') {
    for(const el of Object.values(state.subtitles.entities)) {
      if(currentSeconds >= el.start && currentSeconds < (el.next_start || 99999999)) {
        prevSub = prevEl
        break
      }
      prevEl = el
    }
  }
  return prevSub
}

export const selectNextSubtitleBySeconds =  (state, currentSeconds) => {
  let nextSub = {};
  let foundCurrent = false
  if(state.subtitles.status === 'succeeded') {
    for(const el of Object.values(state.subtitles.entities)) {
      if(foundCurrent) {
        nextSub = el
        break
      }
      if(currentSeconds >= el.start && currentSeconds < (el.next_start || 99999999)) {
        foundCurrent = true
      }
    }
  }
  return nextSub
}

  export const {
    subtitlesLoaded,
    subtitleUpdated,
    subtitlesCleared,
  } = subtitlesSlice.actions
  
  export default subtitlesSlice.reducer
  
  export const reloadAllSubtitles = () => async (dispatch) => {
    dispatch(subtitlesCleared())
    dispatch(fetchSubtitles())
  }