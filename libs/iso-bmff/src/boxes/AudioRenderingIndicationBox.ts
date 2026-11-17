import type { FullBox } from './FullBox.ts'

/**
 * Audio Rendering Indication Box (`ardi`).
 *
 * ISO/IEC 14496-12
 *
 * @public
 */
export type AudioRenderingIndicationBox = FullBox & {
	type: 'ardi'
	audioRenderingIndication: number
}
