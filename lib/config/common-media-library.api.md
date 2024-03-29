## API Report File for "@svta/common-media-library"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @beta
export function appendCmcdHeaders(headers: Record<string, string>, cmcd: Cmcd, options?: CmcdEncodeOptions): Record<string, string>;

// @beta
export function appendCmcdQuery(url: string, cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @beta
export function base64decode(str: string): Uint8Array;

// @beta
export function base64encode(binary: Uint8Array): string;

// @beta
export function canParseId3(data: Uint8Array, offset: number): boolean;

// @beta
export interface Cmcd {
    [index: CmcdCustomKey]: CmcdValue;
    bl?: number;
    br?: number;
    bs?: boolean;
    cid?: string;
    d?: number;
    dl?: number;
    mtp?: number;
    nor?: string;
    nrr?: string;
    ot?: CmObjectType;
    pr?: number;
    rtp?: number;
    sf?: CmStreamingFormat;
    sid?: string;
    st?: CmStreamType;
    su?: boolean;
    tb?: number;
    v?: number;
}

// @beta
export const CMCD_PARAM = "CMCD";

// @beta
export const CMCD_V1 = 1;

// @beta
export type CmcdCustomKey = CmCustomKey;

// @beta
export interface CmcdEncodeOptions {
    baseUrl?: string;
    customHeaderMap?: CmcdHeadersMap;
    filter?: (key: CmcdKey) => boolean;
    formatters?: Record<CmcdKey, CmcdFormatter>;
}

// @beta
export enum CmcdEncoding {
    HEADERS = "headers",
    JSON = "json",
    QUERY = "query"
}

// @beta
export type CmcdFormatter = (value: CmcdValue, options?: CmcdEncodeOptions) => string | number;

// @beta
export const CmcdFormatters: Record<string, CmcdFormatter>;

// @beta
export enum CmcdHeaderField {
    OBJECT = "CMCD-Object",
    REQUEST = "CMCD-Request",
    SESSION = "CMCD-Session",
    STATUS = "CMCD-Status"
}

// @beta
export type CmcdHeadersMap = Record<CmcdHeaderField, CmcdKey[]>;

// @beta
export type CmcdKey = keyof Cmcd;

// @beta
export type CmcdValue = CmValue;

// @beta
export type CmCustomKey = `${string}-${string}`;

// @beta
enum CmObjectType {
    AUDIO = "a",
    CAPTION = "c",
    INIT = "i",
    KEY = "k",
    MANIFEST = "m",
    MUXED = "av",
    OTHER = "o",
    TIMED_TEXT = "tt",
    VIDEO = "v"
}
export { CmObjectType as CmcdObjectType }
export { CmObjectType as CmsdObjectType }

// @beta
export const CMSD_DYNAMIC = "CMSD-Dynamic";

// @beta
export const CMSD_STATIC = "CMSD-Static";

// @beta
export const CMSD_V1 = 1;

// @beta
export type CmsdCustomKey = CmCustomKey;

// @beta
export interface CmsdDynamic {
    params: CmsdDynamicParams;
    value: string;
}

// @beta
export interface CmsdDynamicParams {
    [index: CmsdCustomKey]: CmsdValue;
    du?: boolean;
    etp?: number;
    mb?: number;
    rd?: number;
    rtt?: number;
}

// @beta
export interface CmsdEncodeOptions {
    useSymbol?: boolean;
}

// @beta
export enum CmsdHeaderField {
    DYNAMIC = "CMSD-Dynamic",
    STATIC = "CMSD-Static"
}

// @beta
export interface CmsdStatic {
    [index: CmsdCustomKey]: CmsdValue;
    at?: number;
    br?: number;
    d?: number;
    ht?: number;
    n?: string;
    nor?: string;
    nrr?: string;
    ot?: CmObjectType;
    sf?: CmStreamingFormat;
    st?: CmStreamType;
    su?: boolean;
    v?: number;
}

// @beta
export type CmsdValue = CmValue;

// @beta
enum CmStreamingFormat {
    DASH = "d",
    HLS = "h",
    OTHER = "o",
    SMOOTH = "s"
}
export { CmStreamingFormat as CmcdStreamingFormat }
export { CmStreamingFormat as CmsdStreamingFormat }

// @beta
enum CmStreamType {
    LIVE = "l",
    VOD = "v"
}
export { CmStreamType as CmcdStreamType }
export { CmStreamType as CmsdStreamType }

// @beta
export type CmValue = CmObjectType | CmStreamingFormat | CmStreamType | string | number | boolean | symbol | SfToken;

// @beta
export interface CommonMediaRequest {
    cmcd?: Cmcd;
    credentials?: RequestCredentials;
    customData?: any;
    headers?: Record<string, string>;
    method: string;
    mode?: RequestMode;
    responseType?: string;
    timeout?: number;
    url: string;
}

// @beta
export interface CommonMediaResponse {
    data?: any;
    headers?: Record<string, string>;
    redirected?: boolean;
    request: CommonMediaRequest;
    resourceTiming: ResourceTiming;
    status?: number;
    statusText?: string;
    type?: string;
    url?: string;
}

// @beta
export function decodeCmcd(cmcd: string): Cmcd;

// @beta
export function decodeCmsdDynamic(cmsd: string): CmsdDynamic[];

// @beta
export function decodeCmsdStatic(cmsd: string): CmsdStatic;

// @beta
export type DecodedId3Frame<T> = {
    key: string;
    data: T;
    info?: any;
};

// @beta
export function decodeSfDict(input: string, options?: SfDecodeOptions): SfDictionary;

// @beta
export function decodeSfItem(input: string, options?: SfDecodeOptions): SfItem;

// @beta
export function decodeSfList(input: string, options?: SfDecodeOptions): SfMember[];

// @beta
export function encodeCmcd(cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @beta
export function encodeCmsdDynamic(value: SfItem[]): string;

// @beta
export function encodeCmsdDynamic(value: string, cmsd: CmsdDynamic): string;

// @beta
export function encodeCmsdStatic(cmsd: CmsdStatic, options?: CmsdEncodeOptions): string;

// @beta
export function encodeSfDict(value: Record<string, any> | Map<string, any>, options?: SfEncodeOptions): string;

// @beta
export function encodeSfItem(value: SfItem): string;

// @beta
export function encodeSfItem(value: SfBareItem, params?: SfParameters): string;

// @beta
export function encodeSfList(value: SfMember[], options?: SfEncodeOptions): string;

// @beta
export function fromCmcdHeaders(headers: Record<string, string> | Headers): Cmcd;

// @beta
export function fromCmcdQuery(query: string | URLSearchParams): Cmcd;

// Warning: (ae-internal-missing-underscore) The name "getId3Data" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal
export function getId3Data(data: Uint8Array, offset: number): Uint8Array | undefined;

// @beta
export function getId3Frames(id3Data: Uint8Array): Id3Frame[];

// @beta
export function getId3Timestamp(data: Uint8Array): number | undefined;

// @beta
export type Id3Frame = DecodedId3Frame<ArrayBuffer | string | number>;

// Warning: (ae-internal-missing-underscore) The name "isId3TimestampFrame" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal
export function isId3TimestampFrame(frame: Id3Frame): boolean;

// @beta
export type RequestInterceptor = (request: CommonMediaRequest) => Promise<CommonMediaRequest>;

// @beta
export interface ResourceTiming {
    // (undocumented)
    duration?: number;
    // (undocumented)
    encodedBodySize: number;
    // (undocumented)
    responseEnd?: number;
    // (undocumented)
    responseStart?: number;
    // (undocumented)
    startTime: number;
}

// @beta
export type ResponseInterceptor = (response: CommonMediaResponse) => Promise<CommonMediaResponse>;

// @beta
export function roundToEven(value: number, precision: number): number;

// @beta
export type SfBareItem = string | Uint8Array | boolean | number | symbol | Date | SfToken;

// @beta
export type SfDecodeOptions = {
    useSymbol?: boolean;
};

// @beta
export type SfDictionary = Record<string, SfMember> | Map<string, SfMember>;

// @beta
export type SfEncodeOptions = {
    whitespace?: boolean;
};

// @beta
export type SfInnerList = {
    value: SfItem[] | SfBareItem[];
    params: SfParameters;
};

// @beta
export class SfItem {
    constructor(value: any, params?: SfParameters);
    // (undocumented)
    params?: SfParameters;
    // (undocumented)
    value: SfBareItem;
}

// @beta
export type SfMember = SfItem | SfInnerList | SfBareItem;

// @beta
export type SfParameters = Record<string, any>;

// @beta
export class SfToken {
    constructor(description: string);
    // (undocumented)
    description: string;
}

// @beta
export function toCmcdHeaders(cmcd: Cmcd, options?: CmcdEncodeOptions): {};

// @beta
export function toCmcdJson(cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @beta
export function toCmcdQuery(cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @beta
export function urlToRelativePath(url: string, base: string): string;

// @beta
export function utf8ArrayToStr(array: Uint8Array, exitOnNull?: boolean): string;

// @beta
export function uuid(): string;

```
