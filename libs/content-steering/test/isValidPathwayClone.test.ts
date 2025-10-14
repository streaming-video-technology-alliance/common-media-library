import { isValidPathwayClone } from '@svta/cml-content-steering';
import assert, { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { PATHWAY_CLONE } from './PATHWAY_CLONE.ts';

describe('isValidPathwayClone', () => {
	it('provides a valid example', async () => {
		//#region example
		const pathwayClone = {
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

		assert(isValidPathwayClone(pathwayClone));
		//#endregion example
	});

	it('validates a valid pathway clone', () => {
		equal(isValidPathwayClone(PATHWAY_CLONE), true);
	});

	describe('validates an invalid steering manifest', () => {
		it('invalid pathway clone', () => {
			// @ts-expect-error - invalid type
			equal(isValidPathwayClone(null), false);
			// @ts-expect-error - invalid type
			equal(isValidPathwayClone(undefined), false);
			// @ts-expect-error - invalid type
			equal(isValidPathwayClone(false), false);
			// @ts-expect-error - invalid type
			equal(isValidPathwayClone(''), false);
		});

		it('invalid ID', () => {
			equal(isValidPathwayClone(Object.assign({}, PATHWAY_CLONE, { ID: 0 })), false);
		});

		it('invalid BASE-ID', () => {
			equal(isValidPathwayClone(Object.assign({}, PATHWAY_CLONE, { 'BASE-ID': 0 })), false);
		});

		it('invalid URI-REPLACEMENT', () => {
			equal(isValidPathwayClone(Object.assign({}, PATHWAY_CLONE, { 'URI-REPLACEMENT': 0 })), false);
		});
	});
});
