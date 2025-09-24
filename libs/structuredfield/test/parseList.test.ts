import { parseList } from '@svta/cml-structuredfield/parse/parseList';
import { SfItem } from '@svta/cml-structuredfield/SfItem';
import assert from 'node:assert';
import test, { describe } from 'node:test';

describe('parseList', () => {
	test('string list', () => {
		assert.deepStrictEqual(
			parseList(`"foo", "bar", "It was the best of times."`),
			{
				value: [
					new SfItem(`foo`),
					new SfItem(`bar`),
					new SfItem(`It was the best of times.`),
				], src: ``,
			},
		);
	});

	test('token list', () => {
		assert.deepStrictEqual(
			parseList(`foo, bar`),
			{
				value: [
					new SfItem(Symbol.for(`foo`)),
					new SfItem(Symbol.for(`bar`)),
				], src: ``,
			},
		);
	});

	test('mixed list', () => {
		assert.deepStrictEqual(
			parseList(`1, 1.23, a, "a", ?1, :AQID:, @1659578233`),
			{
				value: [
					new SfItem(1),
					new SfItem(1.23),
					new SfItem(Symbol.for('a')),
					new SfItem('a'),
					new SfItem(true),
					new SfItem(new Uint8Array([1, 2, 3])),
					new SfItem(new Date(1659578233 * 1000)),
				], src: ``,
			},
		);
	});

	test('list of lists', () => {
		assert.deepStrictEqual(
			parseList(`("foo" "bar"), ("baz"), ("bat" "one"), ()`),
			{
				value: [
					new SfItem(['foo', 'bar']),
					new SfItem(['baz']),
					new SfItem(['bat', 'one']),
					new SfItem([]),
				], src: ``,
			},
		);
	});

	test('list with params', () => {
		assert.deepStrictEqual(parseList(`("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), {
			value: [
				new SfItem([
					new SfItem('foo', { 'a': 1, 'b': 2 }),
				], { 'lvl': 5 }),
				new SfItem(['bar', 'baz'], { 'lvl': 1 }),
			], src: ``,
		});
	});

	test('fails on invalid input', () => {
		assert.throws(() => parseList(`("aaa").`), /failed to parse "." as List/);
		assert.throws(() => parseList(`("aaa"),`), /failed to parse "" as List/);
	});
});
