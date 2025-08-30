// src/damap.bootstrap.ts
import {initDamap} from './config'

// Read from Vite env (app side)
const cfg = {
    apiUrl: import.meta.env.VITE_API_URL as string | undefined,
    mapUrl: import.meta.env.VITE_MAP_URL as string | undefined,
    mapPort: import.meta.env.VITE_MAP_PORT as string | undefined,
    endpoint: import.meta.env.VITE_MAP_ENDPOINT as string | undefined,
};

initDamap(cfg);
