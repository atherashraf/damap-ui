
// global.d.ts or fixes.d.ts

declare module 'pbf' {
    class Pbf {
        constructor(buf?: Uint8Array);
        readFields<T>(readField: any, result: T, end?: number): T;
        // Add any additional needed methods
    }

    export = Pbf;
}

declare module '@mapbox/vector-tile' {
    import Pbf = require('pbf');

    export class VectorTileFeature {
        constructor(pbf: Pbf);
    }

    export class VectorTileLayer {
        constructor(pbf: Pbf);
    }

    export class VectorTile {
        constructor(pbf: Pbf);
        layers: { [name: string]: VectorTileLayer };
    }
}



// global.d.ts or fixes.d.ts
declare module 'fast-xml-parser' {
    export interface X2jOptionsOptional {
        ignoreAttributes?: boolean;
        attributeNamePrefix?: string;
        [key: string]: any;
    }

    export interface XmlBuilderOptionsOptional {
        ignoreAttributes?: boolean;
        format?: boolean;
        [key: string]: any;
    }

    export class XMLBuilder {
        constructor(options?: XmlBuilderOptionsOptional);
        build(jsObj: any): string;
    }

    export class XMLParser {
        constructor(options?: X2jOptionsOptional);
        parse(xmlData: string): any;
    }
}
