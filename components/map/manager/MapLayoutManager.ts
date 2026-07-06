// @damap/components/map/manager/MapLayoutManager.ts

export type DrawerSide = "left" | "right" | "bottom" | "top";

export interface ILayoutState {
    left: number;
    right: number;
    bottom: number;
    top: number;
}

export interface IDrawerLayoutDetail {
    side: DrawerSide;
    open: boolean;
    size: number;
}

type LayoutListener = (state: ILayoutState) => void;

class MapLayoutManager {
    private state: ILayoutState = {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
    };

    private listeners = new Set<LayoutListener>();

    getState(): ILayoutState {
        return {...this.state};
    }

    getSide(side: DrawerSide): number {
        return this.state[side] ?? 0;
    }

    setSide(side: DrawerSide, open: boolean, size: number) {
        const nextValue = open ? Math.max(0, size || 0) : 0;

        if (this.state[side] === nextValue) return;

        this.state = {
            ...this.state,
            [side]: nextValue,
        };

        this.emit();
    }

    getCSSVars() {
        return {
            "--left-drawer-width": `${this.state.left}px`,
            "--right-drawer-width": `${this.state.right}px`,
            "--bottom-drawer-height": `${this.state.bottom}px`,
        };
    }

    updateFromDetail(detail: IDrawerLayoutDetail) {
        this.setSide(detail.side, detail.open, detail.size);
    }

    reset() {
        this.state = {
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
        };
        this.emit();
    }

    subscribe(listener: LayoutListener) {
        this.listeners.add(listener);
        listener(this.getState());

        return () => {
            this.listeners.delete(listener);
        };
    }

    private emit() {
        const snapshot = this.getState();
        this.listeners.forEach((listener) => listener(snapshot));
    }
}

export default MapLayoutManager;