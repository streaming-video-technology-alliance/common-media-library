import assert from 'node:assert';
import test from 'node:test';
import { parseIntegerOrDecimal } from '../../src/structuredfield/parseIntegerOrDecimal.js';

test('parseIntegerOrDecimal', () => {
	assert.deepStrictEqual(parseIntegerOrDecimal(`42`), { value: 42, input_string: `` });
	assert.deepStrictEqual(parseIntegerOrDecimal(`-42`), { value: -42, input_string: `` });
	assert.deepStrictEqual(parseIntegerOrDecimal(`4.2`), { value: 4.2, input_string: `` });
	assert.deepStrictEqual(parseIntegerOrDecimal(`4a`), { value: 4, input_string: `a` });
	assert.deepStrictEqual(parseIntegerOrDecimal(`4.5`), { value: 4.5, input_string: `` });
	assert.deepStrictEqual(parseIntegerOrDecimal(`-4.5`), { value: -4.5, input_string: `` });
	assert.deepStrictEqual(parseIntegerOrDecimal(`4.0`), { value: 4, input_string: `` });
	assert.throws(() => parseIntegerOrDecimal(`a`), /failed to parse "a" as Integer or Decimal/);
	assert.throws(() => parseIntegerOrDecimal(`-`), /failed to parse "-" as Integer or Decimal/);
	assert.throws(() => parseIntegerOrDecimal(`1.`), /failed to parse "1." as Integer or Decimal/);
	assert.throws(() => parseIntegerOrDecimal(``), /failed to parse "" as Integer or Decimal/);

	// 7.3.1. when decimal and integer length is larger than 12
	assert.deepStrictEqual(
		parseIntegerOrDecimal(`123456789012.1`),
		{ value: 123456789012.1, input_string: `` }
	);
	assert.throws(() => parseIntegerOrDecimal(`1234567890123.1`), /failed to parse "1234567890123.1" as Integer or Decimal/);

	// 7.3.5. If type is "integer" and input_number contains more than 15 characters, fail parsing.
	assert.deepStrictEqual(
		parseIntegerOrDecimal(`123456789012345`),
		{ value: 123456789012345, input_string: `` }
	);
	assert.throws(() => parseIntegerOrDecimal(`1234567890123456`), /failed to parse "1234567890123456" as Integer or Decimal/);

	// 7.3.6. If type is "decimal" and input_number contains more than 16 characters, fail parsing.
	assert.deepStrictEqual(
		parseIntegerOrDecimal(`123456789012.456`),
		{ value: 123456789012.456, input_string: `` }
	);
	assert.throws(() => parseIntegerOrDecimal(`1234567890123.456`), /failed to parse "1234567890123.456" as Integer or Decimal/);

	// 9.2. If the number of characters after "." in input_number is greater than three, fail parsing.
	assert.deepStrictEqual(
		parseIntegerOrDecimal(`0.123`),
		{ value: 0.123, input_string: `` }
	);
	assert.throws(() => parseIntegerOrDecimal(`0.1234`), /failed to parse "0.1234" as Integer or Decimal/);

	// 2. If output_number is outside the range -999,999,999,999,999 to 999,999,999,999,999 inclusive, fail parsing.
	assert.deepStrictEqual(
		parseIntegerOrDecimal(`-999999999999999`),
		{ value: -999999999999999, input_string: `` }
	);
	assert.throws(() => parseIntegerOrDecimal(`-999999999999999.1`), /failed to parse "-999999999999999.1" as Integer or Decimal/);
	assert.throws(() => parseIntegerOrDecimal(`-1000000000000000`), /failed to parse "-1000000000000000" as Integer or Decimal/);

	assert.deepStrictEqual(
		parseIntegerOrDecimal(`999999999999999`),
		{ value: 999999999999999, input_string: `` }
	);
	assert.throws(() => parseIntegerOrDecimal(`999999999999999.1`), /failed to parse "999999999999999.1" as Integer or Decimal/);
	assert.throws(() => parseIntegerOrDecimal(`1000000000000000`), /failed to parse "1000000000000000" as Integer or Decimal/);
});
