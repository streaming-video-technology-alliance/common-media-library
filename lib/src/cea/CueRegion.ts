import { CueRegionScrollMode } from './CueRegionScrollMode';
import { CueRegionUnits } from './CueRegionUnits';

/**
 * Cue region.
 */
export class CueRegion {
	/**
	 * Region identifier.
	 */
	id: string = '';

	/**
	 * The X offset to start the rendering area in viewportAnchorUnits of the
	 * video width.
	 */
	viewportAnchorX: number = 0;

	/**
	 * The X offset to start the rendering area in viewportAnchorUnits of the
	 * video height.
	 */
	viewportAnchorY: number = 0;

	/**
	 * The X offset to start the rendering area in percentage (0-100) of this
	 * region width.
	 */
	regionAnchorX: number = 0;

	/**
	 * The Y offset to start the rendering area in percentage (0-100) of the
	 * region height.
	 */
	regionAnchorY: number = 0;

	/**
	 * The width of the rendering area in widthUnits.
	 */
	width: number = 100;

	/**
	 * The width of the rendering area in heightUnits.
	 */
	height: number = 100;

	/**
	 * The units (percentage, pixels or lines) the region height is in.
	 */
	heightUnits: CueRegionUnits = CueRegionUnits.PERCENTAGE;

	/**
	 * The units (percentage or pixels) the region width is in.
	 */
	widthUnits: CueRegionUnits = CueRegionUnits.PERCENTAGE;

	/**
	 * The units (percentage or pixels) the region viewportAnchors are in.
	 */
	viewportAnchorUnits: CueRegionUnits = CueRegionUnits.PERCENTAGE;

	/**
	 * If scroll=UP, it means that cues in the region will be added to the
	 * bottom of the region and will push any already displayed cues in the
	 * region up.  Otherwise (scroll=NONE) cues will stay fixed at the location
	 * they were first painted in.
	 */
	scroll: CueRegionScrollMode = CueRegionScrollMode.NONE;
}
