import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
});

export type MapRootState = ReturnType<typeof store.getState>;
export type MapDispatch = typeof store.dispatch;

