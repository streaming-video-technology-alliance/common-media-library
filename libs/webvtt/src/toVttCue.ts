import type { WebVttCue } from './WebVttCue.ts'

/**
 * Convert a generic WebVTT cue to a VTTCue.
 *
 * @param cue - The WebVTT cue to convert.
 * @returns The converted VTTCue.
 *
 *
 * @beta
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/VTTCue | VTTCue}
 */
export function toVttCue(cue: WebVttCue): VTTCue {
	const vttCue = new VTTCue(cue.startTime, cue.endTime, cue.text)
	vttCue.id = cue.id
	vttCue.region = cue.region
	vttCue.vertical = cue.vertical
	vttCue.snapToLines = cue.snapToLines
	vttCue.line = cue.line
	vttCue.lineAlign = cue.lineAlign
	vttCue.position = cue.position
	vttCue.positionAlign = cue.positionAlign
	vttCue.size = cue.size
	vttCue.pauseOnExit = cue.pauseOnExit

	// Safari still uses the old middle value and won't accept center
	try {
		vttCue.align = 'center'
	}
	catch (e) {
		vttCue.align = 'middle' as AlignSetting
	}

	return vttCue
}
