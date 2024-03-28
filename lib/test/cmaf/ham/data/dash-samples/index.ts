import { readFileSync } from 'fs';

const dashSample0 = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-0/manifest-sample-0.mpd',
	'utf8',
);

const dashSample1 = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-1/manifest-sample-1.mpd',
	'utf8',
);

const dashSample2: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-2/manifest-sample-2.mpd',
	'utf8',
);

const dashSample3: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-3/manifest-sample-3.mpd',
	'utf8',
);

const dashSample4: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-4/manifest-sample-4.mpd',
	'utf8',
);

const dashSample5: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-5/manifest-sample-5.mpd',
	'utf8',
);

const dashSample6: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-6/manifest-sample-6.mpd',
	'utf8',
);

const dashSample7: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-7/manifest-sample-7.mpd',
	'utf8',
);

const dashSample8: string = readFileSync(
	'./test/cmaf/ham/data/dash-samples/sample-8/manifest-sample-8.mpd',
	'utf8',
);

export {
	dashSample0,
	dashSample1,
	dashSample2,
	dashSample3,
	dashSample4,
	dashSample5,
	dashSample6,
	dashSample7,
	dashSample8,
};
