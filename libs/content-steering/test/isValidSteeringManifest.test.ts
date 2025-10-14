import { isValidSteeringManifest } from '@svta/cml-content-steering';
import assert, { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { MANIFEST } from './MANIFEST.ts';

describe('isValidSteeringManifest', () => {
	it('provides a valid example', async () => {
		//#region example
		const manifest = {
			VERSION: 1,
			TTL: 100,
			'PATHWAY-PRIORITY': ['pathway1', 'pathway2'],
			'PATHWAY-CLONES': [{
				'BASE-ID': 'pathway1',
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

		assert(isValidSteeringManifest(manifest));
		//#endregion example
	});

	it('validates a valid steering manifest', () => {
		equal(isValidSteeringManifest(MANIFEST), true);
	});

	describe('validates an invalid steering manifest', () => {
		it('invalid manifest', () => {
			// @ts-expect-error - invalid type
			equal(isValidSteeringManifest(null), false);
			// @ts-expect-error - invalid type
			equal(isValidSteeringManifest(undefined), false);
			// @ts-expect-error - invalid type
			equal(isValidSteeringManifest(false), false);
			// @ts-expect-error - invalid type
			equal(isValidSteeringManifest(''), false);
		});

		it('invalid version', () => {
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { VERSION: 0 })), false);
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { VERSION: '1' })), false);
		});

		it('invalid TTL', () => {
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { TTL: 0 })), false);
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { TTL: '1' })), false);
		});

		it('invalid PATHWAY-PRIORITY', () => {
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { 'PATHWAY-PRIORITY': [] })), false);
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { 'PATHWAY-PRIORITY': '' })), false);
			equal(isValidSteeringManifest(Object.assign({}, MANIFEST, { 'PATHWAY-PRIORITY': ['pathway1', 'pathway1'] })), false);
		});
	});
});
