import type { WebVttRegion } from './WebVttRegion.ts'

/**
 * Convert a WebVTT region to a VTTRegion.
 *
 * @param region - The WebVTT region to convert.
 * @returns The converted VTTRegion.
 *
 * @public
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/VTTRegion | VTTRegion}
 */
export function toVttRegion(region: WebVttRegion): VTTRegion {
	const vttRegion = new VTTRegion()
	vttRegion.id = region.id
	vttRegion.width = region.width
	vttRegion.lines = region.lines
	vttRegion.regionAnchorX = region.regionAnchorX
	vttRegion.regionAnchorY = region.regionAnchorY
	vttRegion.viewportAnchorX = region.viewportAnchorX
	vttRegion.viewportAnchorY = region.viewportAnchorY
	vttRegion.scroll = region.scroll

	return vttRegion
}
