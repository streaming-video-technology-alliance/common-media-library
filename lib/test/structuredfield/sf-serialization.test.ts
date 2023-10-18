import assert from 'node:assert';
import test, { describe } from 'node:test';
import { encodeSfItem } from '../../src/structuredfield/encodeSfItem.js';
import { formatItem } from './util/format.js';
import { read } from './util/read.js';

describe('structured field serialization', async () => {
	const suites = await Promise.all([
		read('serialisation-tests/key-generated'),
		read('serialisation-tests/number'),
		read('serialisation-tests/string-generated'),
		read('serialisation-tests/token-generated'),
	]);

	suites.flat().forEach((suite) => {
		try {
			if (suite.header_type === `item`) {
				// encode
				const obj = formatItem(suite.expected);
				const encoded = encodeSfItem(obj);
				const str = suite.canonical[0];
				test(suite.name, () => {
					assert.deepStrictEqual(str, encoded, suite.name);
				});

			}
		}
		catch (error) {
			test(suite.name, () => {
				assert.deepStrictEqual(suite.must_fail, true, error as any);
			});
		}
	});
});
