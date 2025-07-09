import type { WebVttCueFactory } from './WebVttCueFactory';
import type { WebVttRegionFactory } from './WebVttRegionFactory';

/**
 * Options for the WebVtt parser.
 *
 * @group WebVTT
 *
 * @beta
 */
export type WebVttParserOptions = {
	/**
	 * Whether to use DOM VTTCue and VTTRegion or generic objects. If `createCue`
	 * or `createRegion` are provided, they will be used instead of the default
	 * factory functions.
	 *
	 * @defaultValue `true`
	 */
	useDomTypes?: boolean;

	/**
	 * A factory for creating WebVttCue objects.
	 *
	 * By default the parser will create DOM VTTCue objects for each cue.
	 * In some environments, like node or a web worker, this class does not
	 * exist. In this case, you can provide a custom factory function that
	 * creates a custom cue object.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/VTTCue | VTTCue}
	 */
	createCue?: WebVttCueFactory;

	/**
	 * A factory for creating WebVttRegion objects.
	 *
	 * By default the parser will create DOM VTTRegion objects for each region.
	 * In some environments, like node or a web worker, this class does not
	 * exist. In this case, you can provide a custom factory function that
	 * creates a custom region object.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/VTTRegion | VTTRegion}
	 */
	createRegion?: WebVttRegionFactory;
};
