// Tests run in node, so polyfill for VTTCue and VTTRegion
// @ts-expect-error - This is a polyfill
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
globalThis.VTTCue = class VTTCue { }
// @ts-expect-error - This is a polyfill
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
globalThis.VTTRegion = class VTTRegion { }
