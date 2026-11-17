/**
 * WebVTT Cue Payload Box (`payl`).
 *
 * ISO/IEC 14496-30:2014
 *
 * @public
 */
export type WebVttCuePayloadBox = {
	type: 'payl'
	cueText: string
}
