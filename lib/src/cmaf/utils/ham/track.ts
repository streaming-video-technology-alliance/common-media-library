import {
	AudioTrack,
	TextTrack,
	Track,
	VideoTrack,
} from '../../ham/model/index.js';

function trackFromJSON(json: any, type: 'audio' | 'video' | 'text'): Track {
	if (type === 'audio') {
		return AudioTrack.fromJSON(json);
	} else if (type === 'video') {
		return VideoTrack.fromJSON(json);
	} else {
		// if (type === 'text') {
		return TextTrack.fromJSON(json);
	}
}

export { trackFromJSON };
