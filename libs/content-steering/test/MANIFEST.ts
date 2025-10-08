import type { SteeringManifest } from '@svta/common-media-library/contentsteering';

export const MANIFEST: SteeringManifest = {
	VERSION: 1,
	TTL: 100,
	'PATHWAY-PRIORITY': ['pathway1', 'pathway2'],
	'PATHWAY-CLONES': [{
		'BASE-ID': 'base1',
		'ID': 'clone1',
		'URI-REPLACEMENT': {
			HOST: 'example.com',
			PARAMS: {
				param1: 'value1',
				param2: 'value2',
			},
		},
	}],
};
