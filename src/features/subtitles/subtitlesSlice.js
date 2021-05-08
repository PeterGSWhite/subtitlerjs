import {
    createSlice,
    createAsyncThunk,
    createEntityAdapter,
  } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'

import { client } from '../../api/client'
  
export const fetchSubtitles = createAsyncThunk('subtitles/fetchSubtitles', async () => {
  const response = await client.get('/api/subtitles')
  return response
})
  
//   export const addNewSubtitle = createAsyncThunk(
//     'subtitles/addNewSubtitle',
//     async (initialSubtitle) => {
//       const response = await client.post('/api/subtitles', { subtitle: initialSubtitle })
//       return response.subtitle
//     }
//   )

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
      subtitleUpdated(state, action) {
        const { id, start, end, text } = action.payload
        subtitlesAdapter.updateOne(state, { id, changes: { start, end, text } })
      },
      subtitlesCleared: subtitlesAdapter.removeAll,
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
    },
  })
  
export const selectSubtitleBySeconds =  (state, currentSeconds) => {
    let currentSub = {};
    if(state.subtitles.status === 'succeeded') {
      for(const el of Object.values(state.subtitles.entities)) {
        if(currentSeconds >= el.start && currentSeconds < (el.nextStart || 99999999)) {
          currentSub = el
          break
        }
      }
    }
    console.log('CURRENT SUB', currentSub)
    return currentSub
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