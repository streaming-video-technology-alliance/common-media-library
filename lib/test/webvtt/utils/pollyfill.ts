// Tests run in node, so polyfill for VTTCue and VTTRegion
// @ts-ignore
globalThis.VTTCue = class VTTCue { };
// @ts-ignore
globalThis.VTTRegion = class VTTRegion { };
