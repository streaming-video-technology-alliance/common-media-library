/**
 * A WebVTT region.
 *
 * @public
 */
export type WebVttRegion = {
	id: string;
	width: number;
	lines: number;
	regionAnchorX: number;
	regionAnchorY: number;
	viewportAnchorX: number;
	viewportAnchorY: number;
	scroll: ScrollSetting;
};
