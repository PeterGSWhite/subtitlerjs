import { configureStore } from '@reduxjs/toolkit';
import subtitleReducer from '../features/subtitles/subtitlesSlice';

export const store = configureStore({
  reducer: {
    subtitles: subtitleReducer,
  },
});
