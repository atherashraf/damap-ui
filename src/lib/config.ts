// src/config.ts
export type DamapOptions = {
    mapUrl?: string;     // full base URL if provided by the app
    mapPort?: string;    // optional port for IP/localhost fallback
    endpoint?: string;   // optional base path like "/api"
};

let cfg: DamapOptions | null = null;

export function initDamap(options: DamapOptions) {
    cfg = options;
}

export function getDamapConfig(): DamapOptions {
    if (!cfg) throw new Error('Call initDamap({...}) first.');
    return cfg;
}
