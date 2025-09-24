import type { WebVttRegion } from './WebVttRegion.js';

/**
 * Create a generic WebVttRegion object with default values
 * that match the DOM VTTRegion interface.
 *
 * @returns A WebVttRegion object with default values
 *
 * @group WebVTT
 *
 * @beta
 */
export function createWebVttRegion(): WebVttRegion {
	return {
		id: '',
		width: 100,
		lines: 3,
		regionAnchorX: 0,
		regionAnchorY: 100,
		viewportAnchorX: 0,
		viewportAnchorY: 100,
		scroll: '',
	};
}
