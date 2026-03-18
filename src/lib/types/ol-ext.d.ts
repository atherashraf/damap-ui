declare module 'ol-ext/legend/Image';
declare module 'ol-ext/control/MousePositionBar';
declare module 'ol-ext/control/LayerSwitcher';
declare module 'ol-ext/interaction/Select';
// (and any other parts you are importing)
declare module 'ol-ext/legend/Item' {
    class Item {
        constructor(options: {
            title?: string;
            src?: string;
        });
    }
    export default Item;
}