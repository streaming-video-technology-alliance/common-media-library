import fs from 'fs';
import { mpdToHam , hamToMpd } from './mpdConverter.js';
import { hamToM3U8 } from './m3u8Converter.js';

//import samples from manifest-samples/dash-samples

const dash1 = fs.readFileSync(
	'./manifest-sample-1.mpd',
	'utf8',
);
const ham = mpdToHam(dash1);
const dash = hamToMpd(ham);

const m3u8 = hamToM3U8(ham);
console.log(m3u8);
fs.writeFileSync('main.m3u8', m3u8.manifest);
fs.writeFileSync('main.mpd', dash.manifest);

m3u8.ancillaryManifests?.forEach((ancillaryManifest, index) => {
	fs.writeFileSync(`ancillary-${index}.m3u8`, ancillaryManifest.manifest);
});
