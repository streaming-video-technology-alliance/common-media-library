import { readFileSync } from 'fs';

const mpdSample0 = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-0/manifest-sample-0.mpd',
	'utf8',
);

const mpdSample1 = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-1/manifest-sample-1.mpd',
	'utf8',
);

const mpdSample2: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-2/manifest-sample-2.mpd',
	'utf8',
);

const mpdSample3: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-3/manifest-sample-3.mpd',
	'utf8',
);

const mpdSample4: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-4/manifest-sample-4.mpd',
	'utf8',
);

const mpdSample5: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-5/manifest-sample-5.mpd',
	'utf8',
);

const mpdSample6: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-6/manifest-sample-6.mpd',
	'utf8',
);

const mpdSample7: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-7/manifest-sample-7.mpd',
	'utf8',
);

const mpdSample8: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-8/manifest-sample-8.mpd',
	'utf8',
);

export {
	mpdSample0,
	mpdSample1,
	mpdSample2,
	mpdSample3,
	mpdSample4,
	mpdSample5,
	mpdSample6,
	mpdSample7,
	mpdSample8,
};
