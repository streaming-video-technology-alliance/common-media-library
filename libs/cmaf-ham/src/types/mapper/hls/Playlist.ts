/**
 * HLS Playlist
 *
 * @alpha
 */
export type PlayList = {
	uri: string
	attributes: {
		FRAME_RATE: number
		'FRAME-RATE'?: number
		LANGUAGE?: string
		CODECS: string
		BANDWIDTH: number
		RESOLUTION: {
			width: number
			height: number
		}
	}
}
