import {MapDispatch, MapRootState} from '@/store';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';


// Use these throughout your app instead of plain `useDispatch` and `useSelector`
export const useMapDispatch: () => MapDispatch = () => useDispatch<MapDispatch>();
export const useMapSelector: TypedUseSelectorHook<MapRootState> = useSelector;
