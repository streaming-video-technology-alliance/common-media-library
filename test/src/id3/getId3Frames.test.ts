import { getId3Frames, utf8ArrayToStr } from '@svta.org/common-media-library';
import { PRIV } from './data/PRIV.js';


getId3Frames(PRIV).forEach(frame => {
	(frame as any).text = utf8ArrayToStr(new Uint8Array(frame.data as ArrayBuffer));
	console.log(frame);
});

