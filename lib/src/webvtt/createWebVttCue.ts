import type { WebVttCue } from './WebVttCue.js';

/**
 * Create a generic WebVttCue object with default values
 * that match the DOM VTTCue interface.
 *
 * @returns A WebVttCue object with default values
 *
 * @group WebVTT
 *
 * @beta
 */
export function createWebVttCue(): WebVttCue {
	return {
		id: '',
		startTime: 0,
		endTime: 0,
		region: null,
		snapToLines: true,
		line: 'auto',
		lineAlign: 'start',
		position: 'auto',
		positionAlign: 'auto',
		size: 100,
		align: 'center',
		vertical: '',
		pauseOnExit: false,
		text: '',
	};
}
