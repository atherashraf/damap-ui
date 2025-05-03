import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type {MapDispatch, RootState,} from './index';

// Use these throughout your app instead of plain `useDispatch` and `useSelector`
export const useMapDispatch = () => useDispatch<MapDispatch>();
export const useMapSelector: TypedUseSelectorHook<RootState> = useSelector;
