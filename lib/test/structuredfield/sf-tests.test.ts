import assert from 'node:assert';
import test, { describe } from 'node:test';
import { decodeSfDict } from '../../src/structuredfield/decodeSfDict.js';
import { decodeSfItem } from '../../src/structuredfield/decodeSfItem.js';
import { decodeSfList } from '../../src/structuredfield/decodeSfList.js';
import { encodeSfDict } from '../../src/structuredfield/encodeSfDict.js';
import { encodeSfItem } from '../../src/structuredfield/encodeSfItem.js';
import { encodeSfList } from '../../src/structuredfield/encodeSfList.js';
import { formatDict, formatItem, formatList } from './util/format.js';
import { read } from './util/read.js';

describe('structured_field_tests', async () => {
	const suites = await Promise.all([
		read(`binary`),
		read(`boolean`),
		read(`date`),
		read(`dictionary`),
		read(`examples`),
		read(`item`),
		read(`key-generated`),
		read(`large-generated`),
		read(`list`),
		read(`listlist`),
		read(`number-generated`),
		read(`number`),
		read(`param-dict`),
		read(`param-list`),
		read(`param-listlist`),
		read(`string-generated`),
		read(`string`),
		read(`token-generated`),
		read(`token`),
	]);

	suites.flat().forEach((suite) => {
		const ignore = [
			// number.json
			`negative zero`, // -0 & +0 are no equal in deepStrictEqual
			// list.json
			`two line list`,
			// dictionary.json
			`two lines dictionary`,
			// param-dict.json
			`two lines parameterised list`,
			// example.json
			`Example-Hdr (list on two lines)`,
			`Example-Hdr (dictionary on two lines)`,
		];
		if (ignore.includes(suite.name)) {
			return;
		}
		if (suite.name.endsWith('0 decimal')) {
			return;
		} // .0 is Integer in JS

		test(suite.name, () => {
			try {
				if (suite.header_type === `item`) {
					// decode
					const obj = formatItem(suite.expected);
					const decoded = decodeSfItem(suite.raw[0]);
					assert.deepStrictEqual(decoded, obj, suite.name);

					// encode
					const str = suite?.canonical?.[0] || suite.raw[0];
					const encoded = encodeSfItem(obj);
					assert.deepStrictEqual(str, encoded, suite.name);
				}
				if (suite.header_type === `list`) {
					// decode
					const obj = formatList(suite.expected);
					const decoded = decodeSfList(suite.raw[0]);
					assert.deepStrictEqual(decoded, obj, suite.name);

					// encode
					if ([
						// 1.0 is 1 in JS
						`single item parameterised list`,
						`missing parameter value parameterised list`,
						`missing terminal parameter value parameterised list`,
					].includes(suite.name)) {
						return;
					}

					const str = suite?.canonical?.[0] || suite.raw[0];
					const encoded = encodeSfList(obj);
					assert.deepStrictEqual(str, encoded, suite.name);
				}
				if (suite.header_type === `dictionary`) {
					// decode
					const obj = formatDict(suite.expected);
					const decoded = decodeSfDict(suite.raw[0]);
					assert.deepStrictEqual(decoded, obj, suite.name);

					// encode
					if ([
						// 1.0 is 1 in JS
						`single item parameterised dict`,
						`list item parameterised dictionary`,
					].includes(suite.name)) {
						return;
					}

					const str = suite?.canonical?.[0] || suite.raw[0];
					const encoded = encodeSfDict(obj);
					assert.deepStrictEqual(str, encoded, suite.name);
				}
			}
			catch (error: any) {
				assert.deepStrictEqual(suite.must_fail, true, error);
			}
		});
	});
});

