import assert from 'node:assert';
import test from 'node:test';
import { serializeDecimal } from '../../src/structuredfield/serializeDecimal.js';

test('serializeDecimal', () => {
	assert.deepStrictEqual(serializeDecimal(0), '0.0');
	assert.deepStrictEqual(serializeDecimal(1.0), '1.0');
	assert.deepStrictEqual(serializeDecimal(1.01), '1.01');
	assert.deepStrictEqual(serializeDecimal(1.0021), '1.002');
	assert.deepStrictEqual(serializeDecimal(1.0029), '1.003');
	assert.deepStrictEqual(serializeDecimal(1.0025), '1.002');
	assert.deepStrictEqual(serializeDecimal(1.0035), '1.004');
	assert.deepStrictEqual(serializeDecimal(-1.0035), '-1.004');
	assert.deepStrictEqual(serializeDecimal(999_999_999_999.999), '999999999999.999');
	assert.deepStrictEqual(serializeDecimal(-999_999_999_999.999), '-999999999999.999');
	assert.throws(() => serializeDecimal(1_000_000_000_000.0), /failed to serialize "1000000000000" as Decimal/);
	assert.throws(() => serializeDecimal(-1_000_000_000_000.0), /failed to serialize "-1000000000000" as Decimal/);
});
