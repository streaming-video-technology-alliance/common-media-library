/**
 * @internal
 *
 * Get the codec for a type of content.
 *
 * @param type - Type of the content to get the codecs from
 * @param codecs - String containing multiple codecs separated with commas
 * @returns string containing codec
 *
 * @alpha
 */
export function getCodec(type: string, codecs?: string): string {
	if (type === 'audio') {
		// Using codec mp4a.40.2 for now, we should retrieve it by finding
		// the video playlist that is related to this audio group.
		return 'mp4a.40.2';
	}
	else if (type === 'video') {
		// CODECS could be a comma separated value
		// where it has video and audio codec. Using
		// position zero for now.
		// TODO: Get the correct video codec.
		return codecs?.split(',').at(0) ?? '';
	}
	else {
		// if (type === 'text')
		return '';
	}
}
