/**
 * Example usage:
 *
 * ```tsx
 * import { MapVMProvider } from './MapVMContext';
 * import App from './App';
 *
 * const Root = () => {
 *   const mapContainerRef = useRef<HTMLDivElement>(null);
 *
 *   return (
 *     <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
 *       {mapContainerRef.current && (
 *         <MapVMProvider domRef={mapContainerRef.current} isDesigner={true}>
 *           <App />
 *         </MapVMProvider>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */

import React, {
    createContext,
    useContext,
    useRef,
    useEffect,
    useState, ReactNode,
} from 'react';
import MapVM from "@/components/map/models/MapVM.ts";
import {IDomRef} from "@/types/typeDeclarations.ts";


let _globalMapVM: MapVM | null = null;

export const getMapVM = (): MapVM => {
    if (!_globalMapVM) {
        throw new Error("getMapVM(): MapVM has not been initialized.");
    }
    return _globalMapVM;
};

/**
 * Context to provide a globally accessible instance of `MapVM`.
 * It holds a reference to a singleton MapVM initialized with `domRef` and `isDesigner` flags.
 * Consumers can access it using the `useMapVM()` hook.
 */
export const MapVMContext = createContext<MapVM | null>(null);
/**
 * Provider component to initialize and expose a `MapVM` instance via context.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that require access to `MapVM`
 * @param {IDomRef} props.domRef - DOM reference passed to the `MapVM` constructor (e.g., a `div` container for a map)
 * @param {boolean} props.isDesigner - Flag indicating whether the map is in "designer" mode
 * @returns {JSX.Element | null} A context provider with initialized `MapVM`, or null if not yet ready
 */
interface IMapVMProviderProps {
    children: React.ReactNode;
    domRef: IDomRef;
    isDesigner: boolean;
}

// export const mapVMRef = useRef<MapVM | null>(null);
export const MapVMProvider = ({children, domRef, isDesigner,}: IMapVMProviderProps) => {
    const mapVMRef = useRef<MapVM | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!mapVMRef.current && domRef) {
            mapVMRef.current = new MapVM(domRef, isDesigner);
            _globalMapVM = mapVMRef.current
            setReady(true);
        }
    }, [domRef, isDesigner]);

    if (!ready) return null;

    return (
        <MapVMContext.Provider value={mapVMRef.current}>
            {children}
        </MapVMContext.Provider>
    );
};


/**
 * `MapVMInjectProvider` is an alternative context provider that allows
 * injecting an already-initialized `MapVM` instance into the React context.
 *
 * Use this when `MapVM` has already been created (e.g., by a parent component)
 * and you want to expose it to children without reinitializing.
 *
 * Example usage:
 * ```tsx
 * <MapVMInjectProvider mapVM={existingMapVM}>
 *   <Toolbar />
 *   <LayerPanel />
 * </MapVMInjectProvider>
 * ```
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that require access to `MapVM`
 * @param {MapVM} props.mapVM - An existing instance of `MapVM`
 * @returns {JSX.Element} A context provider wrapping the children
 */

interface IMapVMInjectProviderProps {
    children: ReactNode;
    mapVM: MapVM;
}

export const MapVMInjectProvider = ({children, mapVM,}: IMapVMInjectProviderProps) => {
    return (
        <MapVMContext.Provider value={mapVM}>
            {children}
        </MapVMContext.Provider>
    );
};

/**
 * Custom hook to access the `MapVM` instance from context.
 *
 * @function
 * @returns {MapVM} The globally shared `MapVM` instance
 * @throws Will throw an error if used outside `MapVMProvider`
 */
export const useMapVM = (): MapVM => {
    const context = useContext(MapVMContext);
    if (!context) {
        throw new Error('useMapVM must be used within a MapVMProvider');
    }
    return context;
};
