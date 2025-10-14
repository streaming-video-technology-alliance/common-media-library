import type { PathwayClone } from '@svta/cml-content-steering';

export const PATHWAY_CLONE: PathwayClone = {
	'BASE-ID': 'pathway1',
	'ID': 'clone1',
	'URI-REPLACEMENT': {
		HOST: 'example.com',
		PARAMS: {
			param1: 'value1',
			param2: 'value2',
		},
	},
};
