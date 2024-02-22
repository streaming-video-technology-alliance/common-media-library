import { AudioTrack, TextTrack, Track, VideoTrack } from '../../ham/types/model/index.js';

function trackFromJSON(json: object, type: 'audio' | 'video' | 'text'): Track {
	switch (type) {
		case 'video':
			return json as VideoTrack;
		case 'audio':
			return json as AudioTrack;
		default: // case 'text':
			return json as TextTrack;
	}
}

export { trackFromJSON };
